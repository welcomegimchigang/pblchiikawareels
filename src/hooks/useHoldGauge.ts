import { useCallback, useEffect, useRef, useState } from 'react'

const FILL_MS = 3000 // 0 → 100% 걸리는 시간
const DRAIN_PER_SEC = 15 // 손 떼면 초당 줄어드는 %

/**
 * 꾹 누르고 있으면 게이지가 차고, 떼면 천천히 빠지는 훅.
 * requestAnimationFrame으로 갱신해서 모바일에서도 끊기지 않음.
 */
export function useHoldGauge(onComplete: () => void) {
  const [gauge, setGauge] = useState(0)
  const [holding, setHolding] = useState(false)
  const [done, setDone] = useState(false)

  const holdingRef = useRef(false)
  const gaugeRef = useRef(0)
  const doneRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef(0)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const stopLoop = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  const tick = useCallback((now: number) => {
    const dt = Math.min(now - lastRef.current, 100) // 탭 전환 등으로 튀는 값 방지
    lastRef.current = now

    let g = gaugeRef.current
    if (holdingRef.current) g += (dt / FILL_MS) * 100
    else g -= (dt / 1000) * DRAIN_PER_SEC
    g = Math.max(0, Math.min(100, g))
    gaugeRef.current = g
    setGauge(g)

    if (g >= 100) {
      doneRef.current = true
      holdingRef.current = false
      setHolding(false)
      setDone(true)
      stopLoop()
      onCompleteRef.current()
      return
    }
    if (g <= 0 && !holdingRef.current) {
      stopLoop()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const ensureLoop = useCallback(() => {
    if (rafRef.current !== null) return
    lastRef.current = performance.now()
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const start = useCallback(() => {
    if (doneRef.current || holdingRef.current) return
    holdingRef.current = true
    setHolding(true)
    ensureLoop()
  }, [ensureLoop])

  const stop = useCallback(() => {
    if (!holdingRef.current) return
    holdingRef.current = false
    setHolding(false)
    ensureLoop() // 줄어드는 애니메이션 계속
  }, [ensureLoop])

  const reset = useCallback(() => {
    stopLoop()
    holdingRef.current = false
    gaugeRef.current = 0
    doneRef.current = false
    setHolding(false)
    setGauge(0)
    setDone(false)
  }, [])

  useEffect(() => stopLoop, [])

  return { gauge, holding, done, start, stop, reset }
}
