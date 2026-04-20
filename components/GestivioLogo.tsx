import Image from 'next/image'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { icon: 20, gap: 'gap-1.5', text: 'text-sm font-semibold' },
  md: { icon: 26, gap: 'gap-2', text: 'text-lg font-semibold' },
  lg: { icon: 34, gap: 'gap-2.5', text: 'text-2xl font-bold' },
}

export default function GestivioLogo({ size = 'md', showText = true, className = '' }: Props) {
  const s = SIZES[size]
  return (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <Image
        src="/icon.svg"
        alt=""
        width={s.icon}
        height={s.icon}
        className="shrink-0 dark:invert"
        priority
      />
      {showText && (
        <span className={`text-gray-900 dark:text-white tracking-tight ${s.text}`}>
          Gestivio
        </span>
      )}
    </span>
  )
}
