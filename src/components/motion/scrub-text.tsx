interface ScrubTextProps {
  children: string
  className?: string
}

export function ScrubText({ children, className }: ScrubTextProps) {
  const words = children.split(' ')

  return (
    <p className={className} data-motion-scrub>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} data-motion-word className="inline-block">
          {word}{index === words.length - 1 ? '' : '\u00a0'}
        </span>
      ))}
    </p>
  )
}
