import { useState } from "react";
import PageHeader from "../components/PageHeader";
import { api, fmtBytes } from "../api/client";
import { usePoll } from "../hooks/usePoll";
import { ErrorBox, Loading } from "./Overview";

interface Iface {
  name: string;
  addresses: { family: string; address: string; netmask: string }[];
  is_up: boolean;
  speed_mbps: number;
  mtu: number;
  bytes_sent: number; bytes_recv: number;
  packets_sent: number; packets_recv: number;
  errin: number; errout: number; dropin: number; dropout: number;
}

interface Listening { tcp: { addr: string; pid: number; process: string }[]; udp: { addr: string; pid: number; process: string }[]; }

export default function NetworkPage() {
  const [tab, setTab] = useState<"ifaces" | "listening" | "firewall">("ifaces");
  const ifaces = usePoll<{ items: Iface[] }>(() => api("/network/interfaces"), 2000);
  const listen = usePoll<Listening>(() => api("/network/listening"), 5000);
  const fw = usePoll<{ available: boolean; output?: string; error?: string }>(() => api("/network/firewall"), 10000);

  if (ifaces.loading && !ifaces.data) return <Loading />;
  if (ifaces.error) return <ErrorBox msg={ifaces.error} />;

  return (
    <div>
      <PageHeader title="Network" />

      <div className="flex gap-2 mb-4">
        <Tab on={tab === "ifaces"} onClick={() => setTab("ifaces")}>Interfaces</Tab>
        <Tab on={tab === "listening"} onClick={() => setTab("listening")}>Listening ports</Tab>
        <Tab on={tab === "firewall"} onClick={() => setTab("firewall")}>Firewall (UFW)</Tab>
      </div>

      {tab === "ifaces" && (
        <div className="card">
          <table className="t">
            <thead>
              <tr>
                <th>Interface</th><th>State</th><th>Addresses</th>
                <th>Sent</th><th>Received</th><th>Errors</th><th>Drops</th>
              </tr>
            </thead>
            <tbody>
              {ifaces.data?.items.map((i) => (
                <tr key={i.name}>
                  <td className="font-mono text-xs">{i.name}</td>
                  <td>
                    <span className={i.is_up ? "text-ok" : "text-crit"}>{i.is_up ? "UP" : "DOWN"}</span>
                    {i.speed_mbps > 0 && <span className="text-muted text-xs ml-2">{i.speed_mbps}M</span>}
                  </td>
                  <td className="font-mono text-xs">
                    {i.addresses.filter(a => a.address && !a.address.includes("%")).slice(0, 3).map((a, idx) => (
                      <div key={idx}>{a.address}</div>
                    ))}
                  </td>
                  <td className="tabular-nums">{fmtBytes(i.bytes_sent)}</td>
                  <td className="tabular-nums">{fmtBytes(i.bytes_recv)}</td>
                  <td className="tabular-nums">{i.errin + i.errout}</td>
                  <td className="tabular-nums">{i.dropin + i.dropout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "listening" && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <div className="card-title">TCP</div>
            <table className="t">
              <thead><tr><th>Address</th><th>PID</th><th>Process</th></tr></thead>
              <tbody>
                {listen.data?.tcp.map((c, i) => (
                  <tr key={i}><td className="font-mono text-xs">{c.addr}</td><td>{c.pid}</td><td>{c.process}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <div className="card-title">UDP</div>
            <table className="t">
              <thead><tr><th>Address</th><th>PID</th><th>Process</th></tr></thead>
              <tbody>
                {listen.data?.udp.map((c, i) => (
                  <tr key={i}><td className="font-mono text-xs">{c.addr}</td><td>{c.pid}</td><td>{c.process}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "firewall" && (
        <div className="card">
          <div className="card-title">UFW status</div>
          {fw.data?.available ? (
            <pre className="text-xs font-mono whitespace-pre-wrap">{fw.data.output}</pre>
          ) : (
            <div className="text-muted text-sm">UFW not available: {fw.data?.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Tab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`btn ${on ? "btn-primary" : "btn-ghost"}`}>{children}</button>
  );
}
