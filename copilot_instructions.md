# Smart Résumé — GitHub Copilot Instructions

> This file tells GitHub Copilot *exactly* how to scaffold, code, and extend the Smart Résumé web app so we can ship a subscription product fast.

---

## 1) Product vision
**Build a simple, fast tool that tailors a résumé and writes a cover letter for a specific job in under 60 seconds.**

**Primary outcomes**
- 1-click: paste job ad → get tailored résumé + cover letter.
- Clear match score + keyword alignment.
- Download as DOCX/PDF with clean templates.
- Subscription-ready from day one.

**Non‑goals (MVP)**
- No native iOS/Android (mobile‑responsive web only).
- No complex ATS integrations; simple export first.

---

## 2) Target users & jobs‑to‑be‑done
- **Job seekers**: “Give me a résumé + cover letter that matches this job ad.”
- **Recruiters / teams** (phase 2): bulk tailoring, CSV import, brand templates.

---

## 3) Core features (MVP)
1. Auth (email + Google OAuth).
2. Upload or paste master résumé (DOCX/PDF/TXT) and store structured fields.
3. Paste job description (or URL → scrape minimal text, phase 2).
4. AI tailoring → résumé sections + cover letter + keywords + match score.
5. Export DOCX/PDF with selectable template.
6. Billing: Stripe subscriptions (Starter, Pro) and usage limits.
7. Admin: view users, plans, and basic telemetry.

**Phase 2 add‑ons**
- Recruiter/org workspaces, shared templates, bulk runs.
- Multi‑language output.
- Chrome extension for LinkedIn/Indeed job pages.

---

## 4) Architecture & tech stack
**Frontend**: Next.js 14+ (App Router, TypeScript), TailwindCSS, shadcn/ui, React Hook Form, Zod.

**Backend API**: FastAPI (Python 3.11), pydantic v2, Uvicorn, Celery (optional later), structlog.

**AI**: OpenAI API (e.g., `gpt-4o-mini` for cost/perf) for text; deterministic JSON output via response schema.

**Data**: Postgres (Supabase or RDS). ORM on web side via Prisma (for user/billing) or SQLAlchemy (in API) — choose one primary DB, shared via connection string.

**Files/Storage**: S3‑compatible (AWS S3 / Backblaze B2 / Supabase Storage) for uploaded résumé files and generated DOCX/PDF.

**Auth**: NextAuth.js (email + Google). JWT sessions.

**Payments**: Stripe Checkout + Billing portal. Webhooks → grant plan features/credits.

**Deploy**: Vercel (web) + Fly.io/Render (API). Single Postgres instance. Cloudflare for DNS/SSL.

**Logging/analytics**: pino (web), structlog (API), Plausible/Umami for product analytics.

**Why this split?**
- Next.js ships UI fast; FastAPI keeps the AI + parsing isolated and portable.

---

## 5) Repository layout (monorepo)
```
smart-resume/
  apps/
    web/               # Next.js app router frontend
    api/               # FastAPI service
  packages/
    shared/            # Shared types, JSON schemas, prompt snippets
  infra/
    docker/            # Dockerfiles + compose for local dev
  .env.example
  README.md
  COPILOT_INSTRUCTIONS.md
```

---

## 6) Environment variables (.env.example)
**Shared**
```
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/smart_resume
STORAGE_BUCKET_URL=s3://bucket-name
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
SITE_URL=http://localhost:3000
```

**Web (Next.js)**
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=changeme
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
STRIPE_PUBLIC_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
API_BASE_URL=http://localhost:8000
PLAUSIBLE_DOMAIN=smart-resume.local
```

**API (FastAPI)**
```
OPENAI_API_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
DOCX_TEMPLATE_BUCKET=smart-resume-templates
```

---

## 7) Data model (Prisma suggestion)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  image         String?
  providerType  String   @default("credentials")
  createdAt     DateTime @default(now())
  resumes       Resume[]
  generations   Generation[]
  subscription  Subscription?
}

model Resume {
  id           String   @id @default(cuid())
  userId       String
  title        String
  sourceFile   String?   // s3 key
  parsedJson   Json      // structured résumé
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id])
}

model Generation {
  id            String   @id @default(cuid())
  userId        String
  resumeId      String
  jobText       String
  tone          String   @default("professional")
  matchScore    Int
  keywords      String[]
  tailoredCv    Json     // structured
  coverLetter   String
  costCents     Int      @default(0)
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  resume        Resume   @relation(fields: [resumeId], references: [id])
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  stripeId      String   @unique
  plan          String   // starter | pro | team
  status        String   // active | past_due | canceled
  currentPeriodEnd DateTime
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
}
```

---

## 8) API contract (FastAPI)
**Base URL**: `/api/v1`

- `POST /resumes/parse` → Body: `{ file | text }` → `{ parsed_resume_json }`
- `POST /job/parse` → Body: `{ text }` → `{ normalized_job_json }`
- `POST /tailor` → Body: `{ resumeId, jobText, tone?, role? }` → `{ generationId, matchScore, keywords[], tailoredCv, coverLetter }`
- `GET /generations/{id}` → `{ ... }`
- `POST /export` → Body: `{ generationId, format:"docx"|"pdf", templateId? }` → `{ fileUrl }`
- `POST /billing/usage` (webhook/internal) → record OpenAI token cost.

**Notes**
- Always return JSON that matches pydantic schemas.
- Use async endpoints, add CORS for the web origin.

---

## 9) Prompt templates (place in `packages/shared/prompts.ts`)
**System**
```
You are Smart Résumé, an assistant that tailors résumés and writes cover letters for a specific job.
Return strict JSON that conforms to the provided schema. Avoid hallucinating skills not present in the master résumé unless clearly inferred; mark inferred items.
```

