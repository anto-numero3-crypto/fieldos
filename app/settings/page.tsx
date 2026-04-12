'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { toast } from 'sonner'
import {
  Building2, Bell, Shield, Globe, Save, CheckCircle, AlertCircle,
  Phone, CreditCard, Wrench, Sparkles, Link as LinkIcon, Copy, Check,
  ExternalLink, Loader2, DollarSign,
} from 'lucide-react'

type Tab = 'business' | 'booking' | 'notifications' | 'security' | 'integrations' | 'billing'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function InputRow({ label, sub, value, onChange, type = 'text', placeholder = '' }: {
  label: string; sub?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-0.5">{label}</label>
      {sub && <p className="text-xs text-gray-400 mb-1.5">{sub}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
      />
    </div>
  )
}

function NotifRow({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function SaveBar({ saved, error, saving, onSave }: { saved: boolean; error: string | null; saving: boolean; onSave: () => void }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      {saved && <div className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle className="h-4 w-4" /> Enregistré !</div>}
      {error && <div className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}
      <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
        <Save className="h-4 w-4" />{saving ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab]       = useState<Tab>('business')
  const [user, setUser]     = useState<{ id: string; email?: string } | null>(null)
  const [orgId, setOrgId]     = useState<string | null>(null)
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Stripe Connect
  const [connectStatus, setConnectStatus] = useState<{
    connected: boolean; accountId?: string; chargesEnabled?: boolean
    payoutsEnabled?: boolean; onboardingComplete?: boolean; email?: string; displayName?: string
  } | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  // Business profile
  const [bizName, setBizName]       = useState('')
  const [bizPhone, setBizPhone]     = useState('')
  const [bizEmail, setBizEmail]     = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [bizCity, setBizCity]       = useState('')
  const [bizState, setBizState]     = useState('')
  const [bizZip, setBizZip]         = useState('')
  const [bizWebsite, setBizWebsite] = useState('')
  const [bizTaxNum, setBizTaxNum]   = useState('')
  const [currency, setCurrency]     = useState('CAD')
  const [timezone, setTimezone]     = useState('America/Toronto')

  // Booking portal / AI agent
  const [agentName, setAgentName]   = useState('Alex')
  const [agentGreeting, setAgentGreeting] = useState('')
  const [agentServices, setAgentServices] = useState('')

  // Notifications
  const [notifJobCreated, setNotifJobCreated]         = useState(true)
  const [notifJobComplete, setNotifJobComplete]       = useState(true)
  const [notifInvoicePaid, setNotifInvoicePaid]       = useState(true)
  const [notifOverdueInvoice, setNotifOverdueInvoice] = useState(true)
  const [notifNewCustomer, setNotifNewCustomer]       = useState(false)
  const [notifEmail, setNotifEmail]                   = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      setBizEmail(data.user.email || '')

      // Load organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_user_id', data.user.id)
        .single()

      loadConnectStatus(data.user.id)

      // Handle Stripe Connect return URL params
      const params = new URLSearchParams(window.location.search)
      if (params.get('tab') === 'billing') setTab('billing')
      if (params.get('connected') === 'true') {
        setTab('billing')
        toast.success('Compte Stripe connecté !')
        loadConnectStatus(data.user.id)
      }

      if (org) {
        setOrgId(org.id)
        if (org.slug) setOrgSlug(org.slug)
        if (org.name)            setBizName(org.name)
        if (org.phone)           setBizPhone(org.phone)
        if (org.email)           setBizEmail(org.email)
        if (org.address)         setBizAddress(org.address)
        if (org.city)            setBizCity(org.city)
        if (org.state)           setBizState(org.state)
        if (org.zip)             setBizZip(org.zip)
        if (org.website)         setBizWebsite(org.website)
        if (org.tax_number)      setBizTaxNum(org.tax_number)
        if (org.currency)        setCurrency(org.currency)
        if (org.timezone)        setTimezone(org.timezone)
        if (org.ai_agent_name)   setAgentName(org.ai_agent_name)
        if (org.ai_agent_greeting) setAgentGreeting(org.ai_agent_greeting)
        if (org.service_types)   setAgentServices(Array.isArray(org.service_types) ? org.service_types.join(', ') : '')
      }
    }
    init()
  }, [])

  const slugify = (s: string) =>
    s.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)

  const saveSettings = async () => {
    if (!user) return
    setSaving(true); setError(null); setSaved(false)

    // Generate slug from business name if not already set
    let nextSlug = orgSlug
    if (!nextSlug && bizName) {
      const base = slugify(bizName) || 'entreprise'
      // Ensure uniqueness
      let candidate = base
      let n = 2
      while (true) {
        const { data: clash } = await supabase
          .from('organizations')
          .select('id')
          .eq('slug', candidate)
          .maybeSingle()
        if (!clash || clash.id === orgId) break
        candidate = `${base}-${n++}`
        if (n > 50) break
      }
      nextSlug = candidate
    }

    const payload: Record<string, unknown> = {
      owner_user_id: user.id,
      name: bizName,
      phone: bizPhone,
      email: bizEmail,
      address: bizAddress,
      city: bizCity,
      state: bizState,
      zip: bizZip,
      website: bizWebsite,
      tax_number: bizTaxNum,
      currency,
      timezone,
      ai_agent_name: agentName,
      ai_agent_greeting: agentGreeting,
      service_types: agentServices ? agentServices.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }
    if (nextSlug) payload.slug = nextSlug

    const { data: saved, error: err } = orgId
      ? await supabase.from('organizations').update(payload).eq('id', orgId).select('id, slug').single()
      : await supabase.from('organizations').insert(payload).select('id, slug').single()

    if (err) {
      toast.error(err.message)
    } else {
      if (saved?.id) setOrgId(saved.id)
      if (saved?.slug) setOrgSlug(saved.slug)
      toast.success('Paramètres sauvegardés !')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const loadConnectStatus = async (uid: string) => {
    const res = await fetch(`/api/stripe/connect/account-status?userId=${uid}`)
    const data = await res.json()
    setConnectStatus(data)
  }

  const handleConnectStripe = async () => {
    if (!user) return
    setConnectLoading(true)
    try {
      // Step 1: Create or retrieve Stripe Connect account
      if (!connectStatus?.accountId) {
        const res = await fetch('/api/stripe/connect/create-account', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
        const data = await res.json()
        if (!res.ok || !data.accountId) {
          toast.error(data.error || 'Impossible de créer le compte Stripe.')
          setConnectLoading(false)
          return
        }
      }
      // Step 2: Get onboarding link
      const res2 = await fetch('/api/stripe/connect/create-onboarding-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data2 = await res2.json()
      if (!res2.ok || !data2.url) {
        toast.error(data2.error || 'Impossible de générer le lien Stripe.')
        setConnectLoading(false)
        return
      }
      // Step 3: Redirect to Stripe onboarding
      window.location.href = data2.url
    } catch (err) {
      console.error('Stripe connect error:', err)
      toast.error('Erreur de connexion Stripe. Vérifiez la console.')
    }
    setConnectLoading(false)
  }

  const handleStripeDashboard = async () => {
    if (!user) return
    setConnectLoading(true)
    const res = await fetch('/api/stripe/connect/dashboard-link', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const data = await res.json()
    if (data.url) window.open(data.url, '_blank')
    setConnectLoading(false)
  }

  const bookingLink = orgSlug
    ? `https://gestivio.ca/book/${orgSlug}`
    : orgId ? `${window.location.origin}/book?biz=${orgId}` : null

  const copyBookingLink = () => {
    if (!bookingLink) return
    navigator.clipboard.writeText(bookingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'business',      label: 'Entreprise',      icon: Building2 },
    { key: 'billing',       label: 'Paiements',       icon: DollarSign },
    { key: 'booking',       label: 'Portail de réservation', icon: Sparkles },
    { key: 'notifications', label: 'Notifications',   icon: Bell },
    { key: 'security',      label: 'Sécurité',        icon: Shield },
    { key: 'integrations',  label: 'Intégrations',    icon: Globe },
  ]

  const INTEGRATIONS = [
    { name: 'Stripe Payments', desc: 'Accept online payments from customers', icon: CreditCard, connected: true },
    { name: 'Resend Email', desc: 'Transactional email for invoices and reminders', icon: Bell, connected: true },
    { name: 'Anthropic Claude', desc: 'AI assistant and booking agent', icon: Sparkles, connected: true },
    { name: 'Google Calendar', desc: 'Two-way sync jobs with Google Calendar', icon: Globe, connected: false },
    { name: 'QuickBooks', desc: 'Export invoices and revenue data', icon: Building2, connected: false },
    { name: 'Twilio SMS', desc: 'Send SMS notifications to customers', icon: Phone, connected: false },
  ]

  return (
    <AppLayout title="Paramètres">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={['flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap', tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Business Profile */}
        {tab === 'business' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Informations de l&apos;entreprise</h2>
              <p className="text-sm text-gray-400 mb-5">Ces informations apparaissent sur vos factures, devis et communications clients.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InputRow label="Nom de l'entreprise" value={bizName} onChange={setBizName} placeholder="HVAC Tremblay inc." />
                </div>
                <InputRow label="Téléphone" value={bizPhone} onChange={setBizPhone} type="tel" placeholder="+1 (514) 000-0000" />
                <InputRow label="Email professionnel" value={bizEmail} onChange={setBizEmail} type="email" placeholder="info@entreprise.com" />
                <div className="sm:col-span-2">
                  <InputRow label="Adresse" value={bizAddress} onChange={setBizAddress} placeholder="123 rue Principale" />
                </div>
                <InputRow label="Ville" value={bizCity} onChange={setBizCity} placeholder="Montréal" />
                <InputRow label="Province / État" value={bizState} onChange={setBizState} placeholder="QC" />
                <InputRow label="Code postal" value={bizZip} onChange={setBizZip} placeholder="H1A 1A1" />
                <InputRow label="Site web" value={bizWebsite} onChange={setBizWebsite} type="url" placeholder="https://votre-entreprise.com" />
                <InputRow label="Numéro de taxe (TPS/TVQ/TVH)" value={bizTaxNum} onChange={setBizTaxNum} placeholder="123456789 RT0001" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuseau horaire</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="America/Toronto">Eastern (Toronto)</option>
                    <option value="America/Vancouver">Pacific (Vancouver)</option>
                    <option value="America/Chicago">Central (Chicago)</option>
                    <option value="America/Denver">Mountain (Denver)</option>
                    <option value="America/New_York">Eastern (New York)</option>
                    <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div>
                <p className="text-sm font-semibold text-gray-900">Compte</p>
                <p className="text-xs text-gray-400 mt-0.5">Connecté en tant que {user?.email}</p>
              </div>
            </div>

            <SaveBar saved={saved} error={error} saving={saving} onSave={saveSettings} />
          </div>
        )}

        {/* Booking Portal */}
        {tab === 'booking' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Agent IA de réservation</h2>
              <p className="text-sm text-gray-400 mb-5">Personnalisez l&apos;agent IA qui accueille vos clients sur votre portail de réservation.</p>

              <div className="space-y-4">
                <InputRow
                  label="Nom de l'agent"
                  sub="C'est le nom que votre agent IA utilise pour se présenter"
                  value={agentName}
                  onChange={setAgentName}
                  placeholder="Alex"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">Message d&apos;accueil personnalisé (optionnel)</label>
                  <p className="text-xs text-gray-400 mb-1.5">Remplace le message par défaut. Laissez vide pour utiliser le message par défaut.</p>
                  <textarea
                    value={agentGreeting}
                    onChange={(e) => setAgentGreeting(e.target.value)}
                    rows={3}
                    placeholder={`Bonjour ! Je suis ${agentName}, votre assistant de réservation. Comment puis-je vous aider ?`}
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">Services offerts (séparés par des virgules)</label>
                  <p className="text-xs text-gray-400 mb-1.5">Indiquez à votre agent IA quels services proposer et discuter</p>
                  <input
                    type="text"
                    value={agentServices}
                    onChange={(e) => setAgentServices(e.target.value)}
                    placeholder="Réparation HVAC, installation CA, entretien chauffage, nettoyage conduits"
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Booking link */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">Lien de votre portail de réservation</p>
              </div>
              <p className="text-xs text-indigo-600 mb-3">Partagez ce lien avec vos clients pour qu&apos;ils puissent réserver via votre agent IA.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-mono text-gray-700 truncate">
                  {bookingLink || 'Sauvegardez le nom de votre entreprise pour générer votre lien'}
                </div>
                <button
                  onClick={copyBookingLink}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>

            <SaveBar saved={saved} error={error} saving={saving} onSave={saveSettings} />
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Préférences de notifications</h2>
              <p className="text-sm text-gray-400 mb-5">Choisissez quels événements déclenchent des notifications dans l&apos;app et par email.</p>

              <div className="rounded-xl bg-gray-50 px-5 py-4 mb-4">
                <NotifRow label="Notifications par email" sub="Recevoir toutes les notifications par email également" checked={notifEmail} onChange={setNotifEmail} />
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">Déclencheurs d&apos;événements</h3>
              <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                <NotifRow label="Nouvelle intervention créée" sub="Quand un nouveau bon de travail est ajouté" checked={notifJobCreated} onChange={setNotifJobCreated} />
                <NotifRow label="Intervention terminée" sub="Quand un technicien marque une intervention comme terminée" checked={notifJobComplete} onChange={setNotifJobComplete} />
                <NotifRow label="Facture payée" sub="Quand un client paie une facture" checked={notifInvoicePaid} onChange={setNotifInvoicePaid} />
                <NotifRow label="Facture en retard" sub="Quand une facture dépasse sa date d'échéance" checked={notifOverdueInvoice} onChange={setNotifOverdueInvoice} />
                <NotifRow label="Nouveau client ajouté" sub="Quand un nouveau client est créé" checked={notifNewCustomer} onChange={setNotifNewCustomer} />
              </div>
            </div>
            <SaveBar saved={saved} error={error} saving={saving} onSave={saveSettings} />
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Sécurité</h2>
              <p className="text-sm text-gray-400 mb-5">Protégez votre compte avec des mesures de sécurité supplémentaires.</p>
              <div className="space-y-3">
                {[
                  { label: 'Authentification à deux facteurs', desc: 'Ajoutez une couche de sécurité supplémentaire à votre compte.', badge: 'Recommandé', btn: 'Activer 2FA' },
                  { label: 'Sessions actives', desc: 'Voir et révoquer les sessions de connexion actives.', badge: null, btn: 'Gérer les sessions' },
                  { label: 'Journal d\'audit', desc: 'Consulter toutes les actions effectuées sur votre compte.', badge: null, btn: 'Voir le journal' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between rounded-xl border border-gray-100 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        {item.badge && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{item.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">{item.btn}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Zone dangereuse</h3>
              <p className="text-xs text-red-600 mb-4">Ces actions sont permanentes et irréversibles.</p>
              <button className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">Supprimer le compte</button>
            </div>
          </div>
        )}

        {/* Billing / Payments */}
        {tab === 'billing' && (
          <div className="space-y-6">
            {/* Stripe Connect section */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Accepter les paiements en ligne</h2>
                <p className="text-sm text-gray-400 mt-0.5">Connectez votre compte Stripe pour que vos clients puissent payer vos factures en ligne.</p>
              </div>

              <div className="p-6">
                {connectStatus === null ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : connectStatus.onboardingComplete ? (
                  // ── State C: Fully active ──────────────────────────────────
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-emerald-900">Paiements actifs</p>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Actif</span>
                        </div>
                        <p className="text-sm text-emerald-700">
                          {connectStatus.displayName || connectStatus.email || 'Votre compte Stripe'} est connecté.
                          Vos clients peuvent maintenant payer vos factures en ligne.
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          <span className={`flex items-center gap-1 ${connectStatus.chargesEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {connectStatus.chargesEnabled ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            Paiements {connectStatus.chargesEnabled ? 'activés' : 'en attente'}
                          </span>
                          <span className={`flex items-center gap-1 ${connectStatus.payoutsEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {connectStatus.payoutsEnabled ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                            Virements {connectStatus.payoutsEnabled ? 'activés' : 'en attente'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleStripeDashboard}
                        disabled={connectLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-60"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Ouvrir le tableau de bord Stripe
                      </button>
                    </div>
                  </div>
                ) : connectStatus.connected ? (
                  // ── State B: Connected but onboarding incomplete ───────────
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">Configuration incomplète</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                          Votre compte Stripe est créé mais vous devez compléter la configuration pour commencer à accepter des paiements.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleConnectStripe}
                      disabled={connectLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition-all shadow-sm"
                    >
                      {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                      Compléter la configuration
                    </button>
                  </div>
                ) : (
                  // ── State A: Not connected ─────────────────────────────────
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 mb-2">Payez-vous plus vite</h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Connectez Stripe pour que vos clients paient directement depuis leurs factures — par carte ou virement.
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600">
                          {[
                            'Les clients paient en ligne — fini les relances',
                            'Les fonds sont déposés directement dans votre compte',
                            'Visa, Mastercard, Amex, Interac acceptés',
                            'Reçus automatiques envoyés aux clients',
                            'Notifications de paiement en temps réel',
                          ].map((b) => (
                            <li key={b} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              {b}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-4 text-xs text-gray-400">Frais de traitement : 2,9 % + 30 ¢ par transaction (tarifs Stripe standard)</p>
                      </div>
                      <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-200">
                          <CreditCard className="h-8 w-8 text-white" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Prend moins de 5 minutes</p>
                        <button
                          onClick={handleConnectStripe}
                          disabled={connectLoading}
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-md shadow-indigo-200"
                        >
                          {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                          Connecter Stripe
                        </button>
                        <p className="mt-3 text-xs text-gray-400">Propulsé par Stripe · Paiements sécurisés</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Integrations */}
        {tab === 'integrations' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Services connectés</h2>
              <p className="text-sm text-gray-400 mb-5">Gérez les intégrations avec des outils tiers.</p>
              <div className="space-y-3">
                {INTEGRATIONS.map((intg) => (
                  <div key={intg.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${intg.connected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <intg.icon className={`h-5 w-5 ${intg.connected ? 'text-emerald-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                          {intg.connected && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle className="h-3 w-3" /> Connecté
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{intg.desc}</p>
                      </div>
                    </div>
                    {!intg.connected && (
                      <button className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">Connecter</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-sm font-semibold text-indigo-700 mb-1 flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Webhooks & Automation
              </p>
              <p className="text-xs text-indigo-600 mb-3">Connectez Gestivio à plus de 5 000 applications via Zapier, ou créez des automatisations personnalisées avec des webhooks.</p>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">Configurer les webhooks</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
