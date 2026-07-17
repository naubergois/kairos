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
        name="Supervisor",
        role="supervisor",
        description="Recebe a demanda e acompanha todo o fluxo",
        preferred_model="gpt-4.1",
        tools=["chat", "kanban", "approvals"],
        autonomy_level=AutonomyLevel.OPERACAO,
        success_rate=0.94,
    ),
    AgentCatalogItem(
        id="triagem",
        name="Triagem",
        role="triagem",
        description="Classifica o cartão e verifica informações ausentes",
        tools=["classify"],
        success_rate=0.96,
    ),
    AgentCatalogItem(
        id="requisitos",
        name="Analista de requisitos",
        role="requisitos",
        description="Produz requisitos, regras e critérios de aceitação",
        tools=["docs"],
        success_rate=0.91,
    ),
    AgentCatalogItem(
        id="planejador",
        name="Planejador",
        role="planejador",
        description="Decompõe a demanda em tarefas executáveis",
        tools=["planning"],
        success_rate=0.9,
    ),
    AgentCatalogItem(
        id="arquiteto",
        name="Arquiteto",
        role="arquiteto",
        description="Define componentes, interfaces e decisões técnicas",
        preferred_model="gpt-4.1",
        tools=["architecture"],
        success_rate=0.88,
    ),
    AgentCatalogItem(
        id="coordenador",
        name="Coordenador do enxame",
        role="coordenador",
        description="Seleciona agentes e configura o Ruflo",
        tools=["swarm"],
        autonomy_level=AutonomyLevel.INTEGRACAO,
        success_rate=0.92,
    ),
    AgentCatalogItem(
        id="desenvolvedor",
        name="Desenvolvedor",
        role="desenvolvedor",
        description="Implementa serviços, regras e interfaces",
        tools=["git", "editor"],
        autonomy_level=AutonomyLevel.INTEGRACAO,
        success_rate=0.86,
        avg_cost_tokens=45_000,
    ),
    AgentCatalogItem(
        id="testador",
        name="Agente de testes",
        role="testador",
        description="Cria e executa testes",
        tools=["tests"],
        success_rate=0.89,
    ),
    AgentCatalogItem(
        id="revisor",
        name="Revisor de código",
        role="revisor",
        description="Analisa qualidade e aderência aos requisitos",
        tools=["review"],
        success_rate=0.93,
    ),
    AgentCatalogItem(
        id="documentacao",
        name="Agente de documentação",
        role="documentacao",
        description="Produz documentação funcional e técnica",
        tools=["docs"],
        success_rate=0.95,
    ),
    AgentCatalogItem(
        id="chamados",
        name="Agente de chamados",
        role="chamados",
        description="Abre e atualiza tickets",
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
        return {"project_id": project.id, "board_id": board.id if board else None, "seeded": False}

    project = Project(
        id="proj_demo",
        name="Contratos Cloud",
        description="Sistema de cadastro e acompanhamento de contratos",
        default_autonomy=AutonomyLevel.IMPLEMENTACAO,
    )
    board = KanbanBoard(
        id="board_demo",
        project_id=project.id,
        name="Delivery Kanban",
    )
    await store.upsert("projects", project)
    await store.upsert("kanban_boards", board)

    for agent in MVP_AGENTS:
        await store.upsert("agents", agent)

    demo_cards = [
        TaskCard(
            id="card_seed_1",
            title="API de cadastro de clientes",
            description="Criar endpoints para cadastrar e consultar clientes com autenticação.",
            type=CardType.NOVA_FUNCIONALIDADE,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.ALTA,
            column=KanbanColumn.EM_EXECUCAO,
            tags=["api", "auth"],
            acceptance_criteria=["CRUD de clientes", "JWT auth", "Testes > 70%"],
            agents=["desenvolvedor", "testador"],
            subtasks=["Modelar entidades", "Implementar API", "Testar"],
            budget_spent=38_000,
        ),
        TaskCard(
            id="card_seed_2",
            title="Corrigir filtro de pedidos",
            description="Bug: filtro por data retorna pedidos fora do intervalo.",
            type=CardType.CORRECAO,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.CRITICA,
            column=KanbanColumn.BLOQUEADO,
            tags=["bug", "pedidos"],
            acceptance_criteria=["Filtro correto em UTC", "Regressão coberta"],
            agents=["desenvolvedor", "chamados"],
            block_reason="Dependência de credenciais do data warehouse",
            budget_spent=12_000,
        ),
        TaskCard(
            id="card_seed_3",
            title="Documentar fluxo de contratos",
            description="Gerar documentação funcional do módulo de contratos.",
            type=CardType.DOCUMENTACAO,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.MEDIA,
            column=KanbanColumn.CONCLUIDO,
            tags=["docs"],
            acceptance_criteria=["README atualizado", "Diagrama publicado"],
            agents=["documentacao"],
            budget_spent=8_500,
        ),
        TaskCard(
            id="card_seed_4",
            title="Kanban de acompanhamento de contratos",
            description="Interface para acompanhar status de contratos com filtros.",
            type=CardType.NOVA_FUNCIONALIDADE,
            project_id=project.id,
            board_id=board.id,
            priority=Priority.ALTA,
            column=KanbanColumn.AGUARDANDO_APROVACAO,
            tags=["frontend", "kanban"],
            acceptance_criteria=[
                "Board com colunas de status",
                "Filtros por cliente e vigência",
                "Detalhe do contrato",
            ],
            agents=["requisitos", "arquiteto", "desenvolvedor"],
            subtasks=["Wireframes", "API de listagem", "UI Kanban"],
        ),
    ]
    for card in demo_cards:
        await store.upsert("task_cards", card)

    await store.upsert(
        "requirements",
        RequirementSpecification(
            card_id="card_seed_4",
            objective="Entregar Kanban de acompanhamento de contratos",
            context="Interface para acompanhar status de contratos com filtros.",
            functional=[
                "Listar contratos em colunas de status",
                "Filtrar por cliente e vigência",
                "Abrir detalhe do contrato",
            ],
            non_functional=["UI responsiva", "Tempo de carga < 2s"],
            business_rules=["Somente contratos do projeto ativo"],
            constraints=["Sem alterar dados financeiros"],
            acceptance_criteria=[
                "Board com colunas de status",
                "Filtros por cliente e vigência",
                "Detalhe do contrato",
            ],
        ),
    )
    await store.upsert(
        "execution_plans",
        ExecutionPlan(
            card_id="card_seed_4",
            objective="Kanban de contratos",
            strategy="Frontend após contrato de listagem",
            tasks=[
                PlanTask(title="Wireframes", agent_role="requisitos"),
                PlanTask(title="API de listagem", agent_role="desenvolvedor", parallel_group=1),
                PlanTask(title="UI Kanban", agent_role="desenvolvedor", parallel_group=1),
            ],
            required_agents=["requisitos", "arquiteto", "desenvolvedor"],
            completion_criteria=[
                "Board com colunas de status",
                "Filtros por cliente e vigência",
                "Detalhe do contrato",
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
            comment="Escopo do Kanban de contratos pronto para revisão.",
        ),
    )

    return {"project_id": project.id, "board_id": board.id, "seeded": True}
