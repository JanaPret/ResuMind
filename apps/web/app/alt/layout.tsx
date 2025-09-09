import type { ReactNode } from 'react'

export default function AltLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ color: 'hsl(var(--foreground))' }}>
        <div className="min-h-screen flex flex-col">
          {/* Top brand bar */}
          <header
            className="shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #23344b 0%, #576476 100%)',
              color: 'white',
              borderBottom: '1px solid hsl(var(--accent) / 0.2)'
            }}
          >
    <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6 gap-8 h-[260px]">
              <a href="/" aria-label="Go to homepage" className="flex items-center">
                <img
                  src="/Resumind_JustTexrt_logo.svg"
                  alt="ResuMind logo"
      width={1200}
      height={400}
      className="block h-52 w-auto md:h-56 lg:h-60 xl:h-64 transition-all"
      style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.34))', objectFit: 'contain' }}
                />
              </a>
              <nav className="flex items-center gap-6 text-base">
                <a className="text-white/80 hover:text-white" href="/pricing">Pricing</a>
                <a className="text-white/80 hover:text-white" href="/auth/login">Login</a>
                <a
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-semibold shadow-lg transition"
                  style={{ backgroundColor: 'white', color: '#23344b' }}
                >
                  Get started
                </a>
              </nav>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <div className="mx-auto w-full max-w-5xl px-6 py-8">
              {children}
            </div>
          </main>

          <footer className="px-6 py-8 text-center text-xs text-gray-500">© {new Date().getFullYear()} Resumind</footer>
        </div>
      </body>
    </html>
  )
}
