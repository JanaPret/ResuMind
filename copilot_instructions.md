# Smart Résumé — GitHub Copilot Instructions

> This file tells GitHub Copilot *exactly* how to scaffold, code, and extend the Smart Résumé web app so we can ship a subscription product fast.

---

## 1) Product vision
**Build a simple, fast tool that tailors a résumé and writes a cover letter for a specific job in under 60 seconds — and goes beyond by checking ATS-fit, suggesting job matches, and publishing a personal site.**

**Primary outcomes**
- 1-click: paste job ad → get tailored résumé + cover letter.
- Clear match score + keyword alignment.
- Download as DOCX/PDF with clean templates.
- Subscription-ready from day one.

**Core differentiators**
- Trust-first output: every tailored bullet is traceable to a source bullet (source_id), with inferred items flagged.
- Built-in ATS Checker: instant ATS score, readability, section/lint checks, and keyword gap analysis.
- Phrase library + AI rewriter: curated, career-writer-approved bullet phrases by role/level, plus AI rewrite/shorten/STAR.
- One-click personal site: publish a polished profile/resume microsite with signed URLs (private by default, shareable).
- Job match hints: optional job discovery suggestions based on resume skills and location (opt-in, privacy-safe).
- Multilingual output: translate resume and cover letter to selected locales with locale-aware formatting.

**Non‑goals (MVP)**
- No native iOS/Android (mobile‑responsive web only).
- No external job board syndication or applications; provide suggestions only.

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

**Phase 1.5 (inspired by Zety/Kickresume)**
- ATS Resume Checker: score + actionable tips; keyword/missing sections; PDF/DOCX ingestion.
- Phrase Library: 20k+ curated phrases by role/industry; integrate into editor with click-to-insert.
- LinkedIn import: upload LinkedIn PDF to parse fields; optional OAuth later.
- Examples browser: view role-specific resume and cover letter examples; start-from-example.
- Interview prep: generate 10 role-specific questions, with model answers derived from the tailored resume.
- Personal site publisher: static site from resume; custom theme; privacy toggle; signed share links.
- Job match suggestions: optional matching (location/keywords) via pluggable provider; save jobs to tracker.

---

## 4) Architecture & tech stack
**Frontend**: Next.js 14+ (App Router, TypeScript), TailwindCSS, shadcn/ui, React Hook Form, Zod.

**Backend API**: FastAPI (Python 3.11), pydantic v2, Uvicorn, Celery (optional later), structlog.

**AI**: OpenAI API (e.g., `gpt-4o-mini` for cost/perf) for text; deterministic JSON output via response schema.
Optional: smaller models for ATS heuristics; translate with model-native translation where available.

**Data**: Postgres (Supabase or RDS). ORM on web side via Prisma (for user/billing) or SQLAlchemy (in API) — choose one primary DB, shared via connection string. Optional Redis for job queues and cache.

**Files/Storage**: S3‑compatible (AWS S3 / Backblaze B2 / Supabase Storage) for uploaded résumé files, generated DOCX/PDF, and published personal sites (static files).

**Auth**: NextAuth.js (email + Google). JWT sessions.

**Payments**: Stripe Checkout + Billing portal. Webhooks → grant plan features/credits.

**Deploy**: Vercel (web) + Fly.io/Render (API). Single Postgres instance. Cloudflare for DNS/SSL.

**Logging/analytics**: pino (web), structlog (API), Plausible/Umami for product analytics.

**Why this split?**
- Next.js ships UI fast; FastAPI keeps the AI + parsing isolated and portable.

**Architecture notes (new subsystems)**
- ATS checker service: text normalization → sections detection → heuristics + AI critique → score (0–100) with explanations.
- Phrase library store: static JSON bundle to start; migrate to DB for search/filter by role, seniority, and tone.
- Site publisher: render themed static site from resume JSON; upload to S3; return signed URL and optional public slug.
- Job match provider: interface abstraction; implement a mock/local provider first; real provider behind feature flag.

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
SITE_PUBLISH_BUCKET=smart-resume-sites
LOCALE_DEFAULT=en
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
LINKEDIN_CLIENT_ID=... # optional, for future OAuth import
LINKEDIN_CLIENT_SECRET=...
```

**API (FastAPI)**
```
OPENAI_API_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
DOCX_TEMPLATE_BUCKET=smart-resume-templates
JOB_MATCH_API_KEY=... # optional provider (feature-flag)
ENABLE_ATS_CHECKER=true
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
  websites      Website[]
  jobs          SavedJob[]
}

