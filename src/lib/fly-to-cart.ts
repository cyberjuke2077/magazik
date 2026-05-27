/**
 * Fly-to-cart animation: clones the source element and animates it toward
 * the cart icon (any element with `data-cart-icon`). Uses Web Animations API
 * for smooth GPU-accelerated motion.
 */

export function flyToCart(sourceElement: HTMLElement | null): void {
  if (typeof window === 'undefined' || !sourceElement) return

  // Respect users who prefer reduced motion
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const target = document.querySelector<HTMLElement>('[data-cart-icon]')
  if (!target) return

  const sourceRect = sourceElement.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  // Skip if either element is offscreen or zero-sized
  if (sourceRect.width === 0 || targetRect.width === 0) return

  const dx =
    targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2)
  const dy =
    targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2)

  // Build a small floating dot indicator
  const dot = document.createElement('div')
  dot.style.cssText = `
    position: fixed;
    left: ${sourceRect.left + sourceRect.width / 2 - 12}px;
    top: ${sourceRect.top + sourceRect.height / 2 - 12}px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #0066cc, #0ea5e9);
    box-shadow: 0 4px 16px rgba(0, 102, 204, 0.5);
    z-index: 9999;
    pointer-events: none;
    will-change: transform, opacity;
  `

  document.body.appendChild(dot)

  const animation = dot.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.3}px) scale(1.3)`, opacity: 0.9, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.4)`, opacity: 0, offset: 1 },
    ],
    {
      duration: 700,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  )

  animation.onfinish = () => {
    dot.remove()
    // Pulse the cart icon
    target.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.25)' },
        { transform: 'scale(1)' },
      ],
      { duration: 350, easing: 'ease-out' },
    )
  }
  animation.oncancel = () => dot.remove()
}
