'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import MobileFAB from '@/components/MobileFAB'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import { validateRequired, validateEmail, validatePhone } from '@/lib/validators'
import FieldError from '@/components/FieldError'
import EmptyState from '@/components/EmptyState'
import { SkeletonText, SkeletonListRow } from '@/components/ui/skeleton'
import { toast } from 'sonner'
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

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700', 'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700', 'bg-teal-100 text-teal-700',
]
const initials  = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const getColor  = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]
const fmt       = (n: number) => `$${n.toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

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
      toast.error('Configurez d\'abord votre lien de réservation dans Disponibilités.')
      return
    }
    const url = `https://gestivio.ca/book/${orgSlug}`
    navigator.clipboard.writeText(url)
    toast.success('Lien de réservation copié !')
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

  const fetch_ = async (uid: string) => {
    const { data } = await supabase
      .from('customers').select('*')
      .eq('user_id', uid).order('created_at', { ascending: false })
    setCustomers(data || [])
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true })
    if (formInvalid) { toast.error('Vérifiez les champs en surbrillance.'); return }
    setLoading(true)
    const { error } = await supabase.from('customers').insert({
      user_id: user!.id, name: name.trim(),
      email: email.trim() || null, phone: phone.trim() || null,
      address: address.trim() || null, notes: notes.trim() || null,
      tags: tags.length > 0 ? tags : null,
    })
    if (error) { toast.error(error.message) }
    else {
      toast.success('Client ajouté !')
      setName(''); setEmail(''); setPhone(''); setAddress(''); setNotes(''); setTags([])
      await fetch_(user!.id)
      await plan.refresh()
      setPanelOpen(false)
    }
    setLoading(false)
  }

  const openAddCustomer = () => {
    if (plan.isAtCustomerLimit) {
      toast.error(`Limite de ${plan.limits.maxCustomers} clients atteinte sur le forfait Starter. Passez à Pro pour un nombre illimité.`)
      return
    }
    setPanelOpen(true)
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm('Supprimer ce client ? Cette action est irréversible.')) return
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { toast.error(error.message); return }
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    setMenuOpen(null)
    toast.success('Client supprimé.')
  }

  const exportCSV = () => {
    const header = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Étiquettes', 'Valeur cumulée', 'Ajouté le']
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
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
      >
        <Download className="h-4 w-4" /> Exporter CSV
      </button>
      <Link
        href="/customers/import"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
      >
        <Upload className="h-4 w-4" /> Importer CSV
      </Link>
      <button
        onClick={openAddCustomer}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all"
      >
        <Plus className="h-4 w-4" /> Ajouter un client
      </button>
    </div>
  )

  if (pageLoading) return (
    <AppLayout title="Clients">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-3">
        <SkeletonText className="h-10 w-64 mb-3" />
        {[...Array(5)].map((_, i) => <SkeletonListRow key={i} />)}
      </div>
    </AppLayout>
  )

  const totalLTV = customers.reduce((s, c) => s + (c.lifetime_value || 0), 0)

  return (
    <AppLayout title="Clients" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats row */}
        {plan.plan === 'starter' && (
          <div className="mb-4 rounded-xl border border-gray-100 bg-white px-4 py-3 flex items-center gap-3 text-sm">
            <span className="font-semibold text-gray-900">{plan.customerCount}/{plan.limits.maxCustomers} clients</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 flex-1 min-w-0 truncate">Forfait Starter</span>
            {plan.isAtCustomerLimit && (
              <UpgradePrompt variant="inline" feature="Clients illimités" requiredPlan="pro" />
            )}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total clients', value: customers.length, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Avec email', value: customers.filter((c) => c.email).length, icon: Mail, bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { label: 'Valeur cumulée totale', value: fmt(totalLTV), icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} mb-2`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone, étiquettes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
            />
          </div>
          <p className="text-sm text-gray-500 shrink-0">{filtered.length} of {customers.length}</p>
        </div>

        {customers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={Users}
              title="Aucun client pour l'instant"
              description="Ajoutez votre premier client ou partagez votre lien de réservation."
              actions={[
                { label: 'Ajouter un client', onClick: openAddCustomer, variant: 'primary' },
                { label: 'Copier le lien de réservation', onClick: copyBookingLink, variant: 'secondary' },
              ]}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <Search className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun client ne correspond à &ldquo;<span className="font-medium">{search}</span>&rdquo;</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    {['Client', 'Contact', 'Adresse', 'Étiquettes', 'VCV', 'Ajouté', ''].map((col) => (
                      <th key={col} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getColor(c.name)}`}>{initials(c.name)}</div>
                          <Link href={`/customers/${c.id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">{c.name}</Link>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        <div className="space-y-0.5">
                          {c.email && <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-300" />{c.email}</p>}
                          {c.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-300" />{c.phone}</p>}
                          {!c.email && !c.phone && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500 max-w-xs">
                        {c.address
                          ? <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-300 shrink-0" /><span className="truncate">{c.address}</span></span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[140px]">
                          {(c.tags || []).slice(0, 2).map((tag) => (
                            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              <Tag className="h-2.5 w-2.5" />{tag}
                            </span>
                          ))}
                          {(c.tags || []).length > 2 && (
                            <span className="text-xs text-gray-400">+{(c.tags || []).length - 2}</span>
                          )}
                          {(c.tags || []).length === 0 && <span className="text-gray-300">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                        {c.lifetime_value && c.lifetime_value > 0 ? fmt(c.lifetime_value) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(c.created_at).toLocaleDateString('fr-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/customers/${c.id}`} className="rounded-lg p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                          <div className="relative">
                            <button onClick={() => setMenuOpen(menuOpen === c.id ? null : c.id)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {menuOpen === c.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-gray-100 bg-white shadow-lg py-1 slide-up">
                                  <button onClick={() => deleteCustomer(c.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <Trash2 className="h-4 w-4" /> Supprimer
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
            <div className="sm:hidden divide-y divide-gray-100">
              {filtered.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`} className="block p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getColor(c.name)}`}>{initials(c.name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      {c.lifetime_value && c.lifetime_value > 0 && <p className="text-xs text-emerald-600 font-medium">LTV: {fmt(c.lifetime_value)}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                  <div className="ml-12 space-y-0.5">
                    {c.email  && <p className="flex items-center gap-1.5 text-xs text-gray-500"><Mail  className="h-3 w-3" />{c.email}</p>}
                    {c.phone  && <p className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3" />{c.phone}</p>}
                    {c.address && <p className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="h-3 w-3" />{c.address}</p>}
                  </div>
                  {(c.tags || []).length > 0 && (
                    <div className="ml-12 mt-1.5 flex flex-wrap gap-1">
                      {(c.tags || []).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add customer panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Ajouter un client</h2>
                <p className="text-xs text-gray-400 mt-0.5">Remplissez les informations du client ci-dessous</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={addCustomer} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Jean Tremblay" value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  required
                  className={`block w-full rounded-xl border ${errName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <FieldError message={errName} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse courriel</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="email" placeholder="jean@exemple.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                </div>
                <FieldError message={errEmail} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="tel" placeholder="+1 (514) 000-0000" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className={`block w-full rounded-xl border ${errPhone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} bg-white pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                </div>
                <FieldError message={errPhone} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    placeholder="123 Main St, City, State 00000"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="block w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Étiquettes</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="ex. VIP, Commercial"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button type="button" onClick={addTag} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Ajouter</button>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  placeholder="Notes internes sur ce client..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                />
              </div>

            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={addCustomer} disabled={loading || formInvalid} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? 'Ajout en cours...' : 'Ajouter un client'}
              </button>
            </div>
          </div>
        </>
      )}
      <MobileFAB onClick={openAddCustomer} label="Ajouter un client" />
    </AppLayout>
  )
}
