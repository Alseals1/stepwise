import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes:
    "Finds two numbers in any list that add up to a target in one pass, by remembering each number's index in a Map and looking up the partner it needs.",
  analogy: {
    text: 'A coat check where every coat has a number, and each person is looking for the one partner whose number completes the target. Each new arrival asks the attendant, "Has my partner already left a coat?" That is one glance at the rack, and if the coat is there the attendant hands over the ticket that says where it hangs. If not, the arrival leaves their own coat and ticket, so someone later can find it.',
    breaks:
      'The Map keeps every coat that did not match, so the memory it uses grows with the list. It also remembers positions (the tickets), not just that someone is there.',
  },
  bigO: {
    time: 'O(n)',
    timeBecause:
      'it makes one pass, and each lookup in the Map takes O(1) on average. Nested loops would compare every pair, about n × n ÷ 2.',
    space: 'O(n)',
    spaceBecause: 'the Map can end up holding every item with its index.',
  },
  quiz: [
    {
      question: 'The target is 10 and the current item is 4. What does the code look up?',
      options: ['6', '14', '4'],
      answer: 0,
      explain: 'The partner is the complement, target minus the item: 10 - 4 = 6.',
    },
    {
      question: 'What does the Map store for each item?',
      options: ['Only that it exists', 'Its value and index', 'Its sum with a partner'],
      answer: 1,
      explain: 'The value is the key to look up, and the index is what comes back, so the answer can name both positions.',
    },
    {
      question: 'Why is the lookup done before the item is stored?',
      options: ['So the Map stays sorted', 'So it uses less memory', 'So no item pairs itself'],
      answer: 2,
      explain: 'If an item were stored first, it could find itself as its own partner, for example 5 with target 10.',
    },
    {
      question: 'Compared with two pointers, what does the Map version spend?',
      options: ['Extra memory', 'Time on sorting', 'A second pass'],
      answer: 0,
      explain:
        'It works on any order, but the Map can hold every item, O(n) space. Two pointers needs a sorted list and only O(1) space.',
    },
  ],
  source: {
    label: 'MDN: Map',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
  },
}
