from datetime import datetime

from fastapi import APIRouter

from app.db import get_store
from app.models.contracts import CreateTicketRequest, SupportTicket

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("")
async def list_tickets() -> list[SupportTicket]:
    store = get_store()
    rows = await store.list("tickets")
    items = [SupportTicket.model_validate(r) for r in rows]
    return sorted(items, key=lambda t: t.created_at, reverse=True)


@router.post("")
async def create_ticket(payload: CreateTicketRequest) -> SupportTicket:
    store = get_store()
    ticket = SupportTicket(
        category=payload.category,
        title=payload.title,
        description=payload.description,
        card_id=payload.card_id,
        severity=payload.severity,
        updated_at=datetime.utcnow(),
    )
    await store.upsert("tickets", ticket)
    return ticket
