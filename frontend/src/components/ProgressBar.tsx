interface Props {
  value: number; // 0-100
  label?: string;
  caption?: string;
}

export default function ProgressBar({ value, label, caption }: Props) {
  const pct = Math.max(0, Math.min(100, value));
  const color =
    pct >= 90 ? "bg-crit" : pct >= 75 ? "bg-warn" : "bg-accent";
  return (
    <div>
      {label && (
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>{label}</span>
          <span className="tabular-nums">{caption ?? `${pct.toFixed(1)}%`}</span>
        </div>
      )}
      <div className="h-2 bg-bg rounded overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
