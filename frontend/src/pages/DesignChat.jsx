import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import BeforeAfterSlider from '../components/BeforeAfterSlider.jsx'

export default function DesignChat() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { api } = useAuth()
  const [conversation, setConversation] = useState(id ? { id } : null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [lastRender, setLastRender] = useState(null)
  const [usage, setUsage] = useState(null)
  const [showBeforeAfter, setShowBeforeAfter] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    api('/api/usage').then(setUsage).catch(console.error)
  }, [])

  useEffect(() => {
    if (id) {
      api(`/api/conversations/${id}/messages`).then(setMessages).catch(console.error)
    }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const createConversation = async () => {
    const conv = await api('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Design', photoId: photo?.id || null })
    })
    setConversation(conv)
    navigate(`/design/${conv.id}`, { replace: true })
    return conv
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const result = await api('/api/upload', { method: 'POST', body: formData })
      setPhoto(result)
      setPhotoPreview(result.url)
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    try {
      let conv = conversation
      if (!conv?.id) {
        conv = await createConversation()
      }

      // Add user message optimistically
      const userMsg = { role: 'user', content: text, created_at: new Date().toISOString() }
      setMessages(prev => [...prev, userMsg])

      const result = await api(`/api/conversations/${conv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text })
      })
      setMessages(prev => [...prev.filter(m => m.id || m !== userMsg), result.userMessage, result.aiMessage])
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const generateRender = async () => {
    if (!photo) {
      alert('Please upload a photo first')
      return
    }
    try {
      // Get the last AI message as the prompt
      const lastAiMsg = messages.filter(m => m.role === 'assistant').pop()
      const prompt = lastAiMsg?.content || 'Design a beautiful landscape for this yard'

      const render = await api('/api/renders', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation?.id || null,
          photoId: photo?.id || null,
          photoPath: photo?.url || '',
          promptText: prompt
        })
      })
      setLastRender(render)
      setShowBeforeAfter(true)
      // Refresh usage
      api('/api/usage').then(setUsage).catch(console.error)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Chat */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[70vh]">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold">AI Design Assistant</h2>
            <p className="text-sm text-gray-500">Describe your dream landscape</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">🌱</div>
                <p>Describe what you want in your garden!</p>
                <p className="text-sm mt-2">Try: "I want a drought-resistant garden with lavender and rocks"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-green-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input type="text" value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Describe your landscape ideas..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                disabled={sending} />
              <button onClick={sendMessage} disabled={sending || !input.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition">
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right: Photo & Render */}
        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">1. Upload Your Yard Photo</h3>
            {photoPreview ? (
              <div>
                <img src={photoPreview} alt="Your yard" className="w-full h-48 object-cover rounded-lg mb-3" />
                <button onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  className="text-sm text-red-600 hover:underline">Remove</button>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-500 transition">
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm text-gray-500">{uploading ? 'Uploading...' : 'Click to upload a photo of your yard'}</p>
              </label>
            )}
          </div>

          {/* Usage */}
          {usage && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Daily renders: {usage.used}/{usage.limit === Infinity ? '∞' : usage.limit}</span>
              </div>
            </div>
          )}

          {/* Generate Render */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-4">2. Generate Design Render</h3>
            <button onClick={generateRender} disabled={!photo || !messages.length}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              🎨 Generate My Design
            </button>
            {lastRender && showBeforeAfter && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sage-800">3. Before & After</h3>
                  <button
                    onClick={() => setShowBeforeAfter(false)}
                    className="text-xs text-sage-500 hover:text-sage-700 transition"
                  >
                    Hide
                  </button>
                </div>
                <BeforeAfterSlider
                  before={photoPreview}
                  after={lastRender.rendered_image_path ? `/${lastRender.rendered_image_path}` : null}
                  beforeLabel="Your Yard"
                  afterLabel="AI Design"
                />
                <div className="mt-3 text-center">
                  <Link
                    to="/renders"
                    className="text-sm text-sage-600 hover:text-sage-800 underline transition"
                  >
                    View all renders →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}