import { useState } from 'react'
import { MAX_PARTY, memberSpeed, type PartyMember } from '../party'
import { BASE_POKEMON, BY_KEY, megaFormsOf, type Pokemon } from '../pokemon'
import { MAX_SP, NATURE_OPTIONS, speedStat } from '../speed'
import { PokemonBadge } from './PokemonBadge'
import { PokemonSearch } from './PokemonSearch'

type Props = {
  party: PartyMember[]
  onChange: (party: PartyMember[]) => void
}

export function PartyEditor({ party, onChange }: Props) {
  const [message, setMessage] = useState('')
  const full = party.length >= MAX_PARTY

  const add = (p: Pokemon) => {
    // 랭크배틀은 같은 종을 한 마리만 넣을 수 있다 (로토무 폼, 켄타로스 종류도 같은 종)
    if (party.some((m) => BY_KEY.get(m.key)?.dex === p.dex)) {
      setMessage(`같은 포켓몬은 한 마리만 넣을 수 있어요 (${p.name})`)
      return
    }
    onChange([...party, { key: p.key, sp: MAX_SP, nature: 1, scarf: false, mega: null }])
    setMessage('')
  }

  const update = (index: number, patch: Partial<PartyMember>) =>
    onChange(party.map((m, i) => (i === index ? { ...m, ...patch } : m)))

  return (
    <section>
      <div className="toolbar">
        <PokemonSearch
          options={BASE_POKEMON}
          onPick={add}
          disabled={full}
          placeholder={full ? `파티가 가득 찼어요 (${MAX_PARTY}마리)` : '포켓몬 추가 (이름 검색)'}
        />
      </div>
      {message && <p className="notice">{message}</p>}
      <p className="hint">
        내 파티 {party.length}/{MAX_PARTY} · 이 브라우저에만 저장돼요 (휴대폰과 PC는 따로 저장)
      </p>

      {party.length === 0 ? (
        <p className="empty">위에서 포켓몬을 검색해 내 파티를 등록해 주세요.</p>
      ) : (
        <div className="party-grid">
          {party.map((m, i) => (
            <MemberCard
              key={m.key}
              member={m}
              onChange={(patch) => update(i, patch)}
              onRemove={() => onChange(party.filter((_, j) => j !== i))}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type MemberCardProps = {
  member: PartyMember
  onChange: (patch: Partial<PartyMember>) => void
  onRemove: () => void
}

function MemberCard({ member, onChange, onRemove }: MemberCardProps) {
  const base = BY_KEY.get(member.key)!
  const megas = megaFormsOf(member.key)
  const mega = member.mega ? BY_KEY.get(member.mega) : undefined

  return (
    <div className="member">
      <div className="member-head">
        <PokemonBadge pokemon={base} size={48} />
        <button type="button" className="icon-button" onClick={onRemove} aria-label={`${base.name} 빼기`}>
          ✕
        </button>
      </div>

      <p className="member-speed">
        실수치 <b>{speedStat(base.speed, member.sp, member.nature)}</b>{' '}
        <span className="muted">(종족값 {base.speed})</span>
        {member.scarf && (
          <>
            {' '}
            · 스카프 <b>{memberSpeed(member, base)}</b>
          </>
        )}
        {mega && (
          <>
            {' '}
            · 메가 후 <b>{memberSpeed(member, mega)}</b> <span className="muted">(종족값 {mega.speed})</span>
          </>
        )}
      </p>

      <label className="field">
        <span>
          스탯포인트 <b>{member.sp}</b> / {MAX_SP}
        </span>
        <input
          type="range"
          min={0}
          max={MAX_SP}
          value={member.sp}
          onChange={(e) => onChange({ sp: Number(e.target.value) })}
        />
      </label>

      <div className="segmented">
        {NATURE_OPTIONS.map((n) => (
          <button
            key={n.value}
            type="button"
            className={member.nature === n.value ? 'active' : undefined}
            onClick={() => onChange({ nature: n.value })}
          >
            {n.label}
          </button>
        ))}
      </div>

      {megas.length > 0 && (
        <label className="field inline">
          <span>메가진화</span>
          {/* 메가스톤을 지니면 스카프를 못 지니므로 메가를 고르면 스카프를 끈다 */}
          <select value={member.mega ?? ''} onChange={(e) => onChange({ mega: e.target.value || null, scarf: false })}>
            <option value="">안 함</option>
            {megas.map((f) => (
              <option key={f.key} value={f.key}>
                {f.name} (종족값 {f.speed})
              </option>
            ))}
          </select>
        </label>
      )}

      <label className={member.mega ? 'check disabled' : 'check'}>
        <input
          type="checkbox"
          checked={member.scarf}
          disabled={member.mega !== null}
          onChange={(e) => onChange({ scarf: e.target.checked })}
        />
        구애스카프 ×1.5
        {member.mega && <span className="muted">(메가스톤을 지니면 못 씀)</span>}
      </label>
    </div>
  )
}
