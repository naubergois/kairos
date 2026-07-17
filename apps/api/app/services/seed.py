from __future__ import annotations

from app.db import get_store
from app.models.contracts import (
    AgentCatalogItem,
    ExecutionPlan,
    HumanApproval,
    KanbanBoard,
    PlanTask,
    Project,
    RequirementSpecification,
    TaskCard,
)
from app.models.enums import (
    ApprovalDecision,
    ApprovalType,
    AutonomyLevel,
    CardType,
    KanbanColumn,
    Priority,
)

MVP_AGENTS = [
    AgentCatalogItem(
        id="supervisor",
        name="Nova",
        role="supervisor",
        description="Robot supervisor that owns the delivery flow end-to-end",
        preferred_model="grok-3-mini",
        tools=["chat", "kanban", "approvals"],
        autonomy_level=AutonomyLevel.OPERACAO,
        success_rate=0.94,
    ),
    AgentCatalogItem(
        id="triagem",
        name="Scout",
        role="triagem",
        description="Classifies each software demand and spots missing inputs",
        tools=["classify"],
        success_rate=0.96,
    ),
    AgentCatalogItem(
        id="requisitos",
        name="Spec",
        role="requisitos",
        description="Writes requirements and testable acceptance criteria",
        tools=["docs"],
        success_rate=0.91,
    ),
    AgentCatalogItem(
        id="planejador",
        name="Map",
        role="planejador",
        description="Breaks software builds into executable swarm tasks",
        tools=["planning"],
        success_rate=0.9,
    ),
    AgentCatalogItem(
        id="arquiteto",
        name="Atlas",
        role="arquiteto",
        description="Designs components and interfaces for mini-apps",
        preferred_model="grok-3-mini",
        tools=["architecture"],
        success_rate=0.88,
    ),
    AgentCatalogItem(
        id="coordenador",
        name="Hive",
        role="coordenador",
        description="Forms the hierarchical swarm and assigns robot specialists",
        tools=["swarm"],
        autonomy_level=AutonomyLevel.INTEGRACAO,
        success_rate=0.92,
    ),
    AgentCatalogItem(
        id="desenvolvedor",
        name="Forge",
        role="desenvolvedor",
        description="Builds complete mini-apps and deploys a live preview",
        tools=["git", "editor", "runtime"],
        autonomy_level=AutonomyLevel.INTEGRACAO,
        success_rate=0.86,
        avg_cost_tokens=45_000,
    ),
    AgentCatalogItem(
        id="testador",
        name="Pulse",
        role="testador",
        description="Runs acceptance checks against the generated software",
        tools=["tests"],
        success_rate=0.89,
    ),
    AgentCatalogItem(
        id="revisor",
        name="Lens",
        role="revisor",
        description="Independent review of quality and requirement fit",
        tools=["review"],
        success_rate=0.93,
    ),
    AgentCatalogItem(
        id="documentacao",
        name="Quill",
        role="documentacao",
        description="Publishes delivery notes and usage docs",
        tools=["docs"],
        success_rate=0.95,
    ),
    AgentCatalogItem(
        id="chamados",
        name="Beacon",
        role="chamados",
        description="Opens blockers and incidents when agents get stuck",
        tools=["tickets"],
        success_rate=0.97,
    ),
]


