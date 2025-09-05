// Shared prompt templates and simple types for Resumind

export const SYSTEM_PROMPT = `You are Resumind, an assistant that tailors résumés and writes cover letters for a specific job. Return strict JSON that conforms to the provided schema. Avoid hallucinating skills not present in the master résumé unless clearly inferred; mark inferred items.`;

export type TailorRequest = {
  resumeId?: string;
  masterText?: string; // plain text input alternative
  jobText: string;
  tone?: 'professional' | 'confident' | 'friendly';
  role?: string;
};

export type TailoredCv = {
  summary: string;
  skills: string[];
  experience: Array<{
    company?: string;
    title?: string;
    start?: string;
    end?: string;
    bullets: Array<{ text: string; source_id?: string }>;
  }>;
  education: Array<{ school: string; degree?: string; year?: string }>;
  projects: Array<{ name: string; description: string }>;
};

export type TailorResponse = {
  generationId: string;
  matchScore: number;
  keywords: string[];
  missingKeywords?: string[];
  suggestedKeywords?: string[];
  tailoredCv: TailoredCv;
  coverLetter: string;
};

export const tailorUserPrompt = (params: {
  masterResumeJson?: unknown;
  jobText: string;
  tone?: string;
  role?: string;
}) => `MASTER_RESUME_JSON: ${JSON.stringify(params.masterResumeJson ?? {})}
JOB_DESCRIPTION: ${params.jobText}
TONE: ${params.tone ?? 'professional'}
ROLE: ${params.role ?? ''}

Output JSON with keys:
- match_score (0-100)
- missing_keywords (string[])
- suggested_keywords (string[])
- tailored_resume { summary, skills[], experience[], education[], projects[] }
- cover_letter (string, 250–400 words)`;
