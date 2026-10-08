const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-10-06" becomes "Oct 6, 2026". Anything else is returned as it came. */
export function formatDay(key: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!match) return key
  const [, year, month, day] = match
  return `${MONTHS[Number(month) - 1]} ${Number(day)}, ${year}`
}
