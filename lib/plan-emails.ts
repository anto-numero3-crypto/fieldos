// Plan-lifecycle email templates. Server-only — uses Resend directly.
// Call sendPlanEmail() from webhook handlers, cron, or signup flow.

import { Resend } from 'resend'
import { PLAN_PRICING } from '@/lib/plan-limits'

const FROM = 'Gestivio <noreply@gestivio.ca>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gestivio.ca'

export type PlanEmailType =
  | 'welcome_trial'
  | 'trial_ending_3d'
  | 'trial_expired'
  | 'payment_success'
  | 'payment_failed'
  | 'subscription_cancelled'

interface Ctx {
  to: string
  name?: string
  planLabel?: string
  planPrice?: string
  nextBilling?: string
  daysLeft?: number
}

function shell(title: string, body: string, ctaLabel?: string, ctaHref?: string) {
  const cta = ctaLabel && ctaHref
    ? `<div style="margin:28px 0"><a href="${ctaHref}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:15px">${ctaLabel}</a></div>`
    : ''
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#111827">
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="font-size:20px;font-weight:700;color:#4f46e5;margin-bottom:20px">Gestivio</div>
  <h1 style="font-size:22px;margin:0 0 12px 0;color:#111827">${title}</h1>
  <div style="font-size:15px;line-height:1.65;color:#374151">${body}</div>
  ${cta}
  <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:16px;color:#9ca3af;font-size:12px;line-height:1.6">
    Gestivio · La plateforme des entrepreneurs en services · Fait au Québec 🍁<br>
    <a href="${APP_URL}" style="color:#6366f1;text-decoration:none">gestivio.ca</a>
  </div>
</div></body></html>`
}

const DASHBOARD = `${APP_URL}/dashboard`
const BILLING = `${APP_URL}/settings?tab=billing`

function render(type: PlanEmailType, ctx: Ctx): { subject: string; html: string } {
  const hi = ctx.name ? `Bonjour ${ctx.name},` : 'Bonjour,'
  switch (type) {
    case 'welcome_trial':
      return {
        subject: 'Bienvenue sur Gestivio — votre essai Pro commence',
        html: shell(
          'Bienvenue sur Gestivio 🎉',
          `<p>${hi}</p>
           <p>Votre essai <strong>Pro de 14 jours</strong> est actif. Vous avez accès à toutes les fonctionnalités Pro: clients illimités, interventions illimitées, assistant IA, portail de réservation, personnalisation, rapports, et plus.</p>
           <p>Après 14 jours, votre accès sera suspendu à moins de choisir un forfait payant (à partir de ${PLAN_PRICING.demarrage.monthly} $/mois). Vos données resteront toujours préservées.</p>
           <p>Besoin d'aide pour démarrer ? Répondez simplement à ce courriel.</p>`,
          'Accéder à mon tableau de bord',
          DASHBOARD,
        ),
      }
    case 'trial_ending_3d':
      return {
        subject: `Votre essai Gestivio se termine dans ${ctx.daysLeft || 3} jours`,
        html: shell(
          'Votre essai Pro se termine bientôt',
          `<p>${hi}</p>
           <p>Il vous reste <strong>${ctx.daysLeft || 3} jours</strong> sur votre essai Gestivio Pro. Après l'expiration, <strong>votre accès sera suspendu</strong> jusqu'à ce que vous choisissiez un forfait payant — vos données resteront préservées, mais vous ne pourrez plus vous connecter à votre compte.</p>
           <p>Pour conserver vos fonctionnalités Pro sans interruption — <strong>${PLAN_PRICING.pro.monthly} $/mois</strong> (ou ${PLAN_PRICING.pro.annual} $/mois en annuel, facturé annuellement). Des forfaits à partir de ${PLAN_PRICING.demarrage.monthly} $/mois sont aussi disponibles si vos besoins sont plus modestes.</p>`,
          'Conserver mon forfait Pro',
          BILLING,
        ),
      }
    case 'trial_expired':
      return {
        subject: 'Votre essai Gestivio est terminé',
        html: shell(
          'Votre essai est terminé',
          `<p>${hi}</p>
           <p>Votre essai Pro est terminé et <strong>votre accès est maintenant suspendu</strong>. Vos données sont entièrement préservées — vous les retrouverez dès que vous choisirez un forfait payant.</p>
           <p>Pour retrouver l'accès complet (clients illimités, IA illimitée, portail de réservation, personnalisation, rapports):</p>`,
          `Passer à Pro — ${PLAN_PRICING.pro.monthly} $/mois`,
          BILLING,
        ),
      }
    case 'payment_success':
      return {
        subject: `Paiement confirmé — bienvenue sur ${ctx.planLabel || 'Gestivio'}`,
        html: shell(
          'Paiement confirmé',
          `<p>${hi}</p>
           <p>Merci ! Votre paiement a été traité avec succès.</p>
           <ul style="margin:0;padding-left:20px">
             <li><strong>Forfait:</strong> ${ctx.planLabel || 'Pro'}</li>
             ${ctx.planPrice ? `<li><strong>Montant:</strong> ${ctx.planPrice}</li>` : ''}
             ${ctx.nextBilling ? `<li><strong>Prochaine facture:</strong> ${ctx.nextBilling}</li>` : ''}
           </ul>
           <p>Toutes vos fonctionnalités sont actives. Bonne gestion !</p>`,
          'Accéder au tableau de bord',
          DASHBOARD,
        ),
      }
    case 'payment_failed':
      return {
        subject: 'Action requise — problème de paiement Gestivio',
        html: shell(
          'Problème de paiement',
          `<p>${hi}</p>
           <p>Nous n'avons pas pu traiter le paiement de votre abonnement Gestivio. Aucune action n'est requise pour l'instant — nous réessayerons automatiquement.</p>
           <p>Si le problème persiste, votre abonnement sera annulé et <strong>votre accès sera suspendu dans 7 jours</strong>. Pour éviter toute interruption, mettez à jour votre moyen de paiement dès que possible.</p>`,
          'Mettre à jour mon paiement',
          BILLING,
        ),
      }
    case 'subscription_cancelled':
      return {
        subject: 'Votre abonnement Gestivio a été annulé',
        html: shell(
          'Abonnement annulé',
          `<p>${hi}</p>
           <p>Votre abonnement Gestivio a été annulé. Vous conservez l'accès à vos fonctionnalités jusqu'à la fin de votre période de facturation${ctx.nextBilling ? ` (jusqu'au ${ctx.nextBilling})` : ''}.</p>
           <p>Ensuite, <strong>votre accès sera suspendu</strong>. Toutes vos données resteront préservées, et vous pouvez réactiver votre abonnement à tout moment pour les retrouver.</p>`,
          'Réactiver mon abonnement',
          BILLING,
        ),
      }
  }
}

export async function sendPlanEmail(type: PlanEmailType, ctx: Ctx): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[plan-email] RESEND_API_KEY not set — skipping', type)
    return
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { subject, html } = render(type, ctx)
    await resend.emails.send({ from: FROM, to: ctx.to, subject, html })
  } catch (err) {
    console.error(`[plan-email] ${type} failed:`, err)
  }
}
