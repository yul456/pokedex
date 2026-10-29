import { useState } from 'react'
import { TYPES } from '../pokemon'
import { defensiveMatchups, offensiveMatchups, TYPE_IDS, typeFactor } from '../typeChart'
import { MultiplierList } from './MultiplierList'

type Selection = { axis: 'attack' | 'defend'; type: number } | null

const CELL_LABEL: Record<number, string> = { 2: '2', 0.5: '½', 0: '0', 1: '' }
const CELL_CLASS: Record<number, string> = { 2: 'eff-2', 0.5: 'eff-half', 0: 'eff-0', 1: '' }

export function TypeChart() {
  const [selection, setSelection] = useState<Selection>(null)

  const toggle = (axis: 'attack' | 'defend', type: number) =>
    setSelection(selection?.axis === axis && selection.type === type ? null : { axis, type })
  const isHighlighted = (attack: number, defend: number) =>
    selection === null || (selection.axis === 'attack' ? selection.type === attack : selection.type === defend)

  return (
    <section>
      <p className="hint">
        왼쪽(세로)이 공격 타입, 위쪽(가로)이 방어 타입이에요. 칸은 공격이 주는 피해 배율이고 빈칸은 1배예요. 타입을
        누르면 그 줄만 강조해서 아래에 정리해 줘요.
      </p>

      <div className="chart-wrap">
        <table className="type-chart">
          <thead>
            <tr>
              <th className="corner">
                <span className="type-full">공격 ＼ 방어</span>
              </th>
              {TYPE_IDS.map((d) => (
                <th key={d} scope="col">
                  <button
                    type="button"
                    className={selection?.axis === 'defend' && selection.type === d ? 'type-head active' : 'type-head'}
                    style={{ background: TYPES[d].color }}
                    title={`${TYPES[d].name} 방어`}
                    onClick={() => toggle('defend', d)}
                  >
                    <span className="type-full">{TYPES[d].name}</span>
                    <span className="type-short">{TYPES[d].name[0]}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TYPE_IDS.map((a) => (
              <tr key={a}>
                <th scope="row" className="row-head">
                  <button
                    type="button"
                    className={selection?.axis === 'attack' && selection.type === a ? 'type-head active' : 'type-head'}
                    style={{ background: TYPES[a].color }}
                    title={`${TYPES[a].name} 공격`}
                    onClick={() => toggle('attack', a)}
                  >
                    <span className="type-full">{TYPES[a].name}</span>
                    <span className="type-short">{TYPES[a].name[0]}</span>
                  </button>
                </th>
                {TYPE_IDS.map((d) => {
                  const factor = typeFactor(a, d)
                  return (
                    <td
                      key={d}
                      className={[CELL_CLASS[factor], isHighlighted(a, d) ? '' : 'dim'].join(' ').trim() || undefined}
                      title={`${TYPES[a].name} → ${TYPES[d].name}: ${factor}배`}
                    >
                      {CELL_LABEL[factor]}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selection && <Summary selection={selection} />}
    </section>
  )
}

function Summary({ selection }: { selection: NonNullable<Selection> }) {
  const { axis, type } = selection
  const groups = axis === 'attack' ? offensiveMatchups(type) : defensiveMatchups([type])
  return (
    <div className="detail">
      <p>
        <b>{TYPES[type].name}</b> {axis === 'attack' ? '공격 (주는 피해)' : '방어 (받는 피해)'}
      </p>
      <MultiplierList groups={groups} axis={axis} />
    </div>
  )
}
