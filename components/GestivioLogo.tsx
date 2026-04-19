import Image from 'next/image'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { img: 24, text: 'text-sm' },
  md: { img: 32, text: 'text-base' },
  lg: { img: 40, text: 'text-xl' },
}

export default function GestivioLogo({ size = 'md', showText = true, className = '' }: Props) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/logo.png" alt="Gestivio" width={s.img} height={s.img} className="shrink-0" style={{ objectFit: 'contain' }} />
      {showText && <span className={`font-bold text-gray-900 dark:text-white tracking-tight ${s.text}`}>Gestivio</span>}
    </span>
  )
}
