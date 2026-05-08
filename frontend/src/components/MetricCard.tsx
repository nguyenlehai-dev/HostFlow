interface Props {
  title: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "ok" | "warn" | "crit";
}

const COLOR: Record<string, string> = {
  default: "text-slate-100",
  ok: "text-ok",
  warn: "text-warn",
  crit: "text-crit",
};

export default function MetricCard({ title, value, hint, accent = "default" }: Props) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className={`text-2xl font-semibold tabular-nums ${COLOR[accent]}`}>{value}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}
