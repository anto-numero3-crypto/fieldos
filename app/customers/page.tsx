'use client'

import { useEffect, useState, useMemo } from 'react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import MobileFAB from '@/components/MobileFAB'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import { normalizePlan } from '@/lib/plan-limits'
import { validateRequired, validateEmail, validatePhone } from '@/lib/validators'
import FieldError from '@/components/FieldError'
import EmptyState from '@/components/EmptyState'
import { SkeletonText, SkeletonListRow } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import { fmtMoney, fmtDate } from '@/lib/format'
import {
  Users, Plus, Search, Mail, Phone, MapPin, X,
  Tag, TrendingUp, ChevronRight,
  MoreHorizontal, Trash2, Download, Upload,
} from 'lucide-react'

interface Customer {
  id: string; name: string; email: string | null; phone: string | null
  address: string | null; created_at: string; notes: string | null
  tags: string[] | null; lifetime_value: number | null
}

const AVATAR_GRADIENTS = [
  'from-blue-400 to-blue-600', 'from-violet-400 to-violet-600', 'from-emerald-400 to-emerald-600',
  'from-amber-400 to-amber-600', 'from-pink-400 to-pink-600', 'from-cyan-400 to-cyan-600',
  'from-orange-400 to-orange-600', 'from-teal-400 to-teal-600', 'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
]
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
]
const initials  = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const getColor  = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]
const getGradient = (n: string) => AVATAR_GRADIENTS[n.charCodeAt(0) % AVATAR_GRADIENTS.length]
// fmt is now fmtMoney from @/lib/format with lang from useLanguage

