import { LevelMap } from '../components/LevelMap'
import { stageStates } from '../progress/progress'
import { useProgress } from '../progress/ProgressContext'
import { useDocumentTitle } from '../router/useDocumentTitle'
import { stages } from '../topics/stages'

export function Home() {
  useDocumentTitle('Your path')
  const { progress, setUnlockAll } = useProgress()
  return (
    <div>
      <h1 tabIndex={-1}>Your path</h1>
      <p className="page-intro">
        Pick a stage, watch the algorithm run step by step, then check yourself to earn stars.
      </p>
      <LevelMap states={stageStates(stages, progress)} unlockAll={progress.unlockAll} onUnlockAll={setUnlockAll} />
    </div>
  )
}
