import { Player } from './engine/Player'
import { sumDemo } from './topics/sum-demo'

// Temporary: feature 0003 replaces this demo with the topic grid.
const demoFrames = sumDemo.record(sumDemo.defaultInput)

export default function App() {
  return (
    <main>
      <h1>Stepwise</h1>
      <p>See every step of an algorithm, one move at a time.</p>
      <section aria-labelledby="demo-title">
        <h2 id="demo-title">{sumDemo.title}</h2>
        <Player frames={demoFrames} code={sumDemo.code} />
      </section>
    </main>
  )
}
