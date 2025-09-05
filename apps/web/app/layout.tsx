import './globals.css'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-5xl p-6">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Resumind</h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
