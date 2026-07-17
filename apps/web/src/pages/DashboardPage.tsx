import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge, Panel, Stat } from "../components/ui";
import { useAppStore } from "../store";
import { COLUMN_LABELS } from "../types";

export function DashboardPage() {
  const { metrics, cards, refreshAll, loading } = useAppStore();

  useEffect(() => {
    void refreshAll();
    const id = window.setInterval(() => void refreshAll(), 8000);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  const running = cards.filter((c) =>
    ["em_execucao", "em_revisao", "em_testes", "pronto_enxame"].includes(c.column),
  );
  const blocked = cards.filter((c) => c.column === "bloqueado");

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Operação
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Manus SwarmDesk
        </h1>
        <p className="mt-3 text-base text-[var(--muted)]">
          Visão executiva do ciclo multiagente — execução, bloqueios, custo e qualidade.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Em execução" value={metrics?.in_execution ?? 0} hint="Cartões ativos no enxame" />
        <Stat label="Bloqueados" value={metrics?.blocked ?? 0} hint="Dependências externas" />
        <Stat label="Entregas" value={metrics?.recent_deliveries ?? 0} hint="Concluídos no board" />
        <Stat
          label="Custo estimado"
          value={`$${(metrics?.total_cost_usd ?? 0).toFixed(2)}`}
          hint={`${(metrics?.total_tokens ?? 0).toLocaleString()} tokens`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Fila operacional" action={loading ? <Badge>Atualizando</Badge> : null}>
          <div className="space-y-3">
            {[...running, ...blocked].slice(0, 8).map((card) => (
              <Link
                key={card.id}
                to={`/cards/${card.id}`}
                className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 transition hover:border-[var(--accent)]"
              >
                <div>
                  <div className="font-semibold">{card.title}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {COLUMN_LABELS[card.column]} · {card.agents.slice(0, 3).join(", ") || "sem agentes"}
                  </div>
                </div>
                <Badge tone={card.column === "bloqueado" ? "danger" : "accent"}>
                  {card.priority}
                </Badge>
              </Link>
            ))}
            {!running.length && !blocked.length ? (
              <p className="text-sm text-[var(--muted)]">Nenhuma tarefa em andamento no momento.</p>
            ) : null}
          </div>
        </Panel>

        <Panel title="Desempenho dos agentes">
          <div className="space-y-3">
            {(metrics?.agent_performance ?? []).slice(0, 8).map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {agent.avg_cost_tokens.toLocaleString()} tok médios
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[var(--accent)]">
                    {Math.round(agent.success_rate * 100)}%
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {agent.active ? "ativo" : "inativo"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat
              label="Taxa de sucesso"
              value={`${Math.round((metrics?.success_rate ?? 0) * 100)}%`}
            />
            <Stat label="Ciclo médio" value={`${metrics?.avg_cycle_hours ?? 0}h`} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
