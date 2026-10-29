import data from './data/abilities.json'

export type Ability = {
  name: string
  description: string // 게임 안 설명 문구
  englishName?: boolean // 한글 이름이 없어서 영어 이름
  englishDescription?: boolean // 한글 설명이 없어서 영어 설명
}

// 참전 포켓몬이 쓰는 특성 (scripts/build-data.mjs 가 생성)
export const ABILITIES: Record<string, Ability> = data
