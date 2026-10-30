# pokedex

포켓몬 챔피언스 스피드 도감 — 참전 포켓몬의 Lv.50 스피드 실수치 순위표, 1:1 스피드 비교기,
내 파티 저장(브라우저 localStorage)과 상대 6마리와의 스피드 매치업 표, 타입 상성표,
포켓몬 사진을 누르면 나오는 방어 상성·특성 창, 팀 미리보기 스크린샷으로 상대 6마리 입력.

https://yul456.github.io/pokedex/

## 개발

```bash
nvm use        # .nvmrc (Node 22)
npm install
npm run dev    # http://localhost:5173/
```

## 데이터

- `data/roster.txt`: 챔피언스 참전 목록 (PokéAPI identifier). 참전 포켓몬이 바뀌면 여기를 고친다.
- `data/ability-ko.json`: PokéAPI 에 한글이 없는 특성의 한글 이름·설명 보충 (설명은 직접 쓴 것이라 화면에 "직접 작성"으로 표시).
- `data/sprite-memory.json`: 스크린샷 인식용으로 시험하며 고른 그림 지문. 사이트 주소에 `?dev` 를 붙이면 나오는 "기억한 그림 내보내기"로 받은 파일을 `npm run memory -- <파일>` 로 합친다.
- `npm run data`: PokéAPI CSV 에서 다시 만든다.
  - `src/data/pokemon.json`: 참전 포켓몬의 이름·타입·스피드 종족값·특성
  - `src/data/abilities.json`: 특성 이름·게임 안 설명 (한글이 없으면 영어)
  - `src/data/type-chart.json`: 18×18 타입 상성표
  - `src/data/recognition.json`: 스크린샷 인식용 성별 비율·그림 색 (HOME 그림은 `.cache/home`에 받아 둔다)

스피드 실수치 = `floor((종족값 + 20 + 스탯포인트) × 성격 보정)` (스탯포인트 0~32, 성격 ±10%)

## 작업 안내

이어서 작업할 때(AI 도구 포함)는 [AGENTS.md](AGENTS.md)부터 읽는다. 계산 방법, 데이터 관리, 지금까지 만든 기능과 남은 일은 [docs/](docs/)에 정리해 두었다.

## 배포

`main` 에 push 하면 GitHub Actions (`.github/workflows/deploy.yml`) 가 빌드해서 GitHub Pages 에 올린다.
사이트 하위 경로(`/pokedex/`)는 빌드할 때 저장소 이름으로 정해지므로 저장소 이름을 바꿔도 `vite.config.ts` 는 고치지 않아도 된다.
