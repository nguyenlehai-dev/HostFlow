import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { api, fmtTime } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface Proc {
  pid: number; name: string; user: string; status: string;
  cpu: number; mem: number; cmd: string; started: number;
}

export default function ProcessesPage() {
  const [sort, setSort] = useState<"cpu" | "mem" | "pid" | "name">("cpu");
  const [limit, setLimit] = useState(50);
  const { data, error, loading } = usePoll<{ count: number; items: Proc[] }>(
    () => api(`/processes?sort=${sort}&limit=${limit}`),
    3000,
  );

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox msg={error} />;

  return (
    <div>
      <PageHeader
        title="Processes"
        subtitle={`${data?.count ?? 0} total`}
        action={
          <div className="flex gap-2">
            <select className="btn btn-ghost" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="cpu">Sort: CPU</option>
              <option value="mem">Sort: Memory</option>
              <option value="pid">Sort: PID</option>
              <option value="name">Sort: Name</option>
            </select>
            <select className="btn btn-ghost" value={limit} onChange={(e) => setLimit(parseInt(e.target.value))}>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
              <option value="200">Top 200</option>
            </select>
          </div>
        }
      />

      <div className="card">
        <table className="t">
          <thead>
            <tr>
              <th>PID</th><th>User</th><th>Name</th>
              <th>CPU%</th><th>Mem%</th><th>Status</th><th>Started</th><th>Command</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr key={p.pid}>
                <td className="font-mono text-xs">{p.pid}</td>
                <td className="text-xs">{p.user}</td>
                <td className="font-medium">{p.name}</td>
                <td className="tabular-nums">{p.cpu.toFixed(1)}</td>
                <td className="tabular-nums">{p.mem.toFixed(2)}</td>
                <td><StatusBadge s={p.status} /></td>
                <td className="text-xs text-muted">{p.started ? fmtTime(p.started) : ""}</td>
                <td className="font-mono text-xs text-muted truncate max-w-md">{p.cmd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const c = s === "running" ? "text-ok" : s === "zombie" ? "text-crit" : s === "stopped" ? "text-warn" : "text-muted";
  return <span className={`text-xs ${c}`}>{s}</span>;
}
