import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import { api, fmtBytes, fmtDuration } from "../api/client";
import { usePoll } from "../hooks/usePoll";

interface Overview {
  host: { hostname: string; os: string; kernel: string; arch: string };
  uptime_seconds: number;
  cpu: { count_logical: number; percent: number; load_avg: { "1m": number; "5m": number; "15m": number } };
  memory: { total: number; used: number; free: number; percent: number };
  swap: { total: number; used: number; percent: number };
  disk_root: { total: number; used: number; free: number; percent: number };
}

export default function OverviewPage() {
  const { data, error, loading } = usePoll<Overview>(() => api("/system/overview"), 2000);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={`${data.host.hostname} • ${data.host.os}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="CPU"
          value={`${data.cpu.percent.toFixed(1)}%`}
          hint={`${data.cpu.count_logical} cores · load ${data.cpu.load_avg["1m"].toFixed(2)}`}
          accent={data.cpu.percent >= 80 ? "crit" : data.cpu.percent >= 60 ? "warn" : "ok"}
        />
        <MetricCard
          title="Memory"
          value={`${data.memory.percent.toFixed(1)}%`}
          hint={`${fmtBytes(data.memory.used)} / ${fmtBytes(data.memory.total)}`}
          accent={data.memory.percent >= 90 ? "crit" : data.memory.percent >= 75 ? "warn" : "ok"}
        />
        <MetricCard
          title="Disk /"
          value={`${data.disk_root.percent.toFixed(1)}%`}
          hint={`${fmtBytes(data.disk_root.used)} / ${fmtBytes(data.disk_root.total)}`}
          accent={data.disk_root.percent >= 90 ? "crit" : data.disk_root.percent >= 75 ? "warn" : "ok"}
        />
        <MetricCard
          title="Uptime"
          value={fmtDuration(data.uptime_seconds)}
          hint={`Kernel ${data.host.kernel}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Resource usage</div>
          <div className="space-y-3">
            <ProgressBar label="CPU" value={data.cpu.percent} />
            <ProgressBar label="RAM" value={data.memory.percent} caption={`${fmtBytes(data.memory.used)} / ${fmtBytes(data.memory.total)}`} />
            <ProgressBar
              label="Swap"
              value={data.swap.total > 0 ? data.swap.percent : 0}
              caption={data.swap.total > 0 ? `${fmtBytes(data.swap.used)} / ${fmtBytes(data.swap.total)}` : "no swap"}
            />
            <ProgressBar label="Disk /" value={data.disk_root.percent} caption={`${fmtBytes(data.disk_root.free)} free`} />
          </div>
        </div>

        <div className="card">
          <div className="card-title">Load average</div>
          <div className="grid grid-cols-3 gap-4">
            <LoadCell label="1 min" v={data.cpu.load_avg["1m"]} cpus={data.cpu.count_logical} />
            <LoadCell label="5 min" v={data.cpu.load_avg["5m"]} cpus={data.cpu.count_logical} />
            <LoadCell label="15 min" v={data.cpu.load_avg["15m"]} cpus={data.cpu.count_logical} />
          </div>
          <div className="mt-4 text-xs text-muted">
            Load &gt; số core ({data.cpu.count_logical}) → CPU đang quá tải.
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadCell({ label, v, cpus }: { label: string; v: number; cpus: number }) {
  const pct = (v / cpus) * 100;
  const color = pct >= 100 ? "text-crit" : pct >= 70 ? "text-warn" : "text-ok";
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className={`text-xl font-semibold tabular-nums ${color}`}>{v.toFixed(2)}</div>
      <div className="text-xs text-muted">{pct.toFixed(0)}% of {cpus} cores</div>
    </div>
  );
}

export function Loading() {
  return <div className="text-muted text-sm">Loading…</div>;
}

export function ErrorBox({ msg }: { msg: string }) {
  return <div className="card border-crit text-crit text-sm">Error: {msg}</div>;
}
