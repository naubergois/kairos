import { useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Badge, Button, EmptyState, Panel } from "../components/ui";
import { useAppStore } from "../store";

export function ApprovalsPage() {
  const { approvals, cards, refreshAll, setToast } = useAppStore();

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const pending = approvals.filter((a) => a.decision === "pendente");
  const decided = approvals.filter((a) => a.decision !== "pendente");

  async function decide(id: string, decision: "aprovado" | "reprovado") {
    try {
      await api.approvals.decide(id, decision);
      setToast(decision === "aprovado" ? "Aprovado" : "Reprovado");
      await refreshAll();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Falha na decisão");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Controle humano
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Central de aprovações</h1>
      </header>

      <Panel title={`Pendentes (${pending.length})`}>
        {!pending.length ? (
          <EmptyState title="Nada pendente" body="O enxame aguarda novas solicitações." />
        ) : (
          <div className="space-y-3">
            {pending.map((apr) => {
              const card = cards.find((c) => c.id === apr.card_id);
              return (
                <div
                  key={apr.id}
                  className="flex flex-col gap-3 rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="warn">{apr.type}</Badge>
                      <Badge tone="info">{apr.requester}</Badge>
                    </div>
                    <div className="mt-2 font-semibold">
                      {card ? (
                        <Link to={`/cards/${card.id}`} className="hover:underline">
                          {card.title}
                        </Link>
                      ) : (
                        apr.card_id
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">{apr.comment}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void decide(apr.id, "aprovado")}>Aprovar</Button>
                    <Button variant="danger" onClick={() => void decide(apr.id, "reprovado")}>
                      Reprovar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Histórico recente">
        <div className="space-y-3">
          {decided.slice(0, 12).map((apr) => (
            <div
              key={apr.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3"
            >
              <div>
                <div className="font-medium">{apr.type}</div>
                <div className="text-xs text-[var(--muted)]">{apr.card_id}</div>
              </div>
              <Badge tone={apr.decision === "aprovado" ? "accent" : "danger"}>{apr.decision}</Badge>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
