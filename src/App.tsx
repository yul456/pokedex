import { useState } from 'react'
import { Matchup } from './components/Matchup'
import { PartyEditor } from './components/PartyEditor'
import { SpeedCompare } from './components/SpeedCompare'
import { SpeedTable } from './components/SpeedTable'
import { PARTY_STORAGE, parseParty, type PartyMember } from './party'
import { useStoredState } from './storage'
import './App.css'

const TABS = [
  { id: 'table', label: '순위표' },
  { id: 'compare', label: '1:1 비교' },
  { id: 'party', label: '내 파티' },
  { id: 'matchup', label: '매치업' },
] as const

type TabId = (typeof TABS)[number]['id']

function App() {
  const [tab, setTab] = useState<TabId>('table')
  const [party, setParty] = useStoredState<PartyMember[]>(
    PARTY_STORAGE.key,
    PARTY_STORAGE.version,
    parseParty,
    [],
  )

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

      <main>
        {tab === 'table' && <SpeedTable />}
        {tab === 'compare' && <SpeedCompare />}
        {tab === 'party' && <PartyEditor party={party} onChange={setParty} />}
        {tab === 'matchup' && <Matchup party={party} onEditParty={() => setTab('party')} />}
      </main>

      <footer>
        데이터: <a href="https://pokeapi.co">PokéAPI</a> · 참전 목록: 버전 1.2.0 (2026-09-09, 레귤레이션 M-C) 기준 ·{' '}
        <a href="https://github.com/yul456/MySample">GitHub</a>
      </footer>
    </div>
  )
}

export default App
