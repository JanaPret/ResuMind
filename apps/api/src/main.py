from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import structlog
import uuid
import json

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore

logger = structlog.get_logger()

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title="Resumind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Bullet(BaseModel):
    text: str
    source_id: Optional[str] = None


class ExperienceItem(BaseModel):
    company: Optional[str] = None
    title: Optional[str] = None
    start: Optional[str] = None
    end: Optional[str] = None
    bullets: List[Bullet] = Field(default_factory=list)


class EducationItem(BaseModel):
    school: str
    degree: Optional[str] = None
    year: Optional[str] = None


class ProjectItem(BaseModel):
    name: str
    description: str


class TailoredCv(BaseModel):
    summary: str
    skills: List[str]
    experience: List[ExperienceItem]
    education: List[EducationItem]
    projects: List[ProjectItem]


class TailorRequest(BaseModel):
    resumeId: Optional[str] = None
    masterText: Optional[str] = None
    jobText: str
    tone: Optional[str] = Field(default="professional")
    role: Optional[str] = None


class TailorResponse(BaseModel):
    generationId: str
    matchScore: int
    keywords: List[str]
    missingKeywords: Optional[List[str]] = None
    suggestedKeywords: Optional[List[str]] = None
    tailoredCv: TailoredCv
    coverLetter: str


@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.post("/api/v1/tailor", response_model=TailorResponse)
async def tailor(req: TailorRequest):
    logger.info("tailor_request", tone=req.tone, role=req.role)

    # If OpenAI key available, attempt real generation
    if os.getenv("OPENAI_API_KEY") and OpenAI is not None:
        try:
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            system_prompt = (
                "You are Resumind, an assistant that tailors résumés and writes cover letters for a specific job. "
                "Return strict JSON with camelCase keys matching this schema: { matchScore:number(0-100), keywords:string[], "
                "missingKeywords:string[], suggestedKeywords:string[], tailoredCv:{ summary:string, skills:string[], "
                "experience:[{company?:string,title?:string,start?:string,end?:string,bullets:[{text:string,source_id?:string}]}], "
                "education:[{school:string,degree?:string,year?:string}], projects:[{name:string,description:string}] }, "
                "coverLetter:string }"
            )
            master = req.masterText or ""
            user_prompt = (
                f"MASTER_RESUME_TEXT:\n{master}\n\n"
                f"JOB_DESCRIPTION:\n{req.jobText}\n\n"
                f"TONE: {req.tone or 'professional'}\n"
                f"ROLE: {req.role or ''}\n\n"
                "Respond with ONLY the JSON object, no code fences."
            )

            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.2,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            content = resp.choices[0].message.content if resp.choices else None
            data = json.loads(content or "{}")

            # Map to pydantic response; add generationId and fallbacks
            gen_id = str(uuid.uuid4())
            tr = TailorResponse(
                generationId=gen_id,
                matchScore=int(data.get("matchScore", 75)),
                keywords=list(data.get("keywords", [])) or [],
                missingKeywords=list(data.get("missingKeywords", [])) or None,
                suggestedKeywords=list(data.get("suggestedKeywords", [])) or None,
                tailoredCv=TailoredCv(
                    summary=str(data.get("tailoredCv", {}).get("summary", "")),
                    skills=list(data.get("tailoredCv", {}).get("skills", [])) or [],
                    experience=[
                        ExperienceItem(
                            company=item.get("company"),
                            title=item.get("title"),
                            start=item.get("start"),
                            end=item.get("end"),
                            bullets=[Bullet(**b) for b in item.get("bullets", [])],
                        )
                        for item in data.get("tailoredCv", {}).get("experience", [])
                    ],
                    education=[
                        EducationItem(**e)
                        for e in data.get("tailoredCv", {}).get("education", [])
                    ],
                    projects=[
                        ProjectItem(**p) for p in data.get("tailoredCv", {}).get("projects", [])
                    ],
                ),
                coverLetter=str(data.get("coverLetter", "")),
            )
            return tr
        except Exception as e:  # pragma: no cover
            logger.warning("openai_fallback", error=str(e))

    # Fallback deterministic stub
    sample_keywords = ["stakeholder management", "typescript", "fastapi", "resume parsing"]
    gen_id = str(uuid.uuid4())
    summary = (
        "Results-driven professional aligning experience to the target role. "
        "Highlights keywords and optimizes impact with measurable outcomes."
    )
    tailored = TailoredCv(
        summary=summary,
        skills=["Python", "TypeScript", "FastAPI", "Next.js"],
        experience=[
            ExperienceItem(
                company="Acme Corp",
                title="Software Engineer",
                start="2022",
                end="Present",
                bullets=[
                    Bullet(
                        text="Built a resume tailoring tool using FastAPI and Next.js, reducing edit time by 60%",
                        source_id="exp_1_b1",
                    ),
                    Bullet(
                        text="Implemented keyword extraction to improve match scores by 25%",
                        source_id="exp_1_b2",
                    ),
                ],
            )
        ],
        education=[EducationItem(school="Tech University", degree="BSc Computer Science", year="2020")],
        projects=[ProjectItem(name="Resumind MVP", description="MVP for resume tailoring and cover letter generation")],
    )
    cover = (
        "Dear Hiring Manager,\n\n"
        "I am excited to apply for this role. My experience building full-stack applications with Next.js and FastAPI, "
        "combined with a focus on measurable outcomes and clear communication, aligns strongly with your needs. "
        "I have delivered features end-to-end, collaborated with stakeholders, and optimized performance to improve user experience.\n\n"
        "I would welcome the opportunity to contribute and learn more about your priorities.\n\n"
        "Sincerely,\nYour Name"
    )
    return TailorResponse(
        generationId=gen_id,
        matchScore=78,
        keywords=sample_keywords,
        missingKeywords=["OKRs", "A/B testing"],
        suggestedKeywords=["cross-functional", "ownership"],
        tailoredCv=tailored,
        coverLetter=cover,
    )
