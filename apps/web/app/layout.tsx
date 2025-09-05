import './globals.css'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-gray-900 antialiased">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 via-pink-500 to-emerald-500 shadow-lg" />
              <div>
                <div className="text-2xl font-extrabold gradient-text tracking-tight">Resumind</div>
                <div className="text-xs text-gray-500">Tailor your résumé and cover letter in seconds</div>
              </div>
            </div>
            <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
              <a className="hover:text-gray-900" href="#features">Features</a>
              <a className="hover:text-gray-900" href="#pricing">Pricing</a>
              <a className="btn" href="#get-started">Get started</a>
            </nav>
          </header>
          {children}
          <footer className="mt-16 text-center text-xs text-gray-500">© {new Date().getFullYear()} Resumind</footer>
        </div>
      </body>
    </html>
  )
}
