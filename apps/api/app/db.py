from __future__ import annotations

import copy
from typing import Any, TypeVar

from pydantic import BaseModel

from app.config import settings

T = TypeVar("T", bound=BaseModel)


class MemoryStore:
    """In-memory document store used as default/fallback for the MVP."""

    def __init__(self) -> None:
        self.collections: dict[str, dict[str, dict[str, Any]]] = {}

    def _col(self, name: str) -> dict[str, dict[str, Any]]:
        return self.collections.setdefault(name, {})

    async def insert(self, collection: str, model: BaseModel) -> dict[str, Any]:
        data = model.model_dump(mode="json")
        self._col(collection)[data["id"]] = data
        return copy.deepcopy(data)

    async def upsert(self, collection: str, model: BaseModel) -> dict[str, Any]:
        return await self.insert(collection, model)

    async def get(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        doc = self._col(collection).get(doc_id)
        return copy.deepcopy(doc) if doc else None

    async def list(
        self,
        collection: str,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        items = list(self._col(collection).values())
        if filters:
            for key, value in filters.items():
                items = [i for i in items if i.get(key) == value]
        return copy.deepcopy(items)

    async def delete(self, collection: str, doc_id: str) -> bool:
        return self._col(collection).pop(doc_id, None) is not None

    async def clear(self) -> None:
        self.collections.clear()


class MongoStore:
    def __init__(self, db: Any) -> None:
        self.db = db

    async def insert(self, collection: str, model: BaseModel) -> dict[str, Any]:
        data = model.model_dump(mode="json")
        await self.db[collection].replace_one({"id": data["id"]}, data, upsert=True)
        return data

    async def upsert(self, collection: str, model: BaseModel) -> dict[str, Any]:
        return await self.insert(collection, model)

    async def get(self, collection: str, doc_id: str) -> dict[str, Any] | None:
        return await self.db[collection].find_one({"id": doc_id}, {"_id": 0})

    async def list(
        self,
        collection: str,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        query = filters or {}
        cursor = self.db[collection].find(query, {"_id": 0})
        return await cursor.to_list(length=2000)

    async def delete(self, collection: str, doc_id: str) -> bool:
        result = await self.db[collection].delete_one({"id": doc_id})
        return result.deleted_count > 0

    async def clear(self) -> None:
        for name in await self.db.list_collection_names():
            await self.db[name].delete_many({})


store: MemoryStore | MongoStore = MemoryStore()


async def init_store() -> MemoryStore | MongoStore:
    global store
    if settings.use_memory_store:
        store = MemoryStore()
        return store

    try:
        from motor.motor_asyncio import AsyncIOMotorClient

        client = AsyncIOMotorClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=1500,
        )
        await client.admin.command("ping")
        store = MongoStore(client[settings.mongodb_db])
        return store
    except Exception:
        store = MemoryStore()
        return store


def get_store() -> MemoryStore | MongoStore:
    return store
