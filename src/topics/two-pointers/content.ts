import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes:
    'Finds two numbers in a sorted list that add up to a target by walking in from both ends and dropping one number at every step.',
  analogy: {
    text: 'Spending a gift card exactly. You have a price list sorted from cheapest to dearest and want two items that use the whole card. Put one finger on the cheapest item and one on the dearest. Total too high? The dear item is too pricey even next to the cheapest, so it can never be part of the answer: drop it. Total too low? The cheap item is too cheap even next to the dearest, so drop that one instead.',
    breaks:
      'It only works because the list is sorted. On an unsorted list, "move left to get a smaller number" means nothing, so you cannot tell which end to drop.',
  },
  bigO: {
    time: 'O(n)',
    timeBecause:
      'every step drops one number for good, so there are at most n steps. Nested loops would compare every pair, about n × n ÷ 2.',
    space: 'O(1)',
    spaceBecause: 'it keeps only two pointers and the current sum, however long the list is.',
  },
  quiz: [
    {
      question: 'The sum of the two ends is too big. What should you do?',
      options: ['Move right one step left', 'Move left one step right', 'Move both pointers inward'],
      answer: 0,
      explain:
        'The right number is the biggest left, and even with the smallest partner the total is too big, so it can never be in the answer: drop it by moving right left.',
    },
    {
      question: 'Why does the two-pointer method take O(n) time?',
      options: ['It sorts the list first', 'Each move drops a number', 'It uses a Set inside'],
      answer: 1,
      explain: 'Every move rules out one number for good, so with n numbers there are at most n moves.',
    },
    {
      question: 'Does this method work on an unsorted list?',
      options: ['Yes, any list works', 'Only for short lists', 'No, it needs order'],
      answer: 2,
      explain:
        'The moves only make sense when the left end is the smallest and the right end the biggest. Without order, use a Set instead.',
    },
    {
      question: 'How much extra memory does it need?',
      options: ['Just two pointers', 'A copy of the list', 'A Set of numbers'],
      answer: 0,
      explain: 'Only the left and right positions and the sum, which is O(1) however long the list is.',
    },
  ],
  source: {
    label: 'Tech Interview Handbook: Two pointers',
    url: 'https://www.techinterviewhandbook.org/algorithms/array/#two-pointers',
  },
}
