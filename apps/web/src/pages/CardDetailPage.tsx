import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Badge, Button, EmptyState, Panel, priorityTone } from "../components/ui";
import { useAppStore } from "../store";
import { COLUMN_LABELS, type CardDetail, type WorkspaceFile } from "../types";

const tabs = [
  "descricao",
  "requisitos",
  "plano",
  "agentes",
  "arquivos",
  "artefatos",
  "testes",
  "tickets",
  "decisoes",
  "historico",
] as const;

type Tab = (typeof tabs)[number];

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function CardDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setToast, refreshAll } = useAppStore();
  const [detail, setDetail] = useState<CardDetail | null>(null);
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "descricao";
  const [tab, setTab] = useState<Tab>(tabs.includes(initialTab) ? initialTab : "descricao");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  async function load() {
    const data = await api.cards.get(id);
    setDetail(data);
    setSelectedFile((prev) => {
      if (prev && data.files.some((f) => f.path === prev)) return prev;
      return data.files[0]?.path ?? null;
    });
  }

  useEffect(() => {
    void load().catch((err) =>
      setToast(err instanceof Error ? err.message : "Falha ao carregar cartão"),
    );
    const timer = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(timer);
  }, [id]);

  function openTab(next: Tab) {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    setSearchParams(params, { replace: true });
  }

  async function deleteCard() {
    setBusy(true);
    try {
      const res = await api.cards.remove(id);
      setToast(`Deleted ${res.deleted.length} card(s)`);
      await refreshAll();
      navigate("/kanban");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Failed to delete card");
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  async function decide(kind: "approve" | "reject") {
    setBusy(true);
    try {
      if (kind === "approve") await api.cards.approve(id, "Approved from card detail");
      else await api.cards.reject(id, "Rejected from card detail");
      setToast(kind === "approve" ? "Approval recorded" : "Sent back to refinement");
      await load();
      await refreshAll();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return <EmptyState title="Loading card" body="Fetching requirements, plan, and evidence..." />;
  }

  const { card, requirements, plan, mission, artifacts, files, tests, reviews, tickets, approvals, timeline } =
    detail;
  const pending = approvals.filter((a) => a.decision === "pendente");
  const activeFile = files.find((f) => f.path === selectedFile) ?? files[0] ?? null;
  const reqCounts = requirements
    ? [
        requirements.functional.length,
        requirements.non_functional.length,
        requirements.business_rules.length,
        requirements.acceptance_criteria.length,
      ].reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/kanban" className="text-sm font-semibold text-blue-600">
            ← Back to board
          </Link>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{card.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="info">{COLUMN_LABELS[card.column]}</Badge>
            <Badge tone={priorityTone(card.priority)}>{card.priority}</Badge>
            <Badge>{card.type}</Badge>
            <Badge tone="accent">autonomy {card.autonomy_level}</Badge>
            {card.preview_url ? <Badge tone="success">Live preview</Badge> : null}
            {requirements ? (
              <button type="button" onClick={() => openTab("requisitos")}>
                <Badge tone="info">{reqCounts} requisitos</Badge>
              </button>
            ) : null}
            {files.length ? (
              <button type="button" onClick={() => openTab("arquivos")}>
                <Badge tone="success">{files.length} arquivos</Badge>
              </button>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          {card.preview_url ? (
            <Button
              variant="soft"
              onClick={() => window.open(card.preview_url!, "_blank", "noreferrer")}
            >
              Open live app
            </Button>
          ) : null}
          {pending.length ? (
            <>
              <Button disabled={busy} onClick={() => void decide("approve")}>
                Approve
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => void decide("reject")}>
                Reject
              </Button>
            </>
          ) : null}
          <Button variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-xl font-extrabold tracking-tight text-rose-700">Delete card</h2>
            <p className="mt-1 text-sm text-slate-500">
              "{card.title}" will be removed along with its child work cards and generated app.
              This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => void deleteCard()}>
                {busy ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => openTab(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
              tab === item
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--line)] bg-white/70"
            }`}
          >
            {item}
            {item === "requisitos" && requirements ? ` (${reqCounts})` : ""}
            {item === "arquivos" && files.length ? ` (${files.length})` : ""}
          </button>
        ))}
      </div>

      {card.preview_url ? (
        <Panel
          title="App running"
          action={
            <a
              href={card.preview_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-bold text-emerald-700 hover:underline"
            >
              Open ↗
            </a>
          }
        >
          <div className="overflow-hidden rounded-xl border border-emerald-100 bg-slate-100">
            <iframe
              title={`Live preview — ${card.title}`}
              src={card.preview_url}
              className="h-[420px] w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">{card.preview_url}</p>
        </Panel>
      ) : null}

      {tab === "descricao" && (
        <Panel title="Descrição">
          <p className="whitespace-pre-wrap leading-relaxed">{card.description}</p>
          {card.block_reason ? (
            <p className="mt-4 rounded-2xl bg-[#fecdd3] px-4 py-3 text-sm text-[var(--danger)]">
              Bloqueio: {card.block_reason}
            </p>
          ) : null}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Meta label="Tokens" value={`${card.budget_spent.toLocaleString()} / ${card.budget_tokens.toLocaleString()}`} />
            <Meta label="Responsável" value={card.human_owner} />
            <Meta label="Solicitante" value={card.requester} />
          </div>
          <div className="mt-5">
            <h3 className="font-semibold">Critérios de aceitação</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {card.acceptance_criteria.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => openTab("requisitos")}
              className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-left transition hover:border-violet-300 hover:bg-violet-50/40"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-violet-600">Requisitos</div>
              <div className="mt-1 text-2xl font-extrabold">{reqCounts}</div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {requirements ? "Ver especificação completa" : "Ainda não refinados"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => openTab("arquivos")}
              className="rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Arquivos criados</div>
              <div className="mt-1 text-2xl font-extrabold">{files.length}</div>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {files.length ? files.map((f) => f.path).slice(0, 3).join(", ") : "Nenhum gerado ainda"}
                {files.length > 3 ? ` +${files.length - 3}` : ""}
              </p>
            </button>
          </div>
        </Panel>
      )}

      {tab === "requisitos" && (
        <Panel title="Requisitos">
          {!requirements ? (
            <EmptyState title="Sem requisitos" body="Ainda não refinados." />
          ) : (
            <div className="space-y-5">
              <p>
                <strong>Objetivo:</strong> {requirements.objective}
              </p>
              {requirements.context ? (
                <div>
                  <h3 className="font-semibold">Contexto</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {requirements.context}
                  </p>
                </div>
              ) : null}
              <List title="Funcionais" items={requirements.functional} />
              <List title="Não funcionais" items={requirements.non_functional} />
              <List title="Regras de negócio" items={requirements.business_rules} />
              <List title="Restrições" items={requirements.constraints} />
              <List title="Critérios de aceitação" items={requirements.acceptance_criteria} />
              <List title="Premissas" items={requirements.assumptions} />
              <List title="Fora de escopo" items={requirements.out_of_scope} />
              <List title="Perguntas em aberto" items={requirements.open_questions} />
            </div>
          )}
        </Panel>
      )}

      {tab === "plano" && (
        <Panel title="Plano de execução">
          {!plan ? (
            <EmptyState title="Sem plano" body="Aguardando planejamento." />
          ) : (
            <div className="space-y-4">
              <p>{plan.strategy}</p>
              <div className="space-y-2">
                {plan.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-2xl border border-[var(--line)] px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {task.agent_role} · grupo {task.parallel_group}
                      </div>
                    </div>
                    <Badge>{task.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {tab === "agentes" && (
        <Panel title="Agentes / missão">
          {!mission ? (
            <EmptyState title="Sem missão" body="O enxame ainda não foi formado." />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone="accent">{mission.topology}</Badge>
                <Badge>{mission.status}</Badge>
                <Badge tone="info">{Math.round(mission.progress * 100)}%</Badge>
              </div>
              {mission.phase_label ? (
                <p className="text-sm text-[var(--muted)]">{mission.phase_label}</p>
              ) : null}
              <div
                className="h-2 overflow-hidden rounded-full bg-blue-100"
                role="progressbar"
                aria-valuenow={Math.round(mission.progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-blue-500 transition-[width] duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, Math.round(mission.progress * 100))}%`,
                  }}
                />
              </div>
              {mission.agents.map((agent) => (
                <div
                  key={`${agent.agent_id}-${agent.subtask}`}
                  className="rounded-2xl border border-[var(--line)] px-4 py-3"
                >
                  <div className="font-semibold">
                    {agent.agent_id} · {agent.role}
                  </div>
                  <div className="mt-1 text-sm">{agent.subtask}</div>
                  {agent.output_summary ? (
                    <div className="mt-2 text-sm text-[var(--muted)]">{agent.output_summary}</div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "arquivos" && (
        <Panel title="Arquivos criados">
          {!files.length ? (
            <EmptyState
              title="Sem arquivos"
              body="O workspace do mini-app ainda não foi gerado. Após a implementação, os fontes aparecem aqui."
            />
          ) : (
            <FileBrowser
              files={files}
              active={activeFile}
              onSelect={setSelectedFile}
            />
          )}
        </Panel>
      )}

      {tab === "artefatos" && (
        <Panel title="Artefatos">
          {!artifacts.length ? (
            <EmptyState title="Sem artefatos" body="Nada produzido ainda." />
          ) : (
            <div className="space-y-3">
              {artifacts.map((art) => (
                <div key={art.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <div className="font-semibold">{art.name}</div>
                  <div className="text-sm text-[var(--muted)]">
                    {art.type} · {art.author} · {art.location}
                  </div>
                  <p className="mt-2 text-sm">{art.description}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "testes" && (
        <Panel title="Testes e revisão">
          <div className="space-y-4">
            {tests.map((test) => (
              <div key={test.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                <div className="font-semibold">{test.suite}</div>
                <div className="mt-1 text-sm">
                  {test.passed}/{test.executed} ok · cobertura {test.coverage}% · falhas {test.failed}
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{test.recommendation}</p>
              </div>
            ))}
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Badge tone={review.decision === "aprovado" ? "accent" : "danger"}>
                    {review.decision}
                  </Badge>
                  <span className="text-sm">confiança {Math.round(review.confidence * 100)}%</span>
                </div>
                <p className="mt-2 text-sm">{review.rationale}</p>
              </div>
            ))}
            {!tests.length && !reviews.length ? (
              <EmptyState title="Sem testes/revisão" body="Aguardando execução do enxame." />
            ) : null}
          </div>
        </Panel>
      )}

      {tab === "tickets" && (
        <Panel title="Chamados vinculados">
          {!tickets.length ? (
            <EmptyState title="Sem chamados" body="Nenhum bloqueio registrado." />
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <div className="font-semibold">{ticket.title}</div>
                  <div className="mt-1 flex gap-2">
                    <Badge tone="danger">{ticket.severity}</Badge>
                    <Badge>{ticket.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{ticket.description}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "decisoes" && (
        <Panel title="Aprovações humanas">
          {!approvals.length ? (
            <EmptyState title="Sem decisões" body="Nenhuma solicitação ainda." />
          ) : (
            <div className="space-y-3">
              {approvals.map((apr) => (
                <div key={apr.id} className="rounded-2xl border border-[var(--line)] px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{apr.type}</Badge>
                    <Badge
                      tone={
                        apr.decision === "aprovado"
                          ? "accent"
                          : apr.decision === "reprovado"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {apr.decision}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm">{apr.comment || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {tab === "historico" && (
        <Panel title="Linha do tempo">
          <div className="space-y-3">
            {timeline.map((event) => (
              <div
                key={event.id}
                className="grid gap-1 rounded-2xl border border-[var(--line)] px-4 py-3 sm:grid-cols-[160px_1fr]"
              >
                <div className="text-xs text-[var(--muted)]">
                  {new Date(event.created_at).toLocaleString()}
                </div>
                <div>
                  <div className="font-semibold">
                    {event.action} · {event.actor}
                  </div>
                  <div className="text-sm text-[var(--muted)]">
                    {event.previous_state ?? "—"} → {event.next_state ?? "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

function FileBrowser({
  files,
  active,
  onSelect,
}: {
  files: WorkspaceFile[];
  active: WorkspaceFile | null;
  onSelect: (path: string) => void;
}) {
  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.size, 0), [files]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-slate-50/80 px-4 py-2.5">
        <div className="text-sm font-semibold text-slate-700">
          {files.length} arquivo{files.length === 1 ? "" : "s"} · {formatBytes(totalBytes)}
        </div>
        {active?.truncated ? (
          <Badge tone="warn">conteúdo truncado</Badge>
        ) : null}
      </div>
      <div className="grid min-h-[320px] lg:grid-cols-[240px_1fr]">
        <aside className="border-b border-[var(--line)] bg-white/80 lg:border-b-0 lg:border-r">
          <ul className="max-h-[420px] overflow-auto p-2">
            {files.map((file) => {
              const selected = active?.path === file.path;
              return (
                <li key={file.path}>
                  <button
                    type="button"
                    onClick={() => onSelect(file.path)}
                    className={`flex w-full items-start justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "bg-emerald-50 font-semibold text-emerald-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0 break-all font-mono text-[12px]">{file.path}</span>
                    <span className="shrink-0 text-[10px] font-medium text-slate-400">
                      {formatBytes(file.size)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className="min-w-0 bg-[#0f172a]">
          {active ? (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-2 text-xs text-slate-300">
                <span className="font-mono font-semibold text-white">{active.path}</span>
                {active.language ? <Badge tone="info">{active.language}</Badge> : null}
                <span>{formatBytes(active.size)}</span>
              </div>
              {active.content != null ? (
                <pre className="max-h-[520px] overflow-auto p-4 text-[12px] leading-relaxed text-emerald-100">
                  <code>{active.content}</code>
                </pre>
              ) : (
                <div className="p-6 text-sm text-slate-400">
                  Conteúdo binário ou indisponível para visualização.
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-sm text-slate-400">Selecione um arquivo.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3">
      <div className="text-xs uppercase tracking-[0.08em] text-[var(--muted)]">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="font-semibold">
        {title}{" "}
        <span className="text-xs font-medium text-[var(--muted)]">({items.length})</span>
      </h3>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
