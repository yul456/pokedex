// 포켓몬 챔피언스 스피드 계산 (레벨 50, 개체값 최대 고정)
// 실수치 = floor((종족값 + 20 + 스탯포인트) × 성격 보정)
// 스탯포인트(SP)는 한 능력치에 0~32, 성격 보정은 +10% / 없음 / -10%

export type Nature = 1 | 0 | -1

export const MAX_SP = 32

export function speedStat(base: number, sp: number, nature: Nature) {
  return Math.floor(((base + 20 + sp) * (10 + nature)) / 10)
}

// 랭크 변화: +n 이면 (2+n)/2, -n 이면 2/(2+n)
export function stageMultiplier(stage: number) {
  return stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage)
}

export type Modifiers = {
  stage: number
  scarf: boolean
  tailwind: boolean
  paralysis: boolean
}

export const NO_MODIFIERS: Modifiers = { stage: 0, scarf: false, tailwind: false, paralysis: false }

// 실제 게임은 4096 단위 보정을 쓰므로 경계값에서 1 정도 차이가 날 수 있다
export function effectiveSpeed(stat: number, mods: Modifiers) {
  let speed = Math.floor(stat * stageMultiplier(mods.stage))
  if (mods.scarf) speed = Math.floor(speed * 1.5)
  if (mods.tailwind) speed *= 2
  if (mods.paralysis) speed = Math.floor(speed / 2)
  return speed
}

export const PRESETS = [
  { label: '최속', short: '최속', sp: MAX_SP, nature: 1 },
  { label: '준속', short: '준속', sp: MAX_SP, nature: 0 },
  { label: '무투자', short: '무투자', sp: 0, nature: 0 },
  { label: '최저속', short: '최저', sp: 0, nature: -1 },
] as const satisfies readonly { label: string; short: string; sp: number; nature: Nature }[]
