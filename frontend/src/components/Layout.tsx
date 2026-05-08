import { NavLink, Outlet } from "react-router-dom";

const NAV = [
  { to: "/", icon: "📊", label: "Overview", end: true },
  { to: "/cpu", icon: "🧠", label: "CPU" },
  { to: "/memory", icon: "💾", label: "Memory" },
  { to: "/disk", icon: "💿", label: "Disk" },
  { to: "/network", icon: "🌐", label: "Network" },
  { to: "/processes", icon: "⚙️", label: "Processes" },
  { to: "/services", icon: "🔧", label: "Services" },
  { to: "/docker", icon: "🐳", label: "Docker" },
  { to: "/logs", icon: "📜", label: "Logs" },
  { to: "/optimize", icon: "✨", label: "Optimize" },
];

export default function Layout() {
  return (
    <div className="h-full flex">
      <aside className="w-56 border-r border-border bg-panel/60 flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <div className="text-lg font-semibold tracking-tight">
            <span className="text-accent">Host</span>Flow
          </div>
          <div className="text-xs text-muted">Server management</div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end as any}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                  isActive ? "bg-accent/20 text-white border border-accent/40" : "text-slate-300 hover:bg-bg/60"
                }`
              }
            >
              <span className="text-base">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 text-xs text-muted border-t border-border">v0.1.0</div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
