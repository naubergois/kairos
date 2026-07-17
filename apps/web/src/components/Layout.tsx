import { NavLink, Outlet } from "react-router-dom";
import clsx from "clsx";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/kanban", label: "Kanban" },
  { to: "/portal", label: "Portal" },
  { to: "/swarm", label: "Enxame" },
  { to: "/approvals", label: "Aprovações" },
  { to: "/tickets", label: "Chamados" },
  { to: "/agents", label: "Agentes" },
  { to: "/projects", label: "Projetos" },
];

export function Layout() {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-[var(--line)] bg-[#1c2430] text-[#f7f3ea] lg:min-h-screen lg:border-b-0 lg:border-r lg:border-[#2b3442]">
        <div className="px-6 py-7">
          <div className="brand text-3xl font-bold tracking-tight">Manus</div>
          <div className="mt-1 text-sm text-[#b7c0cc]">SwarmDesk</div>
          <p className="mt-4 text-sm leading-relaxed text-[#9aa5b5]">
            Controle humano, execução multiagente e Kanban auditável.
          </p>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-[var(--accent)] text-white"
                    : "text-[#d5dbe4] hover:bg-white/8",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
