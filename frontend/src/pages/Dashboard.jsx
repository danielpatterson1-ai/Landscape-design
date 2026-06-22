import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { api } = useAuth()
  const [usage, setUsage] = useState(null)
  const [renders, setRenders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api('/api/usage'),
      api('/api/renders')
    ]).then(([u, r]) => {
      setUsage(u)
      setRenders(r)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-500"></div>
      </div>
    )
  }

  const renderLimit = usage?.limit === -1 ? '∞' : usage?.limit
  const usagePercent = usage ? Math.min(100, (usage.used / (usage.limit === -1 ? 999 : usage.limit)) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10">
        <div>
          <h1 className="section-heading">Dashboard</h1>
          <p className="text-sage-500 text-sm mt-1">Your landscape design hub</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/design" className="btn-primary text-sm">
            New design
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="stat-card">
          <p className="text-sage-500 text-xs uppercase tracking-wider mb-2 font-medium">Daily renders</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-serif text-sage-900">{usage?.used || 0}</span>
            <span className="text-sage-400">/ {renderLimit}</span>
          </div>
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sage-500 text-xs uppercase tracking-wider mb-2 font-medium">Your plan</p>
          <div className="flex items-center space-x-2">
            <span className="badge-green capitalize text-sm">{usage?.tier || 'starter'}</span>
            {usage?.tier === 'starter' && (
              <Link to="/subscription" className="text-xs text-sage-500 hover:text-sage-700 underline">
                Upgrade
              </Link>
            )}
          </div>
        </div>
        <div className="stat-card">
          <p className="text-sage-500 text-xs uppercase tracking-wider mb-2 font-medium">Total renders</p>
          <div className="text-3xl font-serif text-sage-900">{renders.length}</div>
        </div>
      </div>

      {/* Recent renders */}
      <div className="card p-8">
        <h2 className="font-serif text-xl text-sage-900 mb-6">Recent renders</h2>
        {renders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-30">&#127793;</div>
            <p className="text-sage-500 mb-2">No renders yet</p>
            <p className="text-sage-400 text-sm mb-6">Start a conversation and generate your first landscape design</p>
            <Link to="/design" className="btn-primary text-sm">
              Start designing
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renders.slice(0, 6).map(render => (
              <Link key={render.id} to="/renders" className="card card-hover overflow-hidden">
                <div className="h-44 bg-sage-50 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2 opacity-60">&#127793;</div>
                    <p className="text-sm text-sage-500 line-clamp-2">{render.prompt_text?.slice(0, 60)}...</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-sage-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-sage-400">{new Date(render.created_at).toLocaleDateString()}</span>
                    <span className={`badge ${
                      render.status === 'completed' ? 'badge-green' :
                      render.status === 'placeholder' ? 'badge-amber' : 'badge-blue'
                    }`}>{render.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {renders.length > 6 && (
          <div className="mt-6 text-center">
            <Link to="/renders" className="text-sm text-sage-600 hover:text-sage-800 font-medium">
              View all renders →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}