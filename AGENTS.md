# AGENTS.md — 이 저장소에서 작업할 AI·사람을 위한 안내

이 저장소에서 작업을 시작하는 AI 코딩 도구(Claude Code, Codex, Cursor 등)가 먼저 읽는 문서다. 사람이 읽어도 된다.
여기에는 바로 필요한 것만 두고, 자세한 내용은 아래 `docs/` 문서에 나눠 두었다.

## 무엇을 만드는 저장소인가

포켓몬 챔피언스(Pokémon Champions) 참전 포켓몬의 **Lv.50 스피드**를 보는 개인용 웹 도구다.
대전 중에 휴대폰으로 "누가 먼저 움직이나"를 빨리 찾아보는 용도다.

- 사이트: https://yul456.github.io/pokedex/ (GitHub Pages. `main`에 push하면 자동 배포)
- 저장소: https://github.com/yul456/pokedex (**공개 저장소**라서 개인 정보나 회사 정보는 넣지 않는다)
- 백엔드는 없다. 포켓몬 데이터는 미리 JSON으로 만들어 커밋하고, 내 파티와 설정은 브라우저 localStorage에 저장한다.
- 2026-10-29 기준 참전 목록은 **버전 1.2.0 (레귤레이션 M-C)** 이다.

## 문서 지도

| 문서 | 내용 |
|---|---|
| [docs/speed-rules.md](docs/speed-rules.md) | **계산 방법**: 스피드 계산식, 투자 프리셋, 스카프·순풍·마비·랭크 보정, 동속과 트릭룸, 매치업 칸 판정 |
| [docs/data.md](docs/data.md) | **데이터 노하우**: PokéAPI에서 데이터 만드는 법, 참전 목록 관리와 패치 대응 순서, 이름·폼·메가 규칙, 특성 한글 보충, 출처 |
| [docs/features.md](docs/features.md) | **지금까지 만든 것**: 탭별 기능과 그렇게 만든 이유, 저장 데이터 형식, 알려진 한계, 다음에 할 만한 일 |
| [docs/screenshot-recognition.md](docs/screenshot-recognition.md) | **스크린샷 인식 방법**: 팀 미리보기에서 상대 6마리를 읽는 순서, 색 특징과 그림 지문, 숫자를 정한 근거, 시험 결과, 한계, 확인 방법 |
| [README.md](README.md) | 사람용 짧은 소개 |

## 개발 환경

- Node 22 (`.nvmrc`). PC의 기본 Node 버전이 다를 수 있으니 명령 전에 `nvm use`를 한다. 셸이 시작할 때 nvm 기본 버전으로 돌아가는 환경이 있다.
- React 19, Vite 8, TypeScript 7 (`tsc -b`), 린트는 oxlint.
- 라우터, 상태 관리, CSS 프레임워크 같은 추가 라이브러리는 쓰지 않는다. 런타임 의존성은 react와 react-dom뿐이다.
- React 19라서 Context는 `<SettingsContext value={…}>`처럼 `.Provider` 없이 쓴다.

```bash
nvm install     # 처음 받은 PC에서 한 번 (.nvmrc의 Node 22 설치)
nvm use
npm install
npm run dev     # http://localhost:5173/
npm run build   # tsc -b && vite build (타입 검사 포함)
npm run lint    # oxlint
npm run data    # PokéAPI CSV를 받아 src/data/*.json을 다시 만든다 (인터넷 필요)
npm run memory -- <파일>   # 사이트에서 내보낸 그림 기억을 data/sprite-memory.json 에 합친다
```

`npm run data`는 처음 실행할 때 스크린샷 인식용 HOME 그림 530장(67MB 정도)을 `.cache/home/`에 받아 둔다. 이 폴더는 git에 올리지 않고, 그다음부터는 새 포켓몬의 그림만 받는다.

## 파일 구조

