import Link from 'next/link'
import type { Metadata } from 'next'
import { Wrench, FileText, Mail, ArrowRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Press — Gestivio', description: 'Press resources and media kit for Gestivio.' }

export default function PressPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600"><Wrench className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
            <span className="text-base font-bold text-gray-900">Gestivio</span>
          </Link>
        </div>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6">
          <FileText className="h-8 w-8 text-indigo-400" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 mb-2">Media</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Press & Media</h1>
        <p className="text-lg text-gray-500 max-w-md mb-4">For press inquiries, interview requests, or to access our media kit, please reach out directly.</p>
        <div className="flex items-center gap-2 text-gray-500 mb-8">
          <Mail className="h-4 w-4" />
          <a href="mailto:press@gestivio.ca" className="text-indigo-600 hover:underline">press@gestivio.ca</a>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
          Back to homepage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} Gestivio</p>
      </footer>
    </div>
  )
}
