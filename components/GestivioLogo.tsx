interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { icon: 20, gap: 'gap-1', text: 'text-sm font-semibold' },
  md: { icon: 24, gap: 'gap-1.5', text: 'text-lg font-semibold' },
  lg: { icon: 32, gap: 'gap-2', text: 'text-2xl font-bold' },
}

function GestivioIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="10" y="36" width="42" height="28" rx="3" />
      <rect x="26" y="64" width="10" height="4" />
      <rect x="21" y="68" width="20" height="3" rx="1.5" />
      <path d="M18 36 L18 28 L10 28 L10 18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10" cy="15" r="3.5" />
      <path d="M24 36 L24 22 L18 22 L18 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="9" r="3" />
      <path d="M31 36 L31 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <circle cx="31" cy="7" r="3.5" />
      <path d="M38 36 L38 22 L44 22 L44 12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="44" cy="9" r="3" />
      <path d="M44 36 L44 28 L52 28 L52 18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="52" cy="15" r="3.5" />
      <rect x="13" y="27" width="8" height="2" rx="1" />
      <rect x="41" y="27" width="8" height="2" rx="1" />
    </svg>
  )
}

export default function GestivioLogo({ size = 'md', showText = true, className = '' }: Props) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap} text-gray-900 dark:text-white ${className}`}>
      <GestivioIcon size={s.icon} />
      {showText && (
        <span className={`tracking-tight ${s.text}`}>
          Gestivio
        </span>
      )}
    </span>
  )
}
