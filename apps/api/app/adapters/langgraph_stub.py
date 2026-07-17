"""LangGraph orchestrator adapter (stub for MVP).

Replace with a real LangGraph StateGraph when wiring production agents.
"""

from __future__ import annotations

from datetime import datetime

from app.db import get_store
from app.models.contracts import (
    AuditEvent,
    ExecutionPlan,
    HumanApproval,
    PlanTask,
    RequirementSpecification,
    TaskCard,
)
from app.models.enums import (
    ApprovalDecision,
    ApprovalType,
    CardType,
    KanbanColumn,
    Priority,
)


class LangGraphOrchestrator:
    """Deterministic pipeline that advances a card until human approval."""

    async def receive_demand(self, card: TaskCard) -> TaskCard:
        await self._audit(card, "receive_demand", None, KanbanColumn.ENTRADA.value)
        return await self.run_until_approval(card)

    async def run_until_approval(self, card: TaskCard) -> TaskCard:
        card = await self.classify(card)
        card = await self.refine(card)
        card = await self.plan(card)
        card = await self.request_approval(card)
        return card

    async def classify(self, card: TaskCard) -> TaskCard:
        store = get_store()
        previous = card.column
        card.column = KanbanColumn.TRIAGEM
        card.type = self._infer_type(card.description)
        card.priority = self._infer_priority(card.description)
        card.tags = list({*card.tags, "triaged", card.type.value})
        card.updated_at = datetime.utcnow()
        await store.upsert("task_cards", card)
        await self._audit(card, "classify_task", previous.value, card.column.value, {
            "type": card.type.value,
            "priority": card.priority.value,
        })
        return card

    async def refine(self, card: TaskCard) -> TaskCard:
        store = get_store()
        previous = card.column
        card.column = KanbanColumn.REFINAMENTO
        requirements = RequirementSpecification(
            card_id=card.id,
            objective=f"Entregar: {card.title}",
            context=card.description,
            functional=[
                "Expor endpoints ou telas necessários à demanda",
                "Validar entradas e retornar erros estruturados",
                "Persistir dados relevantes com rastreabilidade",
            ],
            non_functional=[
                "Tempo de resposta p95 < 500ms para operações críticas",
                "Cobertura mínima de testes de 70%",
                "Auditoria de alterações sensíveis",
            ],
            business_rules=[
                "Somente usuários autenticados podem mutar dados",
                "Alterações irreversíveis exigem aprovação humana",
            ],
            constraints=["Ambiente isolado por tarefa", "Sem push direto na main"],
            acceptance_criteria=[
                "Critérios de aceitação documentados e testáveis",
                "Artefatos vinculados ao cartão",
                "Testes registrados com evidências",
                "Revisão independente aprovada",
            ],
            assumptions=["Stack padrão do projeto disponível"],
            out_of_scope=["Migração legada completa", "Redesign visual amplo"],
            open_questions=[],
        )
        card.acceptance_criteria = requirements.acceptance_criteria
        card.updated_at = datetime.utcnow()
        await store.upsert("requirements", requirements)
        await store.upsert("task_cards", card)
        await self._audit(card, "refine_requirements", previous.value, card.column.value)
        return card

    async def plan(self, card: TaskCard) -> TaskCard:
        store = get_store()
        previous = card.column
        tasks = [
            PlanTask(title="Definir entidades e regras", agent_role="requisitos", parallel_group=0),
            PlanTask(title="Projetar arquitetura", agent_role="arquiteto", parallel_group=0),
            PlanTask(title="Implementar backend", agent_role="desenvolvedor", parallel_group=1),
            PlanTask(title="Implementar frontend", agent_role="desenvolvedor", parallel_group=1),
            PlanTask(title="Criar e executar testes", agent_role="testador", parallel_group=2),
            PlanTask(title="Revisar código", agent_role="revisor", parallel_group=2),
            PlanTask(title="Documentar entrega", agent_role="documentacao", parallel_group=3),
        ]
        plan = ExecutionPlan(
            card_id=card.id,
            objective=card.title,
            strategy="Hierárquica com paralelismo após contratos de API",
            tasks=tasks,
            required_agents=[
                "supervisor",
                "requisitos",
                "arquiteto",
                "coordenador",
                "desenvolvedor",
                "testador",
                "revisor",
                "documentacao",
            ],
            tools=["git", "tests", "docs", "tickets"],
            risks=["Dependência externa sem credenciais", "Escopo ambíguo"],
            estimated_effort_hours=16.0,
            completion_criteria=card.acceptance_criteria,
        )
        card.subtasks = [t.title for t in tasks]
        card.agents = plan.required_agents
        card.updated_at = datetime.utcnow()
        await store.upsert("execution_plans", plan)
        await store.upsert("task_cards", card)
        await self._audit(card, "plan_execution", previous.value, previous.value, {
            "tasks": len(tasks),
        })
        return card

    async def request_approval(self, card: TaskCard) -> TaskCard:
        store = get_store()
        previous = card.column
        card.column = KanbanColumn.AGUARDANDO_APROVACAO
        card.updated_at = datetime.utcnow()
        approval = HumanApproval(
            card_id=card.id,
            type=ApprovalType.ESCOPO,
            requester="supervisor",
            decision=ApprovalDecision.PENDENTE,
            comment="Escopo, requisitos e plano prontos para revisão humana.",
        )
        await store.upsert("approvals", approval)
        await store.upsert("task_cards", card)
        await self._audit(
            card,
            "request_human_approval",
            previous.value,
            card.column.value,
            {"approval_id": approval.id},
        )
        return card

    def _infer_type(self, text: str) -> CardType:
        lower = text.lower()
        if any(w in lower for w in ("bug", "erro", "corrig", "falha")):
            return CardType.CORRECAO
        if any(w in lower for w in ("incidente", "down", "outage")):
            return CardType.INCIDENTE
        if any(w in lower for w in ("doc", "document")):
            return CardType.DOCUMENTACAO
        if any(w in lower for w in ("refator", "cleanup")):
            return CardType.REFATORACAO
        if any(w in lower for w in ("integr", "webhook", "api externa")):
            return CardType.INTEGRACAO
        return CardType.NOVA_FUNCIONALIDADE

    def _infer_priority(self, text: str) -> Priority:
        lower = text.lower()
        if any(w in lower for w in ("urgente", "crítico", "critico", "produção", "producao")):
            return Priority.CRITICA
        if any(w in lower for w in ("alta", "importante", "asap")):
            return Priority.ALTA
        if any(w in lower for w in ("baixa", "quando possível", "quando possivel")):
            return Priority.BAIXA
        return Priority.MEDIA

    async def _audit(
        self,
        card: TaskCard,
        action: str,
        previous: str | None,
        nxt: str | None,
        result: dict | None = None,
    ) -> None:
        store = get_store()
        event = AuditEvent(
            card_id=card.id,
            actor="langgraph_stub",
            action=action,
            previous_state=previous,
            next_state=nxt,
            result=result or {},
        )
        await store.insert("audit_events", event)


langgraph = LangGraphOrchestrator()
