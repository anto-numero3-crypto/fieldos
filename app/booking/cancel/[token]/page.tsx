'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

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

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}
function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  declined: 'Refusé',
  completed: 'Terminé',
}

export default function CancelBookingPage() {
  const { token } = useParams<{ token: string }>()

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Réservation introuvable</h1>
        <p className="text-sm text-gray-500">Ce lien d'annulation est invalide ou expiré.</p>
      </div>
    </div>
  )

  const alreadyCancelled = booking?.status === 'cancelled' || booking?.status === 'declined'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-800 px-6 py-5 text-white text-center">
            <h1 className="text-lg font-bold">Annulation de rendez-vous</h1>
          </div>

          <div className="px-6 py-6 space-y-5">
            {/* Booking details */}
            {booking && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Service</span>
                  <span className="font-semibold text-gray-900">{booking.service_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span className="font-semibold text-gray-900">{fmtDate(booking.requested_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Heure</span>
                  <span className="font-semibold text-gray-900">{fmtTime(booking.requested_time)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${alreadyCancelled ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'}`}>
                    {alreadyCancelled ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
              </div>
            )}

            {done || alreadyCancelled ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">
                  {done ? 'Rendez-vous annulé' : 'Ce rendez-vous est déjà annulé'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {done ? 'Un email de confirmation vous a été envoyé.' : 'Aucune action requise.'}
                </p>
              </div>
            ) : booking?.status === 'completed' ? (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                <p className="font-semibold text-gray-900">Ce rendez-vous est terminé</p>
                <p className="text-sm text-gray-500 mt-1">Impossible d'annuler un rendez-vous terminé.</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Raison d'annulation <span className="text-gray-400">(optionnel)</span>
                  </label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">Choisir une raison…</option>
                    <option value="Changement de plans">Changement de plans</option>
                    <option value="Conflit d'horaire">Conflit d'horaire</option>
                    <option value="Problème personnel">Problème personnel</option>
                    <option value="Service non requis">Service non requis</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {cancelling ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Annulation…</>
                  ) : 'Confirmer l\'annulation'}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Cette action est irréversible. Un email de confirmation sera envoyé.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
