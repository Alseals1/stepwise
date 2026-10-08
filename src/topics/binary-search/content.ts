import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes:
    'Finds a target in a sorted list, or says it is missing, by checking the middle and throwing away the half it cannot be in.',
  analogy: {
    text: 'Looking up a word in a dictionary. You do not start at page one: you open the book to the middle and see whether your word comes before or after the words on that page. If it comes before, the whole back half of the book is out; if after, the front half is out. Then you open the middle of what is left, and keep going until you land on the word or run out of pages.',
    breaks:
      'It only works because the words are in order, so one look tells you which half to drop. And you may only jump to the middle of the pages still in play, not to any page you like. In an unordered list the middle tells you nothing, so you would have to check every item.',
  },
  bigO: {
    time: 'O(log n)',
    timeBecause:
      'every step throws away half of what is left, so 1,000,000 items need only about 20 steps, where a scan from the left could need 1,000,000.',
    space: 'O(1)',
    spaceBecause: 'the loop version keeps only low, high and mid, however long the list is.',
  },
  quiz: [
    {
      question: 'A sorted list has 1,000,000 numbers. About how many steps can binary search need at most?',
      options: ['About 50,000 steps', 'About 1,000 steps', 'About 20 steps'],
      answer: 2,
      explain: 'Each step halves the list, and 1,000,000 can only be halved about 20 times before nothing is left.',
    },
    {
      question: 'The middle number is smaller than the target. What do you do?',
      options: ['Search the right half', 'Search the left half', 'Search both halves'],
      answer: 0,
      explain:
        'The list is sorted, so everything on the left is smaller still. The target can only be on the right: set low to mid + 1.',
    },
    {
      question: 'Why does binary search need a sorted list?',
      options: ['It looks at every number twice', 'Order shows which half to drop', 'It sorts the list as it goes'],
      answer: 1,
      explain:
        'Because the list is in order, one look at the middle tells you which half the target cannot be in. Without order, that look tells you nothing.',
    },
    {
      question: 'How much extra memory does the loop version use?',
      options: ['A copy of the list', 'A Set of the numbers', 'Just low, mid and high'],
      answer: 2,
      explain: 'Only three positions, which is O(1) however long the list is.',
    },
  ],
  source: {
    label: 'Tech Interview Handbook: Sorting and searching',
    url: 'https://www.techinterviewhandbook.org/algorithms/sorting-searching/',
  },
}
