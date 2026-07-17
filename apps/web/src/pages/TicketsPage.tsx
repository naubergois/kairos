import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Badge, Button, EmptyState, Panel } from "../components/ui";
import { useAppStore } from "../store";

export function TicketsPage() {
  const { tickets, cards, refreshAll, setToast } = useAppStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cardId, setCardId] = useState("");

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  async function createTicket() {
    if (!title.trim()) return;
    try {
      await api.tickets.create({
        category: "bloqueio",
        title: title.trim(),
        description: description.trim() || title.trim(),
        card_id: cardId || undefined,
        severity: "high",
      });
      setTitle("");
      setDescription("");
      setCardId("");
      setToast("Chamado criado");
      await refreshAll();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Falha ao criar chamado");
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
          Operações
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Central de chamados</h1>
      </header>

      <Panel title="Abrir chamado">
        <div className="grid gap-3 lg:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <select
            value={cardId}
            onChange={(e) => setCardId(e.target.value)}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">Sem cartão vinculado</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.title}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição / evidências"
            rows={3}
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)] lg:col-span-2"
          />
        </div>
        <Button className="mt-3" onClick={() => void createTicket()}>
          Criar chamado
        </Button>
      </Panel>

      <Panel title={`Chamados (${tickets.length})`}>
        {!tickets.length ? (
          <EmptyState title="Sem chamados" body="Bloqueios do enxame aparecerão aqui." />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-[22px] border border-[var(--line)] px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="danger">{ticket.severity}</Badge>
                  <Badge>{ticket.status}</Badge>
                  <Badge tone="info">{ticket.category}</Badge>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{ticket.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{ticket.description}</p>
                {ticket.card_id ? (
                  <Link
                    to={`/cards/${ticket.card_id}`}
                    className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]"
                  >
                    Ver cartão vinculado
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
