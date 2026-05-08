import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface Finding {
  level: "critical" | "warning" | "info" | "ok";
  category: string; issue: string; suggest: string;
}

export default function OptimizePage() {
  const { data, error, loading, refresh } = usePoll<{
    summary: Record<string, number>; findings: Finding[];
  }>(() => api("/optimize/recommendations"), 15000);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox msg={error} />;
  if (!data) return null;

  return (
    <div>
      <PageHeader
        title="Optimize"
        subtitle="Phân tích server và đề xuất tối ưu"
        action={<button onClick={refresh} className="btn btn-primary">Re-analyze</button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Critical" v={data.summary.critical || 0} color="text-crit" />
        <SummaryCard label="Warning" v={data.summary.warning || 0} color="text-warn" />
        <SummaryCard label="Info" v={data.summary.info || 0} color="text-accent" />
        <SummaryCard label="OK" v={data.summary.ok || 0} color="text-ok" />
      </div>

      <div className="space-y-3">
        {data.findings.map((f, i) => (
          <FindingCard key={i} f={f} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div className="card">
      <div className="card-title">{label}</div>
      <div className={`text-3xl font-semibold tabular-nums ${color}`}>{v}</div>
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const palette = {
    critical: "border-crit bg-crit/10",
    warning: "border-warn bg-warn/10",
    info: "border-accent bg-accent/10",
    ok: "border-ok bg-ok/10",
  } as const;
  const icon = { critical: "🔴", warning: "🟡", info: "🔵", ok: "🟢" }[f.level];
  return (
    <div className={`card border-l-4 ${palette[f.level]}`}>
      <div className="flex items-start gap-3">
        <div className="text-xl">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-muted">{f.category}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              f.level === "critical" ? "bg-crit/20 text-crit" :
              f.level === "warning" ? "bg-warn/20 text-warn" :
              f.level === "info" ? "bg-accent/20 text-accent" : "bg-ok/20 text-ok"
            }`}>{f.level}</span>
          </div>
          <div className="font-medium mt-1">{f.issue}</div>
          <div className="text-sm text-muted mt-1">{f.suggest}</div>
        </div>
      </div>
    </div>
  );
}
