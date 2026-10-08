/** Goes to a path such as "/topic/sum-demo", the same as clicking a Link to it. */
export function goTo(path: string): void {
  window.location.hash = `#${path}`
}
