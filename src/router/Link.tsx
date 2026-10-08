import type { AnchorHTMLAttributes } from 'react'

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** A path such as "/topic/sum-demo". */
  to: string
}

/** A plain anchor to a hash URL: the browser handles navigation, Back and new tabs. */
export function Link({ to, ...rest }: Props) {
  return <a href={`#${to}`} {...rest} />
}
