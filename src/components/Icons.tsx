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

export function FlameIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path
        d="M12 2.5c.6 3.2-1.2 4.6-2.7 6.4C7.8 10.7 6.5 12.5 6.5 15a5.5 5.5 0 0011 0c0-2.4-1-3.9-2-5.2-.4 1.2-1.1 2-2 2.3.5-3.4-.3-6.4-1.5-9.6z"
        fill="currentColor"
      />
    </svg>
  )
}

export function MedalIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M8 2.5h3l1 4.2-2 .9zM16 2.5h-3l-1 4.2 2 .9z" fill="currentColor" />
      <circle cx="12" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M12 12.2l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="currentColor" />
    </svg>
  )
}
