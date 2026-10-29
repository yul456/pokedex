import { useState } from 'react'
import { POKEMON, type Pokemon } from '../pokemon'
import {
  effectiveSpeed,
  MAX_SP,
  NATURE_OPTIONS,
  NO_MODIFIERS,
  speedStat,
  type Modifiers,
  type Nature,
} from '../speed'
import { PokemonBadge } from './PokemonBadge'

type Side = {
  pokemon: Pokemon
  sp: number
  nature: Nature
  mods: Modifiers
}

const STAGES = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]

// 이름 마지막 한글 글자에 받침이 있으면 '이', 없으면 '가' (한글이 없으면 '이(가)')
function subjectParticle(name: string) {
  const last = [...name].reverse().find((c) => c >= '가' && c <= '힣')
  if (!last) return '이(가)'
  return (last.charCodeAt(0) - 0xac00) % 28 === 0 ? '가' : '이'
}

function initialSide(key: string): Side {
  return {
    pokemon: POKEMON.find((p) => p.key === key) ?? POKEMON[0],
    sp: MAX_SP,
    nature: 1,
    mods: NO_MODIFIERS,
  }
}

function SidePanel({ title, side, onChange }: { title: string; side: Side; onChange: (s: Side) => void }) {
  const [query, setQuery] = useState(side.pokemon.name)
  const setMods = (patch: Partial<Modifiers>) => onChange({ ...side, mods: { ...side.mods, ...patch } })

  const pick = (value: string) => {
    setQuery(value)
    const found = POKEMON.find((p) => p.name === value || p.nameEn.toLowerCase() === value.toLowerCase())
    // 메가진화한 모습은 메가스톤을 지녀야 해서 스카프를 못 지니므로 메가를 고르면 스카프를 끈다
    if (found) onChange({ ...side, pokemon: found, mods: found.mega ? { ...side.mods, scarf: false } : side.mods })
  }

  return (
    <div className="side">
      <h3>{title}</h3>
      <input
        list="pokemon-names"
        value={query}
        onChange={(e) => pick(e.target.value)}
        onFocus={(e) => e.target.select()}
        placeholder="포켓몬 이름"
      />
      <PokemonBadge pokemon={side.pokemon} size={56} />
      <p className="base-line">스피드 종족값 {side.pokemon.speed}</p>

      <label className="field">
        <span>
          스탯포인트 <b>{side.sp}</b> / {MAX_SP}
        </span>
        <input
          type="range"
          min={0}
          max={MAX_SP}
          value={side.sp}
          onChange={(e) => onChange({ ...side, sp: Number(e.target.value) })}
        />
      </label>

      <div className="segmented">
        {NATURE_OPTIONS.map((n) => (
          <button
            key={n.value}
            type="button"
            className={side.nature === n.value ? 'active' : undefined}
            onClick={() => onChange({ ...side, nature: n.value })}
          >
            {n.label}
          </button>
        ))}
      </div>

      <label className="field inline">
        <span>랭크</span>
        <select value={side.mods.stage} onChange={(e) => setMods({ stage: Number(e.target.value) })}>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {s > 0 ? `+${s}` : s}
            </option>
          ))}
        </select>
      </label>

      <div className="toggles">
        <label className={side.pokemon.mega ? 'disabled' : undefined}>
          <input
            type="checkbox"
            checked={side.mods.scarf}
            disabled={side.pokemon.mega}
            onChange={(e) => setMods({ scarf: e.target.checked })}
          />
          스카프
          {side.pokemon.mega && <span className="muted">(메가스톤을 지니면 못 씀)</span>}
        </label>
        <label>
          <input
            type="checkbox"
            checked={side.mods.tailwind}
            onChange={(e) => setMods({ tailwind: e.target.checked })}
          />
          순풍
        </label>
        <label>
          <input
            type="checkbox"
            checked={side.mods.paralysis}
            onChange={(e) => setMods({ paralysis: e.target.checked })}
          />
          마비
        </label>
      </div>
    </div>
  )
}

export function SpeedCompare() {
  const [mine, setMine] = useState(() => initialSide('garchomp'))
  const [theirs, setTheirs] = useState(() => initialSide('dragapult'))
  const [trickRoom, setTrickRoom] = useState(false)

  const a = effectiveSpeed(speedStat(mine.pokemon.speed, mine.sp, mine.nature), mine.mods)
  const b = effectiveSpeed(speedStat(theirs.pokemon.speed, theirs.sp, theirs.nature), theirs.mods)

  let verdict: string
  let tone: 'win' | 'lose' | 'tie'
  if (a === b) {
    verdict = '동속! 누가 먼저 움직일지는 랜덤(50%)이에요'
    tone = 'tie'
  } else {
    const first = a > b !== trickRoom ? mine : theirs
    verdict = `${first.pokemon.name}${subjectParticle(first.pokemon.name)} 먼저 움직여요`
    tone = first === mine ? 'win' : 'lose'
  }

  return (
    <section>
      <datalist id="pokemon-names">
        {POKEMON.map((p) => (
          <option key={p.key} value={p.name} />
        ))}
      </datalist>

      <div className={`verdict ${tone}`}>
        <div className="numbers">
          <span>{a}</span>
          <span className="vs">vs</span>
          <span>{b}</span>
        </div>
        <p>{verdict}</p>
        <label className="trick-room">
          <input type="checkbox" checked={trickRoom} onChange={(e) => setTrickRoom(e.target.checked)} />
          트릭룸 (느린 쪽이 먼저)
        </label>
      </div>

      <div className="sides">
        <SidePanel title="내 포켓몬" side={mine} onChange={setMine} />
        <SidePanel title="상대 포켓몬" side={theirs} onChange={setTheirs} />
      </div>

      <p className="hint">
        우선도 기술(신속, 기습 등)은 스피드와 상관없이 먼저 움직여요. 실제 게임은 4096 단위 보정을 써서 경계값에서 1 정도
        차이가 날 수 있어요.
      </p>
    </section>
  )
}
