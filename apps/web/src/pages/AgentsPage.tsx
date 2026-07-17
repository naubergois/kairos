import { useEffect } from "react";
import { api } from "../api/client";
import { Badge, Button, Panel } from "../components/ui";
import { useAppStore } from "../store";

export function AgentsPage() {
  const { agents, refreshAll, setToast } = useAppStore();

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function toggle(id: string, active: boolean) {
    try {
      await api.agents.patch(id, { active: !active });
      setToast(!active ? "Agente ativado" : "Agente desativado");
      await refreshAll();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Falha ao atualizar agente");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Catálogo
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Agentes da plataforma</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Papéis do MVP: supervisor, triagem, requisitos, planejador, arquiteto, coordenador,
          desenvolvedor, testador, revisor, documentação e chamados.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <Panel key={agent.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{agent.name}</h2>
                <div className="mt-1 text-sm text-[var(--muted)]">{agent.role}</div>
              </div>
              <Badge tone={agent.active ? "accent" : "neutral"}>
                {agent.active ? "ativo" : "inativo"}
              </Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{agent.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="info">{agent.preferred_model}</Badge>
              <Badge>v{agent.version}</Badge>
              <Badge>autonomia {agent.autonomy_level}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/70 px-3 py-2">
                <div className="text-xs text-[var(--muted)]">Sucesso</div>
                <div className="font-semibold">{Math.round(agent.success_rate * 100)}%</div>
              </div>
              <div className="rounded-2xl bg-white/70 px-3 py-2">
                <div className="text-xs text-[var(--muted)]">Custo médio</div>
                <div className="font-semibold">{agent.avg_cost_tokens.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {agent.tools.map((tool) => (
                <Badge key={tool}>{tool}</Badge>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-4 w-full"
              onClick={() => void toggle(agent.id, agent.active)}
            >
              {agent.active ? "Desativar" : "Ativar"}
            </Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
