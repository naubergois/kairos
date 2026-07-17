"""Ruflo swarm manager adapter (stub for MVP).

Replace with real Ruflo swarm coordination when available.
"""

from __future__ import annotations

from datetime import datetime

from app.db import get_store
from app.models.contracts import (
    AgentAssignment,
    AuditEvent,
    HumanApproval,
    ReviewDecision,
    SupportTicket,
    SwarmMission,
    TaskCard,
    TestFailure,
    TestResult,
    WorkArtifact,
)
from app.models.enums import (
    ApprovalDecision,
    ApprovalType,
    KanbanColumn,
    ReviewVerdict,
    TicketCategory,
    TicketStatus,
)


class RufloSwarmManager:
    async def create_mission(self, card: TaskCard) -> SwarmMission:
        store = get_store()
        agents = [
            AgentAssignment(
                agent_id="coordenador",
                role="coordenador",
                subtask="Distribuir subtarefas e consolidar",
                tools=["swarm"],
            ),
            AgentAssignment(
                agent_id="desenvolvedor",
                role="desenvolvedor",
                subtask="Implementar solução em branch da tarefa",
                tools=["git", "editor"],
            ),
            AgentAssignment(
                agent_id="testador",
                role="testador",
                subtask="Criar e executar suíte de testes",
                tools=["tests"],
            ),
            AgentAssignment(
                agent_id="revisor",
                role="revisor",
                subtask="Revisar aderência e qualidade",
                tools=["review"],
            ),
            AgentAssignment(
                agent_id="documentacao",
                role="documentacao",
                subtask="Gerar documentação da entrega",
                tools=["docs"],
            ),
        ]
        mission = SwarmMission(
            card_id=card.id,
            objective=card.title,
            topology="hierarchical",
            agents=agents,
            allowed_tools=["git", "tests", "docs", "tickets", "review"],
            limits={"max_agents": 5, "max_retries": 2, "token_budget": card.budget_tokens},
            expected_result="Artefatos, testes e revisão aprovados",
            status="running",
            progress=0.1,
        )
        card.column = KanbanColumn.PRONTO_ENXAME
        card.agents = [a.agent_id for a in agents]
        card.updated_at = datetime.utcnow()
        await store.upsert("swarm_missions", mission)
        await store.upsert("task_cards", card)
        await self._audit(card, "create_swarm", KanbanColumn.PRONTO_ENXAME.value, {
            "mission_id": mission.id,
        })
        return mission

    async def execute(self, card: TaskCard, *, simulate_block: bool = False) -> TaskCard:
        store = get_store()
        missions = await store.list("swarm_missions", {"card_id": card.id})
        mission = SwarmMission.model_validate(missions[-1]) if missions else await self.create_mission(card)

        if simulate_block:
            return await self._block_with_ticket(card, mission)

        # Execution
        card.column = KanbanColumn.EM_EXECUCAO
        card.budget_spent += 42_000
        card.updated_at = datetime.utcnow()
        mission.progress = 0.45
        mission.status = "executing"
        for agent in mission.agents:
            if agent.role == "desenvolvedor":
                agent.status = "completed"
                agent.output_summary = "Branch criada com implementação inicial."
        await store.upsert("swarm_missions", mission)
        await store.upsert("task_cards", card)
        await self._artifact(
            card,
            "code",
            "implementation.diff",
            "Alterações iniciais na branch da tarefa",
            "desenvolvedor",
            f"git://task/{card.id}/branch",
        )
        await self._audit(card, "execute_subtasks", KanbanColumn.EM_EXECUCAO.value)

        # Review
        card.column = KanbanColumn.EM_REVISAO
        card.budget_spent += 18_000
        card.updated_at = datetime.utcnow()
        mission.progress = 0.7
        review = ReviewDecision(
            card_id=card.id,
            decision=ReviewVerdict.APROVADO,
            issues=[],
            severity="low",
            requirements_met=card.acceptance_criteria[:3] or ["Escopo atendido"],
            required_fixes=[],
            rationale="Implementação aderente aos requisitos e sem problemas críticos.",
            confidence=0.91,
            reviewer="revisor",
        )
        await store.upsert("reviews", review)
        await store.upsert("task_cards", card)
        await store.upsert("swarm_missions", mission)
        await self._audit(card, "review_artifacts", KanbanColumn.EM_REVISAO.value)

        # Tests
        card.column = KanbanColumn.EM_TESTES
        card.budget_spent += 22_000
        card.updated_at = datetime.utcnow()
        mission.progress = 0.88
        test = TestResult(
            card_id=card.id,
            suite="acceptance",
            executed=12,
            passed=12,
            failed=0,
            skipped=0,
            coverage=78.5,
            failures=[],
            evidences=["junit://acceptance/latest"],
            recommendation="Seguir para entrega",
        )
        await store.upsert("test_results", test)
        await store.upsert("task_cards", card)
        await store.upsert("swarm_missions", mission)
        await self._artifact(
            card,
            "docs",
            "delivery-notes.md",
            "Resumo da entrega e evidências",
            "documentacao",
            f"docs://{card.id}/delivery-notes.md",
        )
        await self._audit(card, "run_tests", KanbanColumn.EM_TESTES.value)

        # Ready for delivery approval
        card.column = KanbanColumn.PRONTO_ENTREGA
        card.updated_at = datetime.utcnow()
        mission.progress = 1.0
        mission.status = "awaiting_delivery_approval"
        mission.updated_at = datetime.utcnow()
        approval = HumanApproval(
            card_id=card.id,
            type=ApprovalType.ENTREGA,
            requester="release_manager",
            decision=ApprovalDecision.PENDENTE,
            comment="Entrega técnica pronta. Aguardando autorização final.",
        )
        await store.upsert("approvals", approval)
        await store.upsert("swarm_missions", mission)
        await store.upsert("task_cards", card)
        await self._audit(card, "prepare_delivery", KanbanColumn.PRONTO_ENTREGA.value)
        return card

    async def _block_with_ticket(self, card: TaskCard, mission: SwarmMission) -> TaskCard:
        store = get_store()
        card.column = KanbanColumn.BLOQUEADO
        card.block_reason = "Credenciais do serviço externo indisponíveis"
        card.updated_at = datetime.utcnow()
        mission.status = "blocked"
        mission.errors.append(card.block_reason)
        mission.updated_at = datetime.utcnow()
        ticket = SupportTicket(
            category=TicketCategory.DEPENDENCIA,
            title=f"Bloqueio: {card.title}",
            description=card.block_reason,
            origin="ruflo_stub",
            severity="high",
            impact="Subtarefa de integração parada",
            evidences=["agent://desenvolvedor/blocker"],
            card_id=card.id,
            status=TicketStatus.ABERTO,
        )
        await store.upsert("tickets", ticket)
        await store.upsert("swarm_missions", mission)
        await store.upsert("task_cards", card)
        await self._audit(card, "open_ticket_and_block", KanbanColumn.BLOQUEADO.value, {
            "ticket_id": ticket.id,
        })
        return card

    async def fail_tests(self, card: TaskCard) -> TaskCard:
        store = get_store()
        card.column = KanbanColumn.EM_TESTES
        card.updated_at = datetime.utcnow()
        test = TestResult(
            card_id=card.id,
            suite="acceptance",
            executed=10,
            passed=8,
            failed=2,
            skipped=0,
            coverage=61.0,
            failures=[
                TestFailure(name="auth_login", message="401 inesperado", severity="high"),
                TestFailure(name="list_orders", message="filtro inválido", severity="medium"),
            ],
            recommendation="Retornar ao enxame para correção",
        )
        await store.upsert("test_results", test)
        await store.upsert("task_cards", card)
        await self._audit(card, "tests_failed", KanbanColumn.EM_TESTES.value)
        card.column = KanbanColumn.EM_EXECUCAO
        card.updated_at = datetime.utcnow()
        await store.upsert("task_cards", card)
        await self._audit(card, "return_to_fix", KanbanColumn.EM_EXECUCAO.value)
        return card

    async def _artifact(
        self,
        card: TaskCard,
        type_: str,
        name: str,
        description: str,
        author: str,
        location: str,
    ) -> None:
        store = get_store()
        artifact = WorkArtifact(
            card_id=card.id,
            type=type_,
            name=name,
            description=description,
            author=author,
            location=location,
            hash=f"sha256:{card.id}:{name}",
            evidences=[location],
        )
        await store.insert("artifacts", artifact)

    async def _audit(self, card: TaskCard, action: str, state: str, result: dict | None = None) -> None:
        store = get_store()
        event = AuditEvent(
            card_id=card.id,
            actor="ruflo_stub",
            action=action,
            previous_state=None,
            next_state=state,
            result=result or {},
        )
        await store.insert("audit_events", event)


ruflo = RufloSwarmManager()
