from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from app.db import get_store
from app.services.runtime import runtime_info, stop_runtime

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.get("/{card_id}")
async def get_runtime(card_id: str):
    info = runtime_info(card_id)
    store = get_store()
    card = await store.get("task_cards", card_id)
    if not card and not info:
        raise HTTPException(status_code=404, detail="Runtime not found")
    return {
        "card_id": card_id,
        "preview_url": (info or {}).get("preview_url") or (card or {}).get("preview_url"),
        "status": (info or {}).get("status") or (card or {}).get("runtime_status") or "unknown",
        "port": (info or {}).get("port") or (card or {}).get("runtime_port"),
        "kind": (info or {}).get("kind"),
    }


@router.get("/{card_id}/open")
async def open_runtime(card_id: str):
    info = await get_runtime(card_id)
    url = info.get("preview_url")
    if not url:
        raise HTTPException(status_code=404, detail="No live preview")
    return RedirectResponse(url)


@router.post("/{card_id}/stop")
async def stop(card_id: str):
    stop_runtime(card_id)
    store = get_store()
    card = await store.get("task_cards", card_id)
    if card:
        card["runtime_status"] = "stopped"
        from app.models.contracts import TaskCard

        await store.upsert("task_cards", TaskCard.model_validate(card))
    return {"ok": True, "status": "stopped"}
