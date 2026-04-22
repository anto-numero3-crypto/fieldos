'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

interface Booking {
  id: string
  token: string
  customer_name: string
  customer_email: string
  service_name: string
  requested_date: string
  requested_time: string
  status: string
  org_id: string
}

export default function CancelBookingPage() {
  const { token } = useParams<{ token: string }>()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const fmtDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString(fr ? 'fr-CA' : 'en-CA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  const fmtTime = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
  }

  const STATUS_LABELS: Record<string, string> = fr
    ? { pending: 'En attente', confirmed: 'Confirm\u00e9e', cancelled: 'Annul\u00e9e', declined: 'Refus\u00e9e', completed: 'Compl\u00e9t\u00e9e' }
    : { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled', declined: 'Declined', completed: 'Completed' }

  const REASONS: Array<{ value: string; label: string }> = fr
    ? [
      { value: 'Changement de plans', label: 'Changement de plans' },
      { value: "Conflit d'horaire",    label: "Conflit d'horaire" },
      { value: 'Problème personnel',   label: 'Problème personnel' },
      { value: 'Service non requis',   label: 'Service non requis' },
      { value: 'Autre',                label: 'Autre' },
    ]
    : [
      { value: 'Changement de plans', label: 'Change of plans' },
      { value: "Conflit d'horaire",    label: 'Schedule conflict' },
      { value: 'Problème personnel',   label: 'Personal issue' },
      { value: 'Service non requis',   label: 'Service no longer needed' },
      { value: 'Autre',                label: 'Other' },
    ]

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [reason, setReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetch(`/api/bookings/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booking) setBooking(data.booking)
        else setNotFound(true)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  const handleCancel = async () => {
    if (!booking) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/bookings/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: reason || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setDone(true)
        setBooking((prev) => prev ? { ...prev, status: 'cancelled' } : null)
      }
    } catch {
      // silent
    }
    setCancelling(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 dark:border-gray-700 border-t-indigo-600" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 relative">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <div className="text-center max-w-sm">
        <AlertCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{fr ? 'Réservation introuvable' : 'Booking not found'}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{fr ? "Ce lien d'annulation est invalide ou expiré." : 'This cancellation link is invalid or has expired.'}</p>
      </div>
    </div>
  )

  const alreadyCancelled = booking?.status === 'cancelled' || booking?.status === 'declined'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-800 dark:bg-gray-800 px-6 py-5 text-white text-center">
            <h1 className="text-lg font-bold">{fr ? 'Annulation de rendez-vous' : 'Cancel appointment'}</h1>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Booking details */}
            {booking && (
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{fr ? 'Service' : 'Service'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{booking.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{fr ? 'Date' : 'Date'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(booking.requested_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{fr ? 'Heure' : 'Time'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmtTime(booking.requested_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{fr ? 'Statut' : 'Status'}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${alreadyCancelled ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
                    {alreadyCancelled ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
              </div>
            )}

            {done || alreadyCancelled ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 dark:text-white">
                  {done
                    ? (fr ? 'Rendez-vous annulé' : 'Appointment cancelled')
                    : (fr ? 'Ce rendez-vous est déjà annulé' : 'This appointment is already cancelled')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {done
                    ? (fr ? 'Un email de confirmation vous a été envoyé.' : 'A confirmation email has been sent to you.')
                    : (fr ? 'Aucune action requise.' : 'No action required.')}
                </p>
              </div>
            ) : booking?.status === 'completed' ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900 dark:text-white">{fr ? 'Ce rendez-vous est terminé' : 'This appointment is completed'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{fr ? "Impossible d'annuler un rendez-vous terminé." : 'A completed appointment cannot be cancelled.'}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    {fr ? "Raison d'annulation" : 'Cancellation reason'}{' '}
                    <span className="text-gray-400 dark:text-gray-500">({fr ? 'optionnel' : 'optional'})</span>
                  </label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">{fr ? 'Choisir une raison…' : 'Choose a reason…'}</option>
                    {REASONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {cancelling ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> {fr ? 'Annulation…' : 'Cancelling…'}</>
                  ) : (fr ? "Confirmer l'annulation" : 'Confirm cancellation')}
                </button>

                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  {fr ? 'Cette action est irréversible. Un email de confirmation sera envoyé.' : 'This action is irreversible. A confirmation email will be sent.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
