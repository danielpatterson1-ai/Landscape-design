import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx'

export default function Renders() {
  const { api } = useAuth()
  const [renders, setRenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedRender, setExpandedRender] = useState(null)

  useEffect(() => {
    api('/api/renders')
      .then(setRenders)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-600"></div>
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
        <Link to="/design" className="px-6 py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700 transition">
          New Design
        </Link>
      </div>

      {renders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏡</div>
          <h3 className="text-xl font-semibold mb-2">No renders yet</h3>
          <p className="text-gray-500 mb-6">Start a conversation and generate your first landscape design</p>
          <Link to="/design" className="inline-block px-6 py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700 transition">
            Start Designing
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {renders.map(render => (
            <div key={render.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              {/* Render card header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    render.status === 'completed' ? 'bg-sage-100 text-sage-700' :
                    render.status === 'placeholder' ? 'bg-cream-100 text-cream-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {render.status === 'completed' ? 'Completed' :
                     render.status === 'placeholder' ? 'Preview' : 'Pending'}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(render.created_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => setExpandedRender(expandedRender === render.id ? null : render.id)}
                  className="text-sm text-sage-600 hover:text-sage-800 font-medium transition"
                >
                  {expandedRender === render.id ? 'Collapse' : 'Compare'}
                </button>
              </div>

              {/* Render images */}
              <div className="p-4">
                {render.original_photo_path && render.rendered_image_path && expandedRender === render.id ? (
                  /* Expanded: show before/after slider */
                  <BeforeAfterSlider
                    before={render.original_photo_path}
                    after={`/${render.rendered_image_path}`}
                    beforeLabel="Your Yard"
                    afterLabel="AI Design"
                  />
                ) : (
                  /* Compact: show side-by-side thumbnails or single image */
                  <div className="grid grid-cols-2 gap-3">
                    {/* Before (original photo) */}
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10 bg-sage-600/80 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                        Before
                      </div>
                      {render.original_photo_path ? (
                        <img
                          src={render.original_photo_path}
                          alt="Original yard"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                          No photo
                        </div>
                      )}
                    </div>

                    {/* After (rendered design) */}
                    <div className="relative">
                      <div className="absolute top-2 left-2 z-10 bg-earth-600/80 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                        After
                      </div>
                      {render.status === 'completed' && render.rendered_image_path ? (
                        <img
                          src={`/${render.rendered_image_path}`}
                          alt="AI Design"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="text-center p-2">
                            <div className="text-2xl mb-1">
                              {render.status === 'placeholder' ? '🌿' : '⏳'}
                            </div>
                            <p className="text-xs text-gray-500">
                              {render.status === 'pending' ? 'Generating...' : 'Preview'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prompt text */}
                <p className="text-sm text-gray-700 line-clamp-2 mt-3">{render.prompt_text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}