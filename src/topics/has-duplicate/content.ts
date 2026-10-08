import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes: 'Finds out whether a list has a duplicate two ways, nested loops and a Set, and counts the work each one does.',
  analogy: {
    text: "A bouncer who stamps each guest's hand as they go in. A stamped hand means that person is already inside, which takes one glance. The nested-loops bouncer instead compares every guest with every other guest.",
    breaks:
      'A Set is not a stamp on the person: it stores the items themselves, which uses extra memory. That memory is the price of the instant check.',
  },
  bigO: {
    time: 'O(n²) vs O(n)',
    timeBecause:
      'the nested loops compare every pair (about n × n ÷ 2), while the Set does one lookup per item.',
    space: 'O(1) vs O(n)',
    spaceBecause: 'the nested loops need no extra memory, but the Set stores every item it has seen.',
  },
  quiz: [
    {
      question: 'How many comparisons do nested loops make for 5 different items?',
      options: ['10', '25', '5'],
      answer: 0,
      explain: 'Each item is compared with every item after it: 4 + 3 + 2 + 1 = 10 pairs.',
    },
    {
      question: 'What does the Set version pay for being faster?',
      options: ['A sorted list', 'More memory', 'More loops'],
      answer: 1,
      explain: 'The Set stores every item it has seen, so it trades extra memory for less time.',
    },
    {
      question: 'For 1,000 different items, about how many lookups does the Set make?',
      options: ['100', '5,000', '1,000'],
      answer: 2,
      explain: 'One lookup per item, so about 1,000. The nested loops would need nearly 500,000 comparisons.',
    },
  ],
  source: {
    label: 'MDN: Set',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set',
  },
}
