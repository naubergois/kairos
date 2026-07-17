from fastapi import APIRouter, HTTPException

from app.db import get_store
from app.models.contracts import CreateProjectRequest, KanbanBoard, Project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
async def list_projects() -> list[Project]:
    store = get_store()
    rows = await store.list("projects")
    return [Project.model_validate(r) for r in rows]


@router.post("")
async def create_project(payload: CreateProjectRequest) -> Project:
    store = get_store()
    project = Project(name=payload.name, description=payload.description)
    board = KanbanBoard(project_id=project.id, name=f"{project.name} Board")
    await store.upsert("projects", project)
    await store.upsert("kanban_boards", board)
    return project


@router.get("/{project_id}")
async def get_project(project_id: str) -> dict:
    store = get_store()
    raw = await store.get("projects", project_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    boards = await store.list("kanban_boards", {"project_id": project_id})
    return {"project": Project.model_validate(raw), "boards": boards}
