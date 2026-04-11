'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  Users2, Plus, X, Mail, Phone, Shield, Wrench,
  AlertCircle, CheckCircle, Trash2, MoreHorizontal, Edit2,
  Star, MapPin,
} from 'lucide-react'

interface TeamMember {
  id: string; name: string; email: string; phone: string | null; role: string
  skills: string[] | null; service_areas: string[] | null; hourly_rate: number | null
  is_active: boolean; color: string | null; created_at: string
}

const ROLE_CFG: Record<string, { label: string; cls: string; icon: typeof Shield }> = {
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
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)

  // Form
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [phone, setPhone]   = useState('')
  const [role, setRole]     = useState('technician')
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

  const openAdd = () => { resetForm(); setPanelOpen(true); setMessage(null) }

  const openEdit = (m: TeamMember) => {
    setEditMember(m)
    setName(m.name); setEmail(m.email); setPhone(m.phone || ''); setRole(m.role)
    setHourlyRate(m.hourly_rate?.toString() || ''); setSkills(m.skills || [])
    setPanelOpen(true); setMessage(null)
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) setSkills([...skills, s])
    setSkillInput('')
  }

  const saveMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setMessage({ text: 'Name and email are required.', type: 'error' }); return }
    setLoading(true); setMessage(null)

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

    if (error) { setMessage({ text: error.message, type: 'error' }) }
    else {
      setMessage({ text: editMember ? 'Member updated!' : 'Team member added!', type: 'success' })
      resetForm()
      await fetchMembers(user!.id)
      setTimeout(() => { setPanelOpen(false); setMessage(null) }, 1000)
    }
    setLoading(false)
  }

  const deleteMember = async (id: string) => {
    if (!confirm('Remove this team member?')) return
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
      <Plus className="h-4 w-4" /> Add Member
    </button>
  )

  if (pageLoading) return (
    <AppLayout title="Team">
      <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
      </div>
    </AppLayout>
  )

  const activeCount = members.filter((m) => m.is_active).length

  return (
    <AppLayout title="Team" actions={AddButton}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Members', value: members.length, icon: Users2, bg: 'bg-indigo-50', color: 'text-indigo-600' },
            { label: 'Active',        value: activeCount,    icon: CheckCircle, bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Technicians',   value: members.filter((m) => m.role === 'technician').length, icon: Wrench, bg: 'bg-amber-50', color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${s.bg} mb-2`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
            </div>
          ))}
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50"><Users2 className="h-7 w-7 text-indigo-500" /></div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No team members yet</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-xs">Add technicians, dispatchers, and admins to build your field service team.</p>
            <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
              <Plus className="h-4 w-4" /> Add first team member
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
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
                              <Edit2 className="h-4 w-4" /> Edit
                            </button>
                            <button onClick={() => toggleActive(m.id, m.is_active)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                              {m.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                            </button>
                            <div className="border-t border-gray-100 mt-1 pt-1">
                              <button onClick={() => deleteMember(m.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                <Trash2 className="h-4 w-4" /> Remove
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

                  {!m.is_active && <div className="mt-3 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-400">Inactive</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit panel */}
      {panelOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/50 backdrop-blur-sm fade-in" onClick={() => setPanelOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-white shadow-2xl slide-over flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{editMember ? 'Edit Team Member' : 'Add Team Member'}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in the team member details</p>
              </div>
              <button type="button" onClick={() => setPanelOpen(false)} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={saveMember} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Alex Johnson" value={name} onChange={(e) => setName(e.target.value)} required className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="email" placeholder="alex@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="block w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hourly Rate</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span><input type="number" placeholder="0.00" min={0} step="0.50" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-7 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                  <option value="technician">Technician</option>
                  <option value="dispatcher">Dispatcher</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="e.g. HVAC, Plumbing" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  <button type="button" onClick={addSkill} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Add</button>
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

              {message && (
                <div className={`flex items-start gap-2.5 rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                  {message.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  {message.text}
                </div>
              )}
            </form>

            <div className="flex items-center gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveMember} disabled={loading} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
                {loading ? 'Saving...' : editMember ? 'Save Changes' : 'Add Member'}
              </button>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  )
}
