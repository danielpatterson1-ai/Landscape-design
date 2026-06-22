import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/90 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-sage-800 font-serif font-bold text-lg">D</span>
              </div>
              <span className="font-serif text-lg text-white tracking-tight">Landscape Design</span>
            </div>
            <div className="flex space-x-3">
              <Link to="/login" className="px-5 py-2 text-white/90 hover:text-white font-medium text-sm">Sign in</Link>
              <Link to="/register" className="px-5 py-2 bg-white text-sage-800 rounded-lg font-medium text-sm hover:bg-cream-50 transition-colors">
                Get started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient min-h-[85vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6">
              See your dream garden<br />before you dig.
            </h1>
            <p className="text-lg sm:text-xl text-sage-200 leading-relaxed mb-10 max-w-2xl">
              Upload a photo of your yard, describe your vision, and let AI create a realistic preview 
              of your new landscape — imposed right onto your original image.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="inline-flex items-center px-8 py-4 bg-white text-sage-800 rounded-lg font-medium text-base hover:bg-cream-50 transition-colors shadow-lg">
                Start your free trial
              </Link>
              <Link to="/login" className="inline-flex items-center px-8 py-4 border border-sage-400 text-sage-100 rounded-lg font-medium text-base hover:bg-sage-700/30 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">How it works</h2>
            <p className="text-sage-500 max-w-xl mx-auto">Three simple steps from photo to finished design</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-sage-600">01</span>
              </div>
              <h3 className="text-lg font-serif text-sage-900 mb-3">Upload your photo</h3>
              <p className="text-sage-500 text-sm leading-relaxed">
                Snap a picture of your yard — front garden, back patio, or side strip. 
                The AI will use it as the canvas for your new design.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-sage-600">02</span>
              </div>
              <h3 className="text-lg font-serif text-sage-900 mb-3">Describe your vision</h3>
              <p className="text-sage-500 text-sm leading-relaxed">
                Talk through your ideas naturally — plants, materials, layout, sunlight. 
                The AI understands garden design and asks the right questions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl text-sage-600">03</span>
              </div>
              <h3 className="text-lg font-serif text-sage-900 mb-3">See the result</h3>
              <p className="text-sage-500 text-sm leading-relaxed">
                Get a realistic after photo with your new garden design rendered right 
                onto your real yard. See exactly what it'll look like before you buy a single plant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-cream-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-heading mb-4">Simple, transparent pricing</h2>
            <p className="text-sage-500 max-w-xl mx-auto">All plans include unlimited conversation with the AI design assistant</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-sage-200 p-8">
              <h3 className="font-serif text-xl text-sage-900 mb-1">Starter</h3>
              <p className="text-sage-500 text-sm mb-6">For getting started</p>
              <p className="text-4xl font-serif text-sage-900 mb-6">$3.99 <span className="text-base text-sage-400 font-sans">/ month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> 1 AI render per day</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Unlimited AI chat</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Photo upload</li>
              </ul>
              <Link to="/register" className="btn-secondary w-full text-center">Get started</Link>
            </div>
            <div className="bg-white rounded-lg border-2 border-sage-600 p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sage-600 text-sage-100 px-4 py-1 rounded-full text-xs font-medium tracking-wide uppercase">Popular</div>
              <h3 className="font-serif text-xl text-sage-900 mb-1">Pro</h3>
              <p className="text-sage-500 text-sm mb-6">For regular projects</p>
              <p className="text-4xl font-serif text-sage-900 mb-6">$9.99 <span className="text-base text-sage-400 font-sans">/ month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> 4 AI renders per day</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Unlimited AI chat</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Photo upload</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Priority rendering</li>
              </ul>
              <Link to="/register" className="btn-primary w-full text-center">Get started</Link>
            </div>
            <div className="bg-white rounded-lg border border-sage-200 p-8">
              <h3 className="font-serif text-xl text-sage-900 mb-1">Unlimited</h3>
              <p className="text-sage-500 text-sm mb-6">For enthusiasts</p>
              <p className="text-4xl font-serif text-sage-900 mb-6">$14.99 <span className="text-base text-sage-400 font-sans">/ month</span></p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Unlimited renders</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Unlimited AI chat</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Photo upload</li>
                <li className="flex items-center text-sm text-sage-600"><span className="text-sage-500 mr-3">—</span> Priority support</li>
              </ul>
              <Link to="/register" className="btn-secondary w-full text-center">Get started</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sage-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-sage-700 rounded-lg flex items-center justify-center">
              <span className="text-sage-200 font-serif font-bold text-sm">D</span>
            </div>
            <span className="font-serif text-sage-300 text-lg">Landscape Design</span>
          </div>
          <p className="text-sage-500 text-sm">Transform your outdoor space with AI-powered design.</p>
        </div>
      </footer>
    </div>
  )
}