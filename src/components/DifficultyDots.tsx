const WORDS = { 1: 'easy', 2: 'medium', 3: 'hard' } as const

export function DifficultyDots({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="difficulty" role="img" aria-label={`Difficulty: ${WORDS[level]}`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className="difficulty-dot" data-filled={n <= level ? 'true' : 'false'} />
      ))}
    </span>
  )
}
