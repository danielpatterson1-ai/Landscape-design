import React, { useState, useRef, useCallback } from 'react'

export default function BeforeAfterSlider({ before, after, beforeLabel = 'Before', afterLabel = 'After' }) {
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setSliderPos((x / rect.width) * 100)
  }, [])

  const handleMouseDown = (e) => {
    setIsDragging(true)
    handleMove(e.clientX)
  }

  const handleTouchStart = (e) => {
    setIsDragging(true)
    handleMove(e.touches[0].clientX)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }

  const handleTouchMove = (e) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  if (!before || !after) return null

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-sage-700 bg-sage-100 px-3 py-1 rounded-full">
          {beforeLabel}
        </span>
        <span className="text-xs text-sage-500">Drag slider to compare</span>
        <span className="text-sm font-medium text-earth-600 bg-earth-100 px-3 py-1 rounded-full">
          {afterLabel}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-xl select-none cursor-ew-resize"
        style={{ paddingBottom: '66.67%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
      >
        {/* After image (full width, underneath) */}
        <img
          src={after}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* Before image (clipped to slider position) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={before}
            alt="Before"
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
            style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Slider handle */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
          {/* Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white shadow-md" />
          {/* Handle circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-sage-400">
            <svg className="w-5 h-5 text-sage-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7l-5 5 5 5M16 7l5 5-5 5" />
            </svg>
          </div>
        </div>

        {/* Labels on the image */}
        <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {beforeLabel}
        </div>
        <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
          {afterLabel}
        </div>
      </div>
    </div>
  )
}