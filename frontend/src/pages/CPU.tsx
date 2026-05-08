import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import { api } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface CPUData {
  count_logical: number;
  count_physical: number;
  freq: { current: number; min: number; max: number } | null;
  per_core_percent: number[];
  times_percent: { user: number; system: number; idle: number; iowait: number };
}

export default function CPUPage() {
  const { data, error, loading } = usePoll<CPUData>(() => api("/system/cpu"), 1500);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader title="CPU" subtitle={`${data.count_physical} physical / ${data.count_logical} logical cores`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard title="Logical cores" value={data.count_logical} />
        <MetricCard title="Physical cores" value={data.count_physical} />
        <MetricCard title="Frequency" value={data.freq ? `${(data.freq.current / 1000).toFixed(2)} GHz` : "—"} hint={data.freq ? `min ${(data.freq.min / 1000).toFixed(1)} max ${(data.freq.max / 1000).toFixed(1)}` : ""} />
        <MetricCard title="iowait" value={`${data.times_percent.iowait.toFixed(1)}%`} accent={data.times_percent.iowait > 20 ? "warn" : "ok"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Per-core usage</div>
          <div className="space-y-2">
            {data.per_core_percent.map((p, i) => (
              <ProgressBar key={i} label={`Core ${i}`} value={p} />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">CPU time breakdown</div>
          <div className="space-y-3">
            <ProgressBar label="User" value={data.times_percent.user} />
            <ProgressBar label="System" value={data.times_percent.system} />
            <ProgressBar label="iowait" value={data.times_percent.iowait} />
            <ProgressBar label="Idle" value={data.times_percent.idle} />
          </div>
        </div>
      </div>
    </div>
  );
}
