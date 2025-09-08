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
# optional: point the web API proxy to the FastAPI server
$env:API_BASE_URL = "http://localhost:8000"
npm run dev
```

The web app will start on http://localhost:3000 (or the PORT you set, e.g. http://localhost:3001).
If you set `API_BASE_URL`, the Next.js route `/api/tailor` will forward to FastAPI; otherwise it returns a mocked response for local UI testing.

2) API

```powershell
cd ../api
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# if your web app runs on a non-default port (e.g., 3001), allow it via CORS
$env:ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:3001"
uvicorn src.main:app --reload --port 8000
```

The API will start on http://localhost:8000.

3) Environment

- Web: you can configure the API proxy either via environment variable before `npm run dev`, e.g. `$env:API_BASE_URL = "http://localhost:8000"`, or by creating `apps/web/.env.local` with:

  ```
  API_BASE_URL=http://localhost:8000
  ```

- API: to permit multiple web origins during local dev, set `ALLOWED_ORIGINS` (comma-separated), e.g. `http://localhost:3000,http://localhost:3001`.

## What works now
- A minimal UI to input master résumé text and a job description, plus tone.
- The Next.js route `/api/tailor` forwards to FastAPI when `API_BASE_URL` is set; otherwise it returns a mocked response for local UI testing.
- FastAPI `/api/v1/health` and `/api/v1/tailor` endpoints with pydantic schemas; tailor returns a deterministic stub.

## Troubleshooting
- We use npm for the web app; no pnpm required.
- Port 3000 in use: set a custom port in PowerShell with `$env:PORT=3001` before `npm run dev`.
- If the browser can’t reach the API, ensure the web process has `API_BASE_URL` set and the API has `ALLOWED_ORIGINS` including your web origin.
- CSS toolchain errors about ESM/CommonJS: ensure `apps/web/postcss.config.js` exists (ESM default export) and `apps/web/tailwind.config.cjs` exists (CommonJS export).

## Production

- Web build and start:

  ```powershell
  cd apps/web
  npm run build
  npm start
  ```

- API (example, without auto-reload):

  ```powershell
  cd apps/api
  .\.venv\Scripts\Activate.ps1
  uvicorn src.main:app --host 0.0.0.0 --port 8000
  ```

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
copilot_instructions.md
```
