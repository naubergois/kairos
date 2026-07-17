from fastapi import APIRouter

from app.db import get_store
from app.models.contracts import DashboardMetrics, TaskCard
from app.models.enums import KanbanColumn, TicketStatus

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
async def metrics() -> DashboardMetrics:
    store = get_store()
    cards = [TaskCard.model_validate(c) for c in await store.list("task_cards")]
    tickets = await store.list("tickets")
    agents = await store.list("agents")

    in_execution = sum(1 for c in cards if c.column == KanbanColumn.EM_EXECUCAO)
    blocked = sum(1 for c in cards if c.column == KanbanColumn.BLOQUEADO)
    recent_deliveries = sum(1 for c in cards if c.column == KanbanColumn.CONCLUIDO)
    open_incidents = sum(
        1 for t in tickets if t.get("status") in {TicketStatus.ABERTO.value, TicketStatus.EM_ANDAMENTO.value}
    )
    done = recent_deliveries
    failedish = sum(1 for c in cards if c.column == KanbanColumn.CANCELADO)
    total = max(done + failedish, 1)
    success_rate = done / total
    total_tokens = sum(c.budget_spent for c in cards)
    total_cost_usd = round(total_tokens / 1_000_000 * 8.5, 2)

    agent_performance = [
        {
            "id": a["id"],
            "name": a["name"],
            "success_rate": a.get("success_rate", 0),
            "avg_cost_tokens": a.get("avg_cost_tokens", 0),
            "active": a.get("active", True),
        }
        for a in agents
    ]

    return DashboardMetrics(
        in_execution=in_execution,
        blocked=blocked,
        recent_deliveries=recent_deliveries,
        open_incidents=open_incidents,
        success_rate=round(success_rate, 2),
        avg_cycle_hours=18.5,
        total_tokens=total_tokens,
        total_cost_usd=total_cost_usd,
        agent_performance=agent_performance,
    )
