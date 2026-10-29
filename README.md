# pokedex

포켓몬 챔피언스 스피드 도감 — 참전 포켓몬의 Lv.50 스피드 실수치 순위표, 1:1 스피드 비교기,
내 파티 저장(브라우저 localStorage)과 상대 6마리와의 스피드 매치업 표.

https://yul456.github.io/pokedex/

## 개발

```bash
nvm use        # .nvmrc (Node 22)
npm install
npm run dev    # http://localhost:5173/
```

## 데이터

- `data/roster.txt`: 챔피언스 참전 목록 (PokéAPI identifier). 참전 포켓몬이 바뀌면 여기를 고친다.
- `npm run data`: PokéAPI CSV 에서 참전 포켓몬의 이름·타입·스피드 종족값을 받아 `src/data/pokemon.json` 을 다시 만든다.

스피드 실수치 = `floor((종족값 + 20 + 스탯포인트) × 성격 보정)` (스탯포인트 0~32, 성격 ±10%)

## 배포

`main` 에 push 하면 GitHub Actions (`.github/workflows/deploy.yml`) 가 빌드해서 GitHub Pages 에 올린다.
사이트 하위 경로(`/pokedex/`)는 빌드할 때 저장소 이름으로 정해지므로 저장소 이름을 바꿔도 `vite.config.ts` 는 고치지 않아도 된다.