export default function CustomersPage() {
  const [customers, setCustomers]   = useState<Customer[]>([])
  const [filtered, setFiltered]     = useState<Customer[]>([])
  const [user, setUser]             = useState<{ id: string } | null>(null)
  const [search, setSearch]         = useState('')
  const [panelOpen, setPanelOpen]   = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading]       = useState(false)
  const [menuOpen, setMenuOpen]     = useState<string | null>(null)
  const plan = usePlan()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'

  // Form
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes]     = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags]       = useState<string[]>([])
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [orgSlug, setOrgSlug] = useState<string | null>(null)
  const confirm = useConfirm()

  const errName  = touched.name  ? validateRequired(name) : ''
  const errEmail = touched.email ? validateEmail(email, false) : ''
  const errPhone = touched.phone ? validatePhone(phone, false) : ''
  const formInvalid = !!validateRequired(name) || !!validateEmail(email, false) || !!validatePhone(phone, false)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      const { data: org } = await supabase
        .from('organizations')
        .select('slug')
        .eq('owner_user_id', data.user.id)
        .maybeSingle()
      if (org?.slug) setOrgSlug(org.slug)
      await fetch_(data.user.id)
      setPageLoading(false)
    }
    init()
  }, [])

  const copyBookingLink = () => {
    if (!orgSlug) {
      toast.error(t.errors.notFound)
      return
    }
    const url = `https://gestivio.ca/book/${orgSlug}`
    navigator.clipboard.writeText(url)
    toast.success(t.success.copied)
  }

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(customers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.tags || []).some((t) => t.toLowerCase().includes(q))
    ))
  }, [search, customers])

  const { page, setPage, range, pageSize, reset: resetPage } = usePagination(filtered.length)
  const paged = useMemo(() => filtered.slice(range.from, range.to), [filtered, range.from, range.to])
  useEffect(() => { resetPage() }, [search, resetPage])

  const fetch_ = async (_uid: string) => {
    try {
      const res = await fetch('/api/customers', { cache: 'no-store' })
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (e) {
      console.error('[customers] fetch failed:', e)
      setCustomers([])
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true })
    if (formInvalid) { toast.error(t.errors.required); return }
    setLoading(true)
    const { error } = await supabase.from('customers').insert({
      user_id: user!.id, name: name.trim(),
      email: email.trim() || null, phone: phone.trim() || null,
      address: address.trim() || null, notes: notes.trim() || null,
      tags: tags.length > 0 ? tags : null,
    })
    if (error) { toast.error(error.message) }
    else {
      toast.success(t.success.created)
      setName(''); setEmail(''); setPhone(''); setAddress(''); setNotes(''); setTags([])
      await fetch_(user!.id)
      await plan.refresh()
      setPanelOpen(false)
    }
    setLoading(false)
  }

  const openAddCustomer = () => {
    if (plan.isAtCustomerLimit) {
      toast.error(fr
        ? `Limite de ${plan.limits.maxCustomers} clients atteinte sur le forfait Démarrage. Passez à Pro pour un nombre illimité.`
        : `Démarrage plan limit of ${plan.limits.maxCustomers} customers reached. Upgrade to Pro for unlimited.`)
      return
    }
    setPanelOpen(true)
  }

  const deleteCustomer = async (id: string) => {
    const { confirmed } = await confirm({
      title: fr ? 'Supprimer ce client ?' : 'Delete this customer?',
      description: fr
        ? 'Cette action est irréversible. Tous les interventions et factures associés seront dissociés.'
        : 'This cannot be undone. All associated jobs and invoices will be unlinked.',
      confirmLabel: fr ? 'Supprimer' : 'Delete',
    })
    if (!confirmed) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    setMenuOpen(null)
    toast.success(t.success.deleted)
  }

  const exportCSV = () => {
    const header = fr
      ? ['Nom', 'Courriel', 'Téléphone', 'Adresse', 'Étiquettes', 'Valeur cumulée', 'Ajouté le']
      : ['Name', 'Email', 'Phone', 'Address', 'Tags', 'Lifetime value', 'Added']
    const rows = customers.map((c) => [
      c.name,
      c.email || '',
      c.phone || '',
      c.address || '',
      (c.tags || []).join('; '),
      c.lifetime_value ? c.lifetime_value.toFixed(2) : '0',
      new Date(c.created_at).toLocaleDateString(),
    ])
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'customers.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const AddButton = (
    <div className="flex items-center gap-2">
      <button
        onClick={exportCSV}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
      >
        <Download className="h-4 w-4" /> {fr ? 'Exporter CSV' : 'Export CSV'}
      </button>
      <Link
        href="/customers/import"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
      >
        <Upload className="h-4 w-4" /> {fr ? 'Importer CSV' : 'Import CSV'}
      </Link>
      <button
        onClick={openAddCustomer}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-md active:scale-[0.98] transition-all duration-150"
      >
        <Plus className="h-4 w-4" /> {fr ? 'Ajouter un client' : 'Add customer'}
      </button>
    </div>
  )

  if (pageLoading) return (
    <AppLayout title={fr ? 'Clients' : 'Customers'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3">
        <SkeletonText className="h-10 w-64 mb-3" />
        {[...Array(5)].map((_, i) => <SkeletonListRow key={i} />)}
      </div>
    </AppLayout>
  )

  const totalLTV = customers.reduce((s, c) => s + (c.lifetime_value || 0), 0)

  return (
    <AppLayout title={fr ? 'Clients' : 'Customers'} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Page header */}
        <div className="mb-6 border-b border-gray-100 dark:border-gray-800 pb-5">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{fr ? 'Clients' : 'Customers'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fr ? 'Gérez vos contacts et leur historique' : 'Manage your contacts and their history'}</p>
        </div>

        {/* Usage bar — Démarrage plan only */}
        {normalizePlan(plan.plan) === 'demarrage' && plan.limits.maxCustomers !== Infinity && (() => {
          const pct = Math.min(100, Math.round((plan.customerCount / plan.limits.maxCustomers) * 100))
          const barCls = pct >= 92 ? 'bg-red-500' : pct >= 80 ? 'bg-orange-500' : 'bg-emerald-500'
          const txtCls = pct >= 92 ? 'text-red-700' : pct >= 80 ? 'text-orange-700' : 'text-gray-900'
          return (
            <div className="mb-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <span className={`font-semibold ${txtCls}`}>
                  {plan.customerCount} / {plan.limits.maxCustomers} {fr ? 'clients utilisés' : 'customers used'}
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 flex-1 min-w-0 truncate">{fr ? 'Forfait Démarrage' : 'Démarrage plan'}</span>
                {pct >= 100 && (
                  <UpgradePrompt variant="inline" feature={fr ? 'Clients illimités' : 'Unlimited customers'} requiredPlan="pro" />
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={`h-full ${barCls} transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })()}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: fr ? 'Total clients' : 'Total customers', value: customers.length, icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400', accent: 'border-l-blue-500' },
            { label: fr ? 'Avec courriel' : 'With email',    value: customers.filter((c) => c.email).length, icon: Mail, bg: 'bg-indigo-50 dark:bg-indigo-950/40', color: 'text-indigo-600 dark:text-indigo-400', accent: 'border-l-indigo-500' },
            { label: fr ? 'Valeur cumulée totale' : 'Total lifetime value', value: fmtMoney(totalLTV, lang), icon: TrendingUp, bg: 'bg-emerald-50 dark:bg-emerald-950/40', color: 'text-emerald-600 dark:text-emerald-400', accent: 'border-l-emerald-500' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border border-gray-100 dark:border-gray-800 border-l-4 ${s.accent} bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                  <s.icon className={`${s.color}`} style={{ width: '18px', height: '18px' }} />
                </div>
              </div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={fr ? 'Rechercher par nom, courriel, telephone, etiquettes...' : 'Search by name, email, phone, tags...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-4 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-sm"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 shrink-0 tabular-nums">{filtered.length} {fr ? 'sur' : 'of'} {customers.length}</p>
        </div>

        {customers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <EmptyState
              icon={Users}
              title={fr ? "Aucun client pour l'instant" : 'No customers yet'}
              description={fr ? 'Ajoutez votre premier client ou partagez votre lien de reservation.' : 'Add your first customer or share your booking link.'}
              actions={[
                { label: fr ? 'Ajouter un client' : 'Add customer', onClick: openAddCustomer, variant: 'primary' },
                { label: fr ? 'Copier le lien de reservation' : 'Copy booking link', onClick: copyBookingLink, variant: 'secondary' },
              ]}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-20 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
              <Search className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{fr ? 'Aucun client ne correspond a' : 'No customer matches'} &ldquo;<span className="font-semibold text-gray-900 dark:text-white">{search}</span>&rdquo;</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{fr ? 'Essayez un autre terme de recherche' : 'Try a different search term'}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/60">
                    {(fr ? ['Client', 'Contact', 'Adresse', 'Etiquettes', 'VCV', 'Ajoute', ''] : ['Customer', 'Contact', 'Address', 'Tags', 'LTV', 'Added', '']).map((col) => (
                      <th key={col} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                  {paged.map((c, idx) => (
                    <tr key={c.id} className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-900/10 transition-colors duration-100 group ${idx % 2 === 1 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''}`}>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(c.name)} text-white text-xs font-bold shadow-sm`}>{initials(c.name)}</div>
                          <Link href={`/customers/${c.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{c.name}</Link>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="space-y-0.5">
                          {c.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />{c.email}</p>}
                          {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600" />{c.phone}</p>}
                          {!c.email && !c.phone && <span className="text-gray-300 dark:text-gray-600">--</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        {c.address
                          ? <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 shrink-0" /><span className="truncate">{c.address}</span></span>
                          : <span className="text-gray-300 dark:text-gray-600">--</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {(c.tags || []).slice(0, 2).map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                              <Tag className="h-2.5 w-2.5" />{tag}
                            </span>
                          ))}
                          {(c.tags || []).length > 2 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">+{(c.tags || []).length - 2}</span>
                          )}
                          {(c.tags || []).length === 0 && <span className="text-gray-300 dark:text-gray-600">--</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {c.lifetime_value && c.lifetime_value > 0 ? fmtMoney(c.lifetime_value, lang) : <span className="text-gray-300 dark:text-gray-600">--</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400 dark:text-gray-500">
                        {fmtDate(c.created_at, lang)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <Link href={`/customers/${c.id}`} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors duration-150">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <div className="relative">
                            <button onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuOpen === c.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1 slide-up">
                                  <button onClick={() => deleteCustomer(c.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors duration-150">
                                    <Trash2 className="h-4 w-4" /> {fr ? 'Supprimer' : 'Delete'}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50 dark:divide-gray-800/50">
              {paged.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`} className="block p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 active:scale-[0.99] transition-all duration-150">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(c.name)} text-white text-sm font-bold shadow-sm`}>{initials(c.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{c.name}</p>
                      {c.address && <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{c.address}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {c.lifetime_value && c.lifetime_value > 0 ? (
                        <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmtMoney(c.lifetime_value, lang)}</span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-14 space-y-0.5">
                    {c.email  && <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><Mail  className="h-3 w-3 text-gray-300 dark:text-gray-600" />{c.email}</p>}
                    {c.phone  && <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400"><Phone className="h-3 w-3 text-gray-300 dark:text-gray-600" />{c.phone}</p>}
                  </div>
                  {(c.tags || []).length > 0 && (
                    <div className="ml-14 mt-2 flex flex-wrap gap-1">
                      {(c.tags || []).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add customer panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{fr ? 'Ajouter un client' : 'Add customer'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Remplissez les informations du client ci-dessous' : 'Fill in the customer info below'}</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addCustomer} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Nom complet' : 'Full name'} <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Jean Tremblay" value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  required
                  className={`block w-full rounded-xl border ${errName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white dark:bg-gray-800 px-3.5 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all`} />
                <FieldError message={errName} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Adresse courriel' : 'Email address'}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="email" placeholder="jean@exemple.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white dark:bg-gray-800 pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all`} />
                </div>
                <FieldError message={errEmail} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Numéro de téléphone' : 'Phone number'}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="tel" placeholder="+1 (514) 000-0000" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className={`block w-full rounded-xl border ${errPhone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white dark:bg-gray-800 pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-all`} />
                </div>
                <FieldError message={errPhone} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Adresse' : 'Address'}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    placeholder="123 Main St, City, State 00000"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3.5 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Étiquettes' : 'Tags'}</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={fr ? 'ex. VIP, Commercial' : 'e.g. VIP, Commercial'}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button type="button" onClick={addTag} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{fr ? 'Ajouter' : 'Add'}</button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                        {tag}
                        <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-indigo-400 hover:text-indigo-700">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{fr ? 'Notes' : 'Notes'}</label>
                <textarea
                  placeholder={fr ? 'Notes internes sur ce client...' : 'Internal notes about this customer...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3.5 py-2.5 text-base sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button onClick={addCustomer} disabled={loading || formInvalid} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? (fr ? 'Ajout en cours...' : 'Adding...') : (fr ? 'Ajouter un client' : 'Add customer')}
              </button>
            </div>
          </div>
        </>
      )}
      <MobileFAB onClick={openAddCustomer} label={fr ? 'Ajouter un client' : 'Add customer'} />
    </AppLayout>
  )
}
