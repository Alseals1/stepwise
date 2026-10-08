import type { TopicContent } from '../types'

export const content: TopicContent = {
  whatItDoes:
    'Checks whether a word reads the same backwards by comparing characters from both ends, walking inward, and stopping at the first pair that differs.',
  analogy: {
    text: 'Two people reading the same word from opposite ends of a banner. One reads left to right, the other right to left, and after each step they compare the letter each just reached. While every pair matches they keep walking toward each other; the moment a pair differs they stop, because the word cannot read the same both ways. If they meet in the middle, every pair matched and it is a palindrome.',
    breaks:
      'A real reader would finish the whole word anyway; the pointers stop at the first difference and never look at the rest. And in a word with an odd number of letters the middle letter has no partner, so nobody compares it.',
  },
  bigO: {
    time: 'O(n)',
    timeBecause:
      'it makes at most n ÷ 2 comparisons, and half of n is still O(n): double the word and the work doubles.',
    space: 'O(1)',
    spaceBecause:
      "it keeps only two pointers and never copies the word, unlike str.split('').reverse().join(''), which builds a whole reversed copy.",
  },
  quiz: [
    {
      question: 'The two ends do not match. What does the code do?',
      options: ['Move both pointers in', 'Return false at once', 'Count it, then go on'],
      answer: 1,
      explain: 'One pair that differs is enough to prove the word is not a palindrome, so it returns false without checking the rest.',
    },
    {
      question: 'What happens to the middle letter of an odd word?',
      options: ['It is never compared', 'It is compared twice', 'It is compared last'],
      answer: 0,
      explain: 'front and back land on it together, so front < back is false and the loop stops: a letter always matches itself.',
    },
    {
      question: 'Why does this take O(n) time?',
      options: ['It sorts the letters first', 'It loops inside a loop', 'It reads half the letters'],
      answer: 2,
      explain: 'It makes at most n ÷ 2 comparisons, and half of n still grows in step with n, so the time is O(n).',
    },
    {
      question: 'How much extra memory does it need?',
      options: ['A reversed copy', 'Just two pointers', 'A Set of letters'],
      answer: 1,
      explain: 'Only front and back, which is O(1) however long the word is. Reversing a copy of the word would need O(n).',
    },
  ],
  source: {
    label: 'Tech Interview Handbook: Strings (Palindrome)',
    url: 'https://www.techinterviewhandbook.org/algorithms/string/#palindrome',
  },
}
