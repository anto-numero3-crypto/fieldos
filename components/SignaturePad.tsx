'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/lib/LanguageContext'
import { Eraser, Check, Type } from 'lucide-react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onClear: () => void
  width?: number
  height?: number
}

export default function SignaturePad({ onSave, onClear, width, height = 150 }: SignaturePadProps) {
  const { lang } = useLanguage()
  const fr = lang === 'fr'

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedName, setTypedName] = useState('')
  const [canvasWidth, setCanvasWidth] = useState(width || 400)

  // Responsive width
  useEffect(() => {
    if (width) { setCanvasWidth(width); return }
    const measure = () => {
      if (containerRef.current) {
        const w = Math.min(containerRef.current.offsetWidth, 400)
        setCanvasWidth(w)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [width])

  // Init canvas with white background
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    initCanvas()
  }, [canvasWidth, height, initCanvas])

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    setDrawing(true)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setDrawing(false)
  }

  const handleClear = () => {
    initCanvas()
    setHasDrawn(false)
    onClear()
  }

  const handleConfirm = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
  }

  const renderTypedSignature = () => {
    if (!typedName.trim()) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Clear and draw white background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    // Render name in italic serif
    ctx.fillStyle = '#000000'
    ctx.font = `italic 32px "Georgia", "Times New Roman", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2)
    setHasDrawn(true)
  }

  return (
    <div ref={containerRef} className="w-full max-w-[400px]">
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={height}
          className="cursor-crosshair touch-none w-full"
          style={{ display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Eraser className="h-3.5 w-3.5" />
          {fr ? 'Effacer' : 'Clear'}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!hasDrawn}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Check className="h-3.5 w-3.5" />
          {fr ? 'Confirmer' : 'Confirm'}
        </button>
      </div>

      {/* Type name fallback */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">
          {fr ? 'Ou tapez votre nom' : 'Or type your name'}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={fr ? 'Votre nom' : 'Your name'}
            className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
          />
          <button
            type="button"
            onClick={renderTypedSignature}
            disabled={!typedName.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Type className="h-3.5 w-3.5" />
            {fr ? 'Appliquer' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
