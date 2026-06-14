const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-24 h-24 text-3xl',
}

export default function Avatar({ initial, size = 'sm', className = '' }) {
  const sizeCls = SIZE_MAP[size] ?? SIZE_MAP.sm
  return (
    <span
      className={`kol-avatar inline-flex items-center justify-center rounded-full bg-surface-secondary text-emphasis font-narrow font-semibold shrink-0 ${sizeCls} ${className}`}
    >
      {initial}
    </span>
  )
}
