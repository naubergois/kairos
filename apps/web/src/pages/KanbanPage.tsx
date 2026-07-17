import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Badge, Button, Panel, priorityTone } from "../components/ui";
import { useAppStore } from "../store";
import {
  COLUMN_LABELS,
  KANBAN_COLUMNS,
  type KanbanColumn,
  type TaskCard,
} from "../types";

function DroppableColumn({
  id,
  cards,
}: {
  id: KanbanColumn;
  cards: TaskCard[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`flex w-[280px] shrink-0 flex-col rounded-[24px] border border-[var(--line)] bg-white/50 transition ${
        isOver ? "ring-2 ring-[var(--accent)]" : ""
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">{COLUMN_LABELS[id]}</h3>
        <Badge>{cards.length}</Badge>
      </div>
      <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({ card }: { card: TaskCard }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CardBody card={card} />
    </div>
  );
}

function CardBody({ card }: { card: TaskCard }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elevated)] p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/cards/${card.id}`} className="font-semibold leading-snug hover:underline">
          {card.title}
        </Link>
        <Badge tone={priorityTone(card.priority)}>{card.priority}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">{card.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {card.agents.slice(0, 3).map((agent) => (
          <Badge key={agent} tone="accent">
            {agent}
          </Badge>
        ))}
        {card.block_reason ? <Badge tone="danger">bloqueado</Badge> : null}
      </div>
    </div>
  );
}

export function KanbanPage() {
  const { cards, setCards, refreshAll, setToast } = useAppStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    void refreshAll();
    const id = window.setInterval(() => void refreshAll(), 6000);
    return () => window.clearInterval(id);
  }, [refreshAll]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [cards, filter]);

  const byColumn = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((c) => [c, [] as TaskCard[]])) as Record<
      KanbanColumn,
      TaskCard[]
    >;
    for (const card of filtered) map[card.column].push(card);
    return map;
  }, [filtered]);

  const activeCard = cards.find((c) => c.id === activeId) ?? null;

  async function onDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const cardId = String(event.active.id);
    const target = event.over?.id as KanbanColumn | undefined;
    if (!target || !KANBAN_COLUMNS.includes(target)) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.column === target) return;

    const previous = cards;
    setCards(cards.map((c) => (c.id === cardId ? { ...c, column: target } : c)));
    try {
      const updated = await api.cards.transition(cardId, target);
      setCards(previous.map((c) => (c.id === cardId ? updated : c)));
      setToast(`Movido para ${COLUMN_LABELS[target]}`);
      await refreshAll();
    } catch (err) {
      setCards(previous);
      setToast(err instanceof Error ? err.message : "Transição inválida");
    }
  }

  async function createCard() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await api.cards.create({
        title: title.trim(),
        description: description.trim() || title.trim(),
      });
      setTitle("");
      setDescription("");
      setToast("Cartão criado e pipeline iniciado");
      await refreshAll();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Falha ao criar cartão");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">
            Fonte visual oficial
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Kanban inteligente</h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Arraste cartões entre colunas válidas. O motor de transições valida critérios, testes e
            evidências.
          </p>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por título, tag..."
          className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-white/80 px-4 py-3 outline-none ring-[var(--accent)] focus:ring-2"
        />
      </header>

      <Panel title="Nova demanda">
        <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_auto]">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição em linguagem natural"
            className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
          <Button onClick={() => void createCard()} disabled={creating}>
            {creating ? "Criando..." : "Criar e triar"}
          </Button>
        </div>
      </Panel>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={(e) => void onDragEnd(e)}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => (
            <DroppableColumn key={column} id={column} cards={byColumn[column]} />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? (
            <div className="w-[260px] rotate-1 scale-105">
              <CardBody card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
