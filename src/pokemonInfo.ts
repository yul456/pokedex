import { createContext, useContext } from 'react'
import type { Pokemon } from './pokemon'

// 포켓몬 사진을 누르면 방어 상성 창을 연다 (App 에서 여는 함수를 PokemonInfoContext 로 내려 준다)
export const PokemonInfoContext = createContext<(pokemon: Pokemon) => void>(() => {})

export function useOpenPokemonInfo() {
  return useContext(PokemonInfoContext)
}
