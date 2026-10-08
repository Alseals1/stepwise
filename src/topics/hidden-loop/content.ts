import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes:
    'Shows how checking seen.includes(item) inside a loop secretly re-scans the list every time, and why that makes the function O(n²).',
  analogy: {
    text: 'A club bouncer with a paper guest list. For every person who arrives, the bouncer reads the list from the top to see whether they are already inside. It is one question, but each answer takes a pass down the list. By the 100th arrival, that pass is 99 names long.',
    breaks:
      'A real bouncer remembers faces, but includes() has no memory: it starts from the top every time, and it stops early the moment it finds a match. The next topic shows the fix, a Set that remembers who is inside.',
  },
  bigO: {
    time: 'O(n²)',
    timeBecause:
      'each of the n items calls includes, which can scan up to n elements, so the work is about n times n.',
    space: 'O(n)',
    spaceBecause: 'seen can grow until it holds every item.',
  },
  quiz: [
    {
      question: 'Which line of hasDuplicate secretly loops over seen?',
      options: ['the push call', 'the includes call', 'the return line'],
      answer: 1,
      explain: 'includes compares the item with the elements of seen one by one, which is a loop you cannot see.',
    },
    {
      question: 'Four different items go in. How many comparisons does includes make in total?',
      options: ['4', '8', '6'],
      answer: 2,
      explain: 'The first scans 0 elements, then 1, then 2, then 3, so 0 + 1 + 2 + 3 = 6 comparisons.',
    },
    {
      question: 'Why can hasDuplicate finish before it has read every item?',
      options: ['return stops the function', 'includes skips the rest', 'seen runs out of room'],
      answer: 0,
      explain: 'As soon as includes finds a match, return true runs and the function ends right away.',
    },
  ],
  source: {
    label: 'MDN: Array.prototype.includes()',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes',
  },
}
