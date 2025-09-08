"use client"

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Wand2 } from 'lucide-react'

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
  // ATS state
  const [atsInput, setAtsInput] = useState('')
  const [jobInput, setJobInput] = useState('')
  const [ats, setAts] = useState<{ atsScore: number; readability: number; issues: { missingSections: string[]; keywordGaps: string[] } } | null>(null)
  const [atsLoading, setAtsLoading] = useState(false)

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

  const runATS = async () => {
    setAtsLoading(true)
    try {
      const res = await fetch('/api/ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: atsInput, jobText: jobInput }),
      })
      const data = await res.json()
      setAts(data)
    } finally {
      setAtsLoading(false)
    }
  }

  return (
    <main className="grid gap-8">
      <section className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl"
        >
          Make your next application <span className="gradient-text">unforgettable</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base"
        >
          Paste your résumé and the job ad. We tailor both the résumé and cover letter with relevant keywords and a clear match score.
        </motion.p>
      </section>

      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card grid gap-4"
      >
        <label className="grid gap-2">
          <span className="text-sm font-medium">Master résumé (paste text)</span>
          <textarea className="h-40 resize-y rounded-xl border border-gray-200 bg-white/70 p-3 outline-none focus:ring-2 focus:ring-blue-500/40" placeholder="Paste your résumé text" {...register('masterText', { required: true })} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Job description</span>
          <textarea className="h-40 resize-y rounded-xl border border-gray-200 bg-white/70 p-3 outline-none focus:ring-2 focus:ring-pink-500/40" placeholder="Paste the job ad" {...register('jobText', { required: true })} />
        </label>
        <div className="grid gap-2 sm:flex sm:items-center sm:gap-4">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Tone</span>
            <select className="rounded-xl border border-gray-200 bg-white/70 p-2 outline-none focus:ring-2 focus:ring-emerald-500/40" {...register('tone')}>
              <option value="professional">Professional</option>
              <option value="confident">Confident</option>
              <option value="friendly">Friendly</option>
            </select>
          </label>
          <div className="flex items-end gap-3 sm:ml-auto">
            <button disabled={loading || !formState.isValid} className="btn disabled:opacity-50" type="submit">
              <Wand2 className="h-4 w-4" />
              {loading ? 'Generating…' : 'Generate'}
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>
      </motion.form>

      {result && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="card grid gap-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title">Match Score</h2>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 rounded bg-gray-200">
                  <div className={`h-2 rounded ${scoreColor}`} style={{ width: `${result.matchScore}%` }} />
                </div>
                <span className="text-sm font-medium">{result.matchScore}%</span>
              </div>
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-medium">Keywords</span>
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-gradient-to-br from-blue-50 to-emerald-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-blue-100">
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
          </div>
          <div className="card grid gap-3">
            <h3 className="card-title">Cover Letter</h3>
            <pre className="whitespace-pre-wrap rounded-xl bg-white/60 p-4 text-sm text-gray-800 ring-1 ring-inset ring-gray-100">{result.coverLetter}</pre>
          </div>
        </motion.section>
      )}

      {/* ATS Checker */}
      <section className="card grid gap-4">
        <h2 className="card-title">ATS Resume Checker</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Resume text</span>
            <textarea className="h-40 resize-y rounded-xl border border-gray-200 bg-white/70 p-3 outline-none focus:ring-2 focus:ring-blue-500/40" placeholder="Paste your current resume text" value={atsInput} onChange={(e) => setAtsInput(e.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Optional job description</span>
            <textarea className="h-40 resize-y rounded-xl border border-gray-200 bg-white/70 p-3 outline-none focus:ring-2 focus:ring-pink-500/40" placeholder="Paste the target job description (optional)" value={jobInput} onChange={(e) => setJobInput(e.target.value)} />
          </label>
        </div>
        <div>
          <button className="btn" type="button" onClick={runATS} disabled={atsLoading || atsInput.trim().length < 20}>
            {atsLoading ? 'Checking…' : 'Run ATS Check'}
          </button>
        </div>
        {ats && (
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-32 rounded bg-gray-200">
                <div className="h-2 rounded bg-indigo-500" style={{ width: `${ats.atsScore}%` }} />
              </div>
              <span className="text-sm">ATS Score: {ats.atsScore}% • Readability: {ats.readability}%</span>
            </div>
            {ats.issues?.missingSections?.length > 0 && (
              <div>
                <div className="text-sm font-medium">Missing sections</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {ats.issues.missingSections.map((s: string) => (
                    <span key={s} className="rounded-full bg-yellow-50 px-2 py-1 text-xs text-yellow-900 ring-1 ring-yellow-200">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {ats.issues?.keywordGaps?.length > 0 && (
              <div>
                <div className="text-sm font-medium">Missing keywords</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {ats.issues.keywordGaps.slice(0, 12).map((k: string) => (
                    <span key={k} className="rounded-full bg-rose-50 px-2 py-1 text-xs text-rose-900 ring-1 ring-rose-200">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  )
}
