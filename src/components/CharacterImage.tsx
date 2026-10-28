import { useEffect, useState } from 'react'

export type CharacterKind = 'idle' | 'nervous' | 'final'

export const CHARACTER_SRC: Record<CharacterKind, string> = {
  idle: '/assets/chiikawa_idle.png',
  nervous: '/assets/chiikawa_nervous.png',
  final: '/assets/usagi_final.png',
}

// 이미지 파일이 없을 때 보여줄 자리표시용 원형 SVG
function Placeholder({ kind }: { kind: CharacterKind }) {
  const face = kind === 'final' ? '🐰' : kind === 'nervous' ? '😳' : '🙂'
  const fill = kind === 'final' ? '#fff3c4' : '#ffffff'
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img" aria-label={kind}>
      <circle cx="100" cy="100" r="90" fill={fill} stroke="#222" strokeWidth="6" />
      <circle cx="60" cy="120" r="16" fill="#ffb8c6" />
      <circle cx="140" cy="120" r="16" fill="#ffb8c6" />
      <text x="100" y="118" textAnchor="middle" fontSize="64">
        {face}
      </text>
    </svg>
  )
}

const failed = new Set<string>()

export default function CharacterImage({
  kind,
  className,
}: {
  kind: CharacterKind
  className?: string
}) {
  const src = CHARACTER_SRC[kind]
  const [broken, setBroken] = useState(() => failed.has(src))

  useEffect(() => setBroken(failed.has(src)), [src])

  if (broken) {
    return (
      <div className={className}>
        <Placeholder kind={kind} />
      </div>
    )
  }
  return (
    <img
      className={className}
      src={src}
      alt=""
      draggable={false}
      onError={() => {
        failed.add(src)
        setBroken(true)
      }}
    />
  )
}

/** 변신 순간 깜빡임 방지용 미리 로드 */
export function preloadCharacters() {
  Object.values(CHARACTER_SRC).forEach((src) => {
    const img = new Image()
    img.src = src
  })
}
