export interface QuizQuestion {
  question: string
  options: string[]
  /** Zero-based index of the correct option. */
  answer: number
  explain: string
}

export interface TopicContent {
  /** One sentence. */
  whatItDoes: string
  analogy: { text: string; breaks: string }
  /** Only set when a real, verified video exists. */
  watchFirst?: { label: string; url: string }
  bigO: { time: string; timeBecause: string; space: string; spaceBecause: string }
  quiz: QuizQuestion[]
  source: { label: string; url: string }
}

/** One stage on the level map. */
export interface StageInfo {
  id: string
  title: string
  blurb: string
  difficulty: 1 | 2 | 3
  /** False for planned topics that are not built yet. */
  available: boolean
}
