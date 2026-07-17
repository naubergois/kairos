import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AgentsPage } from "./pages/AgentsPage";
import { ApprovalsPage } from "./pages/ApprovalsPage";
import { CardDetailPage } from "./pages/CardDetailPage";
import { DashboardPage } from "./pages/DashboardPage";
import { KanbanPage } from "./pages/KanbanPage";
import { PortalPage } from "./pages/PortalPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SwarmPage } from "./pages/SwarmPage";
import { TicketsPage } from "./pages/TicketsPage";
import { useAppStore } from "./store";

function Toast() {
  const toast = useAppStore((s) => s.toast);
  const setToast = useAppStore((s) => s.setToast);
  const error = useAppStore((s) => s.error);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(id);
  }, [toast, setToast]);

  if (!toast && !error) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-[#1c2430] px-4 py-3 text-sm text-white shadow-xl">
      {toast ?? error}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="cards/:id" element={<CardDetailPage />} />
          <Route path="portal" element={<PortalPage />} />
          <Route path="swarm" element={<SwarmPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toast />
    </BrowserRouter>
  );
}
