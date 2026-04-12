'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { ReactNode } from 'react'

interface Props {
  href?: string
  onClick?: () => void
  label?: string
  icon?: ReactNode
  className?: string
}

// Floating action button visible only on mobile (< lg). Sits above the
// bottom tab bar (which is h-16).
export default function MobileFAB({ href, onClick, label, icon, className = '' }: Props) {
  const content = (
    <>
      <span className="flex h-6 w-6 items-center justify-center">{icon ?? <Plus className="h-6 w-6" />}</span>
      {label && <span className="sr-only">{label}</span>}
    </>
  )
  const classes = `fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg active:bg-indigo-700 transition-all lg:hidden ${className}`
  if (href) {
    return (
      <Link href={href} aria-label={label || 'Nouvelle action'} className={classes}>
        {content}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} aria-label={label || 'Nouvelle action'} className={classes}>
      {content}
    </button>
  )
}
