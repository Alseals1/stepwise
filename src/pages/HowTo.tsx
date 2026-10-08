import { SHORTCUTS } from '../engine/shortcuts'
import { useProgress } from '../progress/ProgressContext'
import { Link } from '../router/Link'
import { goTo } from '../router/navigate'
import { BADGES_PATH, HOME_PATH, topicPath } from '../router/parseRoute'
import { useDocumentTitle } from '../router/useDocumentTitle'
import { stages } from '../topics/stages'

export function HowTo() {
  useDocumentTitle('How to use')
  const { requestTour } = useProgress()
  const firstTopic = stages.find((s) => s.available)

  function replayTour() {
    requestTour()
    if (firstTopic) goTo(topicPath(firstTopic.id))
  }

  return (
    <div className="how-to">
      <Link to={HOME_PATH} className="back-link">
        ← Back to the map
      </Link>
      <h1 tabIndex={-1}>How to use</h1>
      <p className="page-intro">Everything you need, in one place. It takes about a minute to read.</p>

      <section className="card" aria-labelledby="how-start">
        <h2 id="how-start">Quick start</h2>
        <ol className="how-steps" aria-label="Quick start steps">
          <li>
            <strong>Pick a stage</strong> on the map. The glowing one marked &ldquo;Next up&rdquo; is a good start.
          </li>
          <li>
            <strong>Press Play</strong> and watch the algorithm run, one step at a time. The highlighted code line is
            the one running.
          </li>
          <li>
            <strong>Check yourself</strong> with the quiz at the bottom to earn stars.
          </li>
        </ol>
      </section>

      <section className="card" aria-labelledby="how-controls">
        <h2 id="how-controls">Controls and keyboard shortcuts</h2>
        <table className="how-table" aria-label="Controls and keyboard shortcuts">
          <thead>
            <tr>
              <th scope="col">What it does</th>
              <th scope="col">Button</th>
              <th scope="col">Keyboard</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((shortcut) => (
              <tr key={shortcut.action}>
                <th scope="row">{shortcut.action}</th>
                <td>{shortcut.button}</td>
                <td>
                  <kbd>{shortcut.label}</kbd>
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">Speed</th>
              <td>The Speed slider</td>
              <td>Focus the slider, then use the arrow keys</td>
            </tr>
            <tr>
              <th scope="row">Switch between JS or TS</th>
              <td>The JS and TS buttons above the code</td>
              <td>Tab to a button, then Enter</td>
            </tr>
          </tbody>
        </table>
        <p className="how-note">
          Shortcuts pause while you are typing or using a slider, so they never get in the way.
        </p>
      </section>

      <section className="card" aria-labelledby="how-page">
        <h2 id="how-page">Reading a topic page</h2>
        <dl className="how-terms">
          <dt>The picture</dt>
          <dd>Your data as boxes. The glowing box is the one being worked on; green ones are done.</dd>
          <dt>The code</dt>
          <dd>The same code in JavaScript or TypeScript, with the running line highlighted.</dd>
          <dt>Predict mode</dt>
          <dd>
            Switch it on to guess what happens before each important step. Pick an answer with the mouse or the number
            keys 1 – 4. A wrong guess is explained and the step carries on, so nothing ever blocks you. You get a score
            at the end of the run.
          </dd>
          <dt>Variables and the sentence</dt>
          <dd>Every variable&apos;s current value, and one sentence saying what just happened and why.</dd>
          <dt>Analogy and Big O</dt>
          <dd>A real-life picture of the idea, where it stops fitting, and how fast the code is.</dd>
          <dt>Check yourself</dt>
          <dd>A short quiz. Finishing it completes the topic and earns stars.</dd>
        </dl>
      </section>

      <section className="card" aria-labelledby="how-game">
        <h2 id="how-game">Stars, streak and badges</h2>
        <p>
          <strong>Stars:</strong> 3 stars for every answer right, 2 for at least half, 1 for finishing. You can retry and
          keep your best.
        </p>
        <p>
          <strong>Streak:</strong> a day counts when you play a run to its last step or check a quiz. Miss a single day
          and the weekly freeze forgives it, once a week. Your best streak is always kept.
        </p>
        <p>
          <strong>Badges:</strong> unlock them as you go and see them all on the <Link to={BADGES_PATH}>badges page</Link>.
        </p>
      </section>

      <section className="card" aria-labelledby="how-data">
        <h2 id="how-data">Your data</h2>
        <p>
          Your progress is saved in this browser only. Open <strong>Your data</strong> in the header to download a
          backup, copy it, or restore it on another browser or device. Do this before clearing browser data.
        </p>
      </section>

      <section className="card" aria-labelledby="how-tour">
        <h2 id="how-tour">Replay the tour</h2>
        <p>Want the quick tour of the picture, the code and the controls again?</p>
        <button type="button" className="btn primary" onClick={replayTour}>
          Replay the tour
        </button>
      </section>
    </div>
  )
}