```
data/                       직접 관리하는 원본
  roster.txt                챔피언스 참전 목록 (PokéAPI identifier, 패치 버전별 구역)
  ability-ko.json           PokéAPI에 한글이 없는 특성의 이름·설명 보충
  sprite-memory.json        스크린샷 인식용: 시험하며 고른 그림 지문 (npm run memory 로 늘린다. 앱이 바로 읽는다)
scripts/build-data.mjs      npm run data: PokéAPI CSV → src/data/*.json
scripts/merge-memory.mjs    npm run memory: 사이트에서 내보낸 그림 기억 → data/sprite-memory.json
scripts/png.mjs             HOME 그림을 읽는 최소 PNG 디코더 (build-data.mjs 가 씀)
src/data/                   생성 결과 (손으로 고치지 않는다. 커밋은 한다)
  pokemon.json              참전 포켓몬 347개, 스피드 종족값 내림차순
  abilities.json            특성 215개
  type-chart.json           18×18 타입 상성
  recognition.json          스크린샷 인식용: 기본 모습 265개의 성별 비율과 HOME 그림 색 특징
src/
  speed.ts                  스피드 계산식, 보정, 투자 프리셋(최속/준속/무투자/최저속)과 프리셋별 스피드
  matchup.ts                매치업 칸 판정 (먼저/나중/○○까지/○○ 동속 …)
  party.ts                  내 파티·상대·스카프 목록 타입, 저장 키, 저장값 검사(parse)
  pokemon.ts                포켓몬 목록, 메가진화 연결, 타입 이름·색, 이미지 주소, 검색
  typeChart.ts              타입 상성 계산 (배율별로 묶기)
  abilities.ts              특성 사전
  settings.ts               보기 설정 (사진 켜기/끄기)과 Context
  pokemonInfo.ts            "사진을 누르면 정보 창 열기" Context
  storage.ts                useStoredState: localStorage에 {version, data}로 저장하는 useState (readStored/writeStored)
  teamPreview.ts            팀 미리보기 스크린샷 분석: 칸 찾기, 타입 아이콘·성별 읽기, 후보 순위
  spriteFeature.ts          그림 색 특징과 지문 비교 (브라우저와 scripts/*.mjs 가 함께 씀, 다른 파일을 import 하지 않음)
  spriteMemory.ts           그림 지문 기억: 이 기기(localStorage) → 소스(data/sprite-memory.json) 순으로 찾기, 저장, 내보내기
  App.tsx                   탭 5개, 헤더(사진 스위치), 하단 문구, 정보 창
  components/               탭 화면과 공용 부품
  index.css / App.css       색 변수(라이트·다크) / 컴포넌트 스타일
.github/workflows/deploy.yml  main push → 빌드 → GitHub Pages
```

## 작업 규칙 (사용자와 합의한 것)

- 대화와 설명은 한국어로 한다.
- **기능 하나를 마치면 커밋한다.** 커밋 로그를 남기기 위해서다. 메시지는 한국어로 짧게, 무엇이 바뀌었는지 쓴다 (예: `타입 상성표 탭 추가`).
- **push는 사용자가 요청할 때만 한다.** push하면 곧바로 사이트에 배포된다.
- 파일·폴더 삭제, 이름 변경, 저장소 설정 변경처럼 되돌리기 어려운 일은 먼저 묻는다.
- 화면 문구는 한국어 해요체("~해요")로 쓰고, 코드 주석은 한국어 평서문("~한다")으로 쓴다. 기존 코드의 말투와 주석 밀도를 따른다.
- 스피드 실수치를 보여 주는 곳에는 **스피드 종족값도 함께** 보여 준다. 게임하는 사람들이 종족값으로 이야기하기 때문이다.
- 대전 중에 휴대폰으로 보는 도구라서 **모바일(375px 폭) 화면을 먼저** 확인한다.
- 게임 속 공식 설명 문구를 위키 등에서 그대로 복사하지 않는다(저작권). 필요하면 효과를 보고 직접 쓰고 "직접 작성"으로 표시한다.
- 광고 같은 수익화는 하지 않는다. GitHub Pages는 상업적 이용이 금지되고, 포켓몬 이름과 이미지는 저작물이다.

