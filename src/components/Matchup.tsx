import { useState } from 'react'
import { judge, opponentSpeeds } from '../matchup'
import {
  MAX_PARTY,
  memberSpeed,
  OPPONENT_STORAGE,
  parseOpponents,
  type Opponent,
  type PartyMember,
} from '../party'
import { artworkUrl, BASE_POKEMON, BY_KEY, megaFormsOf, type Pokemon } from '../pokemon'
import { PRESETS } from '../speed'
import { useStoredState } from '../storage'
import { PokemonSearch } from './PokemonSearch'

type Row = { id: string; form: Pokemon; member: PartyMember }
type Col = { id: string; form: Pokemon; opponent: Opponent }

type Props = {
  party: PartyMember[]
  onEditParty: () => void
}

export function Matchup({ party, onEditParty }: Props) {
  const [opponents, setOpponents] = useStoredState<Opponent[]>(
    OPPONENT_STORAGE.key,
    OPPONENT_STORAGE.version,
    parseOpponents,
    [],
  )
  const [myTailwind, setMyTailwind] = useState(false)
  const [theirTailwind, setTheirTailwind] = useState(false)
  const [trickRoom, setTrickRoom] = useState(false)
  const [withMegas, setWithMegas] = useState(true)
  const [selected, setSelected] = useState<{ row: string; col: string } | null>(null)

  if (party.length === 0) {
    return (
      <section className="empty-state">
        <p>매치업을 보려면 먼저 내 파티를 등록해 주세요.</p>
        <button type="button" className="primary-button" onClick={onEditParty}>
          내 파티 등록하기
        </button>
      </section>
    )
  }

  const full = opponents.length >= MAX_PARTY
  const addOpponent = (p: Pokemon) => {
    if (!full && !opponents.some((o) => o.key === p.key)) setOpponents([...opponents, { key: p.key, scarf: false }])
  }

  // 내 파티: 메가진화할 포켓몬은 진화 전·후를 각각 한 줄씩
  const rows: Row[] = party.flatMap((member) => {
    const mega = member.mega ? BY_KEY.get(member.mega) : undefined
    return [BY_KEY.get(member.key)!, ...(mega ? [mega] : [])].map((form) => ({ id: form.key, form, member }))
  })
  // 상대: 아이템은 미리 알 수 없으니 메가진화 가능한 모습도 함께 비교
  const cols: Col[] = opponents.flatMap((opponent) =>
    [BY_KEY.get(opponent.key)!, ...(withMegas ? megaFormsOf(opponent.key) : [])].map((form) => ({
      id: form.key,
      form,
      opponent,
    })),
  )

  const mySpeed = (row: Row) => memberSpeed(row.member, row.form, myTailwind)
  const theirSpeeds = (col: Col) => opponentSpeeds(col.form, col.opponent.scarf, theirTailwind)
  const selectedRow = rows.find((r) => r.id === selected?.row)
  const selectedCol = cols.find((c) => c.id === selected?.col)

  return (
    <section>
      <div className="toolbar">
        <PokemonSearch
          options={BASE_POKEMON}
          onPick={addOpponent}
          disabled={full}
          placeholder={full ? `상대는 ${MAX_PARTY}마리까지예요` : '상대 포켓몬 입력 (팀 미리보기를 보고 하나씩)'}
        />
      </div>

      {opponents.length > 0 && (
        <div className="chips">
          {opponents.map((o) => {
            const p = BY_KEY.get(o.key)!
            return (
              <span key={o.key} className="chip">
                <img src={artworkUrl(p.id)} alt="" width={24} height={24} />
                {p.name}
                <span className="chip-base">{p.speed}족</span>
                <button
                  type="button"
                  className={o.scarf ? 'chip-toggle active' : 'chip-toggle'}
                  aria-pressed={o.scarf}
                  onClick={() => setOpponents(opponents.map((x) => (x.key === o.key ? { ...x, scarf: !x.scarf } : x)))}
                >
                  스카프
                </button>
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`${p.name} 빼기`}
                  onClick={() => setOpponents(opponents.filter((x) => x.key !== o.key))}
                >
                  ✕
                </button>
              </span>
            )
          })}
          <button type="button" className="text-button" onClick={() => setOpponents([])}>
            모두 지우기
          </button>
        </div>
      )}

      <div className="toggles matchup-options">
        <label>
          <input type="checkbox" checked={myTailwind} onChange={(e) => setMyTailwind(e.target.checked)} />
          내 순풍
        </label>
        <label>
          <input type="checkbox" checked={theirTailwind} onChange={(e) => setTheirTailwind(e.target.checked)} />
          상대 순풍
        </label>
        <label>
          <input type="checkbox" checked={trickRoom} onChange={(e) => setTrickRoom(e.target.checked)} />
          트릭룸
        </label>
        <label>
          <input type="checkbox" checked={withMegas} onChange={(e) => setWithMegas(e.target.checked)} />
          상대 메가 포함
        </label>
      </div>

      <p className="hint legend">
        <span className="legend-item first">먼저</span>
        <span className="legend-item last">나중</span>
        <span className="legend-item mixed">상대 투자에 따라</span>
        {trickRoom
          ? '"무투자부터" = 상대가 무투자 이상이면 내가 먼저'
          : '"준속까지" = 상대가 준속 이하면 내가 먼저'}{' '}
        · "최속 동속" = 상대가 최속이면 동속(50%) · 칸을 누르면 자세히
      </p>

      {cols.length === 0 ? (
        <p className="empty">상대 포켓몬을 입력하면 비교표가 나와요.</p>
      ) : (
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="corner">내 포켓몬</th>
                {cols.map((c) => (
                  <th key={c.id} scope="col">
                    <img src={artworkUrl(c.form.id)} alt="" width={32} height={32} />
                    {c.form.name}
                    <span className="base-speed">{c.form.speed}족</span>
                    {c.opponent.scarf && !c.form.mega && <span className="scarf-mark">스카프</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const speed = mySpeed(r)
                return (
                  <tr key={r.id}>
                    <th scope="row" className="row-head">
                      <span className="row-head-inner">
                        <img src={artworkUrl(r.form.id)} alt="" width={28} height={28} />
                        <span className="row-name">{r.form.name}</span>
                        <span className="row-speed">
                          {speed} <span className="row-base">{r.form.speed}족</span>
                        </span>
                      </span>
                    </th>
                    {cols.map((c) => {
                      const result = judge(speed, theirSpeeds(c), trickRoom)
                      const isSelected = selected?.row === r.id && selected?.col === c.id
                      return (
                        <td key={c.id}>
                          <button
                            type="button"
                            className={`cell ${result.outcome}${isSelected ? ' selected' : ''}`}
                            onClick={() => setSelected(isSelected ? null : { row: r.id, col: c.id })}
                          >
                            {result.label}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedRow && selectedCol && (
        <Detail row={selectedRow} col={selectedCol} mine={mySpeed(selectedRow)} theirs={theirSpeeds(selectedCol)} trickRoom={trickRoom} />
      )}
    </section>
  )
}

type DetailProps = {
  row: Row
  col: Col
  mine: number
  theirs: number[]
  trickRoom: boolean
}

function Detail({ row, col, mine, theirs, trickRoom }: DetailProps) {
  const { wins } = judge(mine, theirs, trickRoom)
  return (
    <div className="detail">
      <p>
        내 <b>{row.form.name}</b> {mine} <span className="muted">(종족값 {row.form.speed})</span> vs 상대{' '}
        <b>{col.form.name}</b> <span className="muted">(종족값 {col.form.speed})</span>
        {col.opponent.scarf && !col.form.mega && ' · 스카프'}
        {trickRoom && ' · 트릭룸'}
      </p>
      <ul>
        {PRESETS.map((preset, i) => {
          const tone = theirs[i] === mine ? 'tie' : wins[i] ? 'first' : 'last'
          return (
            <li key={preset.label} className={tone}>
              상대 {preset.label} {theirs[i]} →{' '}
              {tone === 'tie' ? '동속 (먼저 움직일 확률 50%)' : tone === 'first' ? '내가 먼저' : '상대가 먼저'}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
