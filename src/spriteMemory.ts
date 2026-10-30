import shared from '../data/sprite-memory.json'
import { BY_KEY } from './pokemon'
import { PRINT_SIZE, printDistance, SAME_SPRITE } from './spriteFeature'
import { readStored, writeStored } from './storage'

// 스크린샷에서 고른 포켓몬 그림을 기억해 두고, 같은 그림이 다시 나오면 바로 맞춘다 (이로치도 한 번 고르면 기억)
// 그림 자체가 아니라 그림을 12×12 칸으로 줄인 "지문"(칸마다 평균 색 + 그림이 차지하는 비율)만 저장한다
// 기억은 두 군데에 있다: 이 기기에서 고른 것(localStorage)과 만든 사람이 시험하며 고른 것을 소스에 넣어 둔 것(data/sprite-memory.json)
export const SPRITE_MEMORY_STORAGE = { key: 'champions-speed/sprite-memory', version: 1 }
const MAX_ENTRIES = 300

export type MemoryEntry = { key: string; print: Uint8Array }

const encode = (print: Uint8Array) => btoa(String.fromCharCode(...print))
const decode = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
const serialize = (memory: MemoryEntry[]) => memory.map((m) => ({ key: m.key, print: encode(m.print) }))

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

// 소스에 넣어 둔 기억. 처음 쓰는 기기에서도 이 그림들은 바로 맞춘다 (npm run memory 로 늘린다)
const SHARED_MEMORY = parseSpriteMemory(shared.data, shared.version) ?? []

export function loadSpriteMemory() {
  return readStored(SPRITE_MEMORY_STORAGE.key, parseSpriteMemory) ?? []
}

// 지문 차이가 가장 작은 기억. 같은 그림으로 볼 만큼 가깝지 않으면 null
function nearest(memory: MemoryEntry[], print: Uint8Array) {
  let found: MemoryEntry | null = null
  let best = SAME_SPRITE
  for (const m of memory) {
    const d = printDistance(m.print, print)
    if (d < best) {
      found = m
      best = d
    }
  }
  return found
}

// 같은 그림을 기억에서 찾는다. 이 기기의 기억을 먼저 보고, 없을 때만 소스에 넣어 둔 기억을 본다
// 그래서 소스의 기억이 틀렸어도 이 기기에서 한 번 고치면 그다음부터는 고친 쪽을 따른다
export function recallSprite(print: Uint8Array, memory: MemoryEntry[]) {
  const mine = nearest(memory, print)
  const found = mine ?? nearest(SHARED_MEMORY, print)
  return found && { pokemon: BY_KEY.get(found.key)!, shared: !mine }
}

// 고른 결과를 기억한다. 거의 같은 그림이 이미 있으면 새로 고른 포켓몬으로 바꾸고, 오래된 것부터 300개까지만 남긴다
// 소스에 넣어 둔 기억이 이미 같은 포켓몬으로 맞히는 그림은 이 기기에 따로 저장하지 않는다
export function rememberSprites(picks: MemoryEntry[]) {
  let memory = loadSpriteMemory()
  for (const pick of picks) {
    memory = memory.filter((m) => printDistance(m.print, pick.print) >= SAME_SPRITE)
    if (nearest(SHARED_MEMORY, pick.print)?.key !== pick.key) memory.push(pick)
  }
  writeStored(SPRITE_MEMORY_STORAGE.key, SPRITE_MEMORY_STORAGE.version, serialize(memory.slice(-MAX_ENTRIES)))
}

// 이 기기의 기억을 파일로 내보낼 내용. localStorage 에 저장한 것과 같은 { version, data } 형식이다
// 받은 파일은 npm run memory 로 data/sprite-memory.json 에 합친다
export function exportSpriteMemory() {
  const memory = loadSpriteMemory()
  return {
    count: memory.length,
    json: JSON.stringify({ version: SPRITE_MEMORY_STORAGE.version, data: serialize(memory) }),
  }
}
