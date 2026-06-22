import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="bg-white border-b border-sage-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-sage-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-serif font-bold text-sm tracking-tight">D</span>
              </div>
              <span className="font-serif text-lg text-sage-900 tracking-tight">Landscape Design</span>
            </Link>
            <div className="hidden md:flex ml-10 space-x-1">
              <Link to="/dashboard" className="text-sage-600 hover:text-sage-800 px-3 py-2 text-sm font-medium rounded-md hover:bg-sage-50 transition-colors">Dashboard</Link>
              <Link to="/design" className="text-sage-600 hover:text-sage-800 px-3 py-2 text-sm font-medium rounded-md hover:bg-sage-50 transition-colors">New Design</Link>
              <Link to="/renders" className="text-sage-600 hover:text-sage-800 px-3 py-2 text-sm font-medium rounded-md hover:bg-sage-50 transition-colors">My Renders</Link>
              <Link to="/subscription" className="text-sage-600 hover:text-sage-800 px-3 py-2 text-sm font-medium rounded-md hover:bg-sage-50 transition-colors">Plans</Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="badge-green capitalize">{user?.subscriptionTier || 'starter'}</span>
              <span className="text-sm text-sage-500">{user?.name}</span>
            </div>
            <button onClick={logout} className="btn-ghost text-sm">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}