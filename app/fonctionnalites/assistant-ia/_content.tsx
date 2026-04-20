'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Globe, Brain, Search, Sparkles, FileText, Zap, Bot } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'

export default function AssistantIAContent() {
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
                <Bot className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
                {fr ? 'Posez n\'importe quelle question sur votre entreprise' : 'Ask any question about your business'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Un assistant IA qui connaît vos clients, vos revenus et vos interventions. Posez une question en français ou en anglais et obtenez une réponse instantanée basée sur vos données réelles.'
                  : 'An AI assistant that knows your clients, revenue and jobs. Ask a question in French or English and get an instant answer based on your actual data.'}
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
                  ? 'Avant Gestivio, vous cherchez dans trois logiciels différents pour répondre à une simple question. "Combien ai-je facturé ce mois-ci ?" vous oblige à ouvrir votre tableur, filtrer par date et additionner manuellement. "Quand est-ce que j\'ai travaillé chez Tremblay la dernière fois ?" nécessite de fouiller dans vos courriels ou vos notes. Chaque réponse vous prend 10 minutes.'
                  : 'Before Gestivio, you search through three different software to answer a simple question. "How much did I invoice this month?" forces you to open your spreadsheet, filter by date and add up manually. "When did I last work at Tremblay\'s?" requires digging through emails or notes. Each answer takes you 10 minutes.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, vous tapez votre question en langage naturel et l\'assistant IA vous donne la réponse en quelques secondes. Il interroge vos données en temps réel : clients, factures, interventions, paiements. Il peut même vous aider à rédiger un courriel ou à préparer une tâche.'
                  : 'With Gestivio, you type your question in natural language and the AI assistant gives you the answer in seconds. It queries your data in real-time: clients, invoices, jobs, payments. It can even help you draft an email or prepare a task.'}
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
            {fr ? 'Posez une question, obtenez une réponse, passez à l\'action.' : 'Ask a question, get an answer, take action.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'Posez votre question' : 'Ask your question', desc: fr ? 'Tapez en langage naturel, en français ou en anglais. "Combien ai-je facturé en mars ?" ou "Qui sont mes 5 plus gros clients ?"' : 'Type in natural language, in French or English. "How much did I invoice in March?" or "Who are my top 5 clients?"' },
              { num: '2', title: fr ? 'L\'IA répond' : 'AI answers', desc: fr ? 'L\'assistant interroge vos données en temps réel et vous donne une réponse précise, avec les chiffres et les détails pertinents.' : 'The assistant queries your data in real-time and gives you a precise answer, with relevant numbers and details.' },
              { num: '3', title: fr ? 'Passez à l\'action' : 'Take action', desc: fr ? 'L\'assistant peut aussi vous aider à créer une facture, rédiger un courriel ou planifier une intervention directement depuis la conversation.' : 'The assistant can also help you create an invoice, draft an email or schedule a job directly from the conversation.' },
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
            {fr ? 'Un assistant IA pensé pour les entrepreneurs' : 'An AI assistant built for entrepreneurs'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Search, title: fr ? 'Questions sur vos revenus' : 'Revenue queries', desc: fr ? 'Demandez vos revenus du mois, de l\'année, par client ou par service. Réponse instantanée.' : 'Ask your monthly, yearly revenue, by client or service. Instant answer.' },
              { icon: MessageSquare, title: fr ? 'Historique client' : 'Client history', desc: fr ? 'Retrouvez en un instant tout l\'historique d\'un client : interventions, factures, paiements et notes.' : 'Instantly find a client\'s full history: jobs, invoices, payments and notes.' },
              { icon: FileText, title: fr ? 'Rédaction de courriels' : 'Email drafting', desc: fr ? 'L\'assistant vous aide à rédiger des courriels professionnels : suivis, relances, confirmations.' : 'The assistant helps you draft professional emails: follow-ups, reminders, confirmations.' },
              { icon: Sparkles, title: fr ? 'Aide aux tâches' : 'Task help', desc: fr ? 'Créez des factures, planifiez des interventions ou préparez des soumissions guidé par l\'assistant.' : 'Create invoices, schedule jobs or prepare quotes guided by the assistant.' },
              { icon: Globe, title: fr ? 'Bilingue FR + EN' : 'Bilingual FR + EN', desc: fr ? 'Posez vos questions en français ou en anglais. L\'assistant répond dans la langue de votre choix.' : 'Ask questions in French or English. The assistant responds in your chosen language.' },
              { icon: Brain, title: fr ? 'Contexte de votre entreprise' : 'Your business context', desc: fr ? 'L\'assistant comprend votre type d\'entreprise, vos services et votre historique pour des réponses pertinentes.' : 'The assistant understands your business type, services and history for relevant answers.' },
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
                {fr ? 'Vos données transformées en réponses claires' : 'Your data turned into clear answers'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Demandez "Combien ai-je facturé ce mois-ci ?" et obtenez le montant exact en une seconde. Demandez "Quel est l\'historique du client Tremblay ?" et voyez toutes les interventions, factures et paiements liés à ce client. L\'assistant comprend le contexte et vous donne des réponses précises.'
                  : 'Ask "How much did I invoice this month?" and get the exact amount in one second. Ask "What\'s Tremblay\'s history?" and see all jobs, invoices and payments linked to that client. The assistant understands context and gives you precise answers.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Vous pouvez aussi poser des questions plus complexes comme "Quel est mon service le plus rentable ?" ou "Quels clients n\'ont pas été servis depuis 3 mois ?".'
                  : 'You can also ask more complex questions like "What\'s my most profitable service?" or "Which clients haven\'t been served in 3 months?".'}
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
                {fr ? 'Un assistant qui connaît votre contexte' : 'An assistant that knows your context'}
              </h2>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'L\'assistant comprend votre type d\'entreprise, vos services offerts et votre historique complet. Quand vous demandez "Quel est mon meilleur mois ?", il sait exactement quoi chercher dans vos données. Ses réponses sont pertinentes et adaptées à votre réalité d\'entrepreneur en services.'
                  : 'The assistant understands your business type, services offered and complete history. When you ask "What\'s my best month?", it knows exactly what to look for in your data. Its answers are relevant and adapted to your reality as a service entrepreneur.'}
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {fr
                  ? 'Vos données restent strictement privées et ne sont jamais utilisées pour entraîner des modèles. Tout est hébergé au Canada.'
                  : 'Your data stays strictly private and is never used to train models. Everything is hosted in Canada.'}
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
              question={fr ? 'Quelles questions puis-je poser à l\'assistant ?' : 'What questions can I ask the assistant?'}
              answer={fr ? 'Tout ce qui concerne votre entreprise : revenus du mois, historique d\'un client, interventions à venir, factures impayées, services les plus demandés, et bien plus encore.' : 'Anything about your business: monthly revenue, client history, upcoming jobs, unpaid invoices, most requested services, and much more.'}
            />
            <FaqItem
              question={fr ? 'L\'assistant a-t-il accès à toutes mes données ?' : 'Does the assistant have access to all my data?'}
              answer={fr ? 'Oui. L\'assistant interroge vos données en temps réel pour vous donner des réponses précises et à jour. Vos données restent privées, sécurisées et hébergées au Canada.' : 'Yes. The assistant queries your data in real time to give you accurate, up-to-date answers. Your data stays private, secure and hosted in Canada.'}
            />
            <FaqItem
              question={fr ? 'Fonctionne-t-il en français ?' : 'Does it work in French?'}
              answer={fr ? 'Oui. L\'assistant comprend et répond parfaitement en français et en anglais. Il s\'adapte automatiquement à la langue de votre question.' : 'Yes. The assistant understands and responds perfectly in French and English. It automatically adapts to the language of your question.'}
            />
            <FaqItem
              question={fr ? 'L\'assistant peut-il effectuer des actions ?' : 'Can the assistant perform actions?'}
              answer={fr ? 'Oui. L\'assistant peut vous aider à créer des factures, rédiger des courriels professionnels, préparer des soumissions et planifier des interventions — tout en vous guidant étape par étape.' : 'Yes. The assistant can help you create invoices, draft professional emails, prepare quotes and schedule jobs — all while guiding you step by step.'}
            />
            <FaqItem
              question={fr ? 'Mes données sont-elles utilisées pour entraîner l\'IA ?' : 'Is my data used to train the AI?'}
              answer={fr ? 'Non. Vos données ne sont jamais utilisées pour entraîner des modèles d\'intelligence artificielle. Elles restent strictement confidentielles et hébergées au Canada.' : 'No. Your data is never used to train AI models. It stays strictly confidential and hosted in Canada.'}
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
              { href: '/fonctionnalites/portail-ia', title: fr ? 'Portail IA' : 'AI Portal', desc: fr ? 'L\'IA prend vos rendez-vous automatiquement.' : 'AI takes your appointments automatically.' },
              { href: '/fonctionnalites/facturation', title: fr ? 'Facturation' : 'Invoicing', desc: fr ? 'Créez des factures avec l\'aide de l\'IA.' : 'Create invoices with AI help.' },
              { href: '/fonctionnalites/interventions', title: fr ? 'Interventions' : 'Jobs', desc: fr ? 'Gérez et planifiez vos interventions.' : 'Manage and schedule your jobs.' },
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
              {fr ? 'Essayez l\'assistant IA gratuitement' : 'Try the AI assistant for free'}
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
