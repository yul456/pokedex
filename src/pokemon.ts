import data from './data/pokemon.json'

export type Pokemon = {
  id: number
  key: string
  dex: number
  name: string
  nameEn: string
  types: number[]
  speed: number
  mega: boolean
}

// 스피드 종족값 내림차순으로 정렬된 챔피언스 참전 포켓몬 (scripts/build-data.mjs 가 생성)
export const POKEMON: Pokemon[] = data

export const BY_KEY = new Map(POKEMON.map((p) => [p.key, p]))

// 파티·상대는 진화 전 모습으로 고르고, 메가진화는 따로 선택한다
export const BASE_POKEMON = POKEMON.filter((p) => !p.mega)

// 메가진화 → 진화 전 모습 (예: meowstic-male-mega → meowstic-male, raichu-mega-x → raichu)
// 이름 규칙이 안 맞으면(floette-mega → floette-eternal 등) 같은 종의 메가 아닌 모습
function megaBaseKey(mega: Pokemon) {
  const key = mega.key.replace(/-mega(-[a-z]+)?$/, '')
  return BY_KEY.has(key) ? key : BASE_POKEMON.find((p) => p.dex === mega.dex)?.key
}

const MEGA_FORMS = new Map<string, Pokemon[]>()
for (const p of POKEMON) {
  const base = p.mega ? megaBaseKey(p) : undefined
  if (base) MEGA_FORMS.set(base, [...(MEGA_FORMS.get(base) ?? []), p])
}
// 메가 → 메가 X → 메가 Y → 메가 Z 순서로
for (const forms of MEGA_FORMS.values()) forms.sort((a, b) => a.key.localeCompare(b.key))

export function megaFormsOf(key: string) {
  return MEGA_FORMS.get(key) ?? []
}

export const TYPES: Record<number, { name: string; color: string }> = {
  1: { name: '노말', color: '#9fa19f' },
  2: { name: '격투', color: '#ff8000' },
  3: { name: '비행', color: '#81b9ef' },
  4: { name: '독', color: '#9141cb' },
  5: { name: '땅', color: '#915121' },
  6: { name: '바위', color: '#afa981' },
  7: { name: '벌레', color: '#91a119' },
  8: { name: '고스트', color: '#704170' },
  9: { name: '강철', color: '#60a1b8' },
  10: { name: '불꽃', color: '#e62829' },
  11: { name: '물', color: '#2980ef' },
  12: { name: '풀', color: '#3fa129' },
  13: { name: '전기', color: '#fac000' },
  14: { name: '에스퍼', color: '#ef4179' },
  15: { name: '얼음', color: '#3dcef3' },
  16: { name: '드래곤', color: '#5060e1' },
  17: { name: '악', color: '#624d4e' },
  18: { name: '페어리', color: '#ef70ef' },
}

export function artworkUrl(id: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

// 띄어쓰기·따옴표·마침표 차이는 무시하고 비교 (예: "메가 리자몽", "farfetch'd" 도 찾히도록)
const normalize = (s: string) => s.toLowerCase().replace(/[\s'’.\-()]/g, '')

export function matches(p: Pokemon, query: string) {
  const q = normalize(query)
  if (!q) return true
  return normalize(p.name).includes(q) || normalize(p.nameEn).includes(q)
}

// 이름이 검색어로 시작하는 포켓몬을 앞에 보여 준다
export function searchPokemon(options: Pokemon[], query: string, limit = 8) {
  const q = normalize(query)
  if (!q) return []
  const startsWith = (p: Pokemon) => normalize(p.name).startsWith(q) || normalize(p.nameEn).startsWith(q)
  return options
    .filter((p) => matches(p, query))
    .sort((a, b) => Number(startsWith(b)) - Number(startsWith(a)) || a.dex - b.dex)
    .slice(0, limit)
}
