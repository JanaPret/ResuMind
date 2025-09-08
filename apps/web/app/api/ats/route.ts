import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const payload = await req.json()
  const base = process.env.API_BASE_URL
  if (base) {
    try {
      const res = await fetch(`${base}/api/v1/ats/check`, {
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
  // Fallback mock
  return NextResponse.json(
    {
      atsScore: 73,
      readability: 82,
      issues: { missingSections: ['summary'], keywordGaps: ['leadership', 'strategy'], formatWarnings: [] },
      missingKeywords: ['leadership', 'strategy'],
    },
    { status: 200 },
  )
}
