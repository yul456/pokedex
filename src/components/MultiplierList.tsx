import { MULTIPLIER_LABEL, type MultiplierGroup } from '../typeChart'
import { TypeChips } from './PokemonBadge'

// 배율별 타입 목록. attack 은 주는 피해(2배가 좋음), defend 는 받는 피해(2배가 나쁨)라 색이 반대다
export function MultiplierList({ groups, axis }: { groups: MultiplierGroup[]; axis: 'attack' | 'defend' }) {
  return (
    <dl className="multiplier-list">
      {groups.map((g) => (
        <div key={g.multiplier} className={`multiplier-row ${axis}`}>
          <dt className={`m-${String(g.multiplier).replace('.', '_')}`}>{MULTIPLIER_LABEL[g.multiplier]}</dt>
          <dd>
            <TypeChips types={g.types} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
