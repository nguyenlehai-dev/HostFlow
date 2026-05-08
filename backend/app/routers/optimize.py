import os
import subprocess

import psutil
from fastapi import APIRouter

router = APIRouter()


def _read(path: str, default: str = "") -> str:
    try:
        with open(path) as f:
            return f.read().strip()
    except Exception:
        return default


def _sysctl(key: str) -> str:
    try:
        out = subprocess.run(["sysctl", "-n", key], capture_output=True, text=True, timeout=3, check=False)
        return out.stdout.strip()
    except Exception:
        return ""


@router.get("/recommendations")
def recommendations():
    """Analyze the server and return optimization suggestions."""
    findings = []

    # Memory
    vm = psutil.virtual_memory()
    if vm.percent >= 90:
        findings.append({
            "level": "critical", "category": "memory",
            "issue": f"RAM dùng {vm.percent}% — gần đầy.",
            "suggest": "Kill process tốn RAM nhất, hoặc thêm swap/RAM, hoặc tối ưu app (giảm heap, bật cache eviction).",
        })
    elif vm.percent >= 75:
        findings.append({
            "level": "warning", "category": "memory",
            "issue": f"RAM dùng {vm.percent}%.",
            "suggest": "Theo dõi top processes; cân nhắc giảm số worker hoặc tăng RAM.",
        })

    # Swap
    sw = psutil.swap_memory()
    if sw.total > 0 and sw.percent >= 50:
        findings.append({
            "level": "warning", "category": "memory",
            "issue": f"Swap dùng {sw.percent}% — hệ thống đang thrash.",
            "suggest": "Giảm tải, kill process tốn RAM, hoặc tăng RAM. Kiểm tra `vm.swappiness` (nên 10).",
        })

    # Swappiness
    swappiness = _sysctl("vm.swappiness")
    if swappiness and swappiness.isdigit() and int(swappiness) > 30:
        findings.append({
            "level": "info", "category": "kernel",
            "issue": f"vm.swappiness = {swappiness} (mặc định 60) — server thường nên thấp hơn.",
            "suggest": "Set `vm.swappiness=10` trong /etc/sysctl.d/ để giảm dùng swap.",
        })

    # TCP congestion control
    cc = _sysctl("net.ipv4.tcp_congestion_control")
    if cc and cc != "bbr":
        findings.append({
            "level": "info", "category": "network",
            "issue": f"TCP congestion control = `{cc}`. BBR thường tốt hơn cho VPS.",
            "suggest": "Set `net.core.default_qdisc=fq` và `net.ipv4.tcp_congestion_control=bbr`.",
        })

    # Disk usage on root
    du = psutil.disk_usage("/")
    if du.percent >= 90:
        findings.append({
            "level": "critical", "category": "disk",
            "issue": f"Phân vùng / đầy {du.percent}%.",
            "suggest": "Chạy `ncdu /` để tìm thư mục lớn; xoá log cũ, docker image cũ (`docker system prune -af`), apt cache (`apt clean`).",
        })
    elif du.percent >= 80:
        findings.append({
            "level": "warning", "category": "disk",
            "issue": f"Phân vùng / dùng {du.percent}%.",
            "suggest": "Dọn log/docker/apt cache. Cân nhắc mở rộng disk.",
        })

    # Load average vs CPU
    la1, la5, la15 = psutil.getloadavg()
    cpus = psutil.cpu_count(logical=True) or 1
    if la5 > cpus * 2:
        findings.append({
            "level": "critical", "category": "cpu",
            "issue": f"Load 5m = {la5:.2f}, CPU = {cpus} cores. Hệ thống quá tải.",
            "suggest": "Tìm process tốn CPU (`htop`), giảm số worker, hoặc nâng cấp CPU.",
        })
    elif la5 > cpus:
        findings.append({
            "level": "warning", "category": "cpu",
            "issue": f"Load 5m = {la5:.2f} > số core ({cpus}).",
            "suggest": "Theo dõi top CPU processes.",
        })

    # Boot age
    boot = psutil.boot_time()
    import time as _t
    uptime_days = (_t.time() - boot) / 86400
    if uptime_days > 90:
        findings.append({
            "level": "info", "category": "kernel",
            "issue": f"Uptime {uptime_days:.0f} ngày — kernel/security updates có thể chưa apply.",
            "suggest": "Schedule reboot (sau khi backup) để apply kernel/lib updates.",
        })

    # Open file descriptors
    try:
        fdmax = _read("/proc/sys/fs/file-max")
        if fdmax and fdmax.isdigit() and int(fdmax) < 1000000:
            findings.append({
                "level": "info", "category": "kernel",
                "issue": f"fs.file-max = {fdmax} — thấp cho server traffic cao.",
                "suggest": "Set `fs.file-max=2097152` trong /etc/sysctl.d/.",
            })
    except Exception:
        pass

    # Number of zombie processes
    zombies = sum(1 for p in psutil.process_iter(["status"]) if p.info["status"] == psutil.STATUS_ZOMBIE)
    if zombies > 5:
        findings.append({
            "level": "warning", "category": "process",
            "issue": f"{zombies} zombie processes.",
            "suggest": "Kiểm tra parent processes không reap con — restart parent service tương ứng.",
        })

    # Failed services
    try:
        out = subprocess.run(
            ["systemctl", "--failed", "--no-legend", "--plain", "--no-pager"],
            capture_output=True, text=True, timeout=5, check=False,
        )
        failed = [l.split()[0] for l in out.stdout.splitlines() if l.strip()]
        if failed:
            findings.append({
                "level": "warning", "category": "service",
                "issue": f"Service failed: {', '.join(failed[:5])}{'...' if len(failed) > 5 else ''}.",
                "suggest": "Kiểm tra `systemctl status <unit>` và `journalctl -u <unit>`.",
            })
    except Exception:
        pass

    if not findings:
        findings.append({
            "level": "ok", "category": "general",
            "issue": "Không phát hiện vấn đề.",
            "suggest": "Hệ thống đang ổn. Tiếp tục theo dõi định kỳ.",
        })

    return {
        "count": len(findings),
        "summary": {
            "critical": sum(1 for f in findings if f["level"] == "critical"),
            "warning": sum(1 for f in findings if f["level"] == "warning"),
            "info": sum(1 for f in findings if f["level"] == "info"),
            "ok": sum(1 for f in findings if f["level"] == "ok"),
        },
        "findings": findings,
    }
