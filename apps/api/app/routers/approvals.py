from fastapi import APIRouter

from app.db import get_store
from app.models.contracts import ApprovalAction, HumanApproval
from app.services import cards as card_service

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("")
async def list_approvals() -> list[HumanApproval]:
    store = get_store()
    rows = await store.list("approvals")
    items = [HumanApproval.model_validate(r) for r in rows]
    return sorted(items, key=lambda a: a.created_at, reverse=True)


@router.post("/{approval_id}/decide")
async def decide(approval_id: str, payload: ApprovalAction) -> HumanApproval:
    return await card_service.decide_approval(approval_id, payload)
