import { useMemo, useState } from 'react'
import { matches, POKEMON } from '../pokemon'
import { presetSpeeds, PRESETS } from '../speed'
import { PokemonBadge } from './PokemonBadge'

export function SpeedTable() {
  const [query, setQuery] = useState('')
  const [showMega, setShowMega] = useState(true)
  const [scarf, setScarf] = useState(false)
  const [tailwind, setTailwind] = useState(false)

  // 최속 실수치(speeds[0]) 순으로 정렬한다. 보정이 없으면 종족값 순서와 같고,
  // 스카프를 켜면 메가진화한 포켓몬만 스카프가 빠지므로 순서가 바뀐다. 최속이 같으면 원래 순서(종족값 → 도감 번호)대로
  const rows = useMemo(
    () =>
      POKEMON.filter((p) => (showMega || !p.mega) && matches(p, query))
        .map((p) => ({ pokemon: p, speeds: presetSpeeds(p, scarf, tailwind) }))
        .sort((a, b) => b.speeds[0] - a.speeds[0]),
    [query, showMega, scarf, tailwind],
  )

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
        Lv.50 기준 실수치, 최속 순 · 최속 = SP 32 + 성격↑ · 준속 = SP 32 · 무투자 = SP 0 · 최저 = SP 0 + 성격↓ ({rows.length}마리)
      </p>
      {scarf && (
        <p className="hint">
          메가진화 포켓몬은 메가스톤을 지녀서 스카프를 쓸 수 없어요. 스카프 없이 계산해서 순위를 다시 매겼어요.
        </p>
      )}

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
            {rows.map(({ pokemon: p, speeds }) => (
              <tr key={p.key}>
                <td className="col-name">
                  <PokemonBadge pokemon={p} />
                </td>
                <td className="base">{p.speed}</td>
                {PRESETS.map((preset, i) => (
                  <td key={preset.label} className={preset.nature === 1 ? 'fastest' : undefined}>
                    {speeds[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="empty">검색 결과가 없어요.</p>}
      </div>
    </section>
  )
}
