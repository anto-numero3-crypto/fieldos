import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export function signJobToken(jobId: string): string {
  const secret = process.env.CRON_SECRET || 'dev-secret'
  return createHmac('sha256', secret).update(`job:${jobId}`).digest('hex').slice(0, 32)
}

function verifyToken(jobId: string, token: string): boolean {
  const expected = signJobToken(jobId)
  if (token.length !== expected.length) return false
  // Constant-time compare
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}

function htmlResponse(html: string) {
  return new NextResponse(html, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function errorPage(title: string, message: string) {
  return htmlResponse(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:-apple-system,Segoe UI,sans-serif;text-align:center;padding:60px 20px;color:#111827}h1{color:#ef4444}</style>
  </head><body><h1>${title}</h1><p>${message}</p></body></html>`)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.nextUrl.searchParams.get('token') || ''
  if (!token || !verifyToken(id, token)) {
    return errorPage('Lien invalide', 'Ce lien a expiré ou est invalide.')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, status')
    .eq('id', id)
    .maybeSingle()
  if (!job) return errorPage('Introuvable', "Cette intervention n'existe pas.")
  if (job.status === 'invoiced' || job.status === 'cancelled') {
    return errorPage('Non modifiable', `Cette intervention est déjà ${job.status === 'invoiced' ? 'facturée' : 'annulée'}.`)
  }

  const { error } = await supabase.from('jobs').update({ status: 'completed' }).eq('id', id)
  if (error) return errorPage('Erreur', 'Impossible de marquer comme complétée.')

  const title = job.title || 'Intervention'
  return htmlResponse(`<!DOCTYPE html><html lang="fr"><head>
    <meta charset="utf-8"><title>Intervention complétée</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Arial, sans-serif; text-align: center; padding: 60px 20px; color: #111827; background: #f8fafc; margin: 0; min-height: 100vh }
      .check { font-size: 72px; line-height: 1; margin-bottom: 8px }
      h1 { color: #10b981; margin: 0 0 8px; font-size: 28px }
      p { color: #6b7280; margin: 0 0 24px }
      a { background: #4f46e5; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; display: inline-block; margin-top: 12px; font-weight: 600 }
      a.secondary { background: #6b7280 }
      .stack > * { margin: 6px }
    </style>
  </head><body>
    <div class="check">✓</div>
    <h1>Intervention complétée !</h1>
    <p><strong>${title}</strong> a été marquée comme complétée.</p>
    <div class="stack">
      <a href="https://gestivio.ca/invoices/new?jobId=${id}">Créer la facture maintenant</a>
      <br/>
      <a href="https://gestivio.ca/jobs" class="secondary">Retour aux interventions</a>
    </div>
  </body></html>`)
}
