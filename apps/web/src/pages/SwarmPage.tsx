import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Badge, Button, EmptyState, Panel, Stat } from "../components/ui";
import { useAppStore } from "../store";

const RUNNING_STATUSES = ["running", "coordinating", "executing"];

export function SwarmPage() {
  const { missions, cards, refreshAll, setToast } = useAppStore();
  const [busyMissionId, setBusyMissionId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"start" | "stop" | null>(null);

  useEffect(() => {
    void refreshAll();
    const id = window.setInterval(() => void refreshAll(), 5000);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  const active = missions.filter((m) =>
    [...RUNNING_STATUSES, "awaiting_delivery_approval", "blocked"].includes(m.status),
  );
  const selected = active[0] ?? missions[0];
  const card = selected ? cards.find((c) => c.id === selected.card_id) : null;
  const canStopSelected = selected ? RUNNING_STATUSES.includes(selected.status) : false;
  const canStartSelected = selected ? !RUNNING_STATUSES.includes(selected.status) : false;

  const runAction = async (action: "start" | "stop") => {
    if (!selected) return;
    if (action === "stop" && !canStopSelected) return;
    if (action === "start" && !canStartSelected) return;

    setBusyMissionId(selected.id);
    setBusyAction(action);
    try {
      if (action === "stop") {
        await api.swarm.stop(selected.id);
        setToast("Enxame parado");
      } else {
        await api.swarm.start(selected.id);
        setToast("Enxame iniciado");
      }
      await refreshAll();
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : action === "stop"
            ? "Falha ao parar o enxame"
            : "Falha ao iniciar o enxame",
      );
    } finally {
      setBusyMissionId(null);
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Ruflo
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Central do enxame</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Topologia hierárquica, agentes ativos, progresso e bloqueios da missão atual.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Missões" value={missions.length} />
        <Stat label="Ativas" value={active.length} />
        <Stat
          label="Progresso"
          value={selected ? `${Math.round(selected.progress * 100)}%` : "—"}
        />
      </div>

      {!selected ? (
        <EmptyState
          title="Nenhum enxame formado"
          body="Aprove um cartão em Aguardando aprovação para disparar o enxame de agentes."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel
            title="Topologia"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => void runAction("start")}
                  disabled={!canStartSelected || busyMissionId === selected.id}
                >
                  {busyMissionId === selected.id && busyAction === "start"
                    ? "Iniciando..."
                    : "Start"}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => void runAction("stop")}
                  disabled={!canStopSelected || busyMissionId === selected.id}
                >
                  {busyMissionId === selected.id && busyAction === "stop"
                    ? "Parando..."
                    : "Stop"}
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="rounded-[24px] border border-[var(--line)] bg-[#1c2430] px-5 py-6 text-[#f7f3ea]">
                <div className="text-xs uppercase tracking-[0.12em] text-[#9aa5b5]">Coordenador</div>
                <div className="mt-2 text-2xl font-semibold">coordenador</div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {selected.agents
                    .filter((a) => a.role !== "coordenador")
                    .map((agent) => (
                      <div
                        key={`${agent.agent_id}-${agent.subtask}`}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <div className="font-semibold">{agent.agent_id}</div>
                        <div className="mt-1 text-xs text-[#b7c0cc]">{agent.status}</div>
                      </div>
                    ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone="accent">{selected.topology}</Badge>
                <Badge>{selected.status}</Badge>
                <Badge tone="info">{selected.consensus_policy}</Badge>
              </div>
              {card ? (
                <Link to={`/cards/${card.id}`} className="text-sm font-semibold text-[var(--accent)]">
                  Cartão: {card.title}
                </Link>
              ) : null}
            </div>
          </Panel>

          <Panel title="Tarefas atribuídas">
            <div className="space-y-3">
              {selected.agents.map((agent) => (
                <div
                  key={`${agent.agent_id}-${agent.subtask}`}
                  className="rounded-2xl border border-[var(--line)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">
                      {agent.agent_id} · {agent.role}
                    </div>
                    <Badge tone={agent.status === "completed" ? "accent" : "neutral"}>
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm">{agent.subtask}</p>
                  {agent.output_summary ? (
                    <p className="mt-2 text-sm text-[var(--muted)]">{agent.output_summary}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agent.tools.map((tool) => (
                      <Badge key={tool} tone="info">
                        {tool}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
              {selected.errors.length ? (
                <div className="rounded-2xl bg-[#fecdd3] px-4 py-3 text-sm text-[var(--danger)]">
                  {selected.errors.join(" · ")}
                </div>
              ) : null}
            </div>
          </Panel>
        </div>
      )}

      <Panel title="Todas as missões">
        <div className="space-y-2">
          {missions.map((mission) => {
            const canStop = RUNNING_STATUSES.includes(mission.status);
            const canStart = !RUNNING_STATUSES.includes(mission.status);
            const busy = busyMissionId === mission.id;
            return (
              <div
                key={mission.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3"
              >
                <div>
                  <div className="font-medium">{mission.objective}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {mission.id} · {mission.status}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{Math.round(mission.progress * 100)}%</Badge>
                  <Button
                    variant="soft"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={!canStart || busy}
                    onClick={async () => {
                      setBusyMissionId(mission.id);
                      setBusyAction("start");
                      try {
                        await api.swarm.start(mission.id);
                        setToast("Enxame iniciado");
                        await refreshAll();
                      } catch (err) {
                        setToast(err instanceof Error ? err.message : "Falha ao iniciar o enxame");
                      } finally {
                        setBusyMissionId(null);
                        setBusyAction(null);
                      }
                    }}
                  >
                    {busy && busyAction === "start" ? "..." : "Start"}
                  </Button>
                  <Button
                    variant="danger"
                    className="!px-3 !py-1.5 text-xs"
                    disabled={!canStop || busy}
                    onClick={async () => {
                      setBusyMissionId(mission.id);
                      setBusyAction("stop");
                      try {
                        await api.swarm.stop(mission.id);
                        setToast("Enxame parado");
                        await refreshAll();
                      } catch (err) {
                        setToast(err instanceof Error ? err.message : "Falha ao parar o enxame");
                      } finally {
                        setBusyMissionId(null);
                        setBusyAction(null);
                      }
                    }}
                  >
                    {busy && busyAction === "stop" ? "..." : "Stop"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
