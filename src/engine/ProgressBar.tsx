interface Props {
  value: number
  max: number
  label: string
  /** Spoken in place of the bare number, e.g. "Step 3 of 7". */
  valueText?: string
}

export function ProgressBar({ value, max, label, valueText }: Props) {
  const safeMax = Math.max(max, 0)
  const now = Math.min(Math.max(value, 0), safeMax)
  const percent = safeMax === 0 ? 0 : (now / safeMax) * 100
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuenow={now}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuetext={valueText}
    >
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  )
}
