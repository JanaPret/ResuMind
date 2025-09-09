export default function PricingPage() {
  return (
    <main className="grid gap-10">
      <section className="text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
          Start free, upgrade when you need more. Cancel anytime.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="card grid gap-4">
          <div>
            <h2 className="text-xl font-bold">Starter</h2>
            <p className="text-sm text-gray-600">R89 / $5 per month</p>
          </div>
          <ul className="grid gap-2 text-sm text-gray-700">
            <li>• 10 generations / month</li>
            <li>• 3 templates</li>
            <li>• Email support</li>
          </ul>
          <a className="btn mt-2 w-full text-center" href="/auth/register">Get started</a>
        </div>

        <div className="card grid gap-4 highlight-ring relative">
          <span className="badge-highlight absolute -top-3 left-6">Most popular</span>
          <div>
            <h2 className="text-xl font-bold">Pro</h2>
            <p className="text-sm text-gray-600">R199 / $12 per month</p>
          </div>
          <ul className="grid gap-2 text-sm text-gray-700">
            <li>• Unlimited* fair-use</li>
            <li>• All templates</li>
            <li>• Priority support</li>
          </ul>
          <a className="btn-highlight mt-2 w-full text-center" href="/auth/register">Upgrade</a>
        </div>
      </section>
    </main>
  )
}
