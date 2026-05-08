import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { api } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

export default function LogsPage() {
  const [unit, setUnit] = useState("");
  const [lines, setLines] = useState(200);
  const [priority, setPriority] = useState("");

  const qs = new URLSearchParams();
  if (unit) qs.set("unit", unit);
  qs.set("lines", String(lines));
  if (priority) qs.set("priority", priority);

  const { data, error, loading, refresh } = usePoll<{ output: string }>(
    () => api(`/logs?${qs.toString()}`),
    5000,
  );

  return (
    <div>
      <PageHeader
        title="Logs"
        subtitle="journalctl"
        action={
          <div className="flex gap-2 items-center">
            <input
              placeholder="Unit (optional, e.g. ssh.service)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="btn btn-ghost w-72"
            />
            <select className="btn btn-ghost" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All priorities</option>
              <option value="0">Emerg</option>
              <option value="1">Alert</option>
              <option value="2">Crit</option>
              <option value="3">Error</option>
              <option value="4">Warning</option>
              <option value="5">Notice</option>
              <option value="6">Info</option>
              <option value="7">Debug</option>
            </select>
            <select className="btn btn-ghost" value={lines} onChange={(e) => setLines(parseInt(e.target.value))}>
              <option value="100">100 lines</option>
              <option value="200">200 lines</option>
              <option value="500">500 lines</option>
              <option value="1000">1000 lines</option>
            </select>
            <button onClick={refresh} className="btn btn-primary">Refresh</button>
          </div>
        }
      />

      <div className="card">
        {loading && !data ? (
          <Loading />
        ) : error ? (
          <ErrorBox msg={error} />
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[70vh] overflow-auto">
            {data?.output || "(no output)"}
          </pre>
        )}
      </div>
    </div>
  );
}
