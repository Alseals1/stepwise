import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes: 'Adds up every number in a list by visiting them one at a time.',
  analogy: {
    text: 'Adding up a grocery receipt. You start at $0, look at one price at a time, and add it to a running total in your head. When you reach the bottom of the receipt, the total is your answer.',
    breaks:
      'A computer has no gut feeling for the total, so it must visit every single number. That is why the work grows with the length of the list.',
  },
  bigO: {
    time: 'O(n)',
    timeBecause: 'the loop visits each of the n numbers exactly once.',
    space: 'O(1)',
    spaceBecause: 'it only keeps one running total, however long the list is.',
  },
  quiz: [
    {
      question: 'What is total after the loop finishes for [2, 4, 6]?',
      options: ['12', '10', '6', '24'],
      answer: 0,
      explain: '2 + 4 + 6 = 12. Each pass adds one number to the running total.',
    },
    {
      question: 'How many times does the loop body run for [2, 4, 6]?',
      options: ['3 times', '2 times', '4 times', '6 times'],
      answer: 0,
      explain: 'Once for each number in the list, and there are 3 numbers.',
    },
    {
      question: 'What does sum([]) return?',
      options: ['It returns 0', 'It returns 1', 'It returns NaN', 'It crashes'],
      answer: 0,
      explain: 'With no numbers the loop never runs, so total stays at its starting value, 0.',
    },
  ],
  source: {
    label: 'MDN: for...of',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of',
  },
}
