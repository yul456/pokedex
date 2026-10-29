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

export function matches(p: Pokemon, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q)
}
