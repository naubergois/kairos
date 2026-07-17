from fastapi import APIRouter

from app.models.contracts import ChatMessage, ChatRequest, ChatResponse
from app.services import cards as card_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/messages")
async def messages() -> list[ChatMessage]:
    return await card_service.list_chat_messages()


@router.post("/messages")
async def post_message(payload: ChatRequest) -> ChatResponse:
    return await card_service.handle_chat(payload)
