import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { api, fmtBytes } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface Container {
  id: string; name: string; image: string; status: string; state: string;
  started: string; created: string;
  ports: { private: string; public: any }[];
  command: string[]; restart_count: number;
}

interface Image { id: string; tags: string[]; size: number; created: string; }

export default function DockerPage() {
  const [tab, setTab] = useState<"containers" | "images">("containers");
  const [busy, setBusy] = useState<string | null>(null);
  const containers = usePoll<{ count: number; items: Container[] }>(() => api("/docker/containers"), 5000);
  const images = usePoll<{ count: number; items: Image[] }>(() => api("/docker/images"), 10000);

  const action = async (cid: string, act: string) => {
    if (act === "remove" && !confirm(`Remove container ${cid}?`)) return;
    setBusy(cid);
    try {
      await api(`/docker/containers/${cid}/${act}`, { method: "POST" });
      containers.refresh();
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  if (containers.error?.includes("503")) {
    return (
      <div>
        <PageHeader title="Docker" />
        <div className="card text-muted">Docker service không khả dụng (chưa chạy hoặc backend chưa có quyền).</div>
      </div>
    );
  }
  if (containers.loading && !containers.data) return <Loading />;
  if (containers.error) return <ErrorBox msg={containers.error} />;

  return (
    <div>
      <PageHeader title="Docker" />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("containers")} className={`btn ${tab === "containers" ? "btn-primary" : "btn-ghost"}`}>
          Containers ({containers.data?.count ?? 0})
        </button>
        <button onClick={() => setTab("images")} className={`btn ${tab === "images" ? "btn-primary" : "btn-ghost"}`}>
          Images ({images.data?.count ?? 0})
        </button>
      </div>

      {tab === "containers" && (
        <div className="card">
          {containers.data && containers.data.items.length === 0 ? (
            <div className="text-muted text-sm">Chưa có container nào.</div>
          ) : (
            <table className="t">
              <thead>
                <tr>
                  <th>ID</th><th>Name</th><th>Image</th><th>State</th><th>Ports</th><th>Restarts</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {containers.data?.items.map((c) => (
                  <tr key={c.id}>
                    <td className="font-mono text-xs">{c.id}</td>
                    <td>{c.name}</td>
                    <td className="text-xs">{c.image}</td>
                    <td><StateBadge s={c.state} /></td>
                    <td className="text-xs">
                      {c.ports.length === 0 ? <span className="text-muted">—</span> :
                        c.ports.map((p, i) => <div key={i} className="font-mono">{p.private}{p.public?.[0]?.HostPort ? ` → ${p.public[0].HostPort}` : ""}</div>)}
                    </td>
                    <td className="tabular-nums">{c.restart_count}</td>
                    <td>
                      <div className="flex gap-1">
                        <button disabled={busy === c.id} onClick={() => action(c.id, "start")} className="btn btn-ghost text-xs">▶</button>
                        <button disabled={busy === c.id} onClick={() => action(c.id, "stop")} className="btn btn-ghost text-xs">■</button>
                        <button disabled={busy === c.id} onClick={() => action(c.id, "restart")} className="btn btn-ghost text-xs">↻</button>
                        <button disabled={busy === c.id} onClick={() => action(c.id, "remove")} className="btn btn-danger text-xs">✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "images" && (
        <div className="card">
          <table className="t">
            <thead>
              <tr><th>ID</th><th>Tags</th><th>Size</th><th>Created</th></tr>
            </thead>
            <tbody>
              {images.data?.items.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{i.id}</td>
                  <td className="text-xs">{i.tags?.length ? i.tags.join(", ") : <span className="text-muted">&lt;none&gt;</span>}</td>
                  <td className="tabular-nums">{fmtBytes(i.size)}</td>
                  <td className="text-xs text-muted">{i.created?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StateBadge({ s }: { s: string }) {
  const c = s === "running" ? "text-ok" : s === "exited" ? "text-muted" : s === "paused" ? "text-warn" : "text-crit";
  return <span className={`text-xs ${c}`}>{s}</span>;
}
