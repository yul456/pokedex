import type { Pokemon } from './pokemon'
import { effectiveSpeed, NO_MODIFIERS, PRESETS, speedStat } from './speed'

// 상대 투자는 알 수 없으니 PRESETS 순서(최속 → 준속 → 무투자 → 최저속)대로 스피드를 모두 구한다
export function opponentSpeeds(form: Pokemon, scarf: boolean, tailwind: boolean) {
  return PRESETS.map((preset) =>
    effectiveSpeed(speedStat(form.speed, preset.sp, preset.nature), {
      ...NO_MODIFIERS,
      scarf: scarf && !form.mega,
      tailwind,
    }),
  )
}

export type Judgement = {
  outcome: 'first' | 'last' | 'mixed'
  label: string
  wins: boolean[] // 상대 투자별로 내가 먼저 움직이는지
  tie: boolean // 어떤 투자와 동속인지
}

// 트릭룸이면 느린 쪽이 먼저 움직인다
export function judge(mine: number, theirs: number[], trickRoom: boolean): Judgement {
  const wins = theirs.map((s) => (trickRoom ? mine < s : mine > s))
  const tie = theirs.includes(mine)
  const count = wins.filter(Boolean).length
  if (count === wins.length) return { outcome: 'first', label: '먼저', wins, tie }
  if (count === 0) return { outcome: 'last', label: '나중', wins, tie }

  // 상대 스피드가 빠른 투자부터 정렬돼 있어서 내가 이기는 투자는 한쪽 끝에 몰려 있다
  // 예) 평소: 준속·무투자·최저속을 이기면 "준속까지", 트릭룸: 최속·준속을 이기면 "준속부터"
  const edge = PRESETS[trickRoom ? wins.lastIndexOf(true) : wins.indexOf(true)].short
  const label = count === 1 ? `${edge}만` : trickRoom ? `${edge}부터` : `${edge}까지`
  return { outcome: 'mixed', label, wins, tie }
}
