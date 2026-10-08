import { Player } from './engine/Player'
import { sumDemo } from './topics/sum-demo'

// Temporary: feature 0003 replaces this demo with the level map.
const demoFrames = sumDemo.record(sumDemo.defaultInput)

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

export default function App() {
  return (
    <>
      <header className="site-header">
        <Logo />
        <div>
          <h1>Stepwise</h1>
          <p>See every step of an algorithm, one move at a time.</p>
        </div>
      </header>
      <main>
        <section aria-labelledby="demo-title">
          <h2 id="demo-title">{sumDemo.title}</h2>
          <Player frames={demoFrames} code={sumDemo.code} />
        </section>
      </main>
    </>
  )
}
