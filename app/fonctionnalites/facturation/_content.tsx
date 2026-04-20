'use client'

import Link from 'next/link'
import { ArrowRight, FileText, CreditCard, Hash, Eye, Sparkles, Mail, Receipt, DollarSign } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'
import { MockupInvoice, MockupReports } from '@/components/mockups'

export default function FacturationContent() {
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
                <Receipt className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Une facture professionnelle en moins de 30 secondes' : 'A professional invoice in under 30 seconds'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Décrivez le travail effectué et l\'IA génère votre facture automatiquement. Envoyez-la par courriel et encaissez en ligne — tout depuis votre téléphone.'
                  : 'Describe the work done and AI generates your invoice automatically. Send it by email and collect payment online — all from your phone.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <MockupInvoice />
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
                  ? 'Avant Gestivio, vous rentrez le soir épuisé et vous devez encore passer une heure à faire vos factures. Vous tapez tout à la main dans Word ou Excel, vous oubliez des lignes, vous mélangez les numéros de facture et vous ne savez jamais si le client a bien reçu le document. Les taxes TPS et TVQ sont calculées à la main et vous priez pour ne pas faire d\'erreur.'
                  : 'Before Gestivio, you come home exhausted in the evening and still have to spend an hour doing invoices. You type everything by hand in Word or Excel, forget line items, mix up invoice numbers and never know if the client received the document. GST and QST are calculated by hand and you hope you don\'t make mistakes.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, vous décrivez simplement le travail effectué et l\'IA crée votre facture avec les bons produits de votre catalogue, les bonnes quantités et les taxes calculées automatiquement. Le numéro séquentiel est attribué, le PDF est prêt, le client reçoit un lien de paiement. Vous facturez directement depuis le chantier en moins de 30 secondes.'
                  : 'With Gestivio, you simply describe the work done and AI creates your invoice with the right products from your catalog, correct quantities and taxes calculated automatically. The sequential number is assigned, the PDF is ready, the client gets a payment link. You invoice directly from the job site in under 30 seconds.'}
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
            {fr ? 'De la description du travail au paiement reçu, en trois étapes.' : 'From work description to payment received, in three steps.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Décrivez le travail' : 'Describe the work', desc: fr ? 'Tapez une description en langage naturel ou sélectionnez des items de votre catalogue de produits et services.' : 'Type a natural language description or select items from your product and service catalog.' },
              { num: '2', title: fr ? 'L\'IA crée la facture' : 'AI creates the invoice', desc: fr ? 'Gestivio génère les lignes de facture, applique les taxes TPS/TVQ et attribue le numéro séquentiel automatiquement.' : 'Gestivio generates invoice lines, applies GST/QST taxes and assigns the sequential number automatically.' },
              { num: '3', title: fr ? 'Le client paie en ligne' : 'Client pays online', desc: fr ? 'Envoyez par courriel en un clic. Le client reçoit un lien sécurisé Stripe pour payer par carte, Apple Pay ou Google Pay.' : 'Send by email in one click. The client receives a secure Stripe link to pay by card, Apple Pay or Google Pay.' },
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
            {fr ? 'Une facturation complète et conforme' : 'Complete and compliant invoicing'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Sparkles, title: fr ? 'Création assistée par IA' : 'AI-assisted creation', desc: fr ? 'Décrivez le travail en texte libre et l\'IA génère les lignes de facture depuis votre catalogue.' : 'Describe work in free text and AI generates invoice lines from your catalog.' },
              { icon: FileText, title: fr ? 'Catalogue de produits' : 'Product catalog', desc: fr ? 'Gérez vos produits et services avec prix unitaires pour une facturation rapide et cohérente.' : 'Manage your products and services with unit prices for fast, consistent invoicing.' },
              { icon: DollarSign, title: fr ? 'TPS/TVQ automatique' : 'Automatic GST/QST', desc: fr ? 'Les taxes sont calculées et appliquées automatiquement selon vos paramètres fiscaux.' : 'Taxes are calculated and applied automatically based on your tax settings.' },
              { icon: Hash, title: fr ? 'Numérotation séquentielle' : 'Sequential numbering', desc: fr ? 'Chaque facture reçoit un numéro unique et séquentiel. Personnalisez le préfixe à votre goût.' : 'Each invoice gets a unique sequential number. Customize the prefix to your liking.' },
              { icon: Eye, title: fr ? 'Suivi "vu X fois"' : '"Viewed X times" tracking', desc: fr ? 'Sachez exactement quand et combien de fois votre client a consulté sa facture.' : 'Know exactly when and how many times your client viewed their invoice.' },
              { icon: CreditCard, title: fr ? 'Paiement Stripe intégré' : 'Integrated Stripe payments', desc: fr ? 'Chaque facture inclut un bouton de paiement sécurisé. Le client paie en un clic.' : 'Every invoice includes a secure payment button. The client pays in one click.' },
              { icon: Mail, title: fr ? 'Envoi par courriel' : 'Email sending', desc: fr ? 'Envoyez la facture par courriel en un clic avec un message personnalisable.' : 'Send the invoice by email in one click with a customizable message.' },
              { icon: FileText, title: fr ? 'Export PDF' : 'PDF export', desc: fr ? 'Téléchargez un PDF professionnel avec votre logo et vos coordonnées.' : 'Download a professional PDF with your logo and contact info.' },
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
                {fr ? 'L\'IA comprend votre travail et facture pour vous' : 'AI understands your work and invoices for you'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Vous n\'avez pas besoin de chercher dans votre catalogue ou de calculer quoi que ce soit. Tapez simplement "remplacement cartouche filtre + 2h main d\'oeuvre" et Gestivio crée automatiquement les lignes avec les bons prix de votre catalogue, les bonnes quantités et les taxes applicables.'
                  : 'You don\'t need to search your catalog or calculate anything. Simply type "filter cartridge replacement + 2h labor" and Gestivio automatically creates the lines with the right prices from your catalog, correct quantities and applicable taxes.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'L\'IA apprend de vos factures précédentes pour devenir de plus en plus précise. Elle reconnaît vos produits les plus utilisés et les suggère en priorité.'
                  : 'AI learns from your previous invoices to become increasingly accurate. It recognizes your most-used products and suggests them first.'}
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <MockupInvoice />
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <MockupReports />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'Sachez quand votre client consulte sa facture' : 'Know when your client views their invoice'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Le suivi "vu X fois" vous indique exactement quand votre client a ouvert sa facture et combien de fois il l\'a consultée. Vous savez ainsi s\'il l\'a reçue, s\'il l\'a lue et s\'il est temps de faire un suivi — sans relancer à l\'aveugle.'
                  : 'The "viewed X times" tracking tells you exactly when your client opened their invoice and how many times they viewed it. You know if they received it, read it and if it\'s time to follow up — without blind follow-ups.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Combiné au paiement en ligne Stripe, la majorité de vos factures sont réglées le jour même sans aucun effort de votre part.'
                  : 'Combined with Stripe online payments, most of your invoices are paid the same day with no effort on your part.'}
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
              question={fr ? 'Les taxes TPS/TVQ sont-elles calculées automatiquement ?' : 'Are GST/QST taxes calculated automatically?'}
              answer={fr ? 'Oui. Gestivio applique automatiquement la TPS (5 %) et la TVQ (9,975 %) sur vos lignes de facture selon vos paramètres fiscaux. Vous n\'avez rien à calculer.' : 'Yes. Gestivio automatically applies GST (5%) and QST (9.975%) to your invoice lines based on your tax settings. You don\'t have to calculate anything.'}
            />
            <FaqItem
              question={fr ? 'Puis-je personnaliser le look de mes factures ?' : 'Can I customize my invoice appearance?'}
              answer={fr ? 'Oui. Ajoutez votre logo, vos couleurs et vos coordonnées pour des factures à votre image professionnelle. Le résultat est un PDF élégant que vos clients peuvent payer en ligne.' : 'Yes. Add your logo, colors and contact info for professionally branded invoices. The result is an elegant PDF your clients can pay online.'}
            />
            <FaqItem
              question={fr ? 'Comment fonctionne la création par IA ?' : 'How does AI creation work?'}
              answer={fr ? 'Décrivez le travail en langage naturel (ex: "2h de plomberie + remplacement robinet"). L\'IA cherche dans votre catalogue et génère les lignes de facture avec les bons prix et quantités.' : 'Describe the work in natural language (e.g. "2h plumbing + faucet replacement"). AI searches your catalog and generates invoice lines with correct prices and quantities.'}
            />
            <FaqItem
              question={fr ? 'Mon client peut-il payer directement depuis la facture ?' : 'Can my client pay directly from the invoice?'}
              answer={fr ? 'Oui. Chaque facture envoyée par courriel contient un bouton de paiement sécurisé via Stripe. Le client peut payer par carte, Apple Pay ou Google Pay en quelques secondes.' : 'Yes. Every emailed invoice includes a secure payment button via Stripe. The client can pay by card, Apple Pay or Google Pay in seconds.'}
            />
            <FaqItem
              question={fr ? 'Les factures sont-elles conformes aux exigences québécoises ?' : 'Are invoices compliant with Quebec requirements?'}
              answer={fr ? 'Oui. Numérotation séquentielle, identification complète, TPS/TVQ détaillés — tous les éléments exigés par Revenu Québec sont inclus automatiquement.' : 'Yes. Sequential numbering, full identification, detailed GST/QST — all elements required by Revenu Quebec are included automatically.'}
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
              { href: '/fonctionnalites/paiements', title: fr ? 'Paiements en ligne' : 'Online payments', desc: fr ? 'Encaissez par carte le jour même via Stripe.' : 'Collect card payments the same day via Stripe.' },
              { href: '/fonctionnalites/soumissions', title: fr ? 'Soumissions' : 'Quotes', desc: fr ? 'Créez des devis professionnels et convertissez-les en factures.' : 'Create professional quotes and convert them to invoices.' },
              { href: '/fonctionnalites/contrats', title: fr ? 'Contrats' : 'Contracts', desc: fr ? 'Gérez vos contrats avec facturation récurrente.' : 'Manage your contracts with recurring billing.' },
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
              {fr ? 'Essayez la facturation gratuitement' : 'Try invoicing for free'}
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
