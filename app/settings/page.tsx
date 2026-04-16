'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { formatPrice } from '@/lib/pricing'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { usePlan } from '@/lib/hooks/usePlan'
import { PLAN_PRICING } from '@/lib/plan-limits'
import PromoCodeInput from '@/components/PromoCodeInput'
import { validateEmail, validatePhone } from '@/lib/validators'
import { useConfirm } from '@/components/ui/confirm-dialog'
import AppLayout from '@/components/AppLayout'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtDate } from '@/lib/format'
import {
  Building2, Bell, Shield, Globe, Save, CheckCircle, AlertCircle,
  CreditCard, Wrench, Sparkles, Link as LinkIcon, Copy, Check,
  ExternalLink, Loader2, DollarSign, Plus, Trash2, Clock,
} from 'lucide-react'

type Tab = 'business' | 'services' | 'booking' | 'notifications' | 'account' | 'integrations' | 'billing'

interface Service {
  id: string
  user_id: string
  name: string
  description: string | null
  category: string | null
  base_price: number
  price_max: number | null
  pricing_type: 'fixed' | 'starting_from' | 'quote_required' | 'free' | 'hourly' | 'custom_range'
  pricing_note: string | null
  unit: string | null
  duration_minutes: number
  buffer_minutes: number | null
  is_active: boolean
}

const SERVICE_CATEGORIES = [
  'Nettoyage', 'Plomberie', 'CVC / HVAC', 'Électricité',
  'Aménagement paysager', 'Peinture', 'Rénovation', 'Autre',
]

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

