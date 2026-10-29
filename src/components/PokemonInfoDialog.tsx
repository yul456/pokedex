import { useEffect, useRef } from 'react'
import { ABILITIES } from '../abilities'
import type { Pokemon } from '../pokemon'
import { defensiveMatchups } from '../typeChart'
import { MultiplierList } from './MultiplierList'
import { TypeChips } from './PokemonBadge'
import { PokemonImage } from './PokemonImage'

type Props = {
  pokemon: Pokemon | null
  onClose: () => void
}

// 포켓몬의 방어 상성(타입 기준)을 보여 주는 창. pokemon 이 있으면 열리고 null 이면 닫힌다
export function PokemonInfoDialog({ pokemon, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (pokemon && !dialog.open) dialog.showModal()
    if (!pokemon && dialog.open) dialog.close()
  }, [pokemon])

  return (
    <dialog
      ref={ref}
      className="info-dialog"
      onClose={onClose}
      onClick={(e) => {
        // 창 바깥(어두운 배경)을 누르면 닫는다
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {pokemon && (
        <div className="info-body">
          <div className="info-head">
            <PokemonImage pokemon={pokemon} size={64} interactive={false} />
            <div className="info-title-block">
              <p className="info-name">
                {pokemon.name}
                {pokemon.mega && <span className="mega">M</span>}
              </p>
              <TypeChips types={pokemon.types} />
              <p className="muted">스피드 종족값 {pokemon.speed}</p>
            </div>
            <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>
              ✕
            </button>
          </div>

          <div>
            <p className="info-section">방어 상성 (받는 피해)</p>
            <MultiplierList groups={defensiveMatchups(pokemon.types)} axis="defend" />
          </div>

          <div>
            <p className="info-section">특성</p>
            <ul className="ability-list">
              {pokemon.abilities.map(({ id, hidden }) => {
                const ability = ABILITIES[id]
                return (
                  <li key={id}>
                    <b>{ability.name}</b>
                    {hidden && <span className="ability-tag">숨겨진 특성</span>}
                    {(ability.englishName || ability.englishDescription) && (
                      <span className="ability-tag">한글 정보 없음</span>
                    )}
                    <p className="ability-desc">{ability.description}</p>
                  </li>
                )
              })}
            </ul>
          </div>

          <p className="hint">
            방어 상성은 타입만으로 계산해요. 특성(예: 부유 → 땅 무효)은 반영되지 않으니 위 설명을 함께 보세요. 특성은
            PokéAPI 기준이라 챔피언스에서 바뀐 특성은 다를 수 있어요.
          </p>
        </div>
      )}
    </dialog>
  )
}
