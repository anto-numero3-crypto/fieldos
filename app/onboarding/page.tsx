'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../supabase'
import {
  Wrench, CheckCircle, Users, Briefcase, FileText, ArrowRight,
  ArrowLeft, Building2, Mail, Phone, User, Calendar, Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/lib/LanguageContext'
import { LanguageToggle } from '@/components/LanguageToggle'

export default function OnboardingPage() {
  const router = useRouter()
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const STEPS = [
    { id: 1, title: fr ? 'Bienvenue sur Gestivio' : 'Welcome to Gestivio',     description: fr ? 'Parlez-nous de votre entreprise' : 'Tell us about your business',     icon: Building2 },
    { id: 2, title: fr ? 'Ajoutez votre premier client' : 'Add your first customer', description: fr ? 'Ajoutez un client pour commencer' : 'Add a customer to get started', icon: Users },
    { id: 3, title: fr ? 'Créez votre première intervention' : 'Create your first job', description: fr ? 'Planifiez votre première intervention' : 'Schedule your first job', icon: Briefcase },
    { id: 4, title: fr ? 'Tout est prêt !' : 'All set!',                description: fr ? "Gestivio est prêt à l'utilisation" : 'Gestivio is ready to use', icon: CheckCircle },
  ]

  const [step, setStep]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId]   = useState<string | null>(null)

  const [bizName, setBizName]   = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [bizType, setBizType]   = useState('hvac')

  const [custName, setCustName]   = useState('')
  const [custEmail, setCustEmail] = useState('')
  const [custPhone, setCustPhone] = useState('')
  const [custAddress, setCustAddress] = useState('')
  const [custId, setCustId]       = useState<string | null>(null)

  const [jobTitle, setJobTitle]     = useState('')
  const [jobDate, setJobDate]       = useState('')
  const [jobDesc, setJobDesc]       = useState('')

  const SERVICE_TYPES = [
    { value: 'hvac',        label: fr ? 'CVCA' : 'HVAC',         emoji: '❄️' },
    { value: 'plumbing',    label: fr ? 'Plomberie' : 'Plumbing',      emoji: '🔧' },
    { value: 'electrical',  label: fr ? 'Électricité' : 'Electrical',    emoji: '⚡' },
    { value: 'cleaning',    label: fr ? 'Nettoyage' : 'Cleaning',      emoji: '🧹' },
    { value: 'landscaping', label: fr ? 'Paysagement' : 'Landscaping', emoji: '🌿' },
    { value: 'roofing',     label: fr ? 'Toiture' : 'Roofing',         emoji: '🏠' },
    { value: 'pest_control',label: fr ? 'Extermination' : 'Pest control', emoji: '🐛' },
    { value: 'other',       label: fr ? 'Autre' : 'Other',             emoji: '🛠️' },
  ]

  const handleNext = async () => {
    setLoading(true)
    if (step === 1) {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      setStep(2)
    } else if (step === 2) {
      if (custName.trim() && userId) {
        const { data } = await supabase.from('customers').insert({
          user_id: userId, name: custName.trim(),
          email: custEmail.trim() || null, phone: custPhone.trim() || null,
          address: custAddress.trim() || null,
        }).select().single()
        if (data) setCustId(data.id)
      }
      setStep(3)
    } else if (step === 3) {
      if (jobTitle.trim() && userId) {
        await supabase.from('jobs').insert({
          user_id: userId, customer_id: custId,
          title: jobTitle.trim(), description: jobDesc.trim() || null,
          scheduled_date: jobDate || null, status: 'scheduled',
        })
      }
      setStep(4)
    } else if (step === 4) {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const canProceed = () => {
    if (step === 1) return bizName.trim().length > 0
    return true
  }

  const currentStep = STEPS[step - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4"><LanguageToggle /></div>
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
            <Wrench className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-gray-900">Gestivio</span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  s.id < step ? 'bg-indigo-600 text-white'
                  : s.id === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                  : 'bg-gray-200 text-gray-400'
                }`}>
                  {s.id < step ? <CheckCircle className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 w-full mx-1.5 transition-all duration-300 flex-1 min-w-8 ${s.id < step ? 'bg-indigo-600' : 'bg-gray-200'}`} style={{ width: '100%' }} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">
              {fr ? 'Étape' : 'Step'} {step} {fr ? 'sur' : 'of'} {STEPS.length}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white shadow-xl p-8 slide-up">
          <div className="text-center mb-6">
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl mb-4 ${step === 4 ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
              <currentStep.icon className={`h-7 w-7 ${step === 4 ? 'text-emerald-600' : 'text-indigo-600'}`} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{currentStep.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{currentStep.description}</p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {fr ? "Nom de l'entreprise" : 'Business name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="ABC HVAC Services" value={bizName} onChange={(e) => setBizName(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Numéro de téléphone' : 'Phone number'}</label>
                <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="tel" placeholder="+1 (555) 000-0000" value={bizPhone} onChange={(e) => setBizPhone(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{fr ? 'Type de service' : 'Service type'}</label>
                <div className="grid grid-cols-4 gap-2">
                  {SERVICE_TYPES.map((s) => (
                    <button key={s.value} type="button" onClick={() => setBizType(s.value)} className={['rounded-xl border-2 p-2.5 text-center transition-all', bizType === s.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'].join(' ')}>
                      <div className="text-xl mb-0.5">{s.emoji}</div>
                      <p className="text-xs font-medium text-gray-700">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                <strong>{fr ? 'Optionnel :' : 'Optional:'}</strong>{' '}
                {fr
                  ? 'Vous pouvez passer cette étape et ajouter des clients plus tard depuis la page Clients.'
                  : 'You can skip this step and add customers later from the Customers page.'}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Nom du client' : 'Customer name'}</label>
                <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="John Smith" value={custName} onChange={(e) => setCustName(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Courriel' : 'Email'}</label>
                <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="email" placeholder="john@example.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Téléphone' : 'Phone'}</label>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Ville' : 'City'}</label>
                  <input type="text" placeholder="Toronto" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                <strong>{fr ? 'Optionnel :' : 'Optional:'}</strong>{' '}
                {fr
                  ? 'Vous pouvez passer cette étape et créer des interventions plus tard depuis la page Interventions.'
                  : 'You can skip this step and create jobs later from the Jobs page.'}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? "Titre de l'intervention" : 'Job title'}</label>
                <input type="text" placeholder={fr ? 'ex. Entretien annuel HVAC' : 'e.g. Annual HVAC maintenance'} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Date planifiée' : 'Scheduled date'}</label>
                <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="date" value={jobDate} onChange={(e) => setJobDate(e.target.value)} className="block w-full rounded-xl border border-gray-200 pl-9 pr-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{fr ? 'Description' : 'Description'}</label>
                <textarea placeholder={fr ? 'Décrivez le travail à effectuer...' : 'Describe the work to perform...'} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} rows={3} className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-5 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-base font-bold text-gray-900 mb-1">{fr ? 'Votre compte Gestivio est prêt !' : 'Your Gestivio account is ready!'}</p>
                <p className="text-sm text-gray-500">{fr ? 'Tout est configuré. Commençons à gérer votre activité.' : "Everything's set up. Let's start managing your business."}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { icon: Users,     label: fr ? 'Clients' : 'Customers',         desc: fr ? 'Gérez votre liste de clients'   : 'Manage your customer list',       color: 'bg-blue-50 text-blue-600' },
                  { icon: Briefcase, label: fr ? 'Interventions' : 'Jobs',        desc: fr ? 'Suivez vos interventions'       : 'Track your jobs',                  color: 'bg-violet-50 text-violet-600' },
                  { icon: FileText,  label: fr ? 'Factures' : 'Invoices',         desc: fr ? 'Facturez vos clients'           : 'Invoice your customers',           color: 'bg-emerald-50 text-emerald-600' },
                  { icon: Sparkles,  label: fr ? 'Assistant IA' : 'AI Assistant', desc: fr ? "Posez n'importe quelle question": 'Ask any business question',         color: 'bg-amber-50 text-amber-600' },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.color}`}><f.icon className="h-4 w-4" /></div>
                    <div><p className="text-xs font-semibold text-gray-900">{f.label}</p><p className="text-xs text-gray-400">{f.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center gap-3 mt-7">
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> {fr ? 'Retour' : 'Back'}
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading || !canProceed()}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all ${
                step === 4 ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading
                ? (fr ? 'Enregistrement...' : 'Saving…')
                : step === 4
                  ? (fr ? 'Aller au tableau de bord' : 'Go to dashboard')
                  : step === 2 || step === 3
                    ? (
                      <>
                        {step === 2 && !custName.trim() ? (fr ? 'Passer' : 'Skip') : (fr ? 'Continuer' : 'Continue')}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )
                    : (<>{fr ? 'Continuer' : 'Continue'} <ArrowRight className="h-4 w-4" /></>)
              }
            </button>
          </div>

          {(step === 2 || step === 3) && (
            <button onClick={() => setStep(step + 1)} className="w-full mt-2 text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {fr ? 'Passer cette étape →' : 'Skip this step →'}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {fr ? "Besoin d'aide ?" : 'Need help?'}{' '}
          <span className="text-indigo-600 cursor-pointer hover:underline">{fr ? 'Contactez le support' : 'Contact support'}</span>
        </p>
      </div>
    </div>
  )
}
