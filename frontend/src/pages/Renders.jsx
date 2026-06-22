import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Renders() {
  const { api } = useAuth()
  const [renders, setRenders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/api/renders')
      .then(setRenders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Renders</h1>
          <p className="text-gray-600">All your AI-generated landscape designs</p>
        </div>
        <Link to="/design" className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
          New Design
        </Link>
      </div>

      {renders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏡</div>
          <h3 className="text-xl font-semibold mb-2">No renders yet</h3>
          <p className="text-gray-500 mb-6">Start a conversation and generate your first landscape design</p>
          <Link to="/design" className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
            Start Designing
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renders.map(render => (
            <div key={render.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                {render.status === 'completed' && render.rendered_image_path ? (
                  <img src={`/${render.rendered_image_path}`} alt="Render" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-5xl mb-2">
                      {render.status === 'placeholder' ? '🌿' : render.status === 'pending' ? '⏳' : '🎨'}
                    </div>
                    <p className="text-sm text-gray-500">
                      {render.status === 'pending' ? 'Generating...' : 
                       render.status === 'placeholder' ? 'Preview (AI service pending)' : 'Render'}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-800 line-clamp-2 mb-2">{render.prompt_text}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{new Date(render.created_at).toLocaleDateString()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    render.status === 'completed' ? 'bg-green-100 text-green-700' :
                    render.status === 'placeholder' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>{render.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}