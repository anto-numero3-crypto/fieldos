'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
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
      fetchCustomers(data.user.id)
    }
    init()
  }, [])

  const fetchCustomers = async (userId: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    setCustomers(data || [])
  }

  const addCustomer = async () => {
    if (!name) {
      setMessage('Name is required.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('customers').insert({
      user_id: user.id,
      name,
      email,
      phone,
      address,
    })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Customer added!')
      setName('')
      setEmail('')
      setPhone('')
      setAddress('')
      fetchCustomers(user.id)
    }
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h1>Customers</h1>
        <a href="/dashboard" style={{ color: '#000' }}>← Back to Dashboard</a>
      </div>

      <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '16px' }}>Add New Customer</h2>

        <input
          placeholder="Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
        />

        <button
          onClick={addCustomer}
          disabled={loading}
          style={{ padding: '12px 24px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Adding...' : 'Add Customer'}
        </button>

        {message && <p style={{ marginTop: '12px', color: 'green' }}>{message}</p>}
      </div>

      <h2 style={{ marginBottom: '16px' }}>Your Customers ({customers.length})</h2>

      {customers.length === 0 && (
        <p style={{ color: '#666' }}>No customers yet. Add your first one above.</p>
      )}

      {customers.map((c) => (
        <div key={c.id} style={{ padding: '16px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>{c.name}</h3>
          {c.email && <p style={{ margin: '0 0 4px 0', color: '#666' }}>✉ {c.email}</p>}
          {c.phone && <p style={{ margin: '0 0 4px 0', color: '#666' }}>📞 {c.phone}</p>}
          {c.address && <p style={{ margin: 0, color: '#666' }}>📍 {c.address}</p>}
        </div>
      ))}
    </div>
  )
}