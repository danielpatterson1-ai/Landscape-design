import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, user } = useAuth()
  const navigate = useNavigate()

  if (user) { navigate('/dashboard'); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-3">
            <div className="w-10 h-10 bg-sage-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-serif font-bold">D</span>
            </div>
            <span className="font-serif text-xl text-sage-900">Landscape Design</span>
          </Link>
          <h2 className="mt-8 text-3xl font-serif text-sage-900">Welcome back</h2>
          <p className="mt-2 text-sage-500 text-sm">Sign in to continue designing</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg border border-sage-200">
          {error && <div className="mb-6 p-4 bg-earth-50 border border-earth-200 rounded-lg text-sm text-earth-700">{error}</div>}
          <div className="mb-5">
            <label className="block text-sm font-medium text-sage-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="input-field" placeholder="you@example.com" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-sage-700 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="input-field" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-6 text-center text-sm text-sage-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-sage-600 hover:text-sage-800 font-medium">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  )
}