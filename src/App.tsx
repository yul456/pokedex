import { useState } from 'react'
import { SpeedCompare } from './components/SpeedCompare'
import { SpeedTable } from './components/SpeedTable'
import './App.css'

const TABS = [
  { id: 'table', label: '스피드 순위표' },
  { id: 'compare', label: '1:1 비교' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('table')

  return (
    <div className="app">
      <header>
        <h1>챔피언스 스피드 도감</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={tab === t.id ? 'active' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>{tab === 'table' ? <SpeedTable /> : <SpeedCompare />}</main>

      <footer>
        데이터: <a href="https://pokeapi.co">PokéAPI</a> · 참전 목록: Game8 (2026-06-30 기준) ·{' '}
        <a href="https://github.com/yul456/MySample">GitHub</a>
      </footer>
    </div>
  )
}

export default App
