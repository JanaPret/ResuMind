"use client"

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  masterText: z.string().min(20, 'Please paste at least 20 characters'),
  jobText: z.string().min(20, 'Please paste at least 20 characters'),
  tone: z.enum(['professional', 'confident', 'friendly']).default('professional'),
})

type FormValues = z.infer<typeof FormSchema>

type TailorResponse = {
  generationId: string
  matchScore: number
  keywords: string[]
  missingKeywords?: string[]
  suggestedKeywords?: string[]
  tailoredCv: {
    summary: string
    skills: string[]
    experience: { bullets: { text: string; source_id?: string }[]; company?: string; title?: string }[]
    education: { school: string; degree?: string; year?: string }[]
    projects: { name: string; description: string }[]
  }
  coverLetter: string
}

export default function HomePage() {
  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { tone: 'professional' },
    mode: 'onChange',
  })
  const [result, setResult] = useState<TailorResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    setError(null)
    try {
  const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterText: values.masterText, jobText: values.jobText, tone: values.tone }),
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = (await res.json()) as TailorResponse
      setResult(data)
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = useMemo(() => {
    const s = result?.matchScore ?? 0
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }, [result?.matchScore])

  return (
    <main className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Master résumé (paste text)</span>
          <textarea className="h-32 resize-y rounded border p-2" placeholder="Paste your résumé text" {...register('masterText', { required: true })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Job description</span>
          <textarea className="h-32 resize-y rounded border p-2" placeholder="Paste the job ad" {...register('jobText', { required: true })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Tone</span>
          <select className="rounded border p-2" {...register('tone')}>
            <option value="professional">Professional</option>
            <option value="confident">Confident</option>
            <option value="friendly">Friendly</option>
          </select>
        </label>
        <div className="flex items-center gap-3">
          <button disabled={loading || !formState.isValid} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50" type="submit">
            {loading ? 'Generating…' : 'Generate'}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      {result && (
        <section className="grid gap-4 rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 rounded bg-gray-200">
                <div className={`h-2 rounded ${scoreColor}`} style={{ width: `${result.matchScore}%` }} />
              </div>
              <span className="text-sm">{result.matchScore}%</span>
            </div>
          </div>
          <div className="grid gap-1">
            <span className="text-sm font-medium">Keywords</span>
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((k) => (
                <span key={k} className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                  {k}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <h3 className="font-medium">Résumé</h3>
            <p className="text-sm text-gray-700">{result.tailoredCv.summary}</p>
            <ul className="list-disc pl-6 text-sm text-gray-800">
              {result.tailoredCv.experience.flatMap((e) => e.bullets).map((b, i) => (
                <li key={i}>{b.text}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-2">
            <h3 className="font-medium">Cover Letter</h3>
            <pre className="whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm text-gray-800">{result.coverLetter}</pre>
          </div>
        </section>
      )}
    </main>
  )
}
