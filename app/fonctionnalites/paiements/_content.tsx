'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard, Smartphone, Receipt, Zap, Shield, Bell, DollarSign, Wallet } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'

export default function PaiementsContent() {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  return (
    <MarketingShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Wallet className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Encaissez le jour même, pas dans 30 jours' : 'Get paid today, not in 30 days'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Vos clients paient directement depuis leur facture par carte, Apple Pay ou Google Pay. L\'argent arrive dans votre compte sans que vous ayez à courir après.'
                  : 'Your clients pay directly from their invoice by card, Apple Pay or Google Pay. Money arrives in your account without you having to chase it.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-72 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu interactif' : 'Interactive preview'}
            </div>
          </div>
        </div>
      </section>

      {/* AVANT / APRES */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Le problème' : 'The problem'}
          </h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="rounded-2xl border border-gray-200 p-8">
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">{fr ? 'Avant Gestivio' : 'Before Gestivio'}</p>
              <p className="text-gray-600 italic leading-relaxed">
                {fr
                  ? 'Avant Gestivio, vous courez après les chèques pendant des semaines. Vous envoyez la facture, le client dit qu\'il va payer, puis silence radio. Vous relancez par texto, par courriel, parfois par téléphone. Certains paient en 45 jours, d\'autres jamais. Votre trésorerie est imprévisible et vous passez plus de temps à encaisser qu\'à travailler.'
                  : 'Before Gestivio, you chase cheques for weeks. You send the invoice, the client says they\'ll pay, then radio silence. You follow up by text, email, sometimes phone. Some pay in 45 days, others never. Your cash flow is unpredictable and you spend more time collecting than working.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, votre client reçoit un lien de paiement sécurisé directement dans sa facture. Il clique, paie par carte ou Apple Pay en quelques secondes, et l\'argent est dans votre compte. Un reçu est envoyé automatiquement, la facture passe au statut "Payé" et votre trésorerie respire enfin.'
                  : 'With Gestivio, your client receives a secure payment link directly in their invoice. They click, pay by card or Apple Pay in seconds, and money is in your account. A receipt is sent automatically, the invoice changes to "Paid" status and your cash flow can finally breathe.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            {fr ? 'Comment ça marche' : 'How it works'}
          </h2>
          <p className="text-center text-gray-600 mb-14 max-w-2xl mx-auto">
            {fr ? 'De l\'envoi de la facture au dépôt dans votre compte, tout est automatique.' : 'From sending the invoice to the deposit in your account, everything is automatic.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Envoyez la facture' : 'Send the invoice', desc: fr ? 'Votre client reçoit la facture par courriel avec un bouton de paiement sécurisé intégré. Aucune action supplémentaire de votre part.' : 'Your client receives the invoice by email with an integrated secure payment button. No additional action from you.' },
              { num: '2', title: fr ? 'Le client clique et paie' : 'Client clicks and pays', desc: fr ? 'En un clic, votre client paie par Visa, Mastercard, Apple Pay ou Google Pay. Le processus prend moins de 30 secondes.' : 'In one click, your client pays by Visa, Mastercard, Apple Pay or Google Pay. The process takes less than 30 seconds.' },
              { num: '3', title: fr ? 'L\'argent arrive' : 'Money arrives', desc: fr ? 'Le paiement est enregistré automatiquement, un reçu est envoyé au client et l\'argent est viré dans votre compte bancaire.' : 'The payment is recorded automatically, a receipt is sent to the client and money is transferred to your bank account.' },
            ].map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold relative z-10">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {fr ? 'Des paiements simples et sécurisés' : 'Simple and secure payments'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Shield, title: fr ? 'Stripe sécurisé' : 'Secure Stripe', desc: fr ? 'Tous les paiements passent par Stripe, certifié PCI-DSS niveau 1. Vos données sont en sécurité.' : 'All payments go through Stripe, PCI-DSS Level 1 certified. Your data is safe.' },
              { icon: CreditCard, title: fr ? 'Toutes les cartes' : 'All cards accepted', desc: fr ? 'Visa, Mastercard, American Express et cartes de débit Interac acceptées.' : 'Visa, Mastercard, American Express and Interac debit cards accepted.' },
              { icon: Smartphone, title: fr ? 'Apple Pay et Google Pay' : 'Apple Pay and Google Pay', desc: fr ? 'Vos clients paient en un tap depuis leur téléphone, sans entrer de numéro de carte.' : 'Your clients pay in one tap from their phone, without entering a card number.' },
              { icon: Receipt, title: fr ? 'Reçu automatique' : 'Automatic receipt', desc: fr ? 'Un reçu professionnel est envoyé instantanément au client après chaque paiement.' : 'A professional receipt is instantly sent to the client after each payment.' },
              { icon: Zap, title: fr ? 'Enregistrement automatique' : 'Auto recording', desc: fr ? 'Le paiement est enregistré dans Gestivio et la facture passe au statut Payé sans intervention.' : 'Payment is recorded in Gestivio and the invoice changes to Paid status without intervention.' },
              { icon: Bell, title: fr ? 'Rappels de paiement' : 'Payment reminders', desc: fr ? 'Envoyez des rappels automatiques aux clients dont la facture est en retard.' : 'Send automatic reminders to clients whose invoice is overdue.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <f.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE A */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Un bouton "Payer" sur chaque facture' : 'A "Pay" button on every invoice'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Chaque facture envoyée par Gestivio contient un bouton de paiement intégré. Votre client n\'a pas besoin de créer un compte, de télécharger une application ou de chercher votre numéro de compte. Il clique, il paie, c\'est fait.'
                  : 'Every invoice sent by Gestivio contains an integrated payment button. Your client doesn\'t need to create an account, download an app or look for your account number. They click, they pay, it\'s done.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Le taux de paiement immédiat augmente considérablement quand le processus est simplifié à un seul clic. Fini les excuses "je n\'ai pas trouvé comment payer".'
                  : 'The immediate payment rate increases significantly when the process is simplified to a single click. No more "I couldn\'t figure out how to pay" excuses.'}
              </p>
            </div>
            <div className="bg-gray-100 rounded-2xl p-8 h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu interactif' : 'Interactive preview'}
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-gray-100 rounded-2xl p-8 h-64 flex items-center justify-center text-gray-400 text-sm">
              {fr ? 'Aperçu interactif' : 'Interactive preview'}
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Rappels automatiques pour les factures en retard' : 'Automatic reminders for overdue invoices'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Configurez des rappels automatiques qui sont envoyés à vos clients quand une facture dépasse la date d\'échéance. Le ton est professionnel et poli — vous n\'avez pas besoin de jouer le rôle du collecteur de dettes.'
                  : 'Set up automatic reminders that are sent to your clients when an invoice passes its due date. The tone is professional and polite — you don\'t need to play the role of debt collector.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Vous pouvez aussi envoyer des rappels manuels en un clic si vous préférez garder le contrôle sur le timing de vos relances.'
                  : 'You can also send manual reminders in one click if you prefer to keep control over the timing of your follow-ups.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 rounded-2xl bg-white p-6 shadow-sm">
            <FaqItem
              question={fr ? 'Quels modes de paiement sont acceptés ?' : 'What payment methods are accepted?'}
              answer={fr ? 'Visa, Mastercard, American Express, cartes de débit, Apple Pay et Google Pay. Vos clients choisissent leur méthode préférée.' : 'Visa, Mastercard, American Express, debit cards, Apple Pay and Google Pay. Your clients choose their preferred method.'}
            />
            <FaqItem
              question={fr ? 'Combien coûtent les frais de transaction ?' : 'How much are transaction fees?'}
              answer={fr ? 'Les frais sont ceux de Stripe : 2,9 % + 0,30 $ par transaction. Gestivio ne prend aucune commission supplémentaire sur vos paiements.' : 'Fees are Stripe\'s standard: 2.9% + $0.30 per transaction. Gestivio takes no additional commission on your payments.'}
            />
            <FaqItem
              question={fr ? 'En combien de temps l\'argent est-il dans mon compte ?' : 'How fast do I get paid?'}
              answer={fr ? 'Stripe effectue les virements selon votre calendrier configuré, généralement en 2 jours ouvrables. Vous pouvez configurer des virements quotidiens ou hebdomadaires.' : 'Stripe transfers funds based on your configured schedule, typically within 2 business days. You can configure daily or weekly transfers.'}
            />
            <FaqItem
              question={fr ? 'Les paiements sont-ils sécurisés ?' : 'Are payments secure?'}
              answer={fr ? 'Oui. Tous les paiements passent par Stripe, certifié PCI-DSS niveau 1 — le plus haut niveau de sécurité. Gestivio ne stocke jamais les données de carte de vos clients.' : 'Yes. All payments go through Stripe, PCI-DSS Level 1 certified — the highest security level. Gestivio never stores your clients\' card data.'}
            />
            <FaqItem
              question={fr ? 'Dois-je avoir un compte Stripe ?' : 'Do I need a Stripe account?'}
              answer={fr ? 'Oui. La configuration prend moins de 5 minutes directement depuis Gestivio. Vous connectez votre compte bancaire et c\'est prêt.' : 'Yes. Setup takes less than 5 minutes directly from Gestivio. You connect your bank account and you\'re ready.'}
            />
          </div>
        </div>
      </section>

      {/* RELATED FEATURES */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
            {fr ? 'Voir aussi' : 'See also'}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { href: '/fonctionnalites/facturation', title: fr ? 'Facturation' : 'Invoicing', desc: fr ? 'Créez des factures professionnelles avec l\'IA.' : 'Create professional invoices with AI.' },
              { href: '/fonctionnalites/soumissions', title: fr ? 'Soumissions' : 'Quotes', desc: fr ? 'Envoyez des devis et convertissez-les en factures.' : 'Send quotes and convert them to invoices.' },
              { href: '/fonctionnalites/contrats', title: fr ? 'Contrats' : 'Contracts', desc: fr ? 'Facturation récurrente pour vos contrats.' : 'Recurring billing for your contracts.' },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="rounded-xl border border-gray-200 p-6 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600">
                  {fr ? 'Découvrir' : 'Learn more'} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Essayez les paiements en ligne gratuitement' : 'Try online payments for free'}
            </h2>
            <p className="mt-4 text-indigo-100 max-w-xl mx-auto">
              {fr ? '14 jours · Aucune carte de crédit requise' : '14 days · No credit card required'}
            </p>
            <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-600 hover:bg-indigo-50">
              {fr ? 'Commencer gratuitement' : 'Start for free'} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
