export interface TourStep {
  id: string
  /** The value of the data-tour attribute on the part of the screen to point at. */
  target: string
  title: string
  text: string
}

/** The tour shown the first time a topic is opened. */
export const TOPIC_TOUR: TourStep[] = [
  {
    id: 'picture',
    target: 'picture',
    title: 'The picture',
    text: 'This shows your data and changes at every step.',
  },
  {
    id: 'code',
    target: 'code',
    title: 'The code',
    text: 'The highlighted line is the one running right now. Switch between JS and TS here.',
  },
  {
    id: 'predict',
    target: 'predict',
    title: 'Predict mode',
    text: 'Switch this on to guess what happens before each important step. A wrong guess is fine: you will see why. Press the number keys 1, 2 or 3 to answer.',
  },
  {
    id: 'controls',
    target: 'controls',
    title: 'The controls',
    text: 'Press Play to watch, or use Next and Back to go one step at a time. On a keyboard: Space plays or pauses, the arrow keys step and R restarts.',
  },
  {
    id: 'input',
    target: 'input',
    title: 'Try your own numbers',
    text: 'Type your own numbers here and press Apply to watch the algorithm run on them. Random picks an example for you, and Reset goes back to the original.',
  },
]
