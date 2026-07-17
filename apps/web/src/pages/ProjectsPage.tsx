import { useEffect, useState } from "react";
import { api } from "../api/client";
import { Badge, Button, Panel } from "../components/ui";
import { useAppStore } from "../store";

export function ProjectsPage() {
  const { projects, refreshAll, setToast } = useAppStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function createProject() {
    if (!name.trim()) return;
    try {
      await api.projects.create(name.trim(), description.trim());
      setName("");
      setDescription("");
      setToast("Projeto criado com board");
      await refreshAll();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Falha ao criar projeto");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Administração
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Projetos</h1>
      </header>

      <Panel title="Novo projeto">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome"
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição"
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <Button onClick={() => void createProject()}>Criar</Button>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <Panel key={project.id}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-semibold">{project.name}</h2>
              <Badge tone="accent">autonomia {project.default_autonomy}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {project.description || "Sem descrição"}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="info">git: {project.git_provider}</Badge>
              <Badge>tickets: {project.ticket_provider}</Badge>
              <Badge>{project.id}</Badge>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
