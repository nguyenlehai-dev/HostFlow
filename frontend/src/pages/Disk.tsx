import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import { api, fmtBytes } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface Partition {
  device: string; mountpoint: string; fstype: string; opts: string;
  total?: number; used?: number; free?: number; percent?: number; error?: string;
}

interface IO { name: string; read_bytes: number; write_bytes: number; read_count: number; write_count: number; }

export default function DiskPage() {
  const parts = usePoll<{ items: Partition[] }>(() => api("/disk/partitions"), 5000);
  const io = usePoll<{ items: IO[] }>(() => api("/disk/io"), 2000);

  if (parts.loading && !parts.data) return <Loading />;
  if (parts.error) return <ErrorBox msg={parts.error} />;

  return (
    <div>
      <PageHeader title="Disk" />

      <div className="card mb-4">
        <div className="card-title">Partitions / Mount points</div>
        <table className="t">
          <thead>
            <tr>
              <th>Device</th><th>Mount</th><th>Type</th>
              <th>Total</th><th>Used</th><th>Free</th><th className="w-48">Usage</th>
            </tr>
          </thead>
          <tbody>
            {parts.data?.items.map((p) => (
              <tr key={p.device + p.mountpoint}>
                <td className="font-mono text-xs">{p.device}</td>
                <td className="font-mono text-xs">{p.mountpoint}</td>
                <td>{p.fstype}</td>
                <td className="tabular-nums">{p.total ? fmtBytes(p.total) : "—"}</td>
                <td className="tabular-nums">{p.used ? fmtBytes(p.used) : "—"}</td>
                <td className="tabular-nums">{p.free ? fmtBytes(p.free) : "—"}</td>
                <td>{p.percent != null ? <ProgressBar value={p.percent} /> : <span className="text-muted text-xs">{p.error}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-title">Disk I/O (since boot)</div>
        <table className="t">
          <thead>
            <tr>
              <th>Device</th>
              <th>Reads</th><th>Bytes read</th>
              <th>Writes</th><th>Bytes written</th>
            </tr>
          </thead>
          <tbody>
            {io.data?.items.map((d) => (
              <tr key={d.name}>
                <td className="font-mono text-xs">{d.name}</td>
                <td className="tabular-nums">{d.read_count.toLocaleString()}</td>
                <td className="tabular-nums">{fmtBytes(d.read_bytes)}</td>
                <td className="tabular-nums">{d.write_count.toLocaleString()}</td>
                <td className="tabular-nums">{fmtBytes(d.write_bytes)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
