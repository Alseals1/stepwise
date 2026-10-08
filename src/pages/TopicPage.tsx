import { useState } from 'react'
import { AnalogyCard } from '../components/AnalogyCard'
import { BigOCard } from '../components/BigOCard'
import { DifficultyDots } from '../components/DifficultyDots'
import { Quiz } from '../components/Quiz'
import { WatchFirst } from '../components/WatchFirst'
import { InputPanel } from '../engine/InputPanel'
import { Player } from '../engine/Player'
import type { Frame } from '../engine/types'
import { useProgress } from '../progress/ProgressContext'
import { TOPIC_TOUR } from '../tour/steps'
import { Tour } from '../tour/Tour'
import { Link } from '../router/Link'
import { HOME_PATH } from '../router/parseRoute'
import { useDocumentTitle } from '../router/useDocumentTitle'
import type { Run, TopicEntry } from '../topics/registry'
import type { StageInfo } from '../topics/types'

export function TopicPage({ stage, entry }: { stage: StageInfo; entry: TopicEntry }) {
  useDocumentTitle(stage.title)
  // The run on screen. Applying the learner's own input swaps the frames; the key restarts the Player,
  // which throws away the old run's step, playback, question, answers and score in one go.
  const [current, setCurrent] = useState<{ frames: Frame[]; key: number }>({ frames: entry.frames, key: 0 })
  const showRun = (run: Run) => setCurrent((c) => ({ frames: run.frames, key: c.key + 1 }))
  const { progress, tourRequested, markTourSeen, completeTopic, recordRun, setLanguage, setSpeed, setPredictMode } =
    useProgress()
  const { content } = entry
  // The tour runs the first time a topic is opened, and again when the learner asks for it.
  const showTour = !progress.help.tourSeen || tourRequested

  return (
    <article className="topic-page">
      <Link to={HOME_PATH} className="back-link">
        ← Back to the map
      </Link>
      <div className="topic-head">
        <h1 tabIndex={-1}>{stage.title}</h1>
        <DifficultyDots level={stage.difficulty} />
      </div>
      <p className="what-it-does">
        <span className="label">What this does</span> {content.whatItDoes}
      </p>
      <WatchFirst video={content.watchFirst} />
      <AnalogyCard analogy={content.analogy} />
      <Player
        key={current.key}
        frames={current.frames}
        code={entry.code}
        initialLanguage={progress.settings.language}
        onLanguageChange={setLanguage}
        initialSpeed={progress.settings.speed}
        onSpeedChange={setSpeed}
        initialPredict={progress.settings.predictMode}
        onPredictChange={setPredictMode}
        onRunComplete={() => recordRun(stage.id)}
      />
      {entry.editor && <InputPanel editor={entry.editor} onRun={showRun} />}
      <BigOCard bigO={content.bigO} />
      <Quiz
        key={stage.id}
        questions={content.quiz}
        onFinish={(correct, total) => completeTopic(stage.id, correct, total)}
      />
      <p className="source">
        Source:{' '}
        <a href={content.source.url} target="_blank" rel="noopener noreferrer">
          {content.source.label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
      {showTour && <Tour steps={TOPIC_TOUR} onFinish={markTourSeen} finishNote="You can replay this tour from How to use." />}
    </article>
  )
}
