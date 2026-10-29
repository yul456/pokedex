import chart from './data/type-chart.json'

// CHART[공격 타입 id - 1][방어 타입 id - 1] = 피해 배율 (0, 0.5, 1, 2) — scripts/build-data.mjs 가 생성
const CHART: number[][] = chart

export const TYPE_IDS = Array.from({ length: CHART.length }, (_, i) => i + 1)

export function typeFactor(attack: number, defend: number) {
  return CHART[attack - 1][defend - 1]
}

// 공격 타입 하나가 방어 타입(1~2개)에게 주는 피해 배율
export function effectiveness(attack: number, defendTypes: number[]) {
  return defendTypes.reduce((m, d) => m * typeFactor(attack, d), 1)
}

export const MULTIPLIER_LABEL: Record<number, string> = {
  4: '4배',
  2: '2배',
  0.5: '½배',
  0.25: '¼배',
  0: '무효',
}

export type MultiplierGroup = { multiplier: number; types: number[] }

// 배율별로 타입을 묶는다 (1배는 빼고 4배 → 무효 순)
function groupByMultiplier(factorOf: (type: number) => number): MultiplierGroup[] {
  return [4, 2, 0.5, 0.25, 0]
    .map((multiplier) => ({ multiplier, types: TYPE_IDS.filter((t) => factorOf(t) === multiplier) }))
    .filter((g) => g.types.length > 0)
}

// 이 타입(조합)이 받는 피해: 어떤 공격 타입에 약하고 강한지
export function defensiveMatchups(defendTypes: number[]) {
  return groupByMultiplier((attack) => effectiveness(attack, defendTypes))
}

// 이 공격 타입이 주는 피해: 어떤 방어 타입에 잘 들고 안 드는지
export function offensiveMatchups(attack: number) {
  return groupByMultiplier((defend) => typeFactor(attack, defend))
}
