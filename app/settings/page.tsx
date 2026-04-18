'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import { formatPrice } from '@/lib/pricing'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { usePlan } from '@/lib/hooks/usePlan'
import { PLAN_PRICING, normalizePlan, getPlanDisplayName } from '@/lib/plan-limits'
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
  ExternalLink, Loader2, DollarSign, Plus, Trash2, Clock, Upload, Lock, X,
  Puzzle, FileText, Users, BookOpen, AlertTriangle,
} from 'lucide-react'
import { MODULES, canEnableModule, getDependents, isModuleEnabled, type ModuleKey } from '@/lib/modules'

type Tab = 'business' | 'services' | 'booking' | 'notifications' | 'account' | 'integrations' | 'billing' | 'modules'

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

const SERVICE_CATEGORIES_FR = [
  'Nettoyage', 'Plomberie', 'CVC / HVAC', 'Électricité',
  'Aménagement paysager', 'Peinture', 'Rénovation', 'Autre',
]
const SERVICE_CATEGORIES_EN = [
  'Cleaning', 'Plumbing', 'HVAC', 'Electrical',
  'Landscaping', 'Painting', 'Renovation', 'Other',
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

  const PLAN_TIER: Record<string, number> = { demarrage: 0, pro: 1, croissance: 2 }

  const handlePlanChange = async (planId: 'demarrage' | 'pro' | 'croissance') => {
    if (!user) return

    // On trial (no subscription yet) — redirect to subscribe page
    if (plan.status === 'trial' || plan.status === 'expired') {
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
      return
    }

    // Active subscription — upgrade/downgrade via plan change API
    const currentTier = PLAN_TIER[normalizePlan(plan.plan)] ?? 0
    const newTier = PLAN_TIER[planId] ?? 0
    const isUpgrade = newTier > currentTier
    const targetLabel = getPlanDisplayName(planId, lang)

    const { confirmed } = await confirm({
      title: isUpgrade
        ? (fr ? `Passer au forfait ${targetLabel} ?` : `Upgrade to ${targetLabel}?`)
        : (fr ? `Rétrograder vers ${targetLabel} ?` : `Downgrade to ${targetLabel}?`),
      description: isUpgrade
        ? (fr ? 'La différence sera calculée au prorata et appliquée immédiatement.' : 'The difference will be prorated and applied immediately.')
        : (fr ? 'Le changement prendra effet à la fin de votre période de facturation actuelle.' : 'The change will take effect at the end of your current billing period.'),
      confirmLabel: isUpgrade
        ? (fr ? 'Confirmer la mise à niveau' : 'Confirm upgrade')
        : (fr ? 'Confirmer la rétrogradation' : 'Confirm downgrade'),
    })
    if (!confirmed) return

    setCheckoutLoading(planId)
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId: planId, cycle: billingCycle }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        toast.error(data.error || t.errors.unknown)
        setCheckoutLoading(null)
        return
      }
      if (data.effective === 'immediate') {
        toast.success(fr ? `Vous êtes maintenant sur le forfait ${targetLabel} !` : `You are now on the ${targetLabel} plan!`)
      } else {
        toast.success(fr ? `Votre forfait passera à ${targetLabel} à la fin de la période.` : `Your plan will switch to ${targetLabel} at the end of the period.`)
      }
      plan.refresh()
      setCheckoutLoading(null)
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
  // Logo
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  // Snapshot of address loaded from DB — used to detect if the user
  // actually changed an address field (so we know to null saved coords).
  const [originalAddress, setOriginalAddress] = useState({ address: '', city: '', state: '', zip: '' })

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

  // Modules
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({})
  const [togglingModule, setTogglingModule] = useState<string | null>(null)

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
      if (urlTab === 'billing' || urlTab === 'services' || urlTab === 'booking' || urlTab === 'notifications' || urlTab === 'account' || urlTab === 'integrations' || urlTab === 'modules') {
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
        toast.info(fr ? 'Paiement annulé.' : 'Payment cancelled.')
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
        if (org.logo_url)        setLogoUrl(org.logo_url)
        if (org.currency)        setCurrency(org.currency)
        if (org.timezone)        setTimezone(org.timezone)
        setOriginalAddress({
          address: org.address || '',
          city: org.city || '',
          state: org.state || '',
          zip: org.zip || '',
        })
        if (org.ai_agent_name)   setAgentName(org.ai_agent_name)
        if (org.ai_agent_greeting) setAgentGreeting(org.ai_agent_greeting)
        if (org.service_types)   setAgentServices(Array.isArray(org.service_types) ? org.service_types.join(', ') : '')
        if (org.enabled_modules) setEnabledModules(org.enabled_modules as Record<string, boolean>)
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
      // Coordinates are derived purely from geocoding. If the address changed
      // we null them so the dashboard re-geocodes on next load.
      location_lat: null as number | null,
      location_lng: null as number | null,
    }

    const addressChanged =
      bizAddress !== originalAddress.address ||
      bizCity !== originalAddress.city ||
      bizState !== originalAddress.state ||
      bizZip !== originalAddress.zip
    if (!addressChanged) {
      // Don't touch coords when address didn't change — preserve any coords
      // the dashboard may have saved since the last settings load.
      delete (payload as Record<string, unknown>).location_lat
      delete (payload as Record<string, unknown>).location_lng
    }
    if (nextSlug) payload.slug = nextSlug

    // Route through the service-role API so RLS can't block writes to
    // location_lat/lng (anon policies blocked these writes silently before).
    console.log('[settings save] starting save... addressChanged =', addressChanged, 'location_lat in payload =', 'location_lat' in payload ? payload.location_lat : '(not sent)')
    const res = await fetch('/api/settings/save-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; error?: string; org?: { id: string; slug: string | null; location_lat: number | null; location_lng: number | null } }
    console.log('[settings save] API response:', res.status, data)

    if (!res.ok || !data.ok) {
      toast.error(data.error || (fr ? 'Échec de la sauvegarde' : 'Save failed'))
    } else {
      if (data.org?.id) setOrgId(data.org.id)
      if (data.org?.slug) setOrgSlug(data.org.slug)
      // Re-baseline address snapshot so subsequent saves correctly detect changes.
      setOriginalAddress({ address: bizAddress, city: bizCity, state: bizState, zip: bizZip })
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
      title: fr ? 'Supprimer ce service ?' : 'Delete this service?',
      description: fr ? `« ${svc.name} » ne sera plus disponible dans votre portail de réservation.` : `"${svc.name}" will no longer be available on your booking portal.`,
      confirmLabel: fr ? 'Supprimer' : 'Delete',
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
    { key: 'modules',       label: 'Modules',                                      icon: Puzzle },
    { key: 'integrations',  label: fr ? 'Intégrations' : 'Integrations',          icon: Globe },
  ]

  const handleGoogleConnect = () => {
    window.location.href = '/api/integrations/google/connect'
  }

  const handleGoogleDisconnect = async () => {
    const { confirmed } = await confirm({
      title: fr ? 'Déconnecter Google Calendar ?' : 'Disconnect Google Calendar?',
      description: fr
        ? 'Les nouvelles interventions ne seront plus synchronisées. Les événements déjà créés resteront dans votre calendrier.'
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
    <AppLayout title={fr ? 'Paramètres' : 'Settings'}>
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
                    <option value="CAD">{fr ? 'CAD — Dollar canadien' : 'CAD — Canadian Dollar'}</option>
                    <option value="USD">{fr ? 'USD — Dollar américain' : 'USD — US Dollar'}</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">{fr ? 'GBP — Livre sterling' : 'GBP — British Pound'}</option>
                    <option value="AUD">{fr ? 'AUD — Dollar australien' : 'AUD — Australian Dollar'}</option>
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

            {/* Logo upload section */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? "Logo de l'entreprise" : 'Business logo'}</h2>
              <p className="text-sm text-gray-400 mb-4">{fr ? 'Apparaît sur vos factures imprimées.' : 'Appears on your printed invoices.'}</p>

              {normalizePlan(plan.plan) === 'demarrage' ? (
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Lock className="h-5 w-5 text-gray-400 shrink-0" />
                  <p className="text-sm text-gray-500">{fr ? 'Disponible avec le plan Pro' : 'Available with Pro plan'}</p>
                </div>
              ) : (
                <div>
                  {logoUrl ? (
                    <div className="flex items-start gap-4">
                      <img src={logoUrl} alt="Logo" style={{ maxWidth: 180, maxHeight: 80, objectFit: 'contain' }} className="rounded border border-gray-200 bg-white p-1" />
                      <button
                        onClick={async () => {
                          setLogoUploading(true)
                          try {
                            const res = await fetch('/api/org/delete-logo', { method: 'POST' })
                            const data = await res.json()
                            if (data.ok) { setLogoUrl(null); toast.success(fr ? 'Logo supprimé' : 'Logo removed') }
                            else toast.error(data.error || (fr ? 'Erreur' : 'Error'))
                          } catch { toast.error(fr ? 'Erreur réseau' : 'Network error') }
                          setLogoUploading(false)
                        }}
                        disabled={logoUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60"
                      >
                        <X className="h-3.5 w-3.5" />{fr ? 'Supprimer' : 'Remove'}
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                      {logoUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 font-medium">{fr ? 'Cliquez pour téléverser ou glisser-déposez' : 'Click to upload or drag and drop'}</span>
                          <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — Max 2 MB</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setLogoUploading(true)
                          try {
                            const fd = new FormData()
                            fd.append('logo', file)
                            const res = await fetch('/api/org/upload-logo', { method: 'POST', body: fd })
                            const data = await res.json()
                            if (data.ok && data.logo_url) { setLogoUrl(data.logo_url); toast.success(fr ? 'Logo téléversé' : 'Logo uploaded') }
                            else toast.error(data.error || (fr ? 'Erreur' : 'Error'))
                          } catch { toast.error(fr ? 'Erreur réseau' : 'Network error') }
                          setLogoUploading(false)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
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
                  {fr ? 'Aucun service pour le moment. Ajoutez-en un ci-dessous.' : 'No services yet. Add one below.'}
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
                      placeholder={fr ? 'ex. Nettoyage résidentiel standard' : 'e.g. Standard residential cleaning'}
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
                      <option value="">{fr ? '— Choisir —' : '— Select —'}</option>
                      {(fr ? SERVICE_CATEGORIES_FR : SERVICE_CATEGORIES_EN).map((c) => <option key={c} value={c}>{c}</option>)}
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
                      <option value="starting_from">{fr ? 'À partir de…' : 'Starting from…'}</option>
                      <option value="hourly">{fr ? 'Par heure' : 'Hourly'}</option>
                      <option value="custom_range">{fr ? 'Fourchette (min – max)' : 'Range (min – max)'}</option>
                      <option value="quote_required">{fr ? 'Sur devis' : 'Quote required'}</option>
                      <option value="free">{fr ? 'Gratuit' : 'Free'}</option>
                    </select>
                  </div>

                  {newSvcPricingType !== 'quote_required' && newSvcPricingType !== 'free' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {newSvcPricingType === 'starting_from' ? (fr ? 'Prix minimum' : 'Minimum price') :
                         newSvcPricingType === 'hourly' ? (fr ? 'Tarif horaire' : 'Hourly rate') :
                         newSvcPricingType === 'custom_range' ? (fr ? 'Prix minimum' : 'Minimum price') :
                         (fr ? 'Prix' : 'Price')} ({currency})
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
                      placeholder={fr ? "ex. Varie selon la taille et l'état du bateau" : 'e.g. Varies based on size and condition'}
                      className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{fr ? 'Description (optionnel)' : 'Description (optional)'}</label>
                    <textarea
                      rows={2}
                      value={newSvcDesc}
                      onChange={(e) => setNewSvcDesc(e.target.value)}
                      placeholder={fr ? 'Ce que le service inclut…' : 'What the service includes…'}
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
                  {fr ? 'Ajouter le service' : 'Add service'}
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
                  sub={fr ? "C'est le nom que votre agent IA utilise pour se présenter" : 'The name your AI agent uses to introduce itself'}
                  value={agentName}
                  onChange={setAgentName}
                  placeholder="Alex"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">{fr ? "Message d'accueil personnalisé (optionnel)" : 'Custom greeting (optional)'}</label>
                  <p className="text-xs text-gray-400 mb-1.5">{fr ? 'Remplace le message par défaut. Laissez vide pour utiliser le message par défaut.' : 'Overrides the default greeting. Leave empty to use the default.'}</p>
                  <textarea
                    value={agentGreeting}
                    onChange={(e) => setAgentGreeting(e.target.value)}
                    rows={3}
                    placeholder={fr ? `Bonjour ! Je suis ${agentName}, votre assistant de réservation. Comment puis-je vous aider ?` : `Hi! I'm ${agentName}, your booking assistant. How can I help you?`}
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">{fr ? 'Services offerts (séparés par des virgules)' : 'Services offered (comma-separated)'}</label>
                  <p className="text-xs text-gray-400 mb-1.5">{fr ? 'Indiquez à votre agent IA quels services proposer et discuter' : 'Tell your AI agent which services to offer and discuss'}</p>
                  <input
                    type="text"
                    value={agentServices}
                    onChange={(e) => setAgentServices(e.target.value)}
                    placeholder={fr ? 'Réparation HVAC, installation CA, entretien chauffage, nettoyage conduits' : 'HVAC repair, AC installation, heating maintenance, duct cleaning'}
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Booking link */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">{fr ? 'Lien de votre portail de réservation' : 'Your booking portal link'}</p>
              </div>
              <p className="text-xs text-indigo-600 mb-3">{fr ? 'Partagez ce lien avec vos clients pour qu\'ils puissent réserver via votre agent IA.' : 'Share this link with clients so they can book through your AI agent.'}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-mono text-gray-700 truncate">
                  {bookingLink || (fr ? 'Sauvegardez le nom de votre entreprise pour générer votre lien' : 'Save your business name to generate your link')}
                </div>
                <button
                  onClick={copyBookingLink}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? (fr ? 'Copié !' : 'Copied!') : (fr ? 'Copier' : 'Copy')}
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
              <h2 className="text-base font-semibold text-gray-900 mb-1">{fr ? 'Préférences de notifications' : 'Notification preferences'}</h2>
              <p className="text-sm text-gray-400 mb-5">{fr ? 'Choisissez quels événements déclenchent des notifications dans l\'app et par email.' : 'Choose which events trigger notifications in the app and by email.'}</p>

              <div className="rounded-xl bg-gray-50 px-5 py-4 mb-4">
                <NotifRow label={fr ? 'Notifications par courriel' : 'Email notifications'} sub={fr ? 'Recevoir toutes les notifications par courriel également' : 'Receive all notifications by email as well'} checked={notifEmail} onChange={setNotifEmail} />
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">{fr ? "Déclencheurs d'événements" : 'Event triggers'}</h3>
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
                    <h2 className="text-base font-semibold text-gray-900">{fr ? 'Votre forfait' : 'Your plan'}</h2>
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                      plan.status === 'trial' ? 'bg-indigo-50 text-indigo-700' :
                      plan.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      plan.status === 'past_due' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {plan.status === 'trial' ? (fr ? `Essai · ${plan.trialDaysLeft} j restants` : `Trial · ${plan.trialDaysLeft}d left`) :
                       plan.status === 'active' ? (fr ? 'Actif' : 'Active') :
                       plan.status === 'past_due' ? (fr ? 'Paiement en retard' : 'Past due') :
                       plan.status === 'cancelled' ? (fr ? 'Annulé' : 'Cancelled') : (fr ? 'Expiré' : 'Expired')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{getPlanDisplayName(plan.plan, lang)} — ${PLAN_PRICING[normalizePlan(plan.plan)].monthly}/{fr ? 'mois' : 'mo'}</p>
                  {plan.nextBillingAt && plan.status === 'active' && !plan.promoCodeId && (
                    <p className="text-xs text-gray-400 mt-1">{fmtDate(plan.nextBillingAt, lang)}</p>
                  )}
                  {plan.promoCodeId && plan.promoExpiresAt && (
                    <p className="text-xs font-medium text-emerald-700 mt-1">
                      {new Date(plan.promoExpiresAt).getFullYear() > 2090
                        ? (fr ? '🎁 Accès gratuit à vie' : '🎁 Lifetime free access')
                        : (fr ? `🎁 Code promo actif jusqu'au ${fmtDate(plan.promoExpiresAt, lang)}` : `🎁 Promo code active until ${fmtDate(plan.promoExpiresAt, lang)}`)}
                    </p>
                  )}
                </div>
                {plan.status === 'active' && (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/stripe/customer-portal', { method: 'POST' })
                        const data = await res.json()
                        if (!res.ok || !data.url) { toast.error(data.error || (fr ? 'Erreur' : 'Error')); return }
                        window.location.href = data.url
                      } catch { toast.error(fr ? 'Erreur' : 'Error') }
                    }}
                    className="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    {fr ? "Gérer l'abonnement" : 'Manage subscription'}
                  </button>
                )}
              </div>

              {/* Usage */}
              <div className="px-6 py-5 grid gap-4 sm:grid-cols-3 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{fr ? 'Clients' : 'Customers'}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.customerCount} / {plan.limits.maxCustomers === Infinity ? '∞' : plan.limits.maxCustomers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{fr ? 'Utilisateurs' : 'Users'}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {plan.teamMemberCount} / {plan.limits.maxUsers}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">{fr ? 'Messages IA ce mois' : 'AI messages this month'}</p>
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
                >{fr ? 'Mensuel' : 'Monthly'}</button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${billingCycle === 'annual' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >{fr ? 'Annuel' : 'Annual'} <span className="ml-1 text-emerald-600">(-10%)</span></button>
              </div>
              <div className="p-6 pt-2 grid gap-4 md:grid-cols-3">
                {(['demarrage', 'pro', 'croissance'] as const).map((p) => {
                  const info = PLAN_PRICING[p]
                  const price = billingCycle === 'annual' ? info.annual : info.monthly
                  const isCurrent = normalizePlan(plan.plan) === p
                  const label = fr ? info.label : info.labelEn
                  const tagline = fr ? info.tagline : info.taglineEn
                  return (
                    <div key={p} className={`rounded-xl border p-4 ${isCurrent ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200 bg-white'}`}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">${price}<span className="text-xs font-normal text-gray-400">/{fr ? 'mois' : 'mo'}{billingCycle === 'annual' ? (fr ? ' · facturé annuellement' : ' · billed annually') : ''}</span></p>
                      <p className="text-xs text-gray-500 mt-1 mb-3">{tagline}</p>
                      {isCurrent ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">{fr ? 'Forfait actuel' : 'Current plan'}</span>
                      ) : (() => {
                        const currentTier = PLAN_TIER[normalizePlan(plan.plan)] ?? 0
                        const targetTier = PLAN_TIER[p] ?? 0
                        const isUpgrade = targetTier > currentTier
                        const isTrial = plan.status === 'trial' || plan.status === 'expired'
                        return isTrial ? (
                          <Link
                            href={`/subscribe`}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                          >
                            {fr ? `Choisir ${label}` : `Choose ${label}`}
                          </Link>
                        ) : (
                          <button
                            onClick={() => handlePlanChange(p)}
                            disabled={checkoutLoading === p}
                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                              isUpgrade
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {checkoutLoading === p
                              ? (fr ? 'Chargement…' : 'Loading…')
                              : isUpgrade
                                ? (fr ? `Passer au ${label}` : `Switch to ${label}`)
                                : (fr ? `Passer au ${label}` : `Switch to ${label}`)}
                          </button>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Promo code — only useful on trial/demarrage/expired */}
            {user && (plan.status === 'trial' || normalizePlan(plan.plan) === 'demarrage' || plan.status === 'expired') && (
              <PromoCodeInput userId={user.id} onApplied={() => plan.refresh()} />
            )}

          </div>
        )}

        {/* Integrations */}
        {tab === 'modules' && (
          <div className="space-y-6">
            {(['operations', 'integrations'] as const).map(category => {
              const mods = MODULES.filter(m => m.category === category)
              if (mods.length === 0) return null
              const ICON_MAP: Record<string, typeof FileText> = { FileText, Users, Clock, BookOpen }
              return (
                <div key={category} className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-1">
                    {category === 'operations' ? (fr ? 'Opérations' : 'Operations') : (fr ? 'Intégrations' : 'Integrations')}
                  </h2>
                  <p className="text-sm text-gray-400 mb-5">
                    {category === 'operations'
                      ? (fr ? 'Activez les modules dont vous avez besoin.' : 'Enable the modules you need.')
                      : (fr ? 'Connectez des outils tiers.' : 'Connect third-party tools.')}
                  </p>
                  <div className="space-y-3">
                    {mods.map(mod => {
                      const Icon = ICON_MAP[mod.icon] || FileText
                      const enabled = isModuleEnabled(enabledModules, plan.plan, mod.key)
                      const check = canEnableModule(enabledModules, plan.plan, mod.key)
                      const planTooLow = !check.allowed && check.reason && !mod.requiresModule
                      const depMissing = !check.allowed && check.reason && mod.requiresModule && enabledModules?.[mod.requiresModule] !== true

                      return (
                        <div
                          key={mod.key}
                          className={`rounded-xl border p-4 flex items-start justify-between transition-all ${enabled ? 'border-emerald-200 border-l-4 border-l-emerald-500' : 'border-gray-100'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 ${enabled ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                              <Icon className={`h-5 w-5 ${enabled ? 'text-emerald-600' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{fr ? mod.name.fr : mod.name.en}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{fr ? mod.description.fr : mod.description.en}</p>
                              {planTooLow && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-xs text-amber-600 font-medium">{fr ? check.reason!.fr : check.reason!.en}</span>
                                  <Link href="/subscribe" className="text-xs text-indigo-600 font-semibold hover:underline ml-1">
                                    {fr ? 'Voir les forfaits' : 'View plans'}
                                  </Link>
                                </div>
                              )}
                              {depMissing && (
                                <div className="flex items-center gap-1.5 mt-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-xs text-amber-600 font-medium">{fr ? check.reason!.fr : check.reason!.en}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 ml-4">
                            <button
                              type="button"
                              disabled={!check.allowed && !enabled || togglingModule === mod.key}
                              onClick={async () => {
                                setTogglingModule(mod.key)
                                try {
                                  const res = await fetch('/api/modules/toggle', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ module: mod.key, enabled: !enabled }),
                                  })
                                  const data = await res.json()
                                  if (!res.ok) {
                                    toast.error(fr ? data.reason?.fr || data.error : data.reason?.en || data.error)
                                    return
                                  }
                                  setEnabledModules(data.enabled_modules)
                                  toast.success(
                                    !enabled
                                      ? (fr ? `${mod.name.fr} activé` : `${mod.name.en} enabled`)
                                      : (fr ? `${mod.name.fr} désactivé` : `${mod.name.en} disabled`)
                                  )
                                } catch {
                                  toast.error(fr ? 'Erreur inattendue' : 'Unexpected error')
                                } finally {
                                  setTogglingModule(null)
                                }
                              }}
                              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${enabled ? 'bg-indigo-600' : 'bg-gray-200'} ${(!check.allowed && !enabled) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

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
                            <CheckCircle className="h-3 w-3" /> {fr ? 'Connecté' : 'Connected'}
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
                  {connectStatus?.connected ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStripeDashboard}
                        disabled={connectLoading}
                        className="shrink-0 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        <ExternalLink className="h-3.5 w-3.5 inline mr-1" />
                        {fr ? 'Tableau de bord' : 'Dashboard'}
                      </button>
                      <button
                        onClick={async () => {
                          const { confirmed: ok } = await confirm({
                            title: fr ? 'Déconnecter Stripe ?' : 'Disconnect Stripe?',
                            description: fr
                              ? 'Vos clients ne pourront plus payer en ligne.'
                              : 'Your clients will no longer be able to pay online.',
                            confirmLabel: fr ? 'Déconnecter' : 'Disconnect',
                          })
                          if (!ok) return
                          try {
                            const res = await fetch('/api/stripe/disconnect-connect', { method: 'POST' })
                            if (!res.ok) throw new Error()
                            setConnectStatus({ connected: false })
                            toast.success(fr ? 'Stripe déconnecté' : 'Stripe disconnected')
                          } catch {
                            toast.error(fr ? 'Échec de la déconnexion' : 'Disconnect failed')
                          }
                        }}
                        className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                      >
                        {fr ? 'Déconnecter' : 'Disconnect'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleConnectStripe}
                      disabled={connectLoading}
                      className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-60"
                    >
                      {connectLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Configurer' : 'Set up')}
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
                            <CheckCircle className="h-3 w-3" /> {fr ? 'Connecté' : 'Connected'}
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
