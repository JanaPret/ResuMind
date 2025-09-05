"use client"

import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Placeholder: wire to NextAuth later
      await new Promise((r) => setTimeout(r, 500))
      window.location.href = "/"
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid gap-8">
      <section className="text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">Welcome back</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">Log in to continue tailoring.
        </p>
      </section>
      <form onSubmit={onSubmit} className="card grid gap-4 max-w-md mx-auto">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Email</span>
          <input className="rounded-xl border border-gray-200 bg-white/70 p-2" type="email" name="email" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input className="rounded-xl border border-gray-200 bg-white/70 p-2" type="password" name="password" required />
        </label>
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-center text-sm text-gray-600">New to Resumind? <a className="underline" href="/auth/register">Create an account</a></p>
      </form>
    </main>
  )
}
