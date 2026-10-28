import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import confetti from 'canvas-confetti'
import CharacterImage, { preloadCharacters } from '../components/CharacterImage'
import type { CharacterKind } from '../components/CharacterImage'
import { useHoldGauge } from '../hooks/useHoldGauge'
import type { Payload } from '../lib/payload'
import styles from './ReceiverPage.module.css'

const SFX = ['♡ 꼬물 꼬물', '두근 두근', '부들 부들', '으으으...', '두근두근두근!!', '...!!!']

type Phase = 'idle' | 'pop' | 'reveal' | 'done'

const POP_MS = 700 // "퐁!" + 변신
const REVEAL_MS = 1900 // 메시지 중앙에 쾅 → 제목 자리로

function stageIndex(gauge: number, count: number) {
  if (count <= 0) return 0
  return Math.min(count - 1, Math.floor((gauge / 100) * count))
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function fireConfetti() {
  const reduced = reducedMotion()
  const common = { origin: { y: 0.6 }, zIndex: 50, disableForReducedMotion: true }
  let shapes: confetti.Shape[] | undefined
  try {
    shapes = [confetti.shapeFromText({ text: '💗', scalar: 2 }), 'circle', 'square']
  } catch {
    shapes = undefined
  }
  const colors = ['#ff8fab', '#ffc2d1', '#ffe08a', '#ffffff', '#ff5c8a']
  confetti({ ...common, particleCount: reduced ? 30 : 110, spread: 80, shapes, colors, scalar: 1.2 })
  if (!reduced) {
    setTimeout(() => confetti({ ...common, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors }), 200)
    setTimeout(() => confetti({ ...common, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors }), 200)
  }
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern) // iOS는 미지원 → 그냥 무시됨
  } catch {
    /* ignore */
  }
}

interface Props {
  payload: Payload
  /** 만들기 페이지 미리보기 모드 (링크/사운드 토글 숨김) */
  preview?: boolean
}

export default function ReceiverPage({ payload, preview = false }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [muted, setMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timersRef = useRef<number[]>([])
  const lastStageRef = useRef(0)

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms))
  }

  const onComplete = useCallback(() => {
    setPhase('pop')
    vibrate([30, 40, 80])
    if (!muted && audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
    later(() => {
      setPhase('reveal')
      fireConfetti()
    }, POP_MS)
    later(() => setPhase('done'), POP_MS + REVEAL_MS)
  }, [muted])

  const { gauge, holding, done, start, stop, reset } = useHoldGauge(onComplete)

  useEffect(() => {
    preloadCharacters()
    const stopOnBlur = () => stop()
    window.addEventListener('blur', stopOnBlur)
    return () => {
      window.removeEventListener('blur', stopOnBlur)
      clearTimers()
    }
  }, [stop])

  // 단계가 바뀔 때마다 짧은 진동
  const stage = stageIndex(gauge, payload.s.length)
  useEffect(() => {
    if (holding && stage !== lastStageRef.current) vibrate(15)
    lastStageRef.current = stage
  }, [stage, holding])

  const handleReset = () => {
    clearTimers()
    reset()
    setPhase('idle')
  }

  // ---- 버튼 입력 처리 ----
  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (done) return
    e.preventDefault()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    start()
  }
  const onPointerEnd = () => stop()
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (done) return
      if (!e.repeat) start()
    }
  }
  const onKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') stop()
  }

  // ---- 표시 계산 ----
  const transformed = phase !== 'idle'
  const character: CharacterKind = transformed ? 'final' : gauge >= 50 ? 'nervous' : 'idle'
  const speech = transformed ? (payload.f ?? '') : payload.s[stage]
  const sfx = transformed ? '' : SFX[stageIndex(gauge, SFX.length)]
  const amp = holding ? 1 + (gauge / 100) * 6 : 0 // 떨림 세기(px)
  const pct = Math.round(gauge)

  const rootClass = [
    styles.root,
    phase === 'pop' ? styles.screenShake : '',
    preview ? styles.preview : '',
  ].join(' ')

  return (
    <div className={rootClass} style={{ ['--amp' as string]: `${amp}px` }}>
      {!preview && (
        <button
          type="button"
          className={styles.mute}
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? '소리 켜기' : '소리 끄기'}
          title={muted ? '소리 켜기' : '소리 끄기'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}
      <audio ref={audioRef} src="/assets/pop.mp3" preload="auto" />

      {/* 제목 ↔ 최종 메시지 (같은 자리에 겹쳐서 교체) */}
      <div className={styles.titleArea}>
        <h1 className={`${styles.title} ${phase === 'done' ? styles.titleHidden : ''}`}>{payload.t}</h1>
      </div>

      {phase !== 'idle' && phase !== 'pop' && (
        <div className={`${styles.message} ${phase === 'done' ? styles.messageDocked : styles.messageCenter}`}>
          {payload.m}
        </div>
      )}

      {/* 캐릭터 + 말풍선 */}
      <div className={styles.stage}>
        <div
          key={transformed ? 'final' : 'chii'}
          className={[
            styles.character,
            holding && !transformed ? styles.jitter : '',
            transformed ? styles.popIn : '',
          ].join(' ')}
        >
          <CharacterImage kind={character} className={styles.img} />
        </div>

        {speech && (
          <div key={speech} className={`${styles.bubble} ${transformed ? styles.bubbleShout : ''}`}>
            {speech}
          </div>
        )}

        {phase === 'pop' && <div className={styles.pong}>퐁!</div>}

        <div className={styles.sfx}>{sfx || ' '}</div>
      </div>

      {/* 게이지 */}
      <div className={styles.gaugeWrap} aria-hidden={transformed}>
        <div className={styles.gaugeLabel}>
          <span>용기</span>
          <span>{transformed ? 100 : pct}%</span>
        </div>
        <div
          className={styles.gauge}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={transformed ? 100 : pct}
        >
          <div className={styles.gaugeFill} style={{ width: `${transformed ? 100 : gauge}%` }} />
        </div>
      </div>

      {/* 버튼 */}
      {done ? (
        <button type="button" className={`${styles.btn} ${styles.btnAgain}`} onClick={handleReset}>
          ↻ 다시 한 번
        </button>
      ) : (
        <button
          type="button"
          className={`${styles.btn} ${holding ? styles.btnActive : ''}`}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onPointerLeave={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={onPointerEnd}
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          ♡ 꾹 눌러 응원하기
        </button>
      )}

      {!preview && (
        <a className={styles.sendLink} href={window.location.pathname}>
          나도 보내기 →
        </a>
      )}
    </div>
  )
}