**User (tailor)**
```
MASTER_RESUME_JSON: {master_resume_json}
JOB_DESCRIPTION: {job_text}
TONE: {tone}
ROLE: {role}

Output JSON with keys:
- match_score (0-100)
- missing_keywords (string[])
- suggested_keywords (string[])
- tailored_resume { summary, skills[], experience[], education[], projects[] }
- cover_letter (string, 250–400 words)
```

**Guardrails**
- Ask the model to cite which résumé bullet each tailored bullet came from (by `source_id`) to increase trust.
- When uncertain, prefer conservative edits.

---

## 10) Frontend UX flows
- **Dashboard**: Upload/paste master résumé → parse to JSON → show editable fields.
- **Tailor**: Paste job ad → choose tone (professional, confident, friendly) → Generate → show results in two tabs (Résumé, Cover Letter) + match score + keyword chips.
- **Export**: Pick template → download DOCX/PDF.
- **Billing**: Stripe Checkout session, Billing Portal link, plan limits surfaced.

**Components** (shadcn/ui)
- `Card`, `Tabs`, `Badge` (keywords), `Progress` (match score), `Textarea`, `Dialog` (export modal), `Skeleton` loaders.

---

## 11) Security & privacy
- **POPIA/GDPR**: résumé data is personal → obtain consent, purpose‑limited storage, delete on request.
- Do **not** log raw résumé or job text. Mask PII in logs.
- Encrypt at rest (S3 SSE) and in transit (TLS). Short‑lived signed URLs for downloads.
- Rate‑limit unauthenticated endpoints; require auth for generation.

---

## 12) Payments & plans
- **Starter**: R89 / $5 → 10 generations / month, 3 templates.
- **Pro**: R199 / $12 → unlimited* fair‑use, all templates.
- **Team** (phase 2): R699 / $40 → seats + bulk.

Stripe objects: product/price per plan, customer per user, subscription on checkout. Webhook events: `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid` → update Subscription row.

---

## 13) Local dev & scripts
**Web**
```
cd apps/web
pnpm i
pnpm dev
```
**API**
```
cd apps/api
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```
**DB**
```
# with Prisma (from apps/web)
pnpm prisma migrate dev
pnpm prisma studio
```
**Docker (optional)**
```
docker compose up --build
```

---

## 14) Testing strategy
- **Web**: Vitest + Testing Library; Playwright for e2e (mock API via MSW).
- **API**: pytest, httpx AsyncClient, snapshot the JSON contract.
- **AI**: golden‑file tests with deterministic prompts; record/replay via VCR.py.

---

## 15) Copilot usage guide (prompt patterns)
**Scaffold FastAPI endpoint**
```comment
Copilot: create an async FastAPI endpoint POST /api/v1/tailor that accepts resumeId, jobText, tone, role; calls openai.chat.completions with the system+user prompts in packages/shared; validates against pydantic schema; returns JSON.
```

**Generate React form with Zod**
```comment
Copilot: build a Tailwind form using react-hook-form + zod for jobText and tone, with a submit that calls POST /api/v1/tailor and renders tabs for Résumé and Cover Letter with a progress bar for matchScore.
```

**Stripe checkout server action**
```comment
Copilot: add a Next.js server action that creates a Stripe Checkout Session for plan=pro, returns url, and a webhook handler that upserts Subscription by stripe customer id.
```

**DOCX export**
```comment
Copilot: in the API, implement a DOCX generator using python-docx that fills a template with tailoredCv and coverLetter and uploads to S3, returning a signed URL.
```

---

## 16) Acceptance criteria (MVP)
- A user can sign up, upload/paste a résumé, paste a job ad, click Generate, and download a DOCX/PDF.
- The tailored résumé includes at least 5 role‑relevant keywords present in the job ad.
- Stripe Starter plan limits are enforced.
- Logs contain no raw PII.

---

## 17) Deployment checklist
- [ ] Environment variables set in Vercel/host.
- [ ] Stripe webhook secret configured; webhook URL reachable.
- [ ] Database migrations run.
- [ ] CORS origins set (`SITE_URL`).
- [ ] S3 bucket policy + lifecycle rules.
- [ ] Plausible script on production domain.

---

## 18) Roadmap (90 days)
**0–30 days**: MVP features, payments, 2 templates, single‑locale.

**31–60 days**: Template editor, keyword insights, referral program, SEO pages.

**61–90 days**: Org seats, bulk runs, multi‑language, Chrome extension.

---

## 19) Coding conventions
- TypeScript strict mode; ESLint + Prettier; conventional commits (`feat:`, `fix:`...).
- API returns camelCase JSON, versioned under `/api/v1`.
- Handle errors with typed problem+JSON (`{ code, message, details }`).

---

## 20) Issue & PR templates (short)
**Issue**
```
### What
### Why
### How
### Acceptance Criteria
```
**PR**
```
### Summary
### Screenshots
### How to test
### Checklist: tests, types, docs
```

---

## 21) Legal & compliance (starter)
- Terms, Privacy, DPA (template). Data deletion on request.
- POPIA/GDPR: purpose limitation, user export of data, consent at signup.

---

## 22) Pricing config (code constants)
```
PLANS = {
  starter: { priceId: "price_...", monthlyGenerations: 10 },
  pro:     { priceId: "price_...", monthlyGenerations: 200 },
}
```

---

## 23) Monitoring
- Health endpoints for API.
- 95th percentile latency < 2s for generate on `gpt-4o-mini`.
- Alert on Stripe webhook failures and OpenAI errors.

---

## 24) Hand‑off summary
Copilot: prioritize generating strongly‑typed endpoints, Zod‑validated forms, and prompt constants. Ship MVP quickly, then iterate on templates and billing UX.

