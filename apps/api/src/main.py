from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import os
import structlog
import uuid

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
    # Deterministic stub for now. Replace with OpenAI call later.
    logger.info("tailor_request", tone=req.tone, role=req.role)
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
