import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes: 'Shows what push, unshift, pop and shift do to an array, and how many elements each one has to move.',
  analogy: {
    text: 'A row of cinema seats. Every seat has a number, so walking straight to seat 7 is instant. Someone sitting in the empty seat at the end of the row bothers nobody. Someone squeezing in at the front makes everyone shift over one seat.',
    breaks:
      "Real seats don't grow, but JavaScript arrays resize themselves automatically. That resizing doesn't change the costs you quote in an interview.",
  },
  bigO: {
    time: 'O(1) or O(n)',
    timeBecause:
      'push and pop only touch the last seat (O(1)), while shift and unshift make every other element move over (O(n)).',
    space: 'O(1)',
    spaceBecause: 'none of them copy the array, they change it in place.',
  },
  quiz: [
    {
      question: 'Which of these has to move every other element in the array?',
      options: ['push', 'unshift', 'pop'],
      answer: 1,
      explain: 'unshift adds at the front, so every element already there slides one seat to the right.',
    },
    {
      question: 'What happens to the other elements when you call pop()?',
      options: ['Nothing moves', 'Each moves left', 'Each moves right', 'They get sorted'],
      answer: 0,
      explain: 'pop only empties the last seat, so nobody else has to move.',
    },
    {
      question: 'On an array with 1,000 elements, which call does the most work?',
      options: ['push(7)', 'pop()', 'shift()'],
      answer: 2,
      explain: 'shift removes the first element, and all 999 others have to slide one seat to the left.',
    },
  ],
  source: {
    label: 'Tech Interview Handbook: array cheatsheet',
    url: 'https://www.techinterviewhandbook.org/algorithms/array/',
  },
}
