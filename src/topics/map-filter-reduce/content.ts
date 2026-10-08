import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes:
    'Calls a small function on each item of a list to build something new: map changes every item, filter keeps some, reduce boils the list down to one value, and find returns the first match.',
  analogy: {
    text: 'A factory conveyor belt. map is a stamping machine that treats every item the same way. filter is an inspector who pulls some items off the belt. reduce is a packer who adds each item to one running tally. find is a worker who grabs the first item that fits and stops the belt.',
    breaks:
      'A real belt carries its items away. These methods never touch your original list: map and filter hand you a new list, and reduce and find hand you a single value.',
  },
  bigO: {
    time: 'O(n)',
    timeBecause:
      'the callback runs once per item. find may stop early, but in the worst case it still checks every item.',
    space: 'O(n)',
    spaceBecause:
      'map and filter build a new list that can be as long as the input. reduce and find only keep one value.',
  },
  quiz: [
    {
      question: 'A list has 5 items. How many items does map return?',
      options: ['Always 5', 'Maybe fewer', 'Just one'],
      answer: 0,
      explain: 'map makes one new item for every old item, so the new list is always as long as the old one.',
    },
    {
      question: 'What does reduce return for an empty list when its starting value is 0?',
      options: ['undefined', 'The start, 0', 'An error'],
      answer: 1,
      explain:
        'With nothing to visit, reduce hands back its starting value. (Without a starting value, reduce on an empty list throws an error.)',
    },
    {
      question: 'Which of these can stop before it reaches the end of the list?',
      options: ['map', 'filter', 'find'],
      answer: 2,
      explain: 'find stops at the first item that matches. map and filter always visit every item.',
    },
    {
      question: 'After nums.map(n => n * 2), what has happened to nums?',
      options: ['Unchanged', 'Doubled', 'Emptied'],
      answer: 0,
      explain: 'map builds a new list and leaves nums as it was. That is why the code saves the result in doubled.',
    },
  ],
  source: {
    label: 'javascript.info: Array methods',
    url: 'https://javascript.info/array-methods',
  },
}
