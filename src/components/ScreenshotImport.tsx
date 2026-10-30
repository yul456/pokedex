import { useRef, useState } from 'react'
import { BASE_POKEMON, BY_KEY } from '../pokemon'
import type { Box, PreviewSlot } from '../teamPreview'
import { TypeChips } from './PokemonBadge'
import { PokemonImage } from './PokemonImage'
import { PokemonSearch } from './PokemonSearch'

type Props = {
  onApply: (keys: string[]) => void
}

type Review = {
  slots: PreviewSlot[]
  crops: string[] // 칸마다 스크린샷에서 잘라 낸 그림 (data URL)
  picks: string[] // 칸마다 고른 포켓몬 key
}

const GENDER_LABEL = { male: '♂', female: '♀', none: '성별 없음' } as const
// 후보는 처음에 이만큼만 보여 주고 나머지는 "더 보기"로
const SHOWN_CANDIDATES = 4
// 시험하며 모은 그림 기억을 파일로 내보내는 버튼. 만든 사람만 쓰므로 개발 서버이거나 주소에 ?dev 를 붙였을 때만 보인다
// 받은 파일은 npm run memory 로 소스(data/sprite-memory.json)에 합친다
const SHOW_EXPORT = import.meta.env.DEV || new URLSearchParams(location.search).has('dev')

// 스크린샷에서 그림 부분만 잘라 정사각형 작은 그림으로 만든다
function cropSprite(source: HTMLCanvasElement, box: Box) {
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const scale = size / Math.max(box.w, box.h)
  const w = box.w * scale
  const h = box.h * scale
  canvas.getContext('2d')!.drawImage(source, box.x, box.y, box.w, box.h, (size - w) / 2, (size - h) / 2, w, h)
  return canvas.toDataURL()
}

// 팀 미리보기 스크린샷을 읽어 상대를 한 번에 입력한다. 읽은 결과를 확인하고 고친 뒤에 적용한다
export function ScreenshotImport({ onApply }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'reading' | 'failed'>('idle')
  const [review, setReview] = useState<Review | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [searching, setSearching] = useState<number | null>(null)
  const [exported, setExported] = useState<number | null>(null)

  const read = async (file: File) => {
    setStatus('reading')
    setReview(null)
    setExpanded(null)
    setSearching(null)
    setExported(null)
    try {
      // 분석 코드와 인식용 데이터는 이 기능을 쓸 때만 내려받는다
      const [{ analyzeTeamPreview }, { loadSpriteMemory }] = await Promise.all([
        import('../teamPreview'),
        import('../spriteMemory'),
      ])
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!
      ctx.drawImage(bitmap, 0, 0)
      const slots = analyzeTeamPreview(ctx.getImageData(0, 0, canvas.width, canvas.height), loadSpriteMemory())
      if (slots.length === 0) {
        setStatus('failed')
        return
      }
      setReview({
        slots,
        crops: slots.map((s) => cropSprite(canvas, s.sprite)),
        picks: slots.map((s) => s.candidates[0].key),
      })
      setStatus('idle')
    } catch {
      setStatus('failed')
    }
  }

  const pick = (index: number, key: string) => {
    if (review) setReview({ ...review, picks: review.picks.map((k, i) => (i === index ? key : k)) })
  }

  const apply = async () => {
    if (!review) return
    onApply([...new Set(review.picks)])
    setReview(null)
    // 고른 그림을 기억해서 다음에 같은 그림이 나오면 바로 맞춘다
    const { rememberSprites } = await import('../spriteMemory')
    rememberSprites(review.slots.map((s, i) => ({ key: review.picks[i], print: s.print })))
  }

  const exportMemory = async () => {
    const { exportSpriteMemory } = await import('../spriteMemory')
    const { count, json } = exportSpriteMemory()
    setExported(count)
    if (count === 0) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
    link.download = 'sprite-memory.json'
    link.click()
    // iOS Safari 는 바로 해제하면 파일을 받지 못할 수 있어 조금 뒤에 해제한다
    setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }

  return (
    <div className="shot-import">
      <div className="shot-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={status === 'reading'}
          onClick={() => fileRef.current?.click()}
        >
          {status === 'reading' ? '읽는 중…' : '스크린샷으로 입력'}
        </button>
        <span className="hint">팀 미리보기에서 상대 칸이 보이게 잘라서 올려 주세요. 이 기기 안에서만 읽어요.</span>
        {SHOW_EXPORT && (
          <button type="button" className="text-button" onClick={exportMemory}>
            기억한 그림 내보내기
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            // 같은 파일을 다시 골라도 읽도록 비운다
            e.target.value = ''
            if (file) void read(file)
          }}
        />
      </div>
      {status === 'failed' && (
        <p className="notice">상대 칸을 찾지 못했어요. 빨간 칸이 보이게 잘라서 다시 올려 주세요.</p>
      )}
      {exported !== null && (
        <p className="hint">
          {exported ? `기억한 그림 ${exported}개를 파일로 내보냈어요.` : '이 기기에 기억한 그림이 없어요.'}
        </p>
      )}

      {review && (
        <div className="shot-review">
          <p className="shot-title">스크린샷에서 읽은 상대</p>
          <ol className="shot-slots">
            {review.slots.map((slot, i) => {
              const picked = BY_KEY.get(review.picks[i])!
              const all = slot.candidates.includes(picked) ? slot.candidates : [picked, ...slot.candidates]
              const shown = expanded === i ? all : all.slice(0, SHOWN_CANDIDATES)
              // 접힌 목록에 고른 포켓몬이 없으면 맨 앞에 보여 준다
              const options = shown.includes(picked) ? shown : [picked, ...shown.slice(0, SHOWN_CANDIDATES - 1)]
              return (
                <li key={i} className="shot-slot">
                  <img className="shot-crop" src={review.crops[i]} alt="" width={48} height={48} />
                  <div className="shot-body">
                    <div className="shot-read">
                      <TypeChips types={slot.types} />
                      <span className="muted">{GENDER_LABEL[slot.gender]}</span>
                      {slot.remembered && (
                        <span className="ability-tag">{slot.remembered.shared ? '등록된 그림' : '기억한 그림'}</span>
                      )}
                    </div>
                    <div className="shot-options">
                      {options.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          className={p === picked ? 'shot-option active' : 'shot-option'}
                          aria-pressed={p === picked}
                          onClick={() => pick(i, p.key)}
                        >
                          <PokemonImage pokemon={p} size={24} interactive={false} />
                          {p.name}
                          <span className="chip-base">{p.speed}족</span>
                        </button>
                      ))}
                      {all.length > SHOWN_CANDIDATES && expanded !== i && (
                        <button type="button" className="text-button" onClick={() => setExpanded(i)}>
                          후보 {all.length - SHOWN_CANDIDATES}개 더
                        </button>
                      )}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => setSearching(searching === i ? null : i)}
                      >
                        직접 찾기
                      </button>
                    </div>
                    {searching === i && (
                      <PokemonSearch
                        options={BASE_POKEMON}
                        placeholder="포켓몬 이름 검색"
                        onPick={(p) => {
                          pick(i, p.key)
                          setSearching(null)
                        }}
                      />
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="hint">
            틀린 칸은 후보를 누르거나 직접 찾아서 고쳐 주세요. 고른 그림은 기억해 두고 다음부터 바로 맞춰요.
          </p>
          <div className="shot-buttons">
            <button type="button" className="primary-button" onClick={apply}>
              이 {new Set(review.picks).size}마리로 바꾸기
            </button>
            <button type="button" className="text-button" onClick={() => setReview(null)}>
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
