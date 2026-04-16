'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../supabase'
import AppLayout from '@/components/AppLayout'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import EmptyState from '@/components/EmptyState'
import { Megaphone } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import {
  Send, Users, Mail, Clock, ChevronDown, Sparkles, CheckCircle,
  AlertCircle, Loader2, Plus, X, Calendar, Tag, MessageSquare,
} from 'lucide-react'

interface Customer { id: string; name: string; email?: string; created_at: string }
interface Job { id: string; status: string; created_at: string; customers: { name: string } | null }
interface Invoice { id: string; status: string; customers: { name: string } | null }

type AudienceType = 'inactive_30' | 'inactive_60' | 'inactive_90' | 'unpaid_invoices' | 'all'

interface Campaign {
  id: string; name: string; subject: string; body: string
  audience: AudienceType; recipientCount: number; sentAt: string; status: string
}

function getTemplates(fr: boolean) {
  return fr ? [
    {
      name: 'Vous nous manquez',
      subject: "Nous aimerions avoir de vos nouvelles, {customer_name} !",
      body: "Bonjour {customer_name},\n\nCela fait un moment que nous n'avons pas eu l'occasion de travailler avec vous, et nous tenions à vous contacter personnellement.\n\nChez {business_name}, nous apprécions vraiment votre confiance et aimerions planifier votre prochain rendez-vous.\n\nEn tant que client de retour, nous aimerions vous offrir un rabais spécial. Répondez à ce courriel ou utilisez le lien ci-dessous pour réserver :\n{booking_link}\n\nAu plaisir de vous lire !\n\nCordialement,\n{business_name}",
      audience: 'inactive_60' as AudienceType,
    },
    {
      name: 'Rappel de service saisonnier',
      subject: "C'est le temps de votre service saisonnier, {customer_name}",
      body: "Bonjour {customer_name},\n\nLa saison change, c'est un bon moment pour vous assurer que tout fonctionne bien.\n\nNous vous recommandons de planifier votre rendez-vous saisonnier bientôt — les places se remplissent rapidement à cette période.\n\nRéservez dès maintenant : {booking_link}\n\nCordialement,\n{business_name}",
      audience: 'inactive_30' as AudienceType,
    },
    {
      name: 'Offre client fidèle',
      subject: "Un merci spécial pour vous, {customer_name} 🎁",
      body: "Bonjour {customer_name},\n\nNous tenons à vous remercier chaleureusement pour votre confiance continue envers {business_name}.\n\nEn tant que client apprécié, nous vous offrons un rabais exclusif sur votre prochain service. Mentionnez simplement ce courriel lors de la réservation.\n\n{booking_link}\n\nAvec gratitude,\n{business_name}",
      audience: 'all' as AudienceType,
    },
    {
      name: 'Relance facture impayée',
      subject: 'Rappel de facture — action requise',
      body: "Bonjour {customer_name},\n\nCeci est un rappel amical que vous avez une facture en attente avec {business_name}.\n\nSi vous avez des questions à propos de la facture ou besoin de discuter d'options de paiement, n'hésitez pas à nous contacter. Nous sommes là pour aider.\n\nVous pouvez aussi consulter et payer votre facture en ligne. Répondez simplement à ce courriel et nous vous enverrons le lien.\n\nMerci pour votre confiance.\n\n{business_name}",
      audience: 'unpaid_invoices' as AudienceType,
    },
    {
      name: 'Merci après intervention',
      subject: "Merci d'avoir choisi {business_name} !",
      body: "Bonjour {customer_name},\n\nMerci d'avoir choisi {business_name} pour votre service récent. Nous espérons que tout a été réalisé à votre entière satisfaction.\n\nVotre avis compte pour nous. Si vous avez un moment, nous aimerions connaître votre expérience — et si vous êtes satisfait, un avis serait grandement apprécié !\n\nAu plaisir de vous servir à nouveau bientôt.\n\n{business_name}",
      audience: 'all' as AudienceType,
    },
  ] : [
    {
      name: "We miss you",
      subject: "We'd love to hear from you, {customer_name}!",
      body: "Hi {customer_name},\n\nIt's been a while since we've had the chance to work with you, and we wanted to reach out personally.\n\nAt {business_name}, we truly value your trust and would love to schedule your next service appointment.\n\nAs a returning customer, we'd like to offer you a special discount. Reply to this email or use the link below to book:\n{booking_link}\n\nLooking forward to hearing from you!\n\nBest regards,\n{business_name}",
      audience: 'inactive_60' as AudienceType,
    },
    {
      name: "Seasonal service reminder",
      subject: "Time for your seasonal service, {customer_name}",
      body: "Hi {customer_name},\n\nThe season is changing, which means it's a great time to make sure everything is running smoothly.\n\nWe recommend scheduling your seasonal service appointment soon — spots fill up quickly this time of year.\n\nBook now at: {booking_link}\n\nBest,\n{business_name}",
      audience: 'inactive_30' as AudienceType,
    },
    {
      name: "Loyal customer offer",
      subject: "A special thank-you for you, {customer_name} 🎁",
      body: "Hi {customer_name},\n\nWe want to say a heartfelt thank you for your continued trust in {business_name}.\n\nAs one of our valued customers, we're offering you an exclusive discount on your next service. Simply mention this email when you book.\n\n{booking_link}\n\nWith gratitude,\n{business_name}",
      audience: 'all' as AudienceType,
    },
    {
      name: "Unpaid invoice follow-up",
      subject: "Invoice reminder — action required",
      body: "Hi {customer_name},\n\nThis is a friendly reminder that you have an outstanding invoice with {business_name}.\n\nIf you have any questions about the invoice or need to discuss payment options, please don't hesitate to reach out. We're here to help.\n\nYou can also view and pay your invoice online. Simply reply to this email and we'll send you the link.\n\nThank you for your continued business.\n\n{business_name}",
      audience: 'unpaid_invoices' as AudienceType,
    },
    {
      name: "Post-job thank you",
      subject: "Thank you for choosing {business_name}!",
      body: "Hi {customer_name},\n\nThank you for choosing {business_name} for your recent service. We hope everything was completed to your satisfaction.\n\nYour feedback matters to us. If you have a moment, we'd love to hear about your experience — and if you're happy with the service, a review would mean the world to us!\n\nWe look forward to serving you again soon.\n\n{business_name}",
      audience: 'all' as AudienceType,
    },
  ]
}