function SaveBar({ saved, error, saving, onSave, fr }: { saved: boolean; error: string | null; saving: boolean; onSave: () => void; fr: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 pt-2">
      {saved && <div className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle className="h-4 w-4" /> {fr ? 'Enregistré !' : 'Saved!'}</div>}
      {error && <div className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}
      <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
        <Save className="h-4 w-4" />{saving ? (fr ? 'Enregistrement...' : 'Saving...') : (fr ? 'Enregistrer' : 'Save')}
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const plan = usePlan()
  const confirm = useConfirm()
  const router = useRouter()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const [deletingAccount, setDeletingAccount] = useState(false)

  const handleDeleteAccount = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer définitivement votre compte ?' : 'Permanently delete your account?',
      description: fr
        ? 'Cette action supprimera tous vos clients, contrats, factures, soumissions, services, membres d\'équipe et paramètres. Elle est irréversible.'
        : 'This will delete all your customers, jobs, invoices, quotes, services, team members, and settings. This action cannot be undone.',
      confirmLabel: fr ? 'Continuer' : 'Continue',
    })
    if (!confirmed) return

    const typed = window.prompt(
      fr
        ? 'Tapez SUPPRIMER en majuscules pour confirmer la suppression définitive de votre compte.'
        : 'Type SUPPRIMER in uppercase to confirm permanent deletion of your account.'
    )
    if (typed !== 'SUPPRIMER') {
      if (typed !== null) toast.error(fr ? 'Confirmation invalide' : 'Invalid confirmation')
      return
    }

    setDeletingAccount(true)
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'SUPPRIMER' }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || (fr ? 'Échec de la suppression' : 'Deletion failed'))
        setDeletingAccount(false)
        return
      }
      await supabase.auth.signOut()
      toast.success(fr ? 'Compte supprimé' : 'Account deleted')
      router.push('/')
    } catch {
      toast.error(fr ? 'Échec de la suppression' : 'Deletion failed')
      setDeletingAccount(false)
    }
  }
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  const handlePlanChange = async (planId: 'starter' | 'pro' | 'business') => {
    if (!user) return
    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: user.id, billingCycle }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast.error(data.error || t.errors.unknown)
        setCheckoutLoading(null)
        return
      }
      window.location.href = data.url
    } catch (err) {
      console.error('Plan change error:', err)
      toast.error(t.errors.unknown)
      setCheckoutLoading(null)
    }
  }

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

  // Services
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [newSvcName, setNewSvcName]     = useState('')
  const [newSvcCategory, setNewSvcCategory] = useState('')
  const [newSvcPricingType, setNewSvcPricingType] = useState<Service['pricing_type']>('fixed')
  const [newSvcPrice, setNewSvcPrice]   = useState('')
  const [newSvcPriceMax, setNewSvcPriceMax] = useState('')
  const [newSvcPricingNote, setNewSvcPricingNote] = useState('')
  const [newSvcDuration, setNewSvcDuration] = useState('60')
  const [newSvcBuffer, setNewSvcBuffer] = useState('0')
  const [newSvcDesc, setNewSvcDesc]     = useState('')
  const [addingSvc, setAddingSvc]       = useState(false)

  // Google Calendar
  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleEmail, setGoogleEmail] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)

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
      loadServices(data.user.id)

      // Handle Stripe Connect / tab return URL params
      const params = new URLSearchParams(window.location.search)
      const urlTab = params.get('tab')
      if (urlTab === 'billing' || urlTab === 'services' || urlTab === 'booking' || urlTab === 'notifications' || urlTab === 'account' || urlTab === 'integrations') {
        setTab(urlTab as Tab)
      }
      if (params.get('connected') === 'true') {
        toast.success(t.success.saved)
        loadConnectStatus(data.user.id)
      }
      if (params.get('success') === 'true' && params.get('session_id')) {
        toast.success(t.success.saved)
        plan.refresh()
      }
      if (params.get('canceled') === 'true') {
        toast.info('Paiement annulé.')
      }
      if (params.get('google') === 'success') {
        toast.success(fr ? 'Google Calendar connecté' : 'Google Calendar connected')
      } else if (params.get('google') === 'error') {
        toast.error(fr ? 'Échec de la connexion à Google Calendar' : 'Google Calendar connection failed')
      }

      if (org) {
        setOrgId(org.id)
        if (org.slug) setOrgSlug(org.slug)
        setGoogleConnected(!!org.google_calendar_connected)
        setGoogleEmail(org.google_calendar_email || null)
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
    const emailErr = validateEmail(bizEmail, false)
    const phoneErr = validatePhone(bizPhone, false)
    if (emailErr || phoneErr) {
      toast.error(emailErr || phoneErr)
      return
    }
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
      toast.success(t.success.saved)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const loadServices = async (uid: string) => {
    setServicesLoading(true)
    const { data, error: svcErr } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', uid)
      .order('name')
    if (svcErr) toast.error(svcErr.message)
    setServices((data || []) as Service[])
    setServicesLoading(false)
  }

  const addService = async () => {
    if (!user) return
    const name = newSvcName.trim()
    if (!name) { toast.error(t.errors.required); return }
    const showPrice = newSvcPricingType !== 'quote_required' && newSvcPricingType !== 'free'
    const price = showPrice ? (parseFloat(newSvcPrice) || 0) : 0
    const priceMax = newSvcPricingType === 'custom_range' ? (parseFloat(newSvcPriceMax) || null) : null
    const duration = parseInt(newSvcDuration) || 60
    const buffer = parseInt(newSvcBuffer) || 0
    setAddingSvc(true)
    const { data, error: svcErr } = await supabase
      .from('services')
      .insert({
        user_id: user.id,
        name,
        category: newSvcCategory || null,
        description: newSvcDesc.trim() || null,
        pricing_type: newSvcPricingType,
        base_price: price,
        price_max: priceMax,
        pricing_note: newSvcPricingNote.trim() || null,
        duration_minutes: duration,
        buffer_minutes: buffer,
        is_active: true,
      })
      .select()
      .single()
    setAddingSvc(false)
    if (svcErr) { toast.error(svcErr.message); return }
    setServices((prev) => [...prev, data as Service].sort((a, b) => a.name.localeCompare(b.name)))
    setNewSvcName(''); setNewSvcCategory(''); setNewSvcPricingType('fixed')
    setNewSvcPrice(''); setNewSvcPriceMax(''); setNewSvcPricingNote('')
    setNewSvcDuration('60'); setNewSvcBuffer('0'); setNewSvcDesc('')
    toast.success(t.success.created)
  }

  const toggleServiceActive = async (svc: Service) => {
    const next = !svc.is_active
    setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, is_active: next } : s))
    const { error: svcErr } = await supabase
      .from('services')
      .update({ is_active: next })
      .eq('id', svc.id)
    if (svcErr) {
      toast.error(svcErr.message)
      setServices((prev) => prev.map((s) => s.id === svc.id ? { ...s, is_active: !next } : s))
    }
  }

  const deleteService = async (svc: Service) => {
    const { confirmed } = await confirm({
      title: 'Supprimer ce service ?',
      description: `« ${svc.name} » ne sera plus disponible dans votre portail de réservation.`,
      confirmLabel: 'Supprimer',
    })
    if (!confirmed) return
    const { error: svcErr } = await supabase.from('services').delete().eq('id', svc.id)
    if (svcErr) { toast.error(svcErr.message); return }
    setServices((prev) => prev.filter((s) => s.id !== svc.id))
    toast.success(t.success.deleted)
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
          toast.error(data.error || t.errors.unknown)
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
        toast.error(data2.error || t.errors.unknown)
        setConnectLoading(false)
        return
      }
      // Step 3: Redirect to Stripe onboarding
      window.location.href = data2.url
    } catch (err) {
      console.error('Stripe connect error:', err)
      toast.error(t.errors.unknown)
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
    { key: 'business',      label: fr ? 'Entreprise' : 'Business',                icon: Building2 },
    { key: 'services',      label: fr ? 'Services' : 'Services',                  icon: Wrench },
    { key: 'booking',       label: fr ? 'Portail de réservation' : 'Booking portal', icon: Sparkles },
    { key: 'billing',       label: fr ? 'Facturation' : 'Billing',                icon: DollarSign },
    { key: 'notifications', label: fr ? 'Notifications' : 'Notifications',        icon: Bell },
    { key: 'account',       label: fr ? 'Compte' : 'Account',                      icon: Shield },
    { key: 'integrations',  label: fr ? 'Intégrations' : 'Integrations',          icon: Globe },
  ]

  const handleGoogleConnect = () => {
    window.location.href = '/api/integrations/google/connect'
  }

  const handleGoogleDisconnect = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Déconnecter Google Calendar ?' : 'Disconnect Google Calendar?',
      description: fr
        ? 'Les nouveaux emplois ne seront plus synchronisés. Les événements déjà créés resteront dans votre calendrier.'
        : 'New jobs will no longer sync. Events already created will remain in your calendar.',
      confirmLabel: fr ? 'Déconnecter' : 'Disconnect',
    })
    if (!confirmed) return
    setGoogleLoading(true)
    try {
      const res = await fetch('/api/integrations/google/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setGoogleConnected(false)
      setGoogleEmail(null)
      toast.success(fr ? 'Google Calendar déconnecté' : 'Google Calendar disconnected')
    } catch (err) {
      console.error('[google disconnect]', err)
      toast.error(fr ? 'Échec de la déconnexion' : 'Disconnect failed')
    } finally {
      setGoogleLoading(false)
    }
  }

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
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? "Informations de l'entreprise" : 'Business information'}</h2>
              <p className="text-sm text-gray-400 mb-5">{fr ? 'Ces informations apparaissent sur vos factures, devis et communications clients.' : 'This info appears on invoices, quotes, and client communications.'}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InputRow label={fr ? "Nom de l'entreprise" : 'Business name'} value={bizName} onChange={setBizName} placeholder="HVAC Tremblay inc." />
                </div>
                <InputRow label={fr ? 'Téléphone' : 'Phone'} value={bizPhone} onChange={setBizPhone} type="tel" placeholder="+1 (514) 000-0000" />
                <InputRow label={fr ? 'Courriel professionnel' : 'Business email'} value={bizEmail} onChange={setBizEmail} type="email" placeholder="info@entreprise.com" />
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">{fr ? 'Adresse' : 'Address'}</label>
                  <AddressAutocomplete value={bizAddress} onChange={setBizAddress} />
                </div>
                <InputRow label={fr ? 'Ville' : 'City'} value={bizCity} onChange={setBizCity} placeholder="Montréal" />
                <InputRow label={fr ? 'Province / État' : 'Province / State'} value={bizState} onChange={setBizState} placeholder="QC" />
                <InputRow label={fr ? 'Code postal' : 'Postal code'} value={bizZip} onChange={setBizZip} placeholder="H1A 1A1" />
                <InputRow label={fr ? 'Site web' : 'Website'} value={bizWebsite} onChange={setBizWebsite} type="url" placeholder="https://votre-entreprise.com" />
                <InputRow label={fr ? 'Numéro de taxe (TPS/TVQ/TVH)' : 'Tax number (GST/QST/HST)'} value={bizTaxNum} onChange={setBizTaxNum} placeholder="123456789 RT0001" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Devise' : 'Currency'}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Fuseau horaire' : 'Timezone'}</label>
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
                <p className="text-sm font-semibold text-gray-900">{fr ? 'Compte' : 'Account'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Connecté en tant que' : 'Signed in as'} {user?.email}</p>
              </div>
            </div>

            <SaveBar saved={saved} error={error} saving={saving} onSave={saveSettings} fr={fr} />
          </div>
        )}

        {/* Services */}
        {tab === 'services' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? 'Vos services' : 'Your services'}</h2>
              <p className="text-sm text-gray-400 mb-5">{fr ? 'Ajoutez les services que vos clients peuvent réserver en ligne. Ils apparaîtront sur votre portail de réservation.' : 'Add services clients can book online. They appear on your booking portal.'}</p>

              {/* Existing services */}
              {servicesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : services.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-8 px-4 text-center text-sm text-gray-500">
                  Aucun service pour le moment. Ajoutez-en un ci-dessous.
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {services.map((svc) => (
                    <div key={svc.id} className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${svc.is_active ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">{svc.name}</p>
                          {!svc.is_active && <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{fr ? 'Inactif' : 'Inactive'}</span>}
                        </div>
                        {svc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{svc.description}</p>}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                          <span className="inline-flex items-center gap-1 font-medium text-gray-700">
                            <DollarSign className="h-3 w-3" />{formatPrice(svc, currency)}
                          </span>
                          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{svc.duration_minutes} min</span>
                          {svc.category && <span className="rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5">{svc.category}</span>}
                          {svc.pricing_note && <span className="italic text-gray-400 truncate">{svc.pricing_note}</span>}
                        </div>
                      </div>
                      <Toggle checked={svc.is_active} onChange={() => toggleServiceActive(svc)} />
                      <button
                        onClick={() => deleteService(svc)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        aria-label={fr ? 'Supprimer' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new service */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">{fr ? 'Ajouter un service' : 'Add service'}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Nom du service' : 'Service name'}</label>
                    <input
                      type="text"
                      value={newSvcName}
                      onChange={(e) => setNewSvcName(e.target.value)}
                      placeholder="ex. Nettoyage résidentiel standard"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Catégorie' : 'Category'}</label>
                    <select
                      value={newSvcCategory}
                      onChange={(e) => setNewSvcCategory(e.target.value)}
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">— Choisir —</option>
                      {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Type de prix' : 'Price type'}</label>
                    <select
                      value={newSvcPricingType}
                      onChange={(e) => setNewSvcPricingType(e.target.value as Service['pricing_type'])}
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="fixed">{fr ? 'Prix fixe' : 'Fixed price'}</option>
                      <option value="starting_from">À partir de…</option>
                      <option value="hourly">{fr ? 'Par heure' : 'Hourly'}</option>
                      <option value="custom_range">{fr ? 'Fourchette (min – max)' : 'Range (min – max)'}</option>
                      <option value="quote_required">{fr ? 'Sur devis' : 'Quote required'}</option>
                      <option value="free">{fr ? 'Gratuit' : 'Free'}</option>
                    </select>
                  </div>

                  {newSvcPricingType !== 'quote_required' && newSvcPricingType !== 'free' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {newSvcPricingType === 'starting_from' ? 'Prix minimum' :
                         newSvcPricingType === 'hourly' ? 'Tarif horaire' :
                         newSvcPricingType === 'custom_range' ? 'Prix minimum' :
                         'Prix'} ({currency})
                      </label>
                      <input
                        type="number" step="0.01" min="0"
                        value={newSvcPrice}
                        onChange={(e) => setNewSvcPrice(e.target.value)}
                        placeholder="150.00"
                        className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}

                  {newSvcPricingType === 'custom_range' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Prix maximum' : 'Maximum price'} ({currency})</label>
                      <input
                        type="number" step="0.01" min="0"
                        value={newSvcPriceMax}
                        onChange={(e) => setNewSvcPriceMax(e.target.value)}
                        placeholder="300.00"
                        className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Durée (minutes)' : 'Duration (minutes)'}</label>
                    <input
                      type="number" min="5" step="5"
                      value={newSvcDuration}
                      onChange={(e) => setNewSvcDuration(e.target.value)}
                      placeholder="60"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Temps tampon après (min)' : 'Buffer after (min)'}</label>
                    <input
                      type="number" min="0" step="5"
                      value={newSvcBuffer}
                      onChange={(e) => setNewSvcBuffer(e.target.value)}
                      placeholder="0"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Note de prix (optionnel)' : 'Price note (optional)'}</label>
                    <input
                      type="text"
                      value={newSvcPricingNote}
                      onChange={(e) => setNewSvcPricingNote(e.target.value)}
                      placeholder="ex. Varie selon la taille et l'état du bateau"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Description (optionnel)' : 'Description (optional)'}</label>
                    <textarea
                      rows={2}
                      value={newSvcDesc}
                      onChange={(e) => setNewSvcDesc(e.target.value)}
                      placeholder="Ce que le service inclut…"
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm resize-none focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <button
                  onClick={addService}
                  disabled={addingSvc || !newSvcName.trim()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all"
                >
                  {addingSvc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Ajouter le service
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Booking Portal */}
        {tab === 'booking' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? 'Agent IA de réservation' : 'AI booking agent'}</h2>
              <p className="text-sm text-gray-400 mb-5">{fr ? "Personnalisez l'agent IA qui accueille vos clients sur votre portail de réservation." : 'Customize the AI agent that greets clients on your booking portal.'}</p>

              <div className="space-y-4">
                <InputRow
                  label={fr ? "Nom de l'agent" : "Agent's name"}
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

            <SaveBar saved={saved} error={error} saving={saving} onSave={saveSettings} fr={fr} />
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Préférences de notifications</h2>
              <p className="text-sm text-gray-400 mb-5">Choisissez quels événements déclenchent des notifications dans l&apos;app et par email.</p>

              <div className="rounded-xl bg-gray-50 px-5 py-4 mb-4">
                <NotifRow label={fr ? 'Notifications par courriel' : 'Email notifications'} sub={fr ? 'Recevoir toutes les notifications par courriel également' : 'Receive all notifications by email as well'} checked={notifEmail} onChange={setNotifEmail} />
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">Déclencheurs d&apos;événements</h3>
              <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                <NotifRow label={fr ? 'Nouvelle intervention créée' : 'New job created'} sub={fr ? "Quand un nouveau bon de travail est ajouté" : 'When a new work order is added'} checked={notifJobCreated} onChange={setNotifJobCreated} />
                <NotifRow label={fr ? 'Intervention terminée' : 'Job completed'} sub={fr ? 'Quand un technicien marque une intervention comme terminée' : 'When a technician marks a job complete'} checked={notifJobComplete} onChange={setNotifJobComplete} />
                <NotifRow label={fr ? 'Facture payée' : 'Invoice paid'} sub={fr ? 'Quand un client paie une facture' : 'When a customer pays an invoice'} checked={notifInvoicePaid} onChange={setNotifInvoicePaid} />
                <NotifRow label={fr ? 'Facture en retard' : 'Invoice overdue'} sub={fr ? "Quand une facture dépasse sa date d'échéance" : 'When an invoice passes its due date'} checked={notifOverdueInvoice} onChange={setNotifOverdueInvoice} />
                <NotifRow label={fr ? 'Nouveau client ajouté' : 'New customer added'} sub={fr ? 'Quand un nouveau client est créé' : 'When a new customer is created'} checked={notifNewCustomer} onChange={setNotifNewCustomer} />
              </div>
            </div>
            <SaveBar saved={saved} error={error} saving={saving} onSave={saveSettings} fr={fr} />
          </div>
        )}

        {/* Account */}
        {tab === 'account' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? 'Compte' : 'Account'}</h2>
              <p className="text-sm text-gray-400 mb-5">{fr ? 'Gérez vos sessions et paramètres de compte.' : 'Manage your sessions and account settings.'}</p>
              <div className="space-y-3">
                {/* Sessions */}
                <div className="flex items-start justify-between rounded-xl border border-gray-100 p-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{fr ? 'Sessions actives' : 'Active sessions'}</p>
                    <p className="text-xs text-gray-400">{fr ? 'Vous êtes connecté sur cet appareil.' : 'You are logged in on this device.'}</p>
                  </div>
                  <button
                    onClick={async () => {
                      const { confirmed: ok } = await confirm({
                        title: fr ? 'Déconnecter les autres sessions ?' : 'Sign out other sessions?',
                        description: fr
                          ? 'Vous resterez connecté sur cet appareil, mais toutes les autres sessions seront fermées.'
                          : 'You will stay signed in on this device, but all other sessions will be closed.',
                        confirmLabel: fr ? 'Déconnecter' : 'Sign out others',
                      })
                      if (!ok) return
                      const { error: err } = await supabase.auth.signOut({ scope: 'others' })
                      if (err) toast.error(err.message)
                      else toast.success(fr ? 'Autres sessions déconnectées' : 'Other sessions signed out')
                    }}
                    className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {fr ? 'Déconnecter les autres' : 'Sign out others'}
                  </button>
                </div>

                {/* Activity / Notifications */}
                <div className="flex items-start justify-between rounded-xl border border-gray-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{fr ? 'Notifications' : 'Notifications'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Consulter toutes les notifications récentes sur votre compte.' : 'Review all recent notifications on your account.'}</p>
                  </div>
                  <Link href="/notifications" className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    {fr ? 'Voir les notifications' : 'View notifications'}
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-1">{fr ? 'Zone dangereuse' : 'Danger zone'}</h3>
              <p className="text-xs text-red-600 mb-4">
                {fr
                  ? 'Cette action est irréversible. Toutes vos données seront définitivement supprimées.'
                  : 'This action is irreversible. All your data will be permanently deleted.'}
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 transition-colors"
              >
                {deletingAccount
                  ? (fr ? 'Suppression…' : 'Deleting…')
                  : (fr ? 'Supprimer le compte' : 'Delete account')}
              </button>
            </div>
          </div>
        )}

        {/* Billing / Payments */}
        {tab === 'billing' && (
          <div className="space-y-6">
            {/* Current plan card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">Votre forfait</h2>
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                      plan.status === 'trial' ? 'bg-indigo-50 text-indigo-700' :
                      plan.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      plan.status === 'past_due' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.status === 'trial' ? `Essai · ${plan.trialDaysLeft} j restants` :
                       plan.status === 'active' ? 'Actif' :
                       plan.status === 'past_due' ? 'Paiement en retard' :
                       plan.status === 'cancelled' ? 'Annulé' : 'Expiré'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{PLAN_PRICING[plan.plan].label} — ${PLAN_PRICING[plan.plan].monthly}/mois</p>
                  {plan.nextBillingAt && plan.status === 'active' && !plan.promoCodeId && (
                    <p className="text-xs text-gray-400 mt-1">{fmtDate(plan.nextBillingAt, lang)}</p>
                  )}
                  {plan.promoCodeId && plan.promoExpiresAt && (
                    <p className="text-xs font-medium text-emerald-700 mt-1">
                      🎁 Code promo actif · {plan.promoDaysLeft} jour{plan.promoDaysLeft > 1 ? 's' : ''} restant{plan.promoDaysLeft > 1 ? 's' : ''} — {fmtDate(plan.promoExpiresAt, lang)}
                    </p>
                  )}
                </div>
              </div>

              {/* Usage */}
              <div className="px-6 py-5 grid gap-4 sm:grid-cols-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Clients</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.customerCount} / {plan.limits.maxCustomers === Infinity ? '∞' : plan.limits.maxCustomers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Utilisateurs</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.teamMemberCount} / {plan.limits.maxUsers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Messages IA ce mois</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.aiMessagesThisMonth} / {plan.limits.maxAIMessages === Infinity ? '∞' : plan.limits.maxAIMessages}
                  </p>
                </div>
              </div>

              {/* Plan switcher */}
              <div className="px-6 pt-2 pb-4 flex items-center gap-2">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${billingCycle === 'monthly' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >Mensuel</button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${billingCycle === 'annual' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >Annuel <span className="ml-1 text-emerald-600">(-20%)</span></button>
              </div>
              <div className="p-6 pt-2 grid gap-4 md:grid-cols-3">
                {(['starter', 'pro', 'business'] as const).map((p) => {
                  const info = PLAN_PRICING[p]
                  const price = billingCycle === 'annual' ? info.annual : info.monthly
                  const isCurrent = plan.plan === p
                  return (
                    <div key={p} className={`rounded-xl border p-4 ${isCurrent ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{info.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">${price}<span className="text-xs font-normal text-gray-400">/mois{billingCycle === 'annual' ? ' · facturé annuellement' : ''}</span></p>
                      <p className="text-xs text-gray-500 mt-1 mb-3">{info.tagline}</p>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">Forfait actuel</span>
                      ) : (
                        <button
                          onClick={() => handlePlanChange(p)}
                          disabled={checkoutLoading === p}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {checkoutLoading === p ? 'Chargement…' : p === 'starter' ? 'Rétrograder' : `Passer à ${info.label}`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Promo code — only useful on trial/starter/expired */}
            {user && (plan.status === 'trial' || plan.plan === 'starter' || plan.status === 'expired') && (
              <PromoCodeInput userId={user.id} onApplied={() => plan.refresh()} />
            )}

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
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? 'Services connectés' : 'Connected services'}</h2>
              <p className="text-sm text-gray-400 mb-5">{fr ? 'Gérez les intégrations avec des outils tiers.' : 'Manage third-party integrations.'}</p>
              <div className="space-y-3">
                {/* Stripe Connect */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${connectStatus?.connected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <CreditCard className={`h-5 w-5 ${connectStatus?.connected ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">Stripe Connect</p>
                        {connectStatus?.connected && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle className="h-3 w-3" /> Connecté
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {connectStatus?.connected
                          ? (fr ? 'Paiements en ligne activés' : 'Online payments enabled')
                          : (fr ? 'Acceptez les paiements en ligne de vos clients' : 'Accept online payments from customers')}
                      </p>
                    </div>
                  </div>
                  {!connectStatus?.connected && (
                    <button
                      onClick={() => setTab('billing')}
                      className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      {fr ? 'Configurer' : 'Set up'}
                    </button>
                  )}
                </div>

                {/* Google Calendar */}
                <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${googleConnected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <Globe className={`h-5 w-5 ${googleConnected ? 'text-emerald-600' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">Google Calendar</p>
                        {googleConnected && (
                          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle className="h-3 w-3" /> Connecté
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {googleConnected
                          ? (googleEmail
                              ? (fr ? `Synchronisation active · ${googleEmail}` : `Sync active · ${googleEmail}`)
                              : (fr ? 'Synchronisation active' : 'Sync active'))
                          : (fr ? 'Synchronisez vos interventions avec Google Calendar automatiquement' : 'Automatically sync your jobs with Google Calendar')}
                      </p>
                    </div>
                  </div>
                  {googleConnected ? (
                    <button
                      onClick={handleGoogleDisconnect}
                      disabled={googleLoading}
                      className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
                    >
                      {fr ? 'Déconnecter' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleConnect}
                      className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      {fr ? 'Connecter Google Calendar' : 'Connect Google Calendar'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