async def seed_if_empty() -> dict:
    store = get_store()
    existing = await store.list("projects")
    if existing:
        project = Project.model_validate(existing[0])
        boards = await store.list("kanban_boards", {"project_id": project.id})
        board = KanbanBoard.model_validate(boards[0]) if boards else None
        # always refresh agent catalog names for demo consistency
        for agent in MVP_AGENTS:
            await store.upsert("agents", agent)
        return {"project_id": project.id, "board_id": board.id if board else None, "seeded": False}

    project = Project(
        id="proj_demo",
        name="Swarm Software Factory",
        description="Board for shipping complete mini-apps with robot agents",
        default_autonomy=AutonomyLevel.IMPLEMENTACAO,
    )
    board = KanbanBoard(
        id="board_demo",
        project_id=project.id,
        name="Delivery Board",
    )
    await store.upsert("projects", project)
    await store.upsert("kanban_boards", board)

    for agent in MVP_AGENTS:
        await store.upsert("agents", agent)

    demo_cards = [
        TaskCard(
            id="card_seed_1",
            title="Todo Mini App",
            description="Build a complete Todo web app with add/complete/delete and local persistence. Deploy a live preview.",
            type=CardType.NOVA_FUNCIONALIDADE,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.ALTA,
            column=KanbanColumn.EM_EXECUCAO,
            tags=["mini-app", "frontend"],
            acceptance_criteria=["Add/complete/delete todos", "Persist locally", "Live preview URL"],
            agents=["coordenador", "desenvolvedor", "testador"],
            subtasks=["UI", "State", "Deploy preview"],
            budget_spent=38_000,
            requester="product",
            human_owner="product_owner",
        ),
        TaskCard(
            id="card_seed_2",
            title="Notes Pad",
            description="Blocked while waiting for design tokens for the Notes mini-app.",
            type=CardType.NOVA_FUNCIONALIDADE,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.MEDIA,
            column=KanbanColumn.BLOQUEADO,
            tags=["mini-app", "blocked"],
            acceptance_criteria=["Create/edit notes", "Search", "Live preview"],
            agents=["desenvolvedor", "chamados"],
            block_reason="Waiting on brand color tokens from design",
            budget_spent=12_000,
        ),
        TaskCard(
            id="card_seed_3",
            title="Pomodoro Timer",
            description="Complete Pomodoro timer shipped by the swarm.",
            type=CardType.NOVA_FUNCIONALIDADE,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.MEDIA,
            column=KanbanColumn.CONCLUIDO,
            tags=["mini-app", "live"],
            acceptance_criteria=["Start/pause/reset", "Session history", "Deployed preview"],
            agents=["desenvolvedor", "revisor", "documentacao"],
            budget_spent=8_500,
            runtime_status="stopped",
        ),
        TaskCard(
            id="card_seed_4",
            title="Bookmark Board",
            description="Build a bookmark manager with tags and filters. Ready for human approval before swarm build.",
            type=CardType.NOVA_FUNCIONALIDADE,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.ALTA,
            column=KanbanColumn.AGUARDANDO_APROVACAO,
            tags=["mini-app", "approval"],
            acceptance_criteria=[
                "Save links with titles/tags",
                "Filter by tag",
                "Live preview deployed by Forge",
            ],
            agents=["requisitos", "arquiteto", "desenvolvedor"],
            subtasks=["Wireframes", "UI", "Deploy"],
        ),
    ]
    for card in demo_cards:
        await store.upsert("task_cards", card)

    await store.upsert(
        "requirements",
        RequirementSpecification(
            card_id="card_seed_4",
            objective="Ship a complete Bookmark Board mini-app",
            context="Users want a fast personal bookmark manager with tags.",
            functional=[
                "Save bookmarks with title, URL, and tags",
                "Filter bookmarks by tag",
                "Persist data locally",
            ],
            non_functional=["Modern responsive UI", "Loads under 2s"],
            business_rules=["URLs must be valid"],
            constraints=["Single-user local app"],
            acceptance_criteria=[
                "Save links with titles/tags",
                "Filter by tag",
                "Live preview deployed by Forge",
            ],
        ),
    )
    await store.upsert(
        "execution_plans",
        ExecutionPlan(
            card_id="card_seed_4",
            objective="Bookmark Board",
            strategy="Static mini-app first, then deploy live preview",
            tasks=[
                PlanTask(title="Define data model", agent_role="requisitos"),
                PlanTask(title="Build UI", agent_role="desenvolvedor", parallel_group=1),
                PlanTask(title="Deploy preview", agent_role="desenvolvedor", parallel_group=1),
            ],
            required_agents=["requisitos", "arquiteto", "desenvolvedor", "testador"],
            completion_criteria=[
                "Save links with titles/tags",
                "Filter by tag",
                "Live preview deployed by Forge",
            ],
        ),
    )
    await store.upsert(
        "approvals",
        HumanApproval(
            card_id="card_seed_4",
            type=ApprovalType.ESCOPO,
            requester="supervisor",
            decision=ApprovalDecision.PENDENTE,
            comment="Scope ready: approve to let the robot swarm build and deploy the mini-app.",
        ),
    )

    return {"project_id": project.id, "board_id": board.id, "seeded": True}
