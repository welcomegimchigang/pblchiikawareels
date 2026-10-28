import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

export interface Payload {
  /** 상단 제목 */
  t: string
  /** 게이지 단계별 말풍선 */
  s: string[]
  /** 최종 메시지 */
  m: string
  /** 변신 순간 외침 (선택) */
  f?: string
}

export const LIMITS = {
  title: 30,
  speech: 10,
  speechCount: 6,
  message: 40,
  shout: 10,
} as const

export const DEFAULT_PAYLOAD: Payload = {
  t: '치이가 할 말이 있대...',
  s: ['으...', '응...', '으..으..', '우..', '와..!'],
  m: '이따 마라탕 고?',
  f: '우라~!!',
}

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** 어떤 입력이 들어와도 길이 제한에 맞는 Payload로 정리. 필수값이 비면 기본값으로 채움 */
export function sanitize(raw: unknown): Payload {
  const r = (raw ?? {}) as Record<string, unknown>
  const speech = Array.isArray(r.s)
    ? r.s.map((x) => clip(x, LIMITS.speech)).filter(Boolean).slice(0, LIMITS.speechCount)
    : []
  const shout = clip(r.f, LIMITS.shout)
  return {
    t: clip(r.t, LIMITS.title) || DEFAULT_PAYLOAD.t,
    s: speech.length ? speech : DEFAULT_PAYLOAD.s,
    m: clip(r.m, LIMITS.message) || DEFAULT_PAYLOAD.m,
    ...(shout ? { f: shout } : {}),
  }
}

export function encodePayload(p: Payload): string {
  return compressToEncodedURIComponent(JSON.stringify(sanitize(p)))
}

/** 디코딩 실패 시 기본 메시지로 대체 */
export function decodePayload(v: string | null): Payload {
  if (!v) return DEFAULT_PAYLOAD
  try {
    const json = decompressFromEncodedURIComponent(v)
    if (!json) return DEFAULT_PAYLOAD
    return sanitize(JSON.parse(json))
  } catch {
    return DEFAULT_PAYLOAD
  }
}

export function buildShareUrl(p: Payload): string {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}?v=${encodePayload(p)}`
}
