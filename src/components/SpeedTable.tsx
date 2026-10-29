import { useMemo, useState } from 'react'
import { matches, POKEMON } from '../pokemon'
import { effectiveSpeed, NO_MODIFIERS, PRESETS, speedStat } from '../speed'
import { PokemonBadge } from './PokemonBadge'

export function SpeedTable() {
  const [query, setQuery] = useState('')
  const [showMega, setShowMega] = useState(true)
  const [scarf, setScarf] = useState(false)
  const [tailwind, setTailwind] = useState(false)

  const list = useMemo(
    () => POKEMON.filter((p) => (showMega || !p.mega) && matches(p, query)),
    [query, showMega],
  )
  const mods = { ...NO_MODIFIERS, scarf, tailwind }

  return (
    <section>
      <div className="toolbar">
        <input
          type="search"
          placeholder="이름 검색 (한글/영어)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="toggles">
          <label>
            <input type="checkbox" checked={showMega} onChange={(e) => setShowMega(e.target.checked)} />
            메가진화
          </label>
          <label>
            <input type="checkbox" checked={scarf} onChange={(e) => setScarf(e.target.checked)} />
            스카프 ×1.5
          </label>
          <label>
            <input type="checkbox" checked={tailwind} onChange={(e) => setTailwind(e.target.checked)} />
            순풍 ×2
          </label>
        </div>
      </div>

      <p className="hint">
        Lv.50 기준 실수치 · 최속 = SP 32 + 성격↑ · 준속 = SP 32 · 무투자 = SP 0 · 최저 = SP 0 + 성격↓ ({list.length}마리)
      </p>

      <div className="table-wrap">
        <table className="speed-table">
          <thead>
            <tr>
              <th className="col-name">포켓몬</th>
              <th>종족</th>
              {PRESETS.map((p) => (
                <th key={p.label}>{p.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.key}>
                <td className="col-name">
                  <PokemonBadge pokemon={p} />
                </td>
                <td className="base">{p.speed}</td>
                {PRESETS.map((preset) => (
                  <td key={preset.label} className={preset.nature === 1 ? 'fastest' : undefined}>
                    {effectiveSpeed(speedStat(p.speed, preset.sp, preset.nature), mods)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="empty">검색 결과가 없어요.</p>}
      </div>
    </section>
  )
}
