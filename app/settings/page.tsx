'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  Building2, Bell, Shield, Globe, Save, CheckCircle, AlertCircle,
  Phone, CreditCard, Wrench, Sparkles, Link as LinkIcon, Copy, Check,
} from 'lucide-react'

type Tab = 'business' | 'booking' | 'notifications' | 'security' | 'integrations'

export default function SettingsPage() {
  const [tab, setTab]       = useState<Tab>('business')
  const [user, setUser]     = useState<{ id: string; email?: string } | null>(null)
  const [orgId, setOrgId]   = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Business profile
  const [bizName, setBizName]       = useState('')
  const [bizPhone, setBizPhone]     = useState('')
  const [bizEmail, setBizEmail]     = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [bizCity, setBizCity]       = useState('')
  const [bizState, setBizState]     = useState('')
  const [bizZip, setBizZip]         = useState('')
  const [bizWebsite, setBizWebsite] = useState('')
  const [bizTaxNum, setBizTaxNum]   = useState('')
  const [currency, setCurrency]     = useState('CAD')
  const [timezone, setTimezone]     = useState('America/Toronto')

  // Booking portal / AI agent
  const [agentName, setAgentName]   = useState('Alex')
  const [agentGreeting, setAgentGreeting] = useState('')
  const [agentServices, setAgentServices] = useState('')

  // Notifications
  const [notifJobCreated, setNotifJobCreated]         = useState(true)
  const [notifJobComplete, setNotifJobComplete]       = useState(true)
  const [notifInvoicePaid, setNotifInvoicePaid]       = useState(true)
  const [notifOverdueInvoice, setNotifOverdueInvoice] = useState(true)
  const [notifNewCustomer, setNotifNewCustomer]       = useState(false)
  const [notifEmail, setNotifEmail]                   = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      setBizEmail(data.user.email || '')

      // Load organization settings
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_user_id', data.user.id)
        .single()

      if (org) {
        setOrgId(org.id)
        if (org.name)            setBizName(org.name)
        if (org.phone)           setBizPhone(org.phone)
        if (org.email)           setBizEmail(org.email)
        if (org.address)         setBizAddress(org.address)
        if (org.city)            setBizCity(org.city)
        if (org.state)           setBizState(org.state)
        if (org.zip)             setBizZip(org.zip)
        if (org.website)         setBizWebsite(org.website)
        if (org.tax_number)      setBizTaxNum(org.tax_number)
        if (org.currency)        setCurrency(org.currency)
        if (org.timezone)        setTimezone(org.timezone)
        if (org.ai_agent_name)   setAgentName(org.ai_agent_name)
        if (org.ai_agent_greeting) setAgentGreeting(org.ai_agent_greeting)
        if (org.service_types)   setAgentServices(Array.isArray(org.service_types) ? org.service_types.join(', ') : '')
      }
    }
    init()
  }, [])

  const saveSettings = async () => {
    if (!user) return
    setSaving(true); setError(null); setSaved(false)

    const payload = {
      owner_user_id: user.id,
      name: bizName,
      phone: bizPhone,
      email: bizEmail,
      address: bizAddress,
      city: bizCity,
      state: bizState,
      zip: bizZip,
      website: bizWebsite,
      tax_number: bizTaxNum,
      currency,
      timezone,
      ai_agent_name: agentName,
      ai_agent_greeting: agentGreeting,
      service_types: agentServices ? agentServices.split(',').map((s) => s.trim()).filter(Boolean) : [],
    }

    const { error: err } = orgId
      ? await supabase.from('organizations').update(payload).eq('id', orgId)
      : await supabase.from('organizations').insert(payload)

    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const copyBookingLink = () => {
    const link = `${window.location.origin}/book${orgId ? `?biz=${orgId}` : ''}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabs: { key: Tab; label: string; icon: typeof Building2 }[] = [
    { key: 'business',      label: 'Business',       icon: Building2 },
    { key: 'booking',       label: 'Booking Portal', icon: Sparkles },
    { key: 'notifications', label: 'Notifications',  icon: Bell },
    { key: 'security',      label: 'Security',       icon: Shield },
    { key: 'integrations',  label: 'Integrations',   icon: Globe },
  ]

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )

  const InputRow = ({ label, sub, value, onChange, type = 'text', placeholder = '' }: {
    label: string; sub?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-0.5">{label}</label>
      {sub && <p className="text-xs text-gray-400 mb-1.5">{sub}</p>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
      />
    </div>
  )

  const NotifRow = ({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )

  const SaveBar = () => (
    <div className="flex items-center justify-end gap-3 pt-2">
      {saved && <div className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle className="h-4 w-4" /> Saved!</div>}
      {error && <div className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}
      <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
        <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )

  const INTEGRATIONS = [
    { name: 'Stripe Payments', desc: 'Accept online payments from customers', icon: CreditCard, connected: true },
    { name: 'Resend Email', desc: 'Transactional email for invoices and reminders', icon: Bell, connected: true },
    { name: 'Anthropic Claude', desc: 'AI assistant and booking agent', icon: Sparkles, connected: true },
    { name: 'Google Calendar', desc: 'Two-way sync jobs with Google Calendar', icon: Globe, connected: false },
    { name: 'QuickBooks', desc: 'Export invoices and revenue data', icon: Building2, connected: false },
    { name: 'Twilio SMS', desc: 'Send SMS notifications to customers', icon: Phone, connected: false },
  ]

  return (
    <AppLayout title="Settings">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={['flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap', tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* Business Profile */}
        {tab === 'business' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Business Information</h2>
              <p className="text-sm text-gray-400 mb-5">This appears on invoices, quotes, and customer communications.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InputRow label="Business Name" value={bizName} onChange={setBizName} placeholder="Rivera HVAC Services" />
                </div>
                <InputRow label="Business Phone" value={bizPhone} onChange={setBizPhone} type="tel" placeholder="+1 (555) 000-0000" />
                <InputRow label="Business Email" value={bizEmail} onChange={setBizEmail} type="email" placeholder="info@company.com" />
                <div className="sm:col-span-2">
                  <InputRow label="Street Address" value={bizAddress} onChange={setBizAddress} placeholder="123 Main St" />
                </div>
                <InputRow label="City" value={bizCity} onChange={setBizCity} placeholder="Toronto" />
                <InputRow label="Province / State" value={bizState} onChange={setBizState} placeholder="ON" />
                <InputRow label="Postal / ZIP Code" value={bizZip} onChange={setBizZip} placeholder="M5V 3A8" />
                <InputRow label="Website" value={bizWebsite} onChange={setBizWebsite} type="url" placeholder="https://yourcompany.com" />
                <InputRow label="Tax Number (GST/HST/VAT)" value={bizTaxNum} onChange={setBizTaxNum} placeholder="123456789 RT0001" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="America/Toronto">Eastern (Toronto)</option>
                    <option value="America/Vancouver">Pacific (Vancouver)</option>
                    <option value="America/Chicago">Central (Chicago)</option>
                    <option value="America/Denver">Mountain (Denver)</option>
                    <option value="America/New_York">Eastern (New York)</option>
                    <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div>
                <p className="text-sm font-semibold text-gray-900">Account</p>
                <p className="text-xs text-gray-400 mt-0.5">Logged in as {user?.email}</p>
              </div>
            </div>

            <SaveBar />
          </div>
        )}

        {/* Booking Portal */}
        {tab === 'booking' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">AI Booking Agent</h2>
              <p className="text-sm text-gray-400 mb-5">Customize the AI agent that greets customers on your booking portal.</p>

              <div className="space-y-4">
                <InputRow
                  label="Agent Name"
                  sub="This is the name your AI agent introduces itself with"
                  value={agentName}
                  onChange={setAgentName}
                  placeholder="Alex"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">Custom Greeting (optional)</label>
                  <p className="text-xs text-gray-400 mb-1.5">Override the default greeting message. Leave blank to use the default.</p>
                  <textarea
                    value={agentGreeting}
                    onChange={(e) => setAgentGreeting(e.target.value)}
                    rows={3}
                    placeholder={`Hi! I'm ${agentName}, your booking assistant. How can I help you today?`}
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-0.5">Services Offered (comma-separated)</label>
                  <p className="text-xs text-gray-400 mb-1.5">Tell your AI agent what services to offer and discuss</p>
                  <input
                    type="text"
                    value={agentServices}
                    onChange={(e) => setAgentServices(e.target.value)}
                    placeholder="HVAC repair, AC installation, heating maintenance, duct cleaning"
                    className="block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Booking link */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-indigo-900">Your Booking Portal Link</p>
              </div>
              <p className="text-xs text-indigo-600 mb-3">Share this link with customers so they can book through your AI agent.</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-white border border-indigo-200 px-3 py-2 text-xs font-mono text-gray-700 truncate">
                  {typeof window !== 'undefined' ? `${window.location.origin}/book${orgId ? `?biz=${orgId}` : ''}` : '/book'}
                </div>
                <button
                  onClick={copyBookingLink}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <SaveBar />
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Notification Preferences</h2>
              <p className="text-sm text-gray-400 mb-5">Choose what events trigger in-app and email notifications.</p>

              <div className="rounded-xl bg-gray-50 px-5 py-4 mb-4">
                <NotifRow label="Email Notifications" sub="Receive all notifications via email as well" checked={notifEmail} onChange={setNotifEmail} />
              </div>

              <h3 className="text-sm font-semibold text-gray-700 mb-3">Event Triggers</h3>
              <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
                <NotifRow label="New job created" sub="When a new work order is added" checked={notifJobCreated} onChange={setNotifJobCreated} />
                <NotifRow label="Job completed" sub="When a technician marks a job as complete" checked={notifJobComplete} onChange={setNotifJobComplete} />
                <NotifRow label="Invoice paid" sub="When a customer pays an invoice" checked={notifInvoicePaid} onChange={setNotifInvoicePaid} />
                <NotifRow label="Overdue invoice" sub="When an invoice passes its due date" checked={notifOverdueInvoice} onChange={setNotifOverdueInvoice} />
                <NotifRow label="New customer added" sub="When a new customer is created" checked={notifNewCustomer} onChange={setNotifNewCustomer} />
              </div>
            </div>
            <SaveBar />
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Security</h2>
              <p className="text-sm text-gray-400 mb-5">Protect your account with additional security measures.</p>
              <div className="space-y-3">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account.', badge: 'Recommended', btn: 'Enable 2FA' },
                  { label: 'Active Sessions', desc: 'View and revoke active login sessions.', badge: null, btn: 'Manage sessions' },
                  { label: 'Audit Log', desc: 'Review all actions taken in your account.', badge: null, btn: 'View log' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between rounded-xl border border-gray-100 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        {item.badge && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{item.badge}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                    <button className="shrink-0 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors">{item.btn}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h3>
              <p className="text-xs text-red-600 mb-4">These actions are permanent and cannot be undone.</p>
              <button className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">Delete Account</button>
            </div>
          </div>
        )}

        {/* Integrations */}
        {tab === 'integrations' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Connected Services</h2>
              <p className="text-sm text-gray-400 mb-5">Manage integrations with third-party tools.</p>
              <div className="space-y-3">
                {INTEGRATIONS.map((intg) => (
                  <div key={intg.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${intg.connected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                        <intg.icon className={`h-5 w-5 ${intg.connected ? 'text-emerald-600' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                          {intg.connected && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle className="h-3 w-3" /> Connected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{intg.desc}</p>
                      </div>
                    </div>
                    {!intg.connected && (
                      <button className="shrink-0 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">Connect</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-sm font-semibold text-indigo-700 mb-1 flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Webhooks & Automation
              </p>
              <p className="text-xs text-indigo-600 mb-3">Connect Gestivio to 5,000+ apps via Zapier, or build custom automations with webhooks.</p>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">Configure Webhooks</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
