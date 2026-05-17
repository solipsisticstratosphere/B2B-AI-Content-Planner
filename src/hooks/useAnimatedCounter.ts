import { useEffect, useRef, useState } from 'react'

export function useAnimatedCounter(target: number, duration = 600): number {
  const [count, setCount] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const startTime = performance.now()

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out-quart: fast start, decelerates to end — feels snappier
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [target, duration])

  return count
}
