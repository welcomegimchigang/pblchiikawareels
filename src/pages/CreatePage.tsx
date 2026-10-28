import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_PAYLOAD, LIMITS, buildShareUrl, sanitize } from '../lib/payload'
import type { Payload } from '../lib/payload'
import ReceiverPage from './ReceiverPage'
import styles from './CreatePage.module.css'

const PREVIEW_W = 390
const PREVIEW_H = 760

export default function CreatePage() {
  const [title, setTitle] = useState(DEFAULT_PAYLOAD.t)
  const [speech, setSpeech] = useState<string[]>(DEFAULT_PAYLOAD.s)
  const [shout, setShout] = useState(DEFAULT_PAYLOAD.f ?? '')
  const [message, setMessage] = useState(DEFAULT_PAYLOAD.m)
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [scale, setScale] = useState(0.8)
  const frameRef = useRef<HTMLDivElement>(null)

  // 미리보기 프레임 너비에 맞춰 받는 사람 페이지를 축소
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => setScale(el.clientWidth / PREVIEW_W)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const payload: Payload = useMemo(
    () => sanitize({ t: title, s: speech, m: message, f: shout }),
    [title, speech, message, shout],
  )

  // 내용 바꾸면 만들어둔 링크는 무효
  useEffect(() => {
    setLink('')
    setCopied(false)
  }, [payload])

  const updateSpeech = (i: number, v: string) =>
    setSpeech((arr) => arr.map((s, idx) => (idx === i ? v.slice(0, LIMITS.speech) : s)))
  const removeSpeech = (i: number) => setSpeech((arr) => arr.filter((_, idx) => idx !== i))
  const addSpeech = () =>
    setSpeech((arr) => (arr.length < LIMITS.speechCount ? [...arr, ''] : arr))

  const makeLink = () => setLink(buildShareUrl(payload))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      window.prompt('아래 링크를 복사하세요', link)
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title: payload.t, text: '여기를 눌러 링크를 확인하세요.', url: link })
    } catch {
      /* 사용자가 취소한 경우 등 */
    }
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.h1}>치이가 할 말이 있대</h1>
        <p className={styles.sub}>문구를 바꾸고 링크를 만들어서 친구한테 보내보세요</p>
      </header>

      <div className={styles.layout}>
        {/* ---------- 입력 폼 ---------- */}
        <section className={styles.form}>
          <label className={styles.field}>
            <span className={styles.label}>
              제목 <small>{title.length}/{LIMITS.title}</small>
            </span>
            <input
              value={title}
              maxLength={LIMITS.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={DEFAULT_PAYLOAD.t}
            />
          </label>

          <div className={styles.field}>
            <span className={styles.label}>
              말풍선 (게이지 차는 순서대로) <small>최대 {LIMITS.speechCount}개 · 각 {LIMITS.speech}자</small>
            </span>
            {speech.map((s, i) => (
              <div key={i} className={styles.row}>
                <span className={styles.num}>{i + 1}</span>
                <input
                  value={s}
                  maxLength={LIMITS.speech}
                  onChange={(e) => updateSpeech(i, e.target.value)}
                  placeholder="으..."
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => removeSpeech(i)}
                  disabled={speech.length <= 1}
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
            {speech.length < LIMITS.speechCount && (
              <button type="button" className={styles.addBtn} onClick={addSpeech}>
                + 말풍선 추가
              </button>
            )}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>
              변신 외침 (선택) <small>{shout.length}/{LIMITS.shout}</small>
            </span>
            <input
              value={shout}
              maxLength={LIMITS.shout}
              onChange={(e) => setShout(e.target.value)}
              placeholder="우라~!!"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>
              최종 메시지 <small>{message.length}/{LIMITS.message}</small>
            </span>
            <input
              value={message}
              maxLength={LIMITS.message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={DEFAULT_PAYLOAD.m}
            />
          </label>

          <button type="button" className={styles.primary} onClick={makeLink}>
            🔗 링크 만들기
          </button>

          {link && (
            <div className={styles.result}>
              <input readOnly value={link} onFocus={(e) => e.target.select()} />
              <div className={styles.actions}>
                <button type="button" className={styles.secondary} onClick={copy}>
                  {copied ? '✓ 복사됨!' : '복사'}
                </button>
                {canShare && (
                  <button type="button" className={styles.secondary} onClick={share}>
                    공유
                  </button>
                )}
                <a className={styles.secondary} href={link} target="_blank" rel="noreferrer">
                  열어보기 ↗
                </a>
              </div>
            </div>
          )}
        </section>

        {/* ---------- 미리보기 ---------- */}
        <section className={styles.previewSection}>
          <div className={styles.previewHead}>
            <span className={styles.label}>미리보기</span>
            <button type="button" className={styles.iconBtn} onClick={() => setPreviewKey((k) => k + 1)}>
              ↻
            </button>
          </div>
          <div
            ref={frameRef}
            className={styles.previewFrame}
            style={{ aspectRatio: `${PREVIEW_W} / ${PREVIEW_H}` }}
          >
            <div
              className={styles.previewScale}
              style={{ width: PREVIEW_W, height: PREVIEW_H, transform: `scale(${scale})` }}
            >
              <ReceiverPage key={previewKey} payload={payload} preview />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
