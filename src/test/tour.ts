import { initialState } from '../progress/state'
import { save } from '../storage/storage'

/** Saves a state in which the first-visit tour has already been seen, so it doesn't start on its own. */
export function markTourSeenInStorage() {
  const state = initialState()
  save({ ...state, help: { ...state.help, tourSeen: true } })
}
