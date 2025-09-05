# Resumind — MVP Monorepo

Simple, fast tool to tailor a résumé and write a cover letter for a specific job.

This repository contains:
- apps/web — Next.js 14 App Router frontend (TypeScript, Tailwind)
- apps/api — FastAPI backend (Python 3.11+)
- packages/shared — Shared prompt templates and types
- infra/docker — Optional Docker Compose for local Postgres

## Quick start

Prereqs: Node 18+, npm, Python 3.11+, (optional) Docker Desktop

1) Web (Next.js)

```powershell
cd apps/web
npm install
# optional: set a different port if 3000 is busy
$env:PORT=3001
npm run dev
```

The web app will start on http://localhost:3000 (or the PORT you set, e.g. http://localhost:3001).

2) API

```powershell
cd ../api
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

The API will start on http://localhost:8000.

3) Environment

- Copy `.env.example` to `.env` at the repo root and adjust values.
- For the web app, copy `apps/web/.env.local.example` to `apps/web/.env.local`.
- To proxy the web route `/api/tailor` to FastAPI, set in `apps/web/.env.local`:
  - `API_BASE_URL=http://localhost:8000`

## What works now
- A minimal UI to input master résumé text and a job description, plus tone.
- The Next.js route `/api/tailor` forwards to FastAPI when `API_BASE_URL` is set; otherwise it returns a mocked response for local UI testing.
- FastAPI `/api/v1/health` and `/api/v1/tailor` endpoints with pydantic schemas; tailor returns a deterministic stub.

## Troubleshooting
- `pnpm` not found: use `npm install` and `npm run dev` as shown above (no pnpm required).
- Port 3000 in use: set a custom port in PowerShell with `$env:PORT=3001` before `npm run dev`.
- CSS toolchain errors about ESM/CommonJS: ensure `apps/web/postcss.config.js` exists (ESM default export) and `apps/web/tailwind.config.cjs` exists (CommonJS export).

## Next steps
- Wire up auth (NextAuth) and Stripe (Starter/Pro plans).
- Add Prisma schema and migrations; connect to Postgres.
- Implement proper resume parsing, keyword extraction, and DOCX/PDF export.
- Replace stubs with OpenAI calls following `packages/shared/prompts.ts`.

## Repo layout

```
apps/
  web/
  api/
packages/
  shared/
infra/
  docker/
.env.example
README.md
COPILOT_INSTRUCTIONS.md
```
