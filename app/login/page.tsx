'use client'

import { useState } from 'react'
import { supabase } from '../supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Account created! Please check your email to confirm.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
      else window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '40px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h1 style={{ marginBottom: '24px' }}>
        {isSignUp ? 'Create your FieldOS account' : 'Login to FieldOS'}
      </h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px' }}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Login'}
      </button>

      {message && (
        <p style={{ marginTop: '16px', color: 'red' }}>{message}</p>
      )}

      <p
        onClick={() => setIsSignUp(!isSignUp)}
        style={{ marginTop: '16px', cursor: 'pointer', color: '#666', textAlign: 'center' }}
      >
        {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
      </p>
    </div>
  )
}