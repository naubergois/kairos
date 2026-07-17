from enum import Enum


class KanbanColumn(str, Enum):
    ENTRADA = "entrada"
    TRIAGEM = "triagem"
    REFINAMENTO = "refinamento"
    AGUARDANDO_APROVACAO = "aguardando_aprovacao"
    PRONTO_ENXAME = "pronto_enxame"
    EM_EXECUCAO = "em_execucao"
    EM_REVISAO = "em_revisao"
    EM_TESTES = "em_testes"
    AGUARDANDO_DECISAO = "aguardando_decisao"
    PRONTO_ENTREGA = "pronto_entrega"
    CONCLUIDO = "concluido"
    BLOQUEADO = "bloqueado"
    CANCELADO = "cancelado"


class CardType(str, Enum):
    NOVA_FUNCIONALIDADE = "nova_funcionalidade"
    CORRECAO = "correcao"
    INCIDENTE = "incidente"
    SUPORTE = "suporte"
    MELHORIA = "melhoria"
    REFATORACAO = "refatoracao"
    DOCUMENTACAO = "documentacao"
    PESQUISA = "pesquisa"
    INTEGRACAO = "integracao"
    INFRAESTRUTURA = "infraestrutura"
    DEPENDENCIA = "dependencia"
    REQUISITOS = "requisitos"
    POC = "poc"
    TESTES = "testes"
    REVISAO = "revisao"
    IMPLANTACAO = "implantacao"


class Priority(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    CRITICA = "critica"


class AutonomyLevel(int, Enum):
    ANALISE = 0
    PLANEJAMENTO = 1
    IMPLEMENTACAO = 2
    INTEGRACAO = 3
    OPERACAO = 4


class ApprovalType(str, Enum):
    ESCOPO = "escopo"
    ARQUITETURA = "arquitetura"
    ACESSO = "acesso"
    MUDANCA_EXTERNA = "mudanca_externa"
    PULL_REQUEST = "pull_request"
    IMPLANTACAO = "implantacao"
    CANCELAMENTO = "cancelamento"
    ORCAMENTO = "orcamento"
    ENTREGA = "entrega"


class ApprovalDecision(str, Enum):
    PENDENTE = "pendente"
    APROVADO = "aprovado"
    REPROVADO = "reprovado"
    EDITAR = "editar"


class TicketCategory(str, Enum):
    ERRO = "erro"
    FALHA_TESTE = "falha_teste"
    INDISPONIBILIDADE = "indisponibilidade"
    DUVIDA = "duvida"
    DEPENDENCIA = "dependencia"
    INFRA = "infra"
    RISCO = "risco"
    BLOQUEIO = "bloqueio"
    VULNERABILIDADE = "vulnerabilidade"
    DECISAO = "decisao"


class TicketStatus(str, Enum):
    ABERTO = "aberto"
    EM_ANDAMENTO = "em_andamento"
    RESOLVIDO = "resolvido"
    FECHADO = "fechado"


class ReviewVerdict(str, Enum):
    APROVADO = "aprovado"
    REPROVADO = "reprovado"
    AJUSTES = "ajustes"


COLUMN_LABELS: dict[KanbanColumn, str] = {
    KanbanColumn.ENTRADA: "Entrada",
    KanbanColumn.TRIAGEM: "Triagem por IA",
    KanbanColumn.REFINAMENTO: "Em refinamento",
    KanbanColumn.AGUARDANDO_APROVACAO: "Aguardando aprovação",
    KanbanColumn.PRONTO_ENXAME: "Pronto para o enxame",
    KanbanColumn.EM_EXECUCAO: "Em execução",
    KanbanColumn.EM_REVISAO: "Em revisão",
    KanbanColumn.EM_TESTES: "Em testes",
    KanbanColumn.AGUARDANDO_DECISAO: "Aguardando decisão",
    KanbanColumn.PRONTO_ENTREGA: "Pronto para entrega",
    KanbanColumn.CONCLUIDO: "Concluído",
    KanbanColumn.BLOQUEADO: "Bloqueado",
    KanbanColumn.CANCELADO: "Cancelado",
}

KANBAN_COLUMNS_ORDER = list(KanbanColumn)
