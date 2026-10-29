import type { CSSProperties } from 'react'
import { artworkUrl, type Pokemon } from '../pokemon'
import { useOpenPokemonInfo } from '../pokemonInfo'
import { useSettings } from '../settings'

type Props = {
  pokemon: Pokemon
  size: number
  interactive?: boolean // 누르면 방어 상성 창을 연다 (다른 버튼 안에 들어갈 때는 false)
}

// 포켓몬 사진. 설정에서 사진을 끄면 같은 자리에 도감 번호를 보여 준다
export function PokemonImage({ pokemon, size, interactive = true }: Props) {
  const { showImages } = useSettings()
  const openInfo = useOpenPokemonInfo()

  const image = showImages ? (
    <img
      className="poke-img"
      src={artworkUrl(pokemon.id)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
    />
  ) : (
    <span
      className="poke-img dex-icon"
      style={{ '--size': `${size}px` } as CSSProperties}
      title={`도감 번호 ${pokemon.dex}`}
    >
      {pokemon.dex}
    </span>
  )

  if (!interactive) return image
  return (
    <button
      type="button"
      className="poke-img-button"
      aria-label={`${pokemon.name} 방어 상성 보기`}
      title="방어 상성 보기"
      onClick={() => openInfo(pokemon)}
    >
      {image}
    </button>
  )
}
