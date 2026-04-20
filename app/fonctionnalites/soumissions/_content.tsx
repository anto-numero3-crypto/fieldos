'use client'

import Link from 'next/link'
import { ArrowRight, FileText, Mail, CheckCircle, RefreshCw, ListChecks, Send, Eye, Download, ClipboardList } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'
import { MockupInvoice, MockupClientProfile } from '@/components/mockups'

export default function SoumissionsContent() {
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
                <ClipboardList className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Un devis professionnel en quelques minutes' : 'A professional quote in minutes'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Créez des soumissions à partir de votre catalogue de produits, envoyez-les par courriel et convertissez-les en factures en un seul clic dès qu\'elles sont approuvées par votre client.'
                  : 'Create quotes from your product catalog, send them by email and convert them to invoices in a single click as soon as they\'re approved by your client.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <MockupInvoice />
                </div>
              </div>
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
                  ? 'Avant Gestivio, vous mettez des heures à préparer une soumission. Vous cherchez vos prix dans un fichier, tapez tout dans Word, calculez les taxes à la main et envoyez un PDF par courriel. Le client prend des jours à répondre et vous ne savez même pas s\'il a ouvert le document. Quand il accepte, vous devez tout retaper pour créer la facture.'
                  : 'Before Gestivio, you spend hours preparing a quote. You look up prices in a file, type everything in Word, calculate taxes by hand and send a PDF by email. The client takes days to respond and you don\'t even know if they opened the document. When they accept, you have to retype everything to create the invoice.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, vous sélectionnez les items de votre catalogue, ajustez les quantités et votre soumission est prête en quelques minutes. Le client reçoit un lien pour approuver en ligne d\'un clic. Vous voyez quand il consulte le document. Dès son approbation, vous convertissez en facture instantanément — aucune ressaisie.'
                  : 'With Gestivio, you select items from your catalog, adjust quantities and your quote is ready in minutes. The client receives a link to approve online with one click. You see when they view the document. Upon approval, you convert to invoice instantly — no re-entry.'}
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
            {fr ? 'De la création à la conversion en facture, tout est fluide.' : 'From creation to invoice conversion, everything flows smoothly.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Créez depuis le catalogue' : 'Create from catalog', desc: fr ? 'Sélectionnez vos produits et services, ajustez les quantités et ajoutez des notes. Les prix et taxes sont calculés automatiquement.' : 'Select your products and services, adjust quantities and add notes. Prices and taxes are calculated automatically.' },
              { num: '2', title: fr ? 'Envoyez par courriel' : 'Send by email', desc: fr ? 'Le client reçoit un lien vers sa soumission avec un bouton pour approuver en ligne. Pas besoin de créer un compte.' : 'The client receives a link to their quote with a button to approve online. No account needed.' },
              { num: '3', title: fr ? 'Le client approuve' : 'Client approves', desc: fr ? 'D\'un seul clic, le client approuve la soumission. Vous êtes notifié et pouvez convertir en facture instantanément.' : 'With a single click, the client approves the quote. You\'re notified and can convert to invoice instantly.' },
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
            {fr ? 'Des soumissions professionnelles en toute simplicité' : 'Professional quotes made simple'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: ListChecks, title: fr ? 'Modèles avec catalogue' : 'Templates with catalog', desc: fr ? 'Sélectionnez vos produits et services depuis votre catalogue. Prix unitaires et descriptions pré-remplis.' : 'Select products and services from your catalog. Unit prices and descriptions pre-filled.' },
              { icon: CheckCircle, title: fr ? 'Approbation en ligne' : 'Online approval', desc: fr ? 'Le client approuve d\'un clic depuis le lien reçu par courriel. Aucun compte à créer.' : 'Client approves with one click from the email link. No account needed.' },
              { icon: RefreshCw, title: fr ? 'Conversion en facture' : 'Convert to invoice', desc: fr ? 'Convertissez une soumission approuvée en facture en un clic. Lignes, prix et taxes sont conservés.' : 'Convert an approved quote to invoice in one click. Lines, prices and taxes are preserved.' },
              { icon: Download, title: fr ? 'Export PDF' : 'PDF export', desc: fr ? 'Téléchargez un PDF professionnel avec votre logo et vos coordonnées à tout moment.' : 'Download a professional PDF with your logo and contact info at any time.' },
              { icon: Eye, title: fr ? 'Suivi du statut' : 'Status tracking', desc: fr ? 'Voyez en temps réel si votre soumission a été envoyée, vue ou approuvée par le client.' : 'See in real-time if your quote has been sent, viewed or approved by the client.' },
              { icon: Send, title: fr ? 'Portail client' : 'Client portal', desc: fr ? 'Le client consulte sa soumission sur une page dédiée avec tous les détails et le bouton d\'approbation.' : 'The client views their quote on a dedicated page with all details and the approval button.' },
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
                {fr ? 'Votre catalogue, vos prix, en quelques clics' : 'Your catalog, your prices, in a few clicks'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Votre catalogue de produits et services est au coeur de vos soumissions. Sélectionnez les items pertinents, ajustez les quantités si nécessaire et la soumission se calcule automatiquement — prix unitaires, sous-totaux, TPS, TVQ et total.'
                  : 'Your product and service catalog is at the heart of your quotes. Select the relevant items, adjust quantities if needed and the quote calculates automatically — unit prices, subtotals, GST, QST and total.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Ajoutez des notes personnalisées pour chaque ligne ou pour l\'ensemble de la soumission. Votre client reçoit un document clair et professionnel qui inspire confiance.'
                  : 'Add custom notes for each line or for the entire quote. Your client receives a clear, professional document that inspires confidence.'}
              </p>
            </div>
            <div className="w-full rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <MockupInvoice />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 w-full rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <MockupClientProfile />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {fr ? 'De la soumission à la facture en un clic' : 'From quote to invoice in one click'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Dès que votre client approuve la soumission en ligne, vous pouvez la convertir en facture instantanément. Toutes les lignes, les prix, les quantités et les taxes sont préservés. Aucune ressaisie, aucune erreur possible.'
                  : 'As soon as your client approves the quote online, you can convert it to an invoice instantly. All lines, prices, quantities and taxes are preserved. No re-entry, no possible errors.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'La facture hérite aussi du numéro de soumission comme référence, ce qui facilite le suivi pour vous et votre client.'
                  : 'The invoice also inherits the quote number as a reference, making tracking easier for you and your client.'}
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
              question={fr ? 'Puis-je utiliser mon catalogue de produits ?' : 'Can I use my product catalog?'}
              answer={fr ? 'Oui. Sélectionnez vos produits et services directement depuis votre catalogue pour créer une soumission en quelques clics avec les bons prix déjà remplis.' : 'Yes. Select your products and services directly from your catalog to create a quote in a few clicks with the right prices already filled in.'}
            />
            <FaqItem
              question={fr ? 'Mon client peut-il approuver en ligne ?' : 'Can my client approve online?'}
              answer={fr ? 'Oui. Votre client reçoit un lien par courriel et peut approuver la soumission d\'un seul clic, sans créer de compte ni télécharger quoi que ce soit.' : 'Yes. Your client receives a link by email and can approve the quote with a single click, without creating an account or downloading anything.'}
            />
            <FaqItem
              question={fr ? 'Puis-je convertir une soumission en facture ?' : 'Can I convert a quote to an invoice?'}
              answer={fr ? 'Oui. Une fois la soumission approuvée, convertissez-la en facture en un clic. Toutes les lignes, prix et taxes sont conservés automatiquement.' : 'Yes. Once the quote is approved, convert it to an invoice with one click. All lines, prices and taxes are preserved automatically.'}
            />
            <FaqItem
              question={fr ? 'Les soumissions sont-elles numérotées ?' : 'Are quotes numbered?'}
              answer={fr ? 'Oui. Gestivio attribue un numéro séquentiel unique à chaque soumission pour un suivi professionnel. Vous pouvez personnaliser le préfixe.' : 'Yes. Gestivio assigns a unique sequential number to each quote for professional tracking. You can customize the prefix.'}
            />
            <FaqItem
              question={fr ? 'Puis-je voir si le client a consulté ma soumission ?' : 'Can I see if the client viewed my quote?'}
              answer={fr ? 'Oui. Le suivi du statut vous indique si la soumission a été envoyée, vue ou approuvée. Vous savez toujours où en est chaque devis.' : 'Yes. Status tracking tells you if the quote has been sent, viewed or approved. You always know where each quote stands.'}
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
              { href: '/fonctionnalites/facturation', title: fr ? 'Facturation' : 'Invoicing', desc: fr ? 'Convertissez vos soumissions en factures.' : 'Convert your quotes to invoices.' },
              { href: '/fonctionnalites/contrats', title: fr ? 'Contrats' : 'Contracts', desc: fr ? 'Transformez un devis en contrat récurrent.' : 'Turn a quote into a recurring contract.' },
              { href: '/fonctionnalites/paiements', title: fr ? 'Paiements' : 'Payments', desc: fr ? 'Encaissez rapidement après la facturation.' : 'Collect payment quickly after invoicing.' },
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
              {fr ? 'Essayez les soumissions gratuitement' : 'Try quotes for free'}
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
