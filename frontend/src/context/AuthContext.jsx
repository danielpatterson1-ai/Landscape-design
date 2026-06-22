import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = ''

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const api = useCallback(async (endpoint, options = {}) => {
    const headers = { ...options.headers }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
    if (res.status === 401) {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
      navigate('/login')
      throw new Error('Unauthorized')
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }, [token, navigate])

  useEffect(() => {
    if (token) {
      api('/api/auth/me')
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (name, email, password) => {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    })
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    navigate('/')
  }

  const updateSubscription = (tier, newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(prev => ({ ...prev, subscriptionTier: tier }))
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, api, updateSubscription }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}