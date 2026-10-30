import { BY_KEY } from './pokemon'
import { readStored, writeStored } from './storage'

// 스크린샷에서 고른 포켓몬 그림을 기억해 두고, 같은 그림이 다시 나오면 바로 맞춘다 (이로치도 한 번 고르면 기억)
// 그림 자체가 아니라 그림을 12×12 칸으로 줄인 "지문"(칸마다 평균 색 + 그림이 차지하는 비율)만 저장한다
export const SPRITE_MEMORY_STORAGE = { key: 'champions-speed/sprite-memory', version: 1 }
export const PRINT_GRID = 12
export const PRINT_SIZE = PRINT_GRID * PRINT_GRID * 4
const MAX_ENTRIES = 300

// 지문 차이(칸마다 0~255 차이의 평균)가 이보다 작으면 같은 그림으로 본다
export const SAME_SPRITE = 20

export type MemoryEntry = { key: string; print: Uint8Array }

export function printDistance(a: Uint8Array, b: Uint8Array) {
  let sum = 0
  for (let i = 0; i < PRINT_SIZE; i++) sum += Math.abs(a[i] - b[i])
  return sum / PRINT_SIZE
}

const encode = (print: Uint8Array) => btoa(String.fromCharCode(...print))
const decode = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))

// 지금 참전 목록의 기본 모습이 아니거나 지문이 깨진 항목은 버린다
export function parseSpriteMemory(data: unknown, version: number): MemoryEntry[] | null {
  if (version !== SPRITE_MEMORY_STORAGE.version || !Array.isArray(data)) return null
  return data.flatMap((entry): MemoryEntry[] => {
    if (typeof entry !== 'object' || entry === null) return []
    const { key, print } = entry as Record<string, unknown>
    if (typeof key !== 'string' || BY_KEY.get(key)?.mega !== false || typeof print !== 'string') return []
    try {
      const bytes = decode(print)
      return bytes.length === PRINT_SIZE ? [{ key, print: bytes }] : []
    } catch {
      return []
    }
  })
}

export function loadSpriteMemory() {
  return readStored(SPRITE_MEMORY_STORAGE.key, parseSpriteMemory) ?? []
}

// 고른 결과를 기억한다. 거의 같은 그림이 이미 있으면 새로 고른 포켓몬으로 바꾸고, 오래된 것부터 300개까지만 남긴다
export function rememberSprites(picks: MemoryEntry[]) {
  let memory = loadSpriteMemory()
  for (const pick of picks) {
    memory = memory.filter((m) => printDistance(m.print, pick.print) >= SAME_SPRITE)
    memory.push(pick)
  }
  writeStored(
    SPRITE_MEMORY_STORAGE.key,
    SPRITE_MEMORY_STORAGE.version,
    memory.slice(-MAX_ENTRIES).map((m) => ({ key: m.key, print: encode(m.print) })),
  )
}
