import { useState } from 'react'
import { searchPokemon, type Pokemon } from '../pokemon'
import { PokemonBadge } from './PokemonBadge'

type Props = {
  options: Pokemon[]
  onPick: (pokemon: Pokemon) => void
  placeholder: string
  disabled?: boolean
}

// 입력하면 아래에 후보가 뜨고, 후보를 누르거나 Enter 로 첫 번째 후보를 고른다
export function PokemonSearch({ options, onPick, placeholder, disabled }: Props) {
  const [query, setQuery] = useState('')
  const results = disabled ? [] : searchPokemon(options, query)

  const pick = (p: Pokemon) => {
    onPick(p)
    setQuery('')
  }

  return (
    <div className="search">
      <input
        type="search"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          // 한글 입력 중(조합 중)에 누른 Enter 는 글자 확정용이라 무시
          if (e.key === 'Enter' && !e.nativeEvent.isComposing && results[0]) pick(results[0])
          if (e.key === 'Escape') setQuery('')
        }}
      />
      {results.length > 0 && (
        <ul className="search-list">
          {results.map((p) => (
            <li key={p.key}>
              <button type="button" onClick={() => pick(p)}>
                {/* 후보 줄 전체가 버튼이라 사진은 따로 누를 수 없게 한다 */}
                <PokemonBadge pokemon={p} size={32} interactive={false} />
                <span className="search-speed">종족값 {p.speed}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
