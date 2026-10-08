/** Decorative icons: the meaning is always also given as text. */
interface IconProps {
  className?: string
}

const common = { viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false } as const

export function StarIcon({ className, filled }: IconProps & { filled?: boolean }) {
  return (
    <svg {...common} className={className} data-filled={filled ? 'true' : 'false'}>
      <path
        d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2l-5.9 3.4 1.3-6.6L2.5 9.4l6.6-.8z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 11V8a4 4 0 018 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
