'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function InvoicesPage() {
  const [user, setUser] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [customerId, setCustomerId] = useState('')
  const [jobId, setJobId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState('unpaid')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)
      fetchInvoices(data.user.id)
      fetchCustomers(data.user.id)
      fetchJobs(data.user.id)
    }
    init()
  }, [])

  const fetchInvoices = async (userId: string) => {
    const { data } = await supabase
      .from('invoices')
      .select('*, customers(name), jobs(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setInvoices(data || [])
  }

  const fetchCustomers = async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', userId)
    setCustomers(data || [])
  }

  const fetchJobs = async (userId: string) => {
    const { data } = await supabase
      .from('jobs')
      .select('id, title')
      .eq('user_id', userId)
    setJobs(data || [])
  }

  const addInvoice = async () => {
    if (!amount || !customerId) {
      setMessage('Customer and amount are required.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      customer_id: customerId,
      job_id: jobId || null,
      amount: parseFloat(amount),
      due_date: dueDate || null,
      status,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Invoice added!')
      setCustomerId('')
      setJobId('')
      setAmount('')
      setDueDate('')
      setStatus('unpaid')
      fetchInvoices(user.id)
    }
    setLoading(false)
  }

  const statusColor: any = {
    unpaid: '#f0a500',
    paid: '#00a854',
    overdue: '#ff4d4f',
  }

  const total = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0)

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Invoices</h1>
        <a href="/dashboard" style={{ color: '#000' }}>← Back to Dashboard</a>
      </div>

      <div style={{ padding: '24px', background: '#f9f9f9', borderRadius: '8px', marginBottom: '32px' }}>
        <p style={{ margin: 0, color: '#666' }}>Total invoiced</p>
        <h2 style={{ margin: '4px 0 0 0', fontSize: '36px' }}>${total.toFixed(2)}</h2>
      </div>

      <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '16px' }}>Add New Invoice</h2>

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">Select Customer *</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={jobId}
          onChange={(e) => setJobId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">Link to Job (optional)</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount * (e.g. 150.00)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>

        <button
          onClick={addInvoice}
          disabled={loading}
          style={{ padding: '12px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Adding...' : 'Add Invoice'}
        </button>

        {message && <p style={{ marginTop: '12px', color: 'green' }}>{message}</p>}
      </div>

      <h2 style={{ marginBottom: '16px' }}>Your Invoices ({invoices.length})</h2>

      {invoices.length === 0 && (
        <p style={{ color: '#666' }}>No invoices yet. Add your first one above.</p>
      )}

      {invoices.map((inv) => (
        <div key={inv.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0' }}>${parseFloat(inv.amount).toFixed(2)}</h3>
              {inv.customers && <p style={{ margin: '0 0 4px 0', color: '#666' }}>👤 {inv.customers.name}</p>}
              {inv.jobs && <p style={{ margin: '0 0 4px 0', color: '#666' }}>🔧 {inv.jobs.title}</p>}
              {inv.due_date && <p style={{ margin: 0, color: '#666' }}>📅 Due: {inv.due_date}</p>}
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: statusColor[inv.status], color: '#fff', fontSize: '12px' }}>
              {inv.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}