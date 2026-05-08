import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface Service {
  unit: string; load: string; active: string; sub: string; description: string;
}

export default function ServicesPage() {
  const [state, setState] = useState<"all" | "running" | "failed">("all");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { data, error, loading, refresh } = usePoll<{ count: number; items: Service[] }>(
    () => api(`/services?state=${state}`),
    5000,
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox msg={error} />;

  const items = data?.items.filter((s) =>
    s.unit.toLowerCase().includes(filter.toLowerCase()) ||
    s.description.toLowerCase().includes(filter.toLowerCase()),
  ) ?? [];

  const action = async (unit: string, act: string) => {
    if (!confirm(`${act} ${unit}?`)) return;
    setBusy(unit);
    try {
      await api(`/services/${encodeURIComponent(unit)}/${act}`, { method: "POST" });
      refresh();
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${items.length} of ${data?.count ?? 0} units`}
        action={
          <div className="flex gap-2">
            <input
              placeholder="Filter…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="btn btn-ghost"
            />
            <select className="btn btn-ghost" value={state} onChange={(e) => setState(e.target.value as any)}>
              <option value="all">All</option>
              <option value="running">Running</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        }
      />

      <div className="card">
        <table className="t">
          <thead>
            <tr>
              <th>Unit</th><th>Load</th><th>Active</th><th>Sub</th><th>Description</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.unit}>
                <td className="font-mono text-xs">{s.unit}</td>
                <td>{s.load}</td>
                <td><ActiveBadge a={s.active} /></td>
                <td className="text-xs">{s.sub}</td>
                <td className="text-xs text-muted truncate max-w-sm">{s.description}</td>
                <td>
                  <div className="flex gap-1">
                    <button disabled={busy === s.unit} onClick={() => action(s.unit, "start")} className="btn btn-ghost text-xs">▶</button>
                    <button disabled={busy === s.unit} onClick={() => action(s.unit, "stop")} className="btn btn-ghost text-xs">■</button>
                    <button disabled={busy === s.unit} onClick={() => action(s.unit, "restart")} className="btn btn-ghost text-xs">↻</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActiveBadge({ a }: { a: string }) {
  const c = a === "active" ? "text-ok" : a === "failed" ? "text-crit" : a === "inactive" ? "text-muted" : "text-warn";
  return <span className={`text-xs ${c}`}>{a}</span>;
}
