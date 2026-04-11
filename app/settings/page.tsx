'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import AppLayout from '@/components/AppLayout'
import {
  Settings, Building2, Bell, Shield, Globe, Save, CheckCircle, AlertCircle,
  Mail, Phone, MapPin, CreditCard, Wrench,
} from 'lucide-react'

type Tab = 'business' | 'notifications' | 'security' | 'integrations'

export default function SettingsPage() {
  const [tab, setTab]           = useState<Tab>('business')
  const [user, setUser]         = useState<{ id: string; email?: string } | null>(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Business profile
  const [bizName, setBizName]     = useState('')
  const [bizPhone, setBizPhone]   = useState('')
  const [bizEmail, setBizEmail]   = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [bizCity, setBizCity]     = useState('')
  const [bizState, setBizState]   = useState('')
  const [bizZip, setBizZip]       = useState('')
  const [bizWebsite, setBizWebsite] = useState('')
  const [bizTaxNum, setBizTaxNum] = useState('')
  const [currency, setCurrency]   = useState('CAD')
  const [timezone, setTimezone]   = useState('America/Toronto')

  // Notifications
  const [notifJobCreated, setNotifJobCreated]     = useState(true)
  const [notifJobComplete, setNotifJobComplete]   = useState(true)
  const [notifInvoicePaid, setNotifInvoicePaid]   = useState(true)
  const [notifOverdueInvoice, setNotifOverdueInvoice] = useState(true)
  const [notifNewCustomer, setNotifNewCustomer]   = useState(false)
  const [notifEmail, setNotifEmail]               = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { window.location.href = '/login'; return }
      setUser(data.user)
      setBizEmail(data.user.email || '')
    }
    init()
  }, [])

  const saveSettings = async () => {
    setSaving(true); setError(null); setSaved(false)
    await new Promise((r) => setTimeout(r, 600)) // simulate save
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const tabs: { key: Tab; label: string; icon: typeof Settings }[] = [
    { key: 'business',      label: 'Business Profile', icon: Building2 },
    { key: 'notifications', label: 'Notifications',    icon: Bell },
    { key: 'security',      label: 'Security',         icon: Shield },
    { key: 'integrations',  label: 'Integrations',     icon: Globe },
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

  const InputRow = ({ label, sub, value, onChange, type = 'text', placeholder = '' }: { label: string; sub?: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
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

  const INTEGRATIONS = [
    { name: 'Stripe', desc: 'Accept online payments from customers', icon: CreditCard, status: 'Not connected', btn: 'Connect' },
    { name: 'Google Calendar', desc: 'Two-way sync jobs with Google Calendar', icon: Globe, status: 'Not connected', btn: 'Connect' },
    { name: 'QuickBooks', desc: 'Export invoices and revenue data', icon: Building2, status: 'Not connected', btn: 'Connect' },
    { name: 'Twilio SMS', desc: 'Send SMS notifications to customers', icon: Phone, status: 'Not connected', btn: 'Connect' },
    { name: 'SendGrid', desc: 'Transactional email for invoices and reminders', icon: Mail, status: 'Not connected', btn: 'Connect' },
  ]

  return (
    <AppLayout title="Settings">
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* Tab nav */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 flex-wrap">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={['flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all', tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'].join(' ')}
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
              <p className="text-sm text-gray-400 mb-5">This information appears on your invoices and customer communications.</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InputRow label="Business Name" value={bizName} onChange={setBizName} placeholder="Rivera HVAC Services" />
                </div>
                <InputRow label="Business Phone" value={bizPhone} onChange={setBizPhone} type="tel" placeholder="+1 (555) 000-0000" />
                <InputRow label="Business Email" value={bizEmail} onChange={setBizEmail} type="email" placeholder="info@company.com" />
                <div className="sm:col-span-2">
                  <InputRow label="Address" value={bizAddress} onChange={setBizAddress} placeholder="123 Main St" />
                </div>
                <InputRow label="City" value={bizCity} onChange={setBizCity} placeholder="Toronto" />
                <InputRow label="Province/State" value={bizState} onChange={setBizState} placeholder="ON" />
                <InputRow label="Postal/ZIP Code" value={bizZip} onChange={setBizZip} placeholder="M5V 3A8" />
                <InputRow label="Website" value={bizWebsite} onChange={setBizWebsite} type="url" placeholder="https://yourcompany.com" />
                <InputRow label="Tax Number (GST/HST)" value={bizTaxNum} onChange={setBizTaxNum} placeholder="123456789 RT0001" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="CAD">CAD — Canadian Dollar</option>
                    <option value="USD">USD — US Dollar</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="GBP">GBP — British Pound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="block w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                    <option value="America/Toronto">Eastern Time (Toronto)</option>
                    <option value="America/Vancouver">Pacific Time (Vancouver)</option>
                    <option value="America/Chicago">Central Time (Chicago)</option>
                    <option value="America/Denver">Mountain Time (Denver)</option>
                    <option value="America/New_York">Eastern Time (New York)</option>
                    <option value="America/Los_Angeles">Pacific Time (LA)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div>
                <p className="text-sm font-semibold text-gray-900">Account Information</p>
                <p className="text-xs text-gray-400 mt-0.5">Logged in as {user?.email}</p>
              </div>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Change password</button>
            </div>

            <div className="flex items-center justify-end gap-3">
              {saved && (
                <div className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle className="h-4 w-4" /> Settings saved!</div>
              )}
              {error && (
                <div className="flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>
              )}
              <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
                <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-1">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Notification Preferences</h2>
            <p className="text-sm text-gray-400 mb-5">Choose what events trigger notifications.</p>

            <div className="rounded-xl bg-gray-50 px-5 py-4 mb-4">
              <NotifRow label="Email Notifications" sub="Receive notifications via email" checked={notifEmail} onChange={setNotifEmail} />
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-1 mt-4">Event Notifications</h3>
            <div className="rounded-xl border border-gray-100 px-5 divide-y divide-gray-50">
              <NotifRow label="New job created" sub="When a new work order is added" checked={notifJobCreated} onChange={setNotifJobCreated} />
              <NotifRow label="Job completed" sub="When a technician marks a job as complete" checked={notifJobComplete} onChange={setNotifJobComplete} />
              <NotifRow label="Invoice paid" sub="When a customer pays an invoice" checked={notifInvoicePaid} onChange={setNotifInvoicePaid} />
              <NotifRow label="Overdue invoice" sub="When an invoice passes its due date" checked={notifOverdueInvoice} onChange={setNotifOverdueInvoice} />
              <NotifRow label="New customer added" sub="When a new customer is created" checked={notifNewCustomer} onChange={setNotifNewCustomer} />
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={saveSettings} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-all">
                <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Security */}
        {tab === 'security' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Security Settings</h2>
              <p className="text-sm text-gray-400 mb-5">Protect your account with additional security measures.</p>
              <div className="space-y-4">
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

            <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Danger Zone</h3>
              <p className="text-xs text-red-600 mb-4">These actions are irreversible. Proceed with caution.</p>
              <button className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">Delete Account</button>
            </div>
          </div>
        )}

        {/* Integrations */}
        {tab === 'integrations' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Integrations</h2>
              <p className="text-sm text-gray-400 mb-5">Connect FieldOS with your favorite tools and services.</p>
              <div className="space-y-3">
                {INTEGRATIONS.map((intg) => (
                  <div key={intg.name} className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                        <intg.icon className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                        <p className="text-xs text-gray-400">{intg.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{intg.status}</span>
                      <button className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">{intg.btn}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <p className="text-sm font-semibold text-indigo-700 mb-1 flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Zapier & Webhooks
              </p>
              <p className="text-xs text-indigo-600 mb-3">Connect FieldOS to 5,000+ apps with Zapier or set up custom webhooks for advanced automations.</p>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors">View Webhook Settings</button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
