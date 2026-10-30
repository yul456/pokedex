// npm run memory -- <내보낸 파일...>
// 사이트의 "기억한 그림 내보내기"로 받은 파일을 소스의 data/sprite-memory.json 에 합친다
// 앱이 이 파일을 바로 읽으므로, 처음 쓰는 기기에서도 여기 있는 그림은 바로 맞춘다 (src/spriteMemory.ts)
// 파일 없이 실행하면 지금 기억만 다시 검사하고 정리한다 (참전 목록이 바뀐 뒤 등)
import { readFile, writeFile } from 'node:fs/promises'
import { PRINT_SIZE, printDistance, SAME_SPRITE } from '../src/spriteFeature.ts'

const target = new URL('../data/sprite-memory.json', import.meta.url)

// 앱과 같이 지금 참전 목록의 기본 모습(메가진화 제외)만 기억한다
const names = new Map(
  JSON.parse(await readFile(new URL('../src/data/pokemon.json', import.meta.url), 'utf8'))
    .filter((p) => !p.mega)
    .map((p) => [p.key, p.name]),
)

// { version: 1, data: [{ key, print(base64) }] } 형식. 쓸 수 없는 항목은 버리고 개수만 센다
async function load(file) {
  const { version, data } = JSON.parse(await readFile(file, 'utf8'))
  if (version !== 1 || !Array.isArray(data)) throw new Error(`${file}: 그림 기억 파일이 아니다`)
  const entries = []
  let dropped = 0
  for (const entry of data) {
    const bytes = typeof entry?.print === 'string' ? Buffer.from(entry.print, 'base64') : null
    if (names.has(entry?.key) && bytes?.length === PRINT_SIZE) entries.push({ key: entry.key, bytes })
    else dropped++
  }
  return { entries, dropped }
}

const current = await load(target)
const memory = current.entries
let dropped = current.dropped
let duplicate = 0
const added = []
const replaced = []

for (const file of process.argv.slice(2)) {
  const loaded = await load(file)
  dropped += loaded.dropped
  for (const entry of loaded.entries) {
    const near = memory.filter((m) => printDistance(m.bytes, entry.bytes) < SAME_SPRITE)
    if (near.length > 0 && near.every((m) => m.key === entry.key)) {
      duplicate++
      continue
    }
    // 같은 그림을 다른 포켓몬으로 기억하고 있으면 새로 고른 쪽으로 바꾼다 (앱에서 다시 고친 것이므로)
    for (const m of near) {
      if (m.key !== entry.key) replaced.push(`${names.get(m.key)} → ${names.get(entry.key)}`)
      memory.splice(memory.indexOf(m), 1)
    }
    if (near.length === 0) added.push(names.get(entry.key))
    memory.push(entry)
  }
}

// 포켓몬 순서로 늘어놓고 한 줄에 하나씩 써서 git diff 로 바뀐 것을 보기 쉽게 한다
memory.sort((a, b) => a.key.localeCompare(b.key) || Buffer.compare(a.bytes, b.bytes))
const lines = memory.map(({ key, bytes }) => `    ${JSON.stringify({ key, print: bytes.toString('base64') })}`)
await writeFile(target, `{\n  "version": 1,\n  "data": ${lines.length ? `[\n${lines.join(',\n')}\n  ]` : '[]'}\n}\n`)

console.log(`data/sprite-memory.json: ${memory.length}개 (포켓몬 ${new Set(memory.map((m) => m.key)).size}마리)`)
console.log(`새로 넣음 ${added.length}, 이미 있음 ${duplicate}, 바꿈 ${replaced.length}, 버림 ${dropped}`)
if (added.length) console.log(`새로 넣은 그림: ${added.join(', ')}`)
// 바꾼 것은 잘못 고른 결과일 수도 있으니 맞는지 확인한다
for (const line of replaced) console.log(`바꿈: ${line}`)
