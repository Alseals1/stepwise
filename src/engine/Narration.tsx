export function Narration({ say }: { say: string }) {
  return (
    <p className="narration" role="status" aria-live="polite">
      {say}
    </p>
  )
}
