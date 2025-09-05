import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const base = process.env.API_BASE_URL // server-only; ignore NEXT_PUBLIC to avoid accidental proxying in dev
  if (base) {
    try {
      const res = await fetch(`${base}/api/v1/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    } catch (e) {
      // fall through to mock on connection errors/timeouts
    }
  }
  // Fallback mock if API_BASE_URL isn't set or request failed
  return NextResponse.json(
    {
      generationId: 'mock-123',
      matchScore: 72,
      keywords: ['typescript', 'fastapi', 'resume', 'tailoring'],
      missingKeywords: ['OKRs'],
      suggestedKeywords: ['impact', 'ownership'],
      tailoredCv: {
        summary: 'Tailored summary aligning strengths to job requirements.',
        skills: ['Python', 'TypeScript', 'Next.js'],
        experience: [
          {
            company: 'Example Co',
            title: 'Engineer',
            bullets: [
              { text: 'Delivered features end-to-end improving UX', source_id: 'exp1_b1' },
            ],
          },
        ],
        education: [{ school: 'Uni', degree: 'BSc', year: '2020' }],
        projects: [{ name: 'Resumind', description: 'Resume tailoring MVP' }],
      },
      coverLetter: 'Dear Hiring Manager, ...',
    },
    { status: 200 },
  )
}
