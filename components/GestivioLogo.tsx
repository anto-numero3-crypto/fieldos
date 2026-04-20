import Image from 'next/image'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { img: 24, gap: 'gap-2', text: 'text-sm font-semibold' },
  md: { img: 36, gap: 'gap-2', text: 'text-lg font-semibold' },
  lg: { img: 48, gap: 'gap-3', text: 'text-2xl font-bold' },
}

export default function GestivioLogo({ size = 'md', showText = true, className = '' }: Props) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <Image src="/logo.png" alt="Gestivio" width={s.img} height={s.img} quality={100} priority className="shrink-0 object-contain" />
      {showText && <span className={`text-gray-900 dark:text-white tracking-tight ${s.text}`}>Gestivio</span>}
    </span>
  )
}
