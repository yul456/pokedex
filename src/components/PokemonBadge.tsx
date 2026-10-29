import { TYPES, type Pokemon } from '../pokemon'
import { PokemonImage } from './PokemonImage'

export function TypeChips({ types }: { types: number[] }) {
  return (
    <span className="types">
      {types.map((t) => (
        <span key={t} className="type" style={{ background: TYPES[t].color }}>
          {TYPES[t].name}
        </span>
      ))}
    </span>
  )
}

type BadgeProps = {
  pokemon: Pokemon
  size?: number
  interactive?: boolean // false 면 사진을 눌러도 방어 상성 창을 열지 않는다
}

export function PokemonBadge({ pokemon, size = 40, interactive = true }: BadgeProps) {
  return (
    <span className="badge">
      <PokemonImage pokemon={pokemon} size={size} interactive={interactive} />
      <span className="badge-text">
        <span className="badge-name">
          {pokemon.name}
          {pokemon.mega && <span className="mega">M</span>}
        </span>
        <TypeChips types={pokemon.types} />
      </span>
    </span>
  )
}
