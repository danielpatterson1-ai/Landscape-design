import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const PLANS = [
  { id: 'starter', name: 'Starter', price: 3.99, rendersPerDay: 1, features: ['1 AI render per day', 'Unlimited AI chat', 'Photo upload'] },
  { id: 'pro', name: 'Pro', price: 9.99, rendersPerDay: 4, features: ['4 AI renders per day', 'Unlimited AI chat', 'Photo upload', 'Priority rendering'] },
  { id: 'unlimited', name: 'Unlimited', price: 14.99, rendersPerDay: '∞', features: ['Unlimited renders', 'Unlimited AI chat', 'Photo upload', 'Priority support'] },
]

export default function Subscription() {
  const { api, user, updateSubscription } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const currentTier = user?.subscriptionTier || 'starter'

  const handleUpgrade = async (tier) => {
    if (tier === currentTier) return
    setLoading(true)
    setMessage('')
    try {
      const result = await api('/api/subscription/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ tier })
      })
      updateSubscription(tier, result.token)
      setMessage(`✅ Upgraded to ${tier} plan successfully!`)
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="text-gray-600 mt-2">Current plan: <span className="font-semibold text-green-600 capitalize">{currentTier}</span></p>
      </div>

      {message && (
        <div className="max-w-lg mx-auto mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">{message}</div>
      )}

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentTier
          const isPopular = plan.id === 'pro'
          return (
            <div key={plan.id} className={`bg-white rounded-xl p-8 border relative ${
              isPopular ? 'border-2 border-green-600' : 'border-gray-200'
            } ${isCurrent ? 'ring-2 ring-green-600' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  POPULAR
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  CURRENT
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <p className="text-4xl font-bold mb-4">
                ${plan.price}<span className="text-lg text-gray-500 font-normal">/mo</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">{plan.rendersPerDay} render{plan.rendersPerDay === 1 ? '' : 's'} per day</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500 mr-2">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade(plan.id)} disabled={isCurrent || loading}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  isCurrent 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                } disabled:opacity-50`}>
                {isCurrent ? 'Current Plan' : loading ? 'Processing...' : 'Upgrade'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}