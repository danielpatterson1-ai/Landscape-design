import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  const [searchParams] = useSearchParams()

  const currentTier = user?.subscriptionTier || 'starter'

  // Handle Stripe return redirect — check for session_id in URL
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const tier = searchParams.get('tier')
    if (sessionId && tier) {
      verifySubscription(sessionId, tier)
    }
  }, [])

  const verifySubscription = async (sessionId, tier) => {
    setLoading(true)
    try {
      const result = await api('/api/subscription/verify', {
        method: 'POST',
        body: JSON.stringify({ sessionId, tier })
      })
      updateSubscription(tier, result.token)
      setMessage(`You're now on the ${tier} plan — welcome!`)
    } catch (err) {
      setMessage(`Unable to verify payment: ${err.message}. If you were charged, contact support.`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (tier) => {
    if (tier === currentTier || loading) return
    setLoading(true)
    setMessage('')
    try {
      const result = await api('/api/subscription/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ tier })
      })
      // Redirect to Stripe Payment Link
      window.location.href = result.paymentLink
    } catch (err) {
      setMessage(`Something went wrong: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <h1 className="section-heading">Choose your plan</h1>
        <p className="text-sage-500 text-sm mt-2">
          Current plan: <span className="font-serif text-sage-700 capitalize font-medium">{currentTier}</span>
        </p>
      </div>

      {message && (
        <div className="max-w-lg mx-auto mb-8 p-4 bg-sage-50 border border-sage-200 rounded-lg text-sm text-sage-800">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentTier
          const isPopular = plan.id === 'pro'
          return (
            <div key={plan.id} className={`bg-white rounded-lg p-8 border relative ${
              isPopular ? 'border-2 border-sage-600' : 'border-sage-200'
            } ${isCurrent ? 'ring-1 ring-sage-500' : ''}`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage-600 text-sage-100 px-4 py-1 rounded-full text-xs font-medium tracking-wide uppercase">
                  Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-sage-100 text-sage-700 px-3 py-0.5 rounded-full text-xs font-medium">
                  Current
                </div>
              )}
              <h3 className="font-serif text-xl text-sage-900 mb-1">{plan.name}</h3>
              <p className="text-sage-400 text-xs uppercase tracking-wider mb-4">{plan.rendersPerDay} render{plan.rendersPerDay === 1 ? '' : 's'} per day</p>
              <p className="text-4xl font-serif text-sage-900 mb-6">
                ${plan.price}<span className="text-sm text-sage-400 font-sans">/mo</span>
              </p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center text-sm text-sage-600">
                    <span className="text-sage-400 mr-3">—</span> {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade(plan.id)} disabled={isCurrent || loading}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  isCurrent 
                    ? 'bg-sage-50 text-sage-400 cursor-not-allowed border border-sage-200'
                    : isPopular
                      ? 'bg-sage-600 text-white hover:bg-sage-700'
                      : 'border border-sage-300 text-sage-700 hover:bg-sage-50'
                } disabled:opacity-50`}>
                {loading ? 'Redirecting to payment…' : isCurrent ? 'Current plan' : 'Subscribe'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="text-center mt-10">
        <p className="text-xs text-sage-400 max-w-md mx-auto">
          Secure payment via Stripe. You'll be redirected to complete your purchase. 
          After payment, you'll be brought back here and your plan will activate automatically.
        </p>
      </div>
    </div>
  )
}