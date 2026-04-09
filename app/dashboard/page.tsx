'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [customers, setCustomers] = useState(0)
  const [jobs, setJobs] = useState(0)
  const [invoices, setInvoices] = useState(0)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        window.location.href = '/login'
        return
      }
      setUser(data.user)

      const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
      setCustomers(customerCount || 0)

      const { count: jobCount } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
      setJobs(jobCount || 0)

      const { count: invoiceCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
      setInvoices(invoiceCount || 0)
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (!user) return <p style={{ padding: '40px' }}>Loading...</p>

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <h1>FieldOS Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>{user.email}</span>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 16px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
          <p style={{ color: '#666', marginBottom: '8px' }}>Customers</p>
          <h2 style={{ fontSize: '48px', margin: 0 }}>{customers}</h2>
          <a href="/customers" style={{ color: '#000', fontSize: '14px' }}>View all →</a>
        </div>
        <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
          <p style={{ color: '#666', marginBottom: '8px' }}>Jobs</p>
          <h2 style={{ fontSize: '48px', margin: 0 }}>{jobs}</h2>
          <a href="/jobs" style={{ color: '#000', fontSize: '14px' }}>View all →</a>
        </div>
        <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}>
          <p style={{ color: '#666', marginBottom: '8px' }}>Invoices</p>
          <h2 style={{ fontSize: '48px', margin: 0 }}>{invoices}</h2>
          <a href="/invoices" style={{ color: '#000', fontSize: '14px' }}>View all →</a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <a href="/customers" style={{ padding: '16px', background: '#000', color: '#fff', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}>
          + Add Customer
        </a>
        <a href="/jobs" style={{ padding: '16px', background: '#000', color: '#fff', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}>
          + Add Job
        </a>
        <a href="/invoices" style={{ padding: '16px', background: '#000', color: '#fff', borderRadius: '8px', textAlign: 'center', textDecoration: 'none' }}>
          + Add Invoice
        </a>
      </div>
    </div>
  )
}