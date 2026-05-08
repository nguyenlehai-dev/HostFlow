import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import { api, fmtBytes } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface MemoryData {
  virtual: {
    total: number; available: number; used: number; free: number;
    active?: number; inactive?: number; buffers?: number; cached?: number; shared?: number; percent: number;
  };
  swap: { total: number; used: number; free: number; percent: number; sin: number; sout: number };
}

export default function MemoryPage() {
  const { data, error, loading } = usePoll<MemoryData>(() => api("/system/memory"), 2000);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;

  const v = data.virtual;
  return (
    <div>
      <PageHeader title="Memory" subtitle={`${fmtBytes(v.used)} / ${fmtBytes(v.total)} used`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard title="RAM Used" value={`${v.percent.toFixed(1)}%`} hint={fmtBytes(v.used)} accent={v.percent >= 90 ? "crit" : v.percent >= 75 ? "warn" : "ok"} />
        <MetricCard title="Available" value={fmtBytes(v.available)} hint="for new processes" />
        <MetricCard title="Cached" value={fmtBytes(v.cached || 0)} hint="reclaimable cache" />
        <MetricCard title="Swap Used" value={data.swap.total > 0 ? `${data.swap.percent.toFixed(1)}%` : "—"} hint={data.swap.total > 0 ? fmtBytes(data.swap.used) : "no swap"} accent={data.swap.percent >= 50 ? "warn" : "ok"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Virtual memory breakdown</div>
          <div className="space-y-3">
            <ProgressBar label="Used" value={v.percent} caption={fmtBytes(v.used)} />
            <Row label="Total" v={fmtBytes(v.total)} />
            <Row label="Available" v={fmtBytes(v.available)} />
            <Row label="Free" v={fmtBytes(v.free)} />
            <Row label="Active" v={fmtBytes(v.active || 0)} />
            <Row label="Inactive" v={fmtBytes(v.inactive || 0)} />
            <Row label="Buffers" v={fmtBytes(v.buffers || 0)} />
            <Row label="Cached" v={fmtBytes(v.cached || 0)} />
            <Row label="Shared" v={fmtBytes(v.shared || 0)} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">Swap</div>
          {data.swap.total === 0 ? (
            <div className="text-muted text-sm">No swap configured.</div>
          ) : (
            <div className="space-y-3">
              <ProgressBar label="Swap used" value={data.swap.percent} caption={fmtBytes(data.swap.used)} />
              <Row label="Total" v={fmtBytes(data.swap.total)} />
              <Row label="Used" v={fmtBytes(data.swap.used)} />
              <Row label="Free" v={fmtBytes(data.swap.free)} />
              <Row label="Pages in (since boot)" v={fmtBytes(data.swap.sin)} />
              <Row label="Pages out (since boot)" v={fmtBytes(data.swap.sout)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
}
