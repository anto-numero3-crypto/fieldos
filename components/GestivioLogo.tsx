interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  forceDark?: boolean
}

const SIZES = {
  sm: { icon: 18, gap: 'gap-0.5', text: 'text-sm font-semibold' },
  md: { icon: 22, gap: 'gap-1', text: 'text-lg font-semibold' },
  lg: { icon: 28, gap: 'gap-1', text: 'text-2xl font-bold' },
}

function GestivioIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 52" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Monitor screen - wide, slightly rounded */}
      <rect x="8" y="22" width="28" height="18" rx="2" />
      {/* Stand neck */}
      <rect x="19" y="40" width="6" height="3" />
      {/* Stand base */}
      <rect x="15" y="43" width="14" height="2.5" rx="1.2" />

      {/* === 3 nodes from TOP of monitor === */}
      {/* Left-top: short vertical up */}
      <line x1="16" y1="22" x2="16" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="16" cy="12" r="2.8" />

      {/* Center-top: short vertical up */}
      <line x1="22" y1="22" x2="22" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="8" r="2.5" />

      {/* Right-top: short vertical up */}
      <line x1="28" y1="22" x2="28" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="28" cy="12" r="2.8" />

      {/* === 2 nodes from SIDES of monitor === */}
      {/* Left side: goes left then up (L-shape) */}
      <path d="M8 28 L4 28 L4 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="4" cy="15.5" r="2.8" />

      {/* Right side: goes right then up (L-shape) */}
      <path d="M36 28 L40 28 L40 18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="40" cy="15.5" r="2.8" />

      {/* Small horizontal bars connecting at the top edge */}
      <rect x="13" y="21" width="6" height="1.5" rx="0.75" />
      <rect x="25" y="21" width="6" height="1.5" rx="0.75" />
    </svg>
  )
}

export default function GestivioLogo({ size = 'md', showText = true, className = '', forceDark = false }: Props) {
  const s = SIZES[size]
  const colorClass = forceDark
    ? 'text-gray-900'
    : 'text-gray-900 dark:text-white'
  return (
    <span className={`inline-flex items-center ${s.gap} ${colorClass} ${className}`}>
      <GestivioIcon size={s.icon} />
      {showText && (
        <span className={`tracking-tight ${s.text}`}>
          Gestivio
        </span>
      )}
    </span>
  )
}