model Resume {
  id           String   @id @default(cuid())
  userId       String
  title        String
  sourceFile   String?   // s3 key
  parsedJson   Json      // structured résumé
  language     String    @default("en")
  publicSlug   String?   @unique
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user         User      @relation(fields: [userId], references: [id])
  scores       ResumeScore[]
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

model ResumeScore {
  id         String   @id @default(cuid())
  resumeId   String
  atsScore   Int
  readability Int
  issues     Json      // { missingSections, keywordGaps, formatWarnings }
  createdAt  DateTime  @default(now())
  resume     Resume    @relation(fields: [resumeId], references: [id])
}

model Template {
  id        String   @id @default(cuid())
  name      String
  kind      String   // resume | cover | site
  s3Key     String   @unique
  premium   Boolean  @default(false)
  createdAt DateTime @default(now())
}

model Website {
  id        String   @id @default(cuid())
  userId    String
  resumeId  String
  themeId   String?
  publicUrl String?
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  resume    Resume   @relation(fields: [resumeId], references: [id])
}

model SavedJob {
  id        String   @id @default(cuid())
  userId    String
  title     String
  company   String?
  location  String?
  url       String?
  source    String?  // provider name
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
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

Additional endpoints
- `POST /ats/check` → Body: `{ resume: {file|json}, jobText? }` → `{ atsScore, issues{...}, missingKeywords[] }`
- `GET /templates` → `{ items: Template[] }`
- `GET /examples?role=...` → `{ resumes: ExampleResume[], covers: ExampleCover[] }`
- `POST /linkedin/import` → Body: `{ file }` → `{ parsed_resume_json }`
- `POST /translate` → Body: `{ resumeId, targetLocale }` → `{ translatedResume, translatedCoverLetter }`
- `POST /interview-questions` → Body: `{ resumeId, role }` → `{ questions[], modelAnswers[] }`
- `POST /site/publish` → Body: `{ resumeId, themeId? }` → `{ siteUrl, isPublic }`
- `GET /jobs/match?resumeId=...` → `{ matches: SavedJob[] }` (feature-flagged)

**Notes**
- Always return JSON that matches pydantic schemas.
- Use async endpoints, add CORS for the web origin.
- Add feature flags on server for job matches and LinkedIn OAuth import.

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

**Additional prompts**
- ATS critique: given resume JSON (+optional job), output `{ atsScore, issues{missingSections, keywordGaps, formatting, clarity}, suggestions[] }`.
- Phrase rewrite: rewrite bullet to be concise, quantify impact, follow STAR; limit to 1–2 lines; keep truthfulness.
- Interview prep: generate 10 questions tailored to role + resume; add model answers anchored to resume bullets.
- Translation: translate resume and cover letter to target locale; adapt date/number formats and job titles where appropriate; return same JSON shape.

---

## 10) Frontend UX flows
- **Dashboard**: Upload/paste master résumé → parse to JSON → show editable fields.
- **Tailor**: Paste job ad → choose tone (professional, confident, friendly) → Generate → show results in two tabs (Résumé, Cover Letter) + match score + keyword chips.
- **Export**: Pick template → download DOCX/PDF.
- **Billing**: Stripe Checkout session, Billing Portal link, plan limits surfaced.

**New UX**
- **ATS Check**: Upload existing resume (PDF/DOCX) → instant score + prioritized fixes + missing keywords.
- **Phrase Library**: Search by role/seniority → click-to-insert phrases; in-line AI rewrite/shorten/expand.
- **Examples**: Browse examples by role; start-from-example to prefill editor.
- **Personal Site**: Pick theme → preview live → publish/unpublish; copy link.
- **Interview Prep**: Generate questions/answers; export to notes.
- **Job Matches (opt-in)**: View matches; save to tracker; open original link.

**Components** (shadcn/ui)
- `Card`, `Tabs`, `Badge` (keywords), `Progress` (match score), `Textarea`, `Dialog` (export modal), `Skeleton` loaders.

---

## 11) Security & privacy
- **POPIA/GDPR**: résumé data is personal → obtain consent, purpose‑limited storage, delete on request.
- Do **not** log raw résumé or job text. Mask PII in logs.
- Encrypt at rest (S3 SSE) and in transit (TLS). Short‑lived signed URLs for downloads.
- Rate‑limit unauthenticated endpoints; require auth for generation.
- Personal site is private by default; public toggle with random slug and robots noindex; signed URLs expire.

---

## 12) Payments & plans
- **Free**: R0 → 1 resume import, 1 tailoring, basic ATS check, 1 basic template, TXT/PDF download.
- **Starter**: R89 / $5 → 10 generations / month, ATS checks, 10 templates, personal site, examples.
- **Pro**: R199 / $12 → unlimited* fair‑use, all templates, multilingual, interview prep, job matches.
- **Team** (phase 2): R699 / $40 → seats + bulk, shared templates, admin, export branding.
- Add‑ons: Human proofreading (per document), extra template packs, custom domain for personal site.

Stripe objects: product/price per plan, customer per user, subscription on checkout. Webhook events: `checkout.session.completed`, `customer.subscription.updated`, `invoice.paid` → update Subscription row.
Optional: 14‑day trial on Pro; student discount (coupon); referral credits.

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
- **ATS**: fixture resumes with expected scores and issue sets; regression on scoring changes.
- **Templates**: snapshot DOCX/PDF and site HTML renders for sample resumes.

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

**ATS checker endpoint**
```comment
Copilot: add POST /api/v1/ats/check that accepts a resume file or JSON and optional jobText; normalize to JSON; run heuristics + model critique; return atsScore (0–100), issues, and missingKeywords.
```

**Personal site publisher**
```comment
Copilot: add POST /api/v1/site/publish that renders a static site from resume JSON with a theme; uploads to S3; returns a signed URL and optional public slug.
```

---

## 16) Acceptance criteria (MVP)
- A user can sign up, upload/paste a résumé, paste a job ad, click Generate, and download a DOCX/PDF.
- The tailored résumé includes at least 5 role‑relevant keywords present in the job ad.
- Stripe Starter plan limits are enforced.
- Logs contain no raw PII.

**Acceptance criteria (Phase 1.5)**
- ATS Checker returns a score and at least 3 actionable fixes for a sample resume.
- Phrase Library provides at least 50 phrases for 3 common roles (e.g., PM, SWE, Sales).
- Personal site can be published/unpublished; public link loads with correct data.
- Examples browser shows at least 10 role-specific examples.

---

## 17) Deployment checklist
- [ ] Environment variables set in Vercel/host.
- [ ] Stripe webhook secret configured; webhook URL reachable.
- [ ] Database migrations run.
- [ ] CORS origins set (`SITE_URL`).
- [ ] S3 bucket policy + lifecycle rules.
- [ ] Plausible script on production domain.
- [ ] Site publish bucket with static website hosting and proper ACLs.
- [ ] Feature flags for job matches and LinkedIn OAuth are off by default.

---

## 18) Roadmap (90 days)
**0–30 days**: MVP features, payments, 2 templates, single‑locale.

**31–60 days**: Template editor, ATS checker, phrase library, examples, referral program, SEO pages.

**61–90 days**: Org seats, bulk runs, multi‑language, personal site, job matches, Chrome extension.

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
  free:    { priceId: null, monthlyGenerations: 1, atsChecks: 1, templates: 1 },
  starter: { priceId: "price_starter", monthlyGenerations: 10, atsChecks: 20, templates: 10 },
  pro:     { priceId: "price_pro",     monthlyGenerations: 200, atsChecks: 200, templates: "all" },
}
```

---

## 23) Monitoring
- Health endpoints for API.
- 95th percentile latency < 2s for generate on `gpt-4o-mini`.
- Alert on Stripe webhook failures and OpenAI errors.
- Track ATS check latency and error rate; template render failures; site publish success rate.

---

## 24) Hand‑off summary
Copilot: prioritize generating strongly‑typed endpoints, Zod‑validated forms, and prompt constants. Ship MVP quickly, then iterate on templates and billing UX.

Then add ATS checker, Phrase Library, Examples, and Personal Site to beat incumbents: keep privacy-first defaults, explain scores, and let users verify/edit every AI suggestion.

