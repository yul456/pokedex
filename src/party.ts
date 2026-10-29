import { BY_KEY, megaFormsOf, type Pokemon } from './pokemon'
import { effectiveSpeed, MAX_SP, NO_MODIFIERS, speedStat, type Nature } from './speed'

export const MAX_PARTY = 6

// 저장 형식을 바꾸면 version 을 올리고 parse 함수에서 옛 형식을 변환한다
export const PARTY_STORAGE = { key: 'champions-speed/party', version: 1 }
export const OPPONENT_STORAGE = { key: 'champions-speed/opponents', version: 2 }
export const SCARF_STORAGE = { key: 'champions-speed/scarf-users', version: 1 }

// 포켓몬은 숫자 id 가 아니라 식별자(key)로 저장한다 (PokéAPI 번호가 바뀌어도 그대로 쓸 수 있도록)
export type PartyMember = {
  key: string // 진화 전 모습 (예: garchomp)
  sp: number
  nature: Nature
  scarf: boolean
  mega: string | null // 메가진화할 모습 (예: garchomp-mega), 안 하면 null
}

export type Opponent = {
  key: string
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

function basePokemon(key: unknown) {
  const p = typeof key === 'string' ? BY_KEY.get(key) : undefined
  return p && !p.mega ? p : undefined
}

// 저장된 값을 검사해서 지금 참전 목록에 있는 포켓몬만 남긴다
export function parseParty(data: unknown, version: number): PartyMember[] | null {
  if (version !== PARTY_STORAGE.version || !Array.isArray(data)) return null
  return data
    .filter(isRecord)
    .flatMap((m): PartyMember[] => {
      const base = basePokemon(m.key)
      if (!base) return []
      const sp = typeof m.sp === 'number' ? Math.min(MAX_SP, Math.max(0, Math.round(m.sp))) : MAX_SP
      const nature: Nature = m.nature === 1 ? 1 : m.nature === -1 ? -1 : 0
      const mega =
        typeof m.mega === 'string' && megaFormsOf(base.key).some((f) => f.key === m.mega) ? m.mega : null
      return [{ key: base.key, sp, nature, scarf: m.scarf === true && !mega, mega }]
    })
    .slice(0, MAX_PARTY)
}

// version 1: 상대마다 scarf 값이 있었다 → version 2 부터는 스카프를 포켓몬별로 따로 저장하므로(SCARF_STORAGE) scarf 는 버린다
export function parseOpponents(data: unknown, version: number): Opponent[] | null {
  if ((version !== 1 && version !== OPPONENT_STORAGE.version) || !Array.isArray(data)) return null
  return data
    .filter(isRecord)
    .flatMap((o): Opponent[] => {
      const base = basePokemon(o.key)
      return base ? [{ key: base.key }] : []
    })
    .slice(0, MAX_PARTY)
}

// 상대로 만나면 구애스카프를 지녔을 수 있다고 표시해 둔 포켓몬 (진화 전 모습 식별자 목록)
// 상대 목록과 따로 저장해서 다음 대전에서 다시 만나도 그대로 쓴다
export function parseScarfUsers(data: unknown, version: number): string[] | null {
  if (version !== SCARF_STORAGE.version || !Array.isArray(data)) return null
  return [...new Set(data.flatMap((key) => basePokemon(key)?.key ?? []))]
}

// 내 포켓몬의 실제 스피드 (메가진화한 모습은 스카프를 못 지닌다)
export function memberSpeed(member: PartyMember, form: Pokemon, tailwind = false) {
  return effectiveSpeed(speedStat(form.speed, member.sp, member.nature), {
    ...NO_MODIFIERS,
    scarf: member.scarf && !form.mega,
    tailwind,
  })
}
