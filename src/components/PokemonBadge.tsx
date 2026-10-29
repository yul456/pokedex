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

export function PokemonBadge({ pokemon, size = 40 }: { pokemon: Pokemon; size?: number }) {
  return (
    <span className="badge">
      <PokemonImage pokemon={pokemon} size={size} />
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
