from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.db import get_store
from app.models.contracts import AgentCatalogItem

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentPatch(BaseModel):
    active: bool | None = None
    preferred_model: str | None = None


@router.get("")
async def list_agents() -> list[AgentCatalogItem]:
    store = get_store()
    rows = await store.list("agents")
    return [AgentCatalogItem.model_validate(r) for r in rows]


@router.patch("/{agent_id}")
async def patch_agent(agent_id: str, payload: AgentPatch) -> AgentCatalogItem:
    store = get_store()
    raw = await store.get("agents", agent_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Agente não encontrado")
    agent = AgentCatalogItem.model_validate(raw)
    if payload.active is not None:
        agent.active = payload.active
    if payload.preferred_model is not None:
        agent.preferred_model = payload.preferred_model
    await store.upsert("agents", agent)
    return agent