## 작업 후 확인

1. `npm run build`와 `npm run lint`가 통과해야 한다.
2. `npm run dev`로 띄워 브라우저에서 바뀐 화면을 본다. 데스크톱과 375px 폭을 둘 다 보고, 가로 스크롤이 생기지 않는지 확인한다. 창 크기를 줄일 수 없으면 개발자 도구의 기기 모드나 375px 폭 iframe을 쓴다.
3. 계산 로직은 dev 서버를 연 브라우저 콘솔에서 모듈을 바로 불러 확인할 수 있다. Vite가 `.ts` 파일을 그대로 내려 주기 때문이다.
   ```js
   const { judge } = await import('/src/matchup.ts')
   const { presetSpeeds } = await import('/src/speed.ts')
   const { BY_KEY } = await import('/src/pokemon.ts')
   // 내 최속 한카리아스(169) vs 상대 한카리아스 → label: '최속 동속'
   judge(169, presetSpeeds(BY_KEY.get('garchomp'), false, false), false)
   ```
4. 데이터를 다시 만들었으면 `npm run data`가 출력하는 개수(포켓몬 347, 특성 215, 직접 쓴 설명 23, 영문으로 대신한 것 0, 인식용 265)와 `git diff src/data`를 보고, 의도한 변화만 있는지 확인한다.
5. 스크린샷 인식을 고쳤으면 실제 팀 미리보기 스크린샷으로 확인한다. 방법은 docs/screenshot-recognition.md의 "확인하는 방법"에 있다.

## 주의할 점

- `src/data/*.json`은 생성 파일이다. 고칠 일이 있으면 `data/`의 원본이나 `scripts/build-data.mjs`를 고친 뒤 `npm run data`를 실행한다.
- `data/sprite-memory.json`은 사이트와 함께 모든 사람에게 배포되는 그림 기억이다. `npm run memory`로만 늘리고, 출력에 "바꿈"이 있으면 맞는지 확인한다. 방법은 docs/screenshot-recognition.md의 4절에 있다.
- 포켓몬은 숫자 id가 아니라 **identifier(key, 예: `garchomp-mega`)로 저장하고 비교**한다. 숫자 id는 PokéAPI가 바꿀 수 있어서 이미지 주소를 만들 때만 쓴다.
- localStorage는 출처(origin) 단위라서 `yul456.github.io` 아래의 모든 프로젝트 사이트가 같은 저장 공간을 쓴다. 그래서 키 앞에 `champions-speed/`를 붙였다. 저장소 이름이 바뀌어도 이 키는 그대로 둔다. 바꾸면 사용자가 저장해 둔 파티가 사라진다.
- 저장 형식을 바꿀 때는 version을 올리고, parse 함수에서 옛 형식을 새 형식으로 바꿔 준다. 자세한 내용은 docs/features.md의 "저장 데이터"에 있다.
- Vite의 `base`는 빌드할 때 `GITHUB_REPOSITORY`(예: `yul456/pokedex`)로 정해진다. 그래서 배포 사이트는 `/pokedex/`, 로컬은 `/`이고, 저장소 이름을 바꿔도 설정을 고칠 필요가 없다.
- 스크린샷은 브라우저 안에서만 분석하고 밖으로 보내지 않는다. 프론트 코드는 누구나 볼 수 있으므로 AI API 키 같은 비밀값은 넣지 않는다.
- 사이트는 SPA이고 탭은 주소에 반영되지 않는다. GitHub Pages는 없는 경로에 404를 준다 (`/pokedex/matchup`은 404, `/pokedex/#matchup`은 정상).
- dev 서버의 HMR로 화면이 바뀌어도 이미 열린 탭의 localStorage에는 옛 형식 값이 남을 수 있다. parse가 검사하므로 문제는 없지만, 저장값을 확인할 때는 이 점을 감안한다.
