'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pagination } from '@/components/Pagination'
import { usePagination } from '@/lib/hooks/usePagination'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import MobileFAB from '@/components/MobileFAB'
import UpgradePrompt from '@/components/UpgradePrompt'
import { usePlan } from '@/lib/hooks/usePlan'
import { validateRequired, validateEmail, validatePhone } from '@/lib/validators'
import FieldError from '@/components/FieldError'
import EmptyState from '@/components/EmptyState'
import { SkeletonCard } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/LanguageContext'
import {
  Users2, Plus, X, Mail, Phone, Shield, Wrench,
  Trash2, MoreHorizontal, Edit2, CheckCircle,
  Star, MapPin,
} from 'lucide-react'

interface TeamMember {
  id: string; name: string; email: string; phone: string | null; role: string
  skills: string[] | null; service_areas: string[] | null; hourly_rate: number | null
  is_active: boolean; color: string | null; created_at: string
}

const ROLE_CFG_FR: Record<string, { label: string; cls: string; icon: typeof Shield }> = {
  owner:      { label: 'Propriétaire', cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100', icon: Star },
  admin:      { label: 'Admin',        cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100', icon: Shield },
  dispatcher: { label: 'Répartiteur', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',       icon: Users2 },
  technician: { label: 'Technicien',  cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', icon: Wrench },
}
const ROLE_CFG_EN: Record<string, { label: string; cls: string; icon: typeof Shield }> = {
  owner:      { label: 'Owner',      cls: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100', icon: Star },
  admin:      { label: 'Admin',      cls: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100', icon: Shield },
  dispatcher: { label: 'Dispatcher', cls: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',       icon: Users2 },
  technician: { label: 'Technician', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', icon: Wrench },
}

const AVATAR_COLORS = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500','bg-orange-500','bg-teal-500']
const getColor = (n: string) => AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length]
const initials = (n: string) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function TeamPage() {
  const [user, setUser]     = useState<{ id: string } | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [panelOpen, setPanelOpen] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const { page: teamPage, setPage: setTeamPage, range: teamRange, pageSize: teamPageSize } = usePagination(members.length)
  const pagedMembers = useMemo(() => members.slice(teamRange.from, teamRange.to), [members, teamRange.from, teamRange.to])
  const plan = usePlan()
  const [editMember, setEditMember] = useState<TeamMember | null>(null)

  // Form
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [role, setRole]     = useState('technician')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const confirm = useConfirm()
  const { lang, t } = useLanguage()
  const fr = lang === 'fr'
  const ROLE_CFG = fr ? ROLE_CFG_FR : ROLE_CFG_EN

  const errName  = touched.name  ? validateRequired(name) : ''
  const errEmail = touched.email ? validateEmail(email) : ''
  const errPhone = touched.phone ? validatePhone(phone, false) : ''
  const formInvalid = !!validateRequired(name) || !!validateEmail(email) || !!validatePhone(phone, false)
  const [hourlyRate, setHourlyRate] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      await fetchMembers(data.user.id)
      setPageLoading(false)
    }
    init()
  }, [])

  const fetchMembers = async (uid: string) => {
    const { data } = await supabase.from('team_members').select('*').eq('owner_user_id', uid).order('created_at')
    setMembers(data || [])
  }

  const resetForm = () => { setName(''); setEmail(''); setPhone(''); setRole('technician'); setHourlyRate(''); setSkills([]); setSkillInput(''); setEditMember(null) }

  const openAdd = () => { resetForm(); setPanelOpen(true) }

  const openEdit = (m: TeamMember) => {
    setEditMember(m)
    setName(m.name); setEmail(m.email); setPhone(m.phone || ''); setRole(m.role)
    setHourlyRate(m.hourly_rate?.toString() || ''); setSkills(m.skills || [])
    setPanelOpen(true)
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills([...skills, s])
    setSkillInput('')
  }

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true })
    if (formInvalid) { toast.error(t.errors.required); return }
    setLoading(true)

    const payload = {
      owner_user_id: user!.id, name: name.trim(), email: email.trim(),
      phone: phone.trim() || null, role,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      skills: skills.length > 0 ? skills : null,
    }

    let error
    if (editMember) {
      ;({ error } = await supabase.from('team_members').update(payload).eq('id', editMember.id))
    } else {
      ;({ error } = await supabase.from('team_members').insert({ ...payload, is_active: true }))
    }

    if (error) { toast.error(error.message) }
    else {
      toast.success(editMember ? t.success.updated : t.success.created)
      resetForm()
      await fetchMembers(user!.id)
      setPanelOpen(false)
    }
    setLoading(false)
  }

  const deleteMember = async (id: string) => {
    const { confirmed } = await confirm({
      title: fr ? 'Retirer ce membre ?' : 'Remove this member?',
      description: fr ? 'Ce membre perdra accès à la plateforme.' : 'This member will lose access to the platform.',
      confirmLabel: fr ? 'Retirer' : 'Remove',
    })
    if (!confirmed) return
    await supabase.from('team_members').delete().eq('id', id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
    setMenuOpen(null)
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('team_members').update({ is_active: !current }).eq('id', id)
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, is_active: !current } : m))
    setMenuOpen(null)
  }

  const AddButton = (
    <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all">
      <Plus className="h-4 w-4" /> {fr ? 'Ajouter un membre' : 'Add member'}
    </button>
  )

  if (pageLoading) return (
    <AppLayout title={fr ? 'Équipe' : 'Team'}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <SkeletonCard key={i} className="h-40" />)}
      </div>
    </AppLayout>
  )

  if (!plan.loading && !plan.isFeatureAvailable('hasTeamManagement')) {
    return (
      <AppLayout title={fr ? 'Équipe' : 'Team'}>
        <div className="p-6 sm:p-10">
          <UpgradePrompt
            variant="overlay"
            feature={fr ? "Gestion d'équipe" : 'Team management'}
            requiredPlan="pro"
            description={fr
              ? "Invitez jusqu'à 5 techniciens, assignez-leur des interventions et suivez leurs performances en temps réel avec le forfait Pro."
              : 'Invite up to 5 technicians, assign them jobs, and track their performance in real time with the Pro plan.'}
          />
        </div>
      </AppLayout>
    )
  }

  const activeCount = members.filter((m) => m.is_active).length

  return (
    <AppLayout title={fr ? 'Équipe' : 'Team'} actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: fr ? 'Total membres' : 'Total members', value: members.length, icon: Users2, bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { label: fr ? 'Actifs' : 'Active',               value: activeCount,    icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: fr ? 'Techniciens' : 'Technicians',     value: members.filter((m) => m.role === 'technician').length, icon: Wrench, bg: 'bg-amber-50', color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white">
            <EmptyState
              icon={Users2}
              title={fr ? "Aucun membre d'équipe" : 'No team members'}
              description={fr ? 'Invitez vos techniciens pour leur assigner des emplois.' : 'Invite your technicians so you can assign them jobs.'}
              actions={[{ label: fr ? 'Inviter un membre' : 'Invite a member', onClick: openAdd, variant: 'primary' }]}
            />
          </div>
        ) : (
          <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pagedMembers.map((m) => {
              const rcfg = ROLE_CFG[m.role] || ROLE_CFG.technician
              return (
                <div key={m.id} className={`rounded-2xl border border-gray-100 bg-white shadow-sm p-5 transition-all hover:shadow-md ${!m.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white ${getColor(m.name)}`}>
                        {initials(m.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{m.name}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${rcfg.cls}`}>
                          <rcfg.icon className="h-3 w-3" />{rcfg.label}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)} className="rounded-lg p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpen === m.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-gray-100 bg-white shadow-lg py-1 slide-up">
                            <button onClick={() => { openEdit(m); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              <Edit2 className="h-4 w-4" /> {fr ? 'Modifier' : 'Edit'}
                            </button>
                            <button onClick={() => toggleActive(m.id, m.is_active)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              {m.is_active ? (fr ? '🔴 Désactiver' : '🔴 Deactivate') : (fr ? '🟢 Activer' : '🟢 Activate')}
                            </button>
                            <div className="border-t border-gray-100 mt-1 pt-1">
                              <button onClick={() => deleteMember(m.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" /> {fr ? 'Retirer' : 'Remove'}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm text-gray-500">
                    <p className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-300" />{m.email}</p>
                    {m.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-300" />{m.phone}</p>}
                    {m.hourly_rate && <p className="flex items-center gap-1.5 font-medium text-gray-700"><span className="text-gray-300 font-normal">$/hr</span>${m.hourly_rate}/hr</p>}
                  </div>

                  {(m.skills || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(m.skills || []).slice(0, 3).map((s) => (
                        <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{s}</span>
                      ))}
                      {(m.skills || []).length > 3 && <span className="text-xs text-gray-400">+{(m.skills || []).length - 3}</span>}
                    </div>
                  )}

                  {!m.is_active && <div className="mt-3 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-400">{fr ? 'Inactif' : 'Inactive'}</div>}
                </div>
              )
            })}
          </div>
          <div className="mt-4 rounded-2xl border border-gray-100 bg-white overflow-hidden">
            <Pagination page={teamPage} pageSize={teamPageSize} total={members.length} onPageChange={setTeamPage} />
          </div>
          </>
        )}
      </div>

      {/* Add/Edit panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{editMember ? (fr ? 'Modifier le membre' : 'Edit member') : (fr ? 'Ajouter un membre' : 'Add member')}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{fr ? 'Remplissez les informations du membre' : 'Fill in the member info'}</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={saveMember} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Nom complet' : 'Full name'} <span className="text-red-500">*</span></label>
                <input type="text" placeholder={fr ? 'Prénom Nom' : 'First Last'} value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  required
                  className={`block w-full rounded-xl border ${errName ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                <FieldError message={errName} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Courriel' : 'Email'} <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="email" placeholder="alex@company.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    required
                    className={`block w-full rounded-xl border ${errEmail ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} pl-9 pr-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                </div>
                <FieldError message={errEmail} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Téléphone' : 'Phone'}</label>
                  <input type="tel" placeholder="+1 (514) 000-0000" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    className={`block w-full rounded-xl border ${errPhone ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'} px-3.5 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all`} />
                  <FieldError message={errPhone} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Taux horaire' : 'Hourly rate'}</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input type="number" placeholder="0.00" min={0} step="0.50" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-7 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Rôle' : 'Role'}</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                  <option value="technician">{fr ? 'Technicien' : 'Technician'}</option>
                  <option value="dispatcher">{fr ? 'Répartiteur' : 'Dispatcher'}</option>
                  <option value="admin">Admin</option>
                  <option value="owner">{fr ? 'Propriétaire' : 'Owner'}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Compétences' : 'Skills'}</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder={fr ? 'ex. HVAC, Plomberie' : 'e.g. HVAC, Plumbing'} value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  <button type="button" onClick={addSkill} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">{fr ? 'Ajouter' : 'Add'}</button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {s}<button type="button" onClick={() => setSkills(skills.filter((sk) => sk !== s))} className="text-gray-400 hover:text-gray-700">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">{fr ? 'Annuler' : 'Cancel'}</button>
              <button onClick={saveMember} disabled={loading || formInvalid} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                {loading ? (fr ? 'Enregistrement...' : 'Saving...') : editMember ? (fr ? 'Enregistrer' : 'Save') : (fr ? 'Ajouter' : 'Add')}
              </button>
            </div>
          </div>
        </>
      )}
      <MobileFAB onClick={openAdd} label={fr ? 'Ajouter un membre' : 'Add member'} />
    </AppLayout>
  )
}
