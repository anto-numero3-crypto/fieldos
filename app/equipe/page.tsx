'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import { useLanguage } from '@/lib/LanguageContext'
import { usePlan } from '@/lib/hooks/usePlan'
import { normalizePlan } from '@/lib/plan-limits'
import { isModuleEnabled } from '@/lib/modules'
import UpgradePrompt from '@/components/UpgradePrompt'
import EmptyState from '@/components/EmptyState'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Users, Plus, X, Mail, Phone, UserPlus, Lock, Shield, Send,
  MoreHorizontal, Edit2, UserX, Loader2,
} from 'lucide-react'

interface Employee {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  phone: string | null
  color: string
  created_at: string
}

const PRESET_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']

export default function TeamPage() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'
  const plan = usePlan()
  const confirm = useConfirm()
  const normalizedPlan = normalizePlan(plan.plan)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [orgModules, setOrgModules] = useState<Record<string, boolean> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  // Form state
  const [fFirstName, setFFirstName] = useState('')
  const [fLastName, setFLastName] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fColor, setFColor] = useState('#6366f1')
  const [submitting, setSubmitting] = useState(false)

  const loadEmployees = async () => {
    const res = await fetch('/api/employees')
    if (res.ok) {
      const data = await res.json()
      setEmployees(data.employees || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      const { data: org } = await supabase
        .from('organizations')
        .select('enabled_modules')
        .eq('owner_user_id', auth.user.id)
        .single()

      setOrgModules(org?.enabled_modules || null)
      await loadEmployees()
    }
    init()
  }, [])

  const moduleEnabled = isModuleEnabled(orgModules, plan.plan, 'team_management')

  const openInviteModal = () => {
    setEditEmployee(null)
    setFFirstName('')
    setFLastName('')
    setFEmail('')
    setFPhone('')
    setFColor('#6366f1')
    setModalOpen(true)
  }

  const openEditModal = (emp: Employee) => {
    setEditEmployee(emp)
    setFFirstName(emp.first_name)
    setFLastName(emp.last_name)
    setFEmail(emp.email)
    setFPhone(emp.phone || '')
    setFColor(emp.color || '#6366f1')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!fFirstName.trim() || !fLastName.trim()) return
    setSubmitting(true)

    if (editEmployee) {
      // Update
      const res = await fetch(`/api/employees/${editEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: fFirstName.trim(),
          last_name: fLastName.trim(),
          phone: fPhone.trim() || null,
          color: fColor,
        }),
      })
      if (res.ok) {
        toast.success(fr ? 'Employé mis à jour' : 'Employee updated')
        setModalOpen(false)
        await loadEmployees()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    } else {
      // Invite
      if (!fEmail.trim()) { setSubmitting(false); return }
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fFirstName.trim(),
          lastName: fLastName.trim(),
          email: fEmail.trim(),
          phone: fPhone.trim() || undefined,
          color: fColor,
        }),
      })
      if (res.ok) {
        toast.success(fr ? 'Invitation envoyée!' : 'Invitation sent!')
        setModalOpen(false)
        await loadEmployees()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error')
      }
    }
    setSubmitting(false)
  }

  const deactivate = async (emp: Employee) => {
    const result = await confirm({
      title: fr ? 'Désactiver cet employé?' : 'Deactivate this employee?',
      description: fr
        ? `${emp.first_name} ${emp.last_name} ne pourra plus accéder à l'application.`
        : `${emp.first_name} ${emp.last_name} will no longer be able to access the app.`,
      confirmLabel: fr ? 'Désactiver' : 'Deactivate',
      destructive: true,
    })
    if (!result.confirmed) return

    const res = await fetch(`/api/employees/${emp.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(fr ? 'Employé désactivé' : 'Employee deactivated')
      await loadEmployees()
    }
  }

  const resendInvite = async (emp: Employee) => {
    const res = await fetch('/api/employees/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: emp.first_name,
        lastName: emp.last_name,
        email: emp.email,
        phone: emp.phone || undefined,
        color: emp.color,
      }),
    })
    if (res.ok) {
      toast.success(fr ? 'Invitation renvoyée' : 'Invitation resent')
    } else {
      // If duplicate, just deactivate old and re-invite
      toast.error(fr ? 'Impossible de renvoyer' : 'Could not resend')
    }
  }

  const activeCount = employees.filter(e => e.status !== 'inactive').length

  // Not enabled
  if (!plan.loading && !moduleEnabled) {
    if (normalizedPlan === 'demarrage') {
      return (
        <AppLayout title={fr ? 'Équipe' : 'Team'}>
          <UpgradePrompt
            feature={fr ? "Gestion d'équipe" : 'Team management'}
            requiredPlan="pro"
          />
        </AppLayout>
      )
    }

    return (
      <AppLayout title={fr ? 'Équipe' : 'Team'}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {fr ? "Module Gestion d'équipe" : 'Team Management Module'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            {fr
              ? "Activez le module Gestion d'équipe dans Paramètres pour inviter des employés et leur assigner des interventions."
              : 'Enable the Team Management module in Settings to invite employees and assign jobs to them.'}
          </p>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Shield className="w-4 h-4" />
            {fr ? 'Paramètres → Modules' : 'Settings → Modules'}
          </a>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title={fr ? 'Équipe' : 'Team'}
      actions={
        <button
          onClick={openInviteModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          {fr ? 'Inviter un employé' : 'Invite employee'}
        </button>
      }
    >
      {/* Pro plan limit banner */}
      {normalizedPlan === 'pro' && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fr ? 'Employés' : 'Employees'}
            </span>
            <span className="text-sm text-gray-500">{activeCount} / 5</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (activeCount / 5) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={fr ? 'Aucun employé' : 'No employees'}
          description={fr ? "Invitez votre premier employé pour commencer." : 'Invite your first employee to get started.'}
          actions={[{
            label: fr ? 'Inviter un employé' : 'Invite employee',
            onClick: openInviteModal,
            variant: 'primary' as const,
          }]}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map((emp) => (
            <Link
              href={`/equipe/${emp.id}`}
              key={emp.id}
              className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow block"
            >
              {/* Actions menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {menuOpen === emp.id && (
                  <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => { setMenuOpen(null); openEditModal(emp) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> {fr ? 'Modifier' : 'Edit'}
                    </button>
                    {emp.status === 'invited' && (
                      <button
                        onClick={() => { setMenuOpen(null); resendInvite(emp) }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Send className="w-3.5 h-3.5" /> {fr ? "Renvoyer l'invitation" : 'Resend invite'}
                      </button>
                    )}
                    <button
                      onClick={() => { setMenuOpen(null); deactivate(emp) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <UserX className="w-3.5 h-3.5" /> {fr ? 'Désactiver' : 'Deactivate'}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: emp.color || '#6366f1' }}
                >
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{emp.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    emp.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : emp.status === 'invited'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {emp.status === 'active' ? (fr ? 'Actif' : 'Active') : emp.status === 'invited' ? (fr ? 'Invité' : 'Invited') : (fr ? 'Inactif' : 'Inactive')}
                </span>
                {emp.phone && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="w-3 h-3" /> {emp.phone}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Invite / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setModalOpen(false)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editEmployee
                  ? (fr ? 'Modifier l\'employé' : 'Edit employee')
                  : (fr ? 'Inviter un employé' : 'Invite employee')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Prénom' : 'First name'} *
                  </label>
                  <input
                    type="text"
                    value={fFirstName}
                    onChange={(e) => setFFirstName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Nom' : 'Last name'} *
                  </label>
                  <input
                    type="text"
                    value={fLastName}
                    onChange={(e) => setFLastName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {!editEmployee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {fr ? 'Courriel' : 'Email'} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={fEmail}
                      onChange={(e) => setFEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fr ? 'Téléphone' : 'Phone'} ({fr ? 'optionnel' : 'optional'})
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={fPhone}
                    onChange={(e) => setFPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {fr ? 'Couleur' : 'Color'}
                </label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${fColor === c ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {fr ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !fFirstName.trim() || !fLastName.trim() || (!editEmployee && !fEmail.trim())}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editEmployee
                  ? (fr ? 'Enregistrer' : 'Save')
                  : (fr ? 'Envoyer l\'invitation' : 'Send invitation')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
