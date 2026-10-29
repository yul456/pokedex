import type { CSSProperties } from 'react'
import { artworkUrl, type Pokemon } from '../pokemon'
import { useSettings } from '../settings'

// 포켓몬 사진. 설정에서 사진을 끄면 같은 자리에 도감 번호를 보여 준다
export function PokemonImage({ pokemon, size }: { pokemon: Pokemon; size: number }) {
  const { showImages } = useSettings()

  if (!showImages) {
    return (
      <span
        className="poke-img dex-icon"
        style={{ '--size': `${size}px` } as CSSProperties}
        title={`도감 번호 ${pokemon.dex}`}
      >
        {pokemon.dex}
      </span>
    )
  }

  return (
    <img
      className="poke-img"
      src={artworkUrl(pokemon.id)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
    />
  )
}
