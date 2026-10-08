import { useEffect, useMemo, useRef } from 'react'
import { Hud } from './components/Hud'
import { HowToLink } from './components/HowToLink'
import { Toasts } from './components/Toasts'
import { Badges } from './pages/Badges'
import { Home } from './pages/Home'
import { HowTo } from './pages/HowTo'
import { Locked } from './pages/Locked'
import { NotFound } from './pages/NotFound'
import { resolvePage } from './pages/resolvePage'
import { TopicPage } from './pages/TopicPage'
import { stageStates } from './progress/progress'
import { ProgressProvider, useProgress } from './progress/ProgressContext'
import { Link } from './router/Link'
import { HOME_PATH } from './router/parseRoute'
import { useRoute } from './router/useRoute'
import { getEntry } from './topics/registry'
import { stages } from './topics/stages'

function Logo() {
  // Three rising steps.
  return (
    <svg className="logo" viewBox="0 0 32 32" width="36" height="36" aria-hidden="true">
      <rect x="2" y="20" width="8" height="10" rx="2" className="logo-step logo-step-1" />
      <rect x="12" y="12" width="8" height="18" rx="2" className="logo-step logo-step-2" />
      <rect x="22" y="3" width="8" height="27" rx="2" className="logo-step logo-step-3" />
    </svg>
  )
}

function Pages() {
  const route = useRoute()
  const { progress } = useProgress()
  const states = useMemo(() => stageStates(stages, progress), [progress])
  const page = resolvePage(route, states, getEntry)

  // After navigating, put keyboard and screen-reader focus on the new page's heading.
  const routeKey = JSON.stringify(route)
  const previousKey = useRef<string | null>(null)
  useEffect(() => {
    if (previousKey.current !== null && previousKey.current !== routeKey) {
      document.querySelector<HTMLElement>('main h1')?.focus()
    }
    previousKey.current = routeKey
  }, [routeKey])

  switch (page.page) {
    case 'home':
      return <Home />
    case 'badges':
      return <Badges />
    case 'how-to':
      return <HowTo />
    case 'topic':
      return <TopicPage stage={page.state.stage} entry={page.entry} />
    case 'locked':
      return <Locked blockedBy={page.state.blockedBy ?? ''} />
    case 'not-found':
      return <NotFound reason={page.reason} />
  }
}

export default function App() {
  return (
    <ProgressProvider>
      <header className="site-header">
        <Logo />
        <div>
          <Link to={HOME_PATH} className="brand">
            Stepwise
          </Link>
          <p>See every step of an algorithm, one move at a time.</p>
        </div>
        <div className="header-actions">
          <Hud />
          <HowToLink />
        </div>
      </header>
      <main>
        <Pages />
      </main>
      <Toasts />
    </ProgressProvider>
  )
}
