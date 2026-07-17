# Manus SwarmDesk

Plataforma multiagente para desenvolvimento autônomo de software orientado por Kanban.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind + React Router
- **Backend:** FastAPI + Pydantic v2 + Motor (MongoDB)
- **Orquestração (MVP):** adaptadores stub LangGraph / Ruflo

## Subir a infraestrutura

```bash
docker compose up -d
```

## API

Requer Python 3.12 ou 3.13.

```bash
cd apps/api
python3.13 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Por padrão `USE_MEMORY_STORE=true` (arquivo `.env`) para rodar sem Mongo. Com Docker Compose no ar e `USE_MEMORY_STORE=false`, a API usa MongoDB.

A API faz seed automático do projeto demo, agentes MVP e cartões de exemplo.

## Web

```bash
cd apps/web
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). A SPA aponta para `http://localhost:8000` por padrão.

## Fluxo demo

1. Abra **Portal** e descreva uma demanda em linguagem natural.
2. O cartão entra em **Entrada** e o pipeline stub gera triagem, requisitos e plano até **Aguardando aprovação**.
3. Aprove em **Aprovações** ou no detalhe do cartão.
4. O enxame stub executa, revisa, testa e leva o cartão a **Pronto para entrega**.
5. Aprove a entrega para concluir.

## Estrutura

```
apps/web/          React SPA
apps/api/          FastAPI
packages/shared/   Tipos TypeScript compartilhados
docker-compose.yml MongoDB + Redis
```