function getAudienceLabels(fr: boolean): Record<AudienceType, string> {
  return fr ? {
    inactive_30: 'Inactifs 30+ jours',
    inactive_60: 'Inactifs 60+ jours',
    inactive_90: 'Inactifs 90+ jours',
    unpaid_invoices: 'Clients avec factures impayées',
    all: 'Tous les clients',
  } : {
    inactive_30: 'Inactive 30+ days',
    inactive_60: 'Inactive 60+ days',
    inactive_90: 'Inactive 90+ days',
    unpaid_invoices: 'Customers with unpaid invoices',
    all: 'All customers',
  }
}

function CampaignsPageInner() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const TEMPLATES = getTemplates(fr)
  const AUDIENCE_LABELS = getAudienceLabels(fr)
  const fmt = (d: string) => fmtDate(d, lang)
  const [tab, setTab]             = useState<'create' | 'history'>('create')
  const [loading, setLoading]     = useState(true)
  const [sending, setSending]     = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')
  const [businessName, setBusinessName] = useState(fr ? 'Votre entreprise' : 'Your Business')

  // Data
  const [customers, setCustomers] = useState<Customer[]>([])
  const [jobs, setJobs]           = useState<Job[]>([])
  const [invoices, setInvoices]   = useState<Invoice[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  // Form state
  const [campaignName, setCampaignName] = useState('')
  const [audience, setAudience]   = useState<AudienceType>('inactive_60')
  const [subject, setSubject]     = useState('')
  const [body, setBody]           = useState('')
  const [generating, setGenerating] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) { window.location.href = '/login'; return }
      const uid = auth.user.id

      const [
        { data: c },
        { data: j },
        { data: inv },
        { data: org },
      ] = await Promise.all([
        supabase.from('customers').select('id, name, email, created_at').eq('user_id', uid).order('name'),
        supabase.from('jobs').select('id, status, created_at, customers(name)').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
        supabase.from('invoices').select('id, status, customers(name)').eq('user_id', uid),
        supabase.from('organizations').select('name').eq('owner_user_id', uid).maybeSingle(),
      ])

      setCustomers((c || []) as unknown as Customer[])
      setJobs((j || []) as unknown as Job[])
      setInvoices((inv || []) as unknown as Invoice[])
      if (org?.name) setBusinessName(org.name)

      // Mock past campaigns from localStorage for demo
      const stored = localStorage.getItem('gestivio_campaigns')
      if (stored) setCampaigns(JSON.parse(stored))

      setLoading(false)
    }
    init()
  }, [])

  const getRecipients = useCallback((aud: AudienceType): Customer[] => {
    const now = Date.now()
    if (aud === 'all') return customers

    if (aud === 'unpaid_invoices') {
      const unpaidCustomerNames = new Set(
        invoices.filter((i) => i.status !== 'paid').map((i) => (i.customers as unknown as { name: string } | null)?.name)
      )
      return customers.filter((c) => unpaidCustomerNames.has(c.name))
    }

    const days = aud === 'inactive_30' ? 30 : aud === 'inactive_60' ? 60 : 90
    const cutoff = now - days * 86400000
    const activeNames = new Set(
      jobs
        .filter((j) => new Date(j.created_at).getTime() >= cutoff)
        .map((j) => (j.customers as unknown as { name: string } | null)?.name)
    )
    return customers.filter((c) => !activeNames.has(c.name))
  }, [customers, jobs, invoices])

  const recipients = getRecipients(audience)

  const applyTemplate = (t: typeof TEMPLATES[number]) => {
    setCampaignName(t.name)
    setSubject(t.subject)
    setBody(t.body)
    setAudience(t.audience)
  }

  const generateAI = async () => {
    setGenerating(true)
    try {
      const prompt = `Write a professional re-engagement email for a field service business called "${businessName}".
Audience: ${AUDIENCE_LABELS[audience]}.
Campaign name: ${campaignName || 'Re-engagement'}.
Use these variables: {customer_name}, {business_name}, {booking_link}.
Write only the subject line and email body, separated by a blank line.
Subject line first, then body. Keep it warm, professional, and concise.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'campaign_builder',
        }),
      })
      const data = await res.json()
      if (data.content) {
        const lines = data.content.split('\n').filter((l: string) => l.trim())
        const subjLine = lines[0].replace(/^(Subject:|subject:)\s*/i, '')
        const bodyText = lines.slice(1).join('\n').trim()
        setSubject(subjLine)
        setBody(bodyText)
      }
    } finally {
      setGenerating(false)
    }
  }

  const sendCampaign = async () => {
    if (!subject.trim() || !body.trim() || recipients.length === 0) return
    setSending(true)
    setError('')
    try {
      let sent = 0
      for (const customer of recipients) {
        if (!customer.email) continue
        const personalizedSubject = subject.replace(/\{customer_name\}/g, customer.name).replace(/\{business_name\}/g, businessName)
        const personalizedBody = body
          .replace(/\{customer_name\}/g, customer.name)
          .replace(/\{business_name\}/g, businessName)
          .replace(/\{booking_link\}/g, `${window.location.origin}/book`)

        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: customer.email,
            subject: personalizedSubject,
            body: personalizedBody,
          }),
        })
        sent++
      }

      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: campaignName || (fr ? 'Campagne sans titre' : 'Untitled Campaign'),
        subject, body, audience,
        recipientCount: sent,
        sentAt: new Date().toISOString(),
        status: 'sent',
      }

      const updated = [newCampaign, ...campaigns]
      setCampaigns(updated)
      localStorage.setItem('gestivio_campaigns', JSON.stringify(updated))

      setSuccess(fr
        ? `Campagne envoyée à ${sent} client${sent !== 1 ? 's' : ''} avec succès !`
        : `Campaign sent to ${sent} customer${sent !== 1 ? 's' : ''} successfully!`)
      setSubject(''); setBody(''); setCampaignName('')
      setTimeout(() => setSuccess(''), 5000)
    } catch {
      setError(fr ? "Échec de l'envoi de la campagne. Veuillez réessayer." : 'Failed to send campaign. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const previewBody = body
    .replace(/\{customer_name\}/g, 'Jane Smith')
    .replace(/\{business_name\}/g, businessName)
    .replace(/\{booking_link\}/g, `${typeof window !== 'undefined' ? window.location.origin : 'https://gestivio.ca'}/book`)
    .replace(/\{last_service\}/g, 'HVAC Maintenance')

  if (loading) return (
    <AppLayout title={fr ? 'Campagnes' : 'Campaigns'}>
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <div className="h-12 skeleton rounded-2xl w-80" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </AppLayout>
  )

  const tabOptions: ['create' | 'history', string][] = fr
    ? [['create', 'Créer une campagne'], ['history', 'Campagnes envoyées']]
    : [['create', 'Create Campaign'], ['history', 'Sent Campaigns']]

  return (
    <AppLayout title={fr ? 'Campagnes' : 'Campaigns'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabOptions.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
              {key === 'history' && campaigns.length > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{campaigns.length}</span>
              )}
            </button>
          ))}
        </div>

        {success && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button onClick={() => setError('')} className="ml-auto"><X className="h-4 w-4 text-red-400" /></button>
          </div>
        )}

        {tab === 'create' && (
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Left: builder */}
            <div className="lg:col-span-3 space-y-5">

              {/* Templates */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-400" /> {fr ? 'Modèles' : 'Templates'}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  {TEMPLATES.map((t) => (
                    <button key={t.name} onClick={() => applyTemplate(t)}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-left hover:border-indigo-200 hover:bg-indigo-50 transition-all group">
                      <div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{t.name}</p>
                        <p className="text-xs text-gray-400">{AUDIENCE_LABELS[t.audience]}</p>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400 -rotate-90 group-hover:text-indigo-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" /> {fr ? 'Composer' : 'Compose'}
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{fr ? 'Nom de la campagne' : 'Campaign name'}</label>
                  <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                    placeholder={fr ? 'ex. Réengagement estival' : 'e.g. Summer re-engagement'}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{fr ? 'Audience' : 'Audience'}</label>
                  <div className="relative">
                    <select value={audience} onChange={(e) => setAudience(e.target.value as AudienceType)}
                      className="w-full appearance-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none bg-white pr-8">
                      {(Object.entries(AUDIENCE_LABELS) as [AudienceType, string][]).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-xs text-indigo-600 font-medium">
                      {fr
                        ? `${recipients.length} client${recipients.length !== 1 ? 's' : ''} recevront ceci`
                        : `${recipients.length} customer${recipients.length !== 1 ? 's' : ''} will receive this`}
                    </span>
                    {recipients.filter((c) => !c.email).length > 0 && (
                      <span className="text-xs text-amber-600">· {recipients.filter((c) => !c.email).length} {fr ? 'sans courriel' : 'without email'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{fr ? 'Ligne d\'objet' : 'Subject line'}</label>
                  <input value={subject} onChange={(e) => setSubject(e.target.value)}
                    placeholder={fr ? "ex. Nous aimerions avoir de vos nouvelles, {customer_name} !" : "e.g. We'd love to hear from you, {customer_name}!"}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600">{fr ? 'Corps du message' : 'Message body'}</label>
                    <button onClick={generateAI} disabled={generating}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 px-2.5 py-1 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                      {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      {generating ? (fr ? 'Génération…' : 'Generating…') : (fr ? "Rédiger avec l'IA" : 'Write with AI')}
                    </button>
                  </div>
                  <textarea value={body} onChange={(e) => setBody(e.target.value)}
                    rows={8}
                    placeholder={fr
                      ? "Rédigez votre message ici, ou utilisez un modèle ci-dessus. Utilisez {customer_name}, {business_name}, {booking_link} comme variables."
                      : "Write your message here, or use a template above. Use {customer_name}, {business_name}, {booking_link} as variables."}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />
                  <p className="mt-1 text-xs text-gray-400">{fr ? 'Variables' : 'Variables'}: <code className="bg-gray-100 px-1 rounded">{'{customer_name}'}</code> <code className="bg-gray-100 px-1 rounded">{'{business_name}'}</code> <code className="bg-gray-100 px-1 rounded">{'{booking_link}'}</code></p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <Calendar className="inline h-3.5 w-3.5 mr-1" />{fr ? 'Planifier (facultatif)' : 'Schedule (optional)'}
                  </label>
                  <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none" />
                  <p className="mt-1 text-xs text-gray-400">{fr ? 'Laisser vide pour envoyer immédiatement' : 'Leave blank to send immediately'}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={sendCampaign}
                    disabled={sending || !subject.trim() || !body.trim() || recipients.filter((c) => c.email).length === 0}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending
                      ? (fr ? 'Envoi…' : 'Sending…')
                      : scheduleDate
                        ? (fr ? 'Planifier la campagne' : 'Schedule Campaign')
                        : (fr ? `Envoyer à ${recipients.filter((c) => c.email).length} clients` : `Send to ${recipients.filter((c) => c.email).length} customers`)}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: preview */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 sticky top-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">{fr ? 'Aperçu' : 'Preview'}</h3>
                {subject || body ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-xs text-gray-400 mb-0.5">{fr ? 'À' : 'To'}: Jane Smith &lt;jane@example.com&gt;</p>
                      <p className="text-xs text-gray-400 mb-0.5">{fr ? 'De' : 'From'}: {businessName}</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {subject.replace(/\{customer_name\}/g, 'Jane Smith').replace(/\{business_name\}/g, businessName) || (fr ? '(Pas d\'objet)' : '(No subject)')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{previewBody || (fr ? '(Pas de contenu)' : '(No body)')}</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <Mail className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{fr ? 'Sélectionnez un modèle ou rédigez votre message pour voir un aperçu' : 'Select a template or write your message to see a preview'}</p>
                  </div>
                )}
              </div>

              {/* Audience breakdown */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{fr ? 'Audience' : 'Audience'}: {AUDIENCE_LABELS[audience]}</h3>
                {recipients.length === 0 ? (
                  <p className="text-sm text-gray-400">{fr ? 'Aucun client ne correspond à ce filtre.' : 'No customers match this filter.'}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recipients.slice(0, 10).map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 truncate">{c.email || (fr ? 'Aucun courriel' : 'No email')}</p>
                        </div>
                        {!c.email && <span className="text-xs text-amber-600 shrink-0">{fr ? 'Aucun courriel' : 'No email'}</span>}
                      </div>
                    ))}
                    {recipients.length > 10 && (
                      <p className="text-xs text-gray-400 text-center pt-1">+{recipients.length - 10} {fr ? 'de plus' : 'more'}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            {campaigns.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title={fr ? 'Aucune campagne' : 'No campaigns'}
                description={fr ? 'Créez votre première campagne de réengagement pour la voir ici.' : 'Create your first re-engagement campaign to see it here.'}
                actions={[{ label: fr ? 'Créer une campagne' : 'Create a campaign', onClick: () => setTab('create'), variant: 'primary' }]}
              />
            ) : (
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {(fr ? ['Campagne', 'Audience', 'Destinataires', 'Envoyée', 'Statut'] : ['Campaign', 'Audience', 'Recipients', 'Sent', 'Status']).map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{c.subject}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600">{AUDIENCE_LABELS[c.audience]}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-900">{c.recipientCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-600">{fmt(c.sentAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> {fr ? 'Envoyée' : 'Sent'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function CampaignsGate() {
  const plan = usePlan()
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  if (!plan.loading && !plan.isFeatureAvailable('hasCampaigns')) {
    return (
      <AppLayout title={fr ? 'Campagnes' : 'Campaigns'}>
        <div className="p-6 sm:p-10">
          <UpgradePrompt
            variant="overlay"
            feature={fr ? 'Campagnes de réengagement' : 'Re-engagement campaigns'}
            requiredPlan="pro"
            description={fr
              ? 'Relancez automatiquement vos clients inactifs par courriel — avec le forfait Pro.'
              : 'Automatically re-engage inactive customers by email — with the Pro plan.'}
          />
        </div>
      </AppLayout>
    )
  }
  return <CampaignsPageInner />
}

export default function CampaignsPage() {
  return <CampaignsGate />
}
