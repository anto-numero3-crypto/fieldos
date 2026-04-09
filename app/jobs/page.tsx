'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function JobsPage() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [status, setStatus] = useState('scheduled')
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
      fetchJobs(data.user.id)
      fetchCustomers(data.user.id)
    }
    init()
  }, [])

  const fetchJobs = async (userId: string) => {
    const { data } = await supabase
      .from('jobs')
      .select('*, customers(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setJobs(data || [])
  }

  const fetchCustomers = async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', userId)
    setCustomers(data || [])
  }

  const addJob = async () => {
    if (!title) {
      setMessage('Title is required.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('jobs').insert({
      user_id: user.id,
      customer_id: customerId || null,
      title,
      description,
      scheduled_date: scheduledDate || null,
      status,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Job added!')
      setTitle('')
      setDescription('')
      setCustomerId('')
      setScheduledDate('')
      setStatus('scheduled')
      fetchJobs(user.id)
    }
    setLoading(false)
  }

  const statusColor: any = {
    scheduled: '#f0a500',
    in_progress: '#0070f3',
    complete: '#00a854',
    cancelled: '#ff4d4f',
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Jobs</h1>
        <a href="/dashboard" style={{ color: '#000' }}>← Back to Dashboard</a>
      </div>

      <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '16px' }}>Add New Job</h2>

        <input
          placeholder="Job Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px', height: '80px' }}
        />

        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="">Select Customer (optional)</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button
          onClick={addJob}
          disabled={loading}
          style={{ padding: '12px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Adding...' : 'Add Job'}
        </button>

        {message && <p style={{ marginTop: '12px', color: 'green' }}>{message}</p>}
      </div>

      <h2 style={{ marginBottom: '16px' }}>Your Jobs ({jobs.length})</h2>

      {jobs.length === 0 && (
        <p style={{ color: '#666' }}>No jobs yet. Add your first one above.</p>
      )}

      {jobs.map((j) => (
        <div key={j.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{j.title}</h3>
            <span style={{ padding: '4px 12px', borderRadius: '20px', background: statusColor[j.status], color: '#fff', fontSize: '12px' }}>
              {j.status}
            </span>
          </div>
          {j.customers && <p style={{ margin: '8px 0 4px 0', color: '#666' }}>👤 {j.customers.name}</p>}
          {j.scheduled_date && <p style={{ margin: '4px 0', color: '#666' }}>📅 {j.scheduled_date}</p>}
          {j.description && <p style={{ margin: '4px 0', color: '#666' }}>{j.description}</p>}
        </div>
      ))}
    </div>
  )
}