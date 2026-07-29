'use client'

import Link from 'next/link'
import { ArrowRight, Play, Pause, Square, FileSpreadsheet, CheckCircle, Download, Clock, DollarSign, Timer } from 'lucide-react'
import MarketingShell from '@/components/MarketingShell'
import FaqItem from '@/components/FaqItem'
import { useLanguage } from '@/lib/LanguageContext'
import { MockupTimeTracker, MockupReports } from '@/components/mockups'

export default function SuiviTempsContent() {
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
                <Timer className="h-7 w-7" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
                {fr ? 'Des feuilles de temps qui se remplissent toutes seules' : 'Timesheets that fill themselves out'}
              </h1>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed max-w-xl">
                {fr
                  ? 'Vos employés pointent depuis leur téléphone en un tap. Les feuilles de temps se génèrent automatiquement. Vous approuvez et exportez pour la paie en quelques clics.'
                  : 'Your employees clock in from their phone in one tap. Timesheets generate automatically. You approve and export for payroll in a few clicks.'}
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/signup" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  {fr ? 'Essai gratuit 14 jours' : 'Free 14-day trial'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <MockupTimeTracker />
            </div>
          </div>
        </div>
      </section>

      {/* AVANT / APRES */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Le problème' : 'The problem'}
          </h2>
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
              <p className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-4">{fr ? 'Avant Gestivio' : 'Before Gestivio'}</p>
              <p className="text-gray-600 dark:text-gray-300 italic leading-relaxed">
                {fr
                  ? 'Avant Gestivio, vous ramassez des bouts de papier griffonnés le vendredi soir. Vos employés ne se souviennent plus exactement de leurs heures, les pauses ne sont pas notées et vous devez tout retranscrire à la main. La paie est un casse-tête, les erreurs sont fréquentes et vous ne savez jamais vraiment combien une intervention a coûté en main-d\'oeuvre.'
                  : 'Before Gestivio, you collect scribbled slips of paper on Friday evening. Your employees don\'t remember their exact hours, breaks aren\'t noted and you have to transcribe everything by hand. Payroll is a headache, errors are frequent and you never really know how much a job cost in labor.'}
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-8">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-4">{fr ? 'Avec Gestivio' : 'With Gestivio'}</p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Avec Gestivio, chaque employé pointe son arrivée et son départ depuis son téléphone. Les pauses sont enregistrées, les heures sont liées aux interventions et la feuille de temps de la semaine se génère automatiquement. Vous approuvez d\'un clic et exportez un CSV prêt pour votre comptable ou votre logiciel de paie.'
                  : 'With Gestivio, each employee clocks in and out from their phone. Breaks are recorded, hours are linked to jobs and the weekly timesheet is generated automatically. You approve with one click and export a CSV ready for your accountant or payroll software.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-4">
            {fr ? 'Comment ça marche' : 'How it works'}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-14 max-w-2xl mx-auto">
            {fr ? 'Du pointage à la paie, trois étapes sans paperasse.' : 'From punch clock to payroll, three steps without paperwork.'}
          </p>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-0.5 bg-indigo-200" style={{ left: '16%', right: '16%' }} />
            {[
              { num: '1', title: fr ? 'L\'employé pointe' : 'Employee punches in', desc: fr ? 'Un tap sur le bouton Début lance le chronomètre. Pause et Fin sont tout aussi simples. Le temps est enregistré automatiquement avec l\'intervention associée.' : 'One tap on the Start button starts the timer. Pause and Stop are just as simple. Time is recorded automatically with the associated job.' },
              { num: '2', title: fr ? 'Le chrono tourne' : 'Timer runs', desc: fr ? 'Le temps est comptabilisé en temps réel. Pauses, heures supplémentaires et temps par intervention sont calculés automatiquement.' : 'Time is tracked in real-time. Breaks, overtime and time per job are calculated automatically.' },
              { num: '3', title: fr ? 'Vous approuvez' : 'You approve', desc: fr ? 'En fin de semaine, consultez les feuilles de temps de votre équipe, approuvez d\'un clic et exportez en CSV pour la paie.' : 'At week\'s end, review your team\'s timesheets, approve with one click and export to CSV for payroll.' },
            ].map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold relative z-10">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES GRID */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            {fr ? 'Le suivi du temps sans la paperasse' : 'Time tracking without the paperwork'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {[
              { icon: Play, title: fr ? 'Début / Pause / Fin' : 'Start / Pause / Stop', desc: fr ? 'Trois boutons simples pour enregistrer le temps. Accessible même avec des gants sur le terrain.' : 'Three simple buttons to record time. Accessible even with gloves in the field.' },
              { icon: Clock, title: fr ? 'Suivi par intervention' : 'Per-job tracking', desc: fr ? 'Chaque entrée de temps est liée à une intervention spécifique pour un coût précis par projet.' : 'Each time entry is linked to a specific job for precise per-project costing.' },
              { icon: FileSpreadsheet, title: fr ? 'Feuilles de temps auto' : 'Auto timesheets', desc: fr ? 'Les feuilles de temps se génèrent automatiquement à partir des pointages de chaque employé.' : 'Timesheets are generated automatically from each employee\'s punches.' },
              { icon: CheckCircle, title: fr ? 'Approbation en un clic' : 'One-click approval', desc: fr ? 'Consultez et approuvez les heures de votre équipe en un seul clic depuis le tableau de bord.' : 'Review and approve your team\'s hours in a single click from the dashboard.' },
              { icon: Download, title: fr ? 'Export CSV' : 'CSV export', desc: fr ? 'Téléchargez un fichier CSV propre compatible avec la plupart des logiciels de comptabilité et de paie.' : 'Download a clean CSV file compatible with most accounting and payroll software.' },
              { icon: DollarSign, title: fr ? 'Calcul des coûts' : 'Cost calculation', desc: fr ? 'Voyez instantanément combien une intervention a coûté en main-d\'oeuvre selon les heures pointées.' : 'Instantly see how much a job cost in labor based on clocked hours.' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
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
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Un pointage simple comme un bouton' : 'Clocking in as simple as a button'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Début, Pause, Fin — c\'est tout ce que vos employés ont à faire. L\'interface est conçue pour être utilisée sur le terrain, même avec des gants, sous la pluie ou en plein soleil. Le chronomètre tourne en arrière-plan et enregistre automatiquement les durées.'
                  : 'Start, Pause, Stop — that\'s all your employees need to do. The interface is designed to be used in the field, even with gloves, in rain or bright sunlight. The timer runs in the background and automatically records durations.'}
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Chaque entrée de temps peut être associée à une intervention spécifique, ce qui vous permet de connaître le coût réel en main-d\'oeuvre de chaque projet.'
                  : 'Each time entry can be associated with a specific job, allowing you to know the real labor cost of each project.'}
              </p>
            </div>
            <div className="flex justify-center">
              <MockupTimeTracker />
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE B */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 w-full rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <MockupReports />
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {fr ? 'Exportez pour votre comptable en un clic' : 'Export for your accountant in one click'}
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Téléchargez un fichier CSV propre avec les heures approuvées de la semaine, prêt à importer dans votre logiciel de paie ou à envoyer directement à votre comptable. Toutes les informations sont là : employé, date, heures régulières, supplémentaires et pauses.'
                  : 'Download a clean CSV file with the week\'s approved hours, ready to import into your payroll software or send directly to your accountant. All the information is there: employee, date, regular hours, overtime and breaks.'}
              </p>
              <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                {fr
                  ? 'Plus besoin de retranscrire des feuilles de papier. Le processus de paie qui prenait des heures se fait maintenant en quelques minutes.'
                  : 'No more transcribing paper sheets. The payroll process that took hours now takes minutes.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {fr ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm">
            <FaqItem
              question={fr ? 'Comment mes employés pointent-ils leurs heures ?' : 'How do my employees clock their hours?'}
              answer={fr ? 'Depuis le navigateur de leur téléphone, vos employés appuient sur Début pour commencer, Pause pour les pauses et Fin pour terminer — aucune application à télécharger. Les heures sont enregistrées automatiquement et liées à l\'intervention en cours.' : 'From their phone\'s browser, your employees tap Start to begin, Pause for breaks and Stop to finish — no app to download. Hours are recorded automatically and linked to the current job.'}
            />
            <FaqItem
              question={fr ? 'Puis-je exporter les feuilles de temps ?' : 'Can I export timesheets?'}
              answer={fr ? 'Oui. Exportez les feuilles de temps en format CSV compatible avec la plupart des logiciels de comptabilité et de paie (QuickBooks, Sage, etc.).' : 'Yes. Export timesheets in CSV format compatible with most accounting and payroll software (QuickBooks, Sage, etc.).'}
            />
            <FaqItem
              question={fr ? 'Les heures sont-elles liées aux interventions ?' : 'Are hours linked to jobs?'}
              answer={fr ? 'Oui. Chaque entrée de temps peut être associée à une intervention spécifique, ce qui vous permet de calculer le coût réel en main-d\'oeuvre de chaque projet.' : 'Yes. Each time entry can be linked to a specific job, allowing you to calculate the real labor cost of each project.'}
            />
            <FaqItem
              question={fr ? 'Comment approuver les feuilles de temps ?' : 'How do I approve timesheets?'}
              answer={fr ? 'Consultez les heures de la semaine dans votre tableau de bord. Les heures non approuvées sont clairement identifiées. Approuvez individuellement ou en lot d\'un seul clic.' : 'Review the week\'s hours in your dashboard. Unapproved hours are clearly flagged. Approve individually or in batch with a single click.'}
            />
            <FaqItem
              question={fr ? 'Les heures supplémentaires sont-elles calculées ?' : 'Is overtime calculated?'}
              answer={fr ? 'Oui. Gestivio identifie automatiquement les heures au-delà du seuil normal et les marque comme supplémentaires dans la feuille de temps.' : 'Yes. Gestivio automatically identifies hours beyond the normal threshold and marks them as overtime in the timesheet.'}
            />
          </div>
        </div>
      </section>

      {/* RELATED FEATURES */}
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
            {fr ? 'Voir aussi' : 'See also'}
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { href: '/fonctionnalites/equipe', title: fr ? 'Gestion d\'équipe' : 'Team management', desc: fr ? 'Invitez et coordonnez vos techniciens.' : 'Invite and coordinate your technicians.' },
              { href: '/fonctionnalites/interventions', title: fr ? 'Interventions' : 'Jobs', desc: fr ? 'Liez le temps aux interventions spécifiques.' : 'Link time to specific jobs.' },
              { href: '/fonctionnalites/facturation', title: fr ? 'Facturation' : 'Invoicing', desc: fr ? 'Facturez en fonction des heures réelles.' : 'Invoice based on actual hours.' },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600">{card.title}</h3>
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
      <section className="py-20 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-indigo-600 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              {fr ? 'Essayez le suivi du temps gratuitement' : 'Try time tracking for free'}
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
