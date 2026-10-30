# 데이터와 참전 목록 관리

## 흐름

```
data/roster.txt (참전 목록) + data/ability-ko.json (특성 한글 보충)
        │
        │  npm run data  (scripts/build-data.mjs)
        │  ← PokéAPI CSV 13개를 GitHub에서 한 번에 받는다
        │  ← 스크린샷 인식용 HOME 그림 530장 (.cache/home 에 받아 두고 다시 쓴다)
        ▼
src/data/pokemon.json · abilities.json · type-chart.json · recognition.json   ← 커밋한다
        │
        │  npm run build: JSON이 JS 번들 안에 들어간다
        ▼
사이트는 실행 중에 API를 부르지 않는다. 이미지만 브라우저가 PokeAPI/sprites 저장소에서 직접 받는다.
```

- CSV 주소: `https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/<이름>.csv`
- REST API를 포켓몬마다 부르지 않고 CSV를 한 번에 받는다. 빠르고, PokéAPI가 멈춰도 사이트는 동작한다. PokéAPI도 데이터를 받아 두고 쓰기를 권장한다.
- **PokéAPI에는 "챔피언스 참전 여부" 정보가 없다.** 그래서 참전 목록은 `data/roster.txt`에서 직접 관리한다.
- PokéAPI의 `master`가 바뀌면 같은 명령으로도 결과가 달라질 수 있다. 다시 만든 뒤에는 `git diff src/data`로 변화를 확인한다.

## PokéAPI CSV에서 알아 둘 것

- 쓰는 CSV: pokemon, pokemon_stats, pokemon_species_names, pokemon_forms, pokemon_form_names, pokemon_types, type_efficacy, pokemon_abilities, abilities, ability_names, ability_flavor_text, ability_prose, pokemon_species (성별 비율 gender_rate)
- 언어 id는 한국어 `3`, 영어 `9`다. 스피드 stat_id는 `6`이다.
- **pokemon.id**: 기본 모습은 도감 번호와 같다 (한카리아스 445). 메가진화나 지역 폼처럼 기본이 아닌 모습은 10001번부터 따로 번호가 붙는다 (메가한카리아스 10058, 메가한카리아스 Z 10309). `species_id`가 도감 번호다.
- **identifier**: roster.txt에 쓰는 값이고, 앱에서는 `key`라고 부른다.
  - 메가: `-mega`, `-mega-x`, `-mega-y`, `-mega-z` (예: `charizard-mega-x`, `absol-mega-z`). 성별이 있으면 `meowstic-male-mega`처럼 쓴다.
  - 지역 폼: `-alola`, `-galar`, `-hisui`, 팔데아 켄타로스는 `tauros-paldea-combat-breed`/`-blaze-breed`/`-aqua-breed`다.
  - 모습이 여럿인 종은 기본 모습에도 접미어가 붙는다: `aegislash-shield`, `lycanroc-midday`, `gourgeist-average`, `mimikyu-disguised`, `morpeko-full-belly`, `toxtricity-amped`, `palafin-zero`, `maushold-family-of-four`, `indeedee-male`, `basculegion-male`, `meowstic-male`, `pyroar-male`, `squawkabilly-green-plumage`
  - 찾는 방법: `https://pokeapi.co/api/v2/pokemon-species/<영어 이름>`을 열면 `varieties`에 모습별 identifier가 나온다.
- **한글 특성 설명**(ability_flavor_text)은 소드·실드까지만 있다. 그 뒤에 나온 특성은 `data/ability-ko.json`으로 채운다.

## 생성되는 `pokemon.json` 항목

```json
{ "id": 10058, "key": "garchomp-mega", "dex": 445, "name": "메가한카리아스", "nameEn": "Mega Garchomp",
  "types": [16, 5], "speed": 92, "mega": true, "abilities": [{ "id": "sand-force", "hidden": false }] }
```

- 정렬은 스피드 종족값 내림차순, 같으면 도감 번호 오름차순이다.
- `types`는 PokéAPI type id다 (1 노말 … 18 페어리). 한글 이름과 색은 `src/pokemon.ts`의 `TYPES`에 있다.
- roster에 있는데 PokéAPI에 없는 identifier가 있으면 `PokéAPI에 없는 identifier: …` 오류를 내고 멈춘다.

## 한글 이름 만드는 규칙 (`koreanName`)

| 경우 | 결과 예 |
|---|---|
| 메가진화 | 메가한카리아스, 메가리자몽 X, 메가앱솔 Z, 메가냐오닉스 (수컷) |
| 지역 폼 | 페르시온 (알로라), 윈디 (히스이) |
| `FORM_LABEL_KO`에 직접 정한 폼 (PokéAPI에 한글 폼 이름이 없음) | 켄타로스 (팔데아 워터종), 돌핀맨 (나이브폼), 파밀리쥐 (네 식구), 대쓰여너 (수컷) |
| 로토무 | 폼 이름 그대로 (히트로토무) |
| 기본이 아닌 모습이거나, 같은 종이 여러 모습으로 참전 | 킬가르도 (실드폼), 에써르 (암컷의 모습), 루가루암 (한낮의 모습) |
| 그 밖 | 종 이름 (한카리아스, 따라큐, 시비꼬) |

- 영어 이름은 폼 이름(`pokemon_name`)을 먼저 쓰고, 없으면 종 이름을 쓴다. 성별이 다른 메가에는 `(Male)`/`(Female)`을 붙인다.
- 검색은 한글과 영어 이름 모두로 한다. 띄어쓰기, 따옴표, 마침표, 하이픈, 괄호는 무시한다 ("메가 리자몽", "farfetch'd"도 찾힌다). 이름이 검색어로 시작하는 포켓몬을 먼저 보여 준다.

## 메가진화 연결 (`src/pokemon.ts`의 `megaBaseKey`)

- 메가의 key에서 `-mega`, `-mega-x/y/z`를 떼면 진화 전 모습이 된다 (`raichu-mega-x` → `raichu`, `meowstic-male-mega` → `meowstic-male`).
- 그렇게 떼어 낸 key가 없으면 같은 도감 번호의 메가가 아닌 모습으로 연결한다. 예: `floette-mega` → `floette-eternal`(영원의 꽃)
- 지금 메가 82개가 모두 진화 전 모습에 연결된다. 알로라 라이츄처럼 연결되는 메가가 없는 모습은 메가 선택지가 나오지 않는다.
- **메가를 roster에 넣을 때는 진화 전 모습도 roster에 있어야** 파티와 매치업에서 고를 수 있다.

## 특성

- 포켓몬별 특성은 `pokemon_abilities`에서 가져온다. slot 순서로 넣고, `is_hidden`이면 숨겨진 특성으로 표시한다. 사전(`abilities.json`)에는 참전 포켓몬이 쓰는 특성만 넣는다.
- 이름은 다음 순서로 고른다: PokéAPI 한글 → `ability-ko.json`의 `name` → 영어 → identifier
- 설명은 다음 순서로 고른다: PokéAPI 한글 게임 문구(가장 최근 버전) → `ability-ko.json`의 `description` → 영어 게임 문구 → 영어 효과 요약
  - 영어 효과 요약(`ability_prose`의 short_effect)에 있는 `[글]{mechanic:…}` 링크 표기는 글자만 남긴다.
- 화면 태그는 세 가지다: "숨겨진 특성", "한글 정보 없음"(영어로 대신 보여 줌), "직접 작성"(`ability-ko.json`의 설명)
- 현재 215개 가운데 PokéAPI 한글이 192개, 직접 작성이 23개, 영어가 0개다.
- **`data/ability-ko.json` 운영 규칙**
  - 이름 3개(파동의방호, 천정부지, 불꽃의갈기)는 PokéAPI에 없었다. 그래서 GameWith의 포켓몬 챔피언스 한국어 특성 목록에서 일본어 이름으로 대조해 가져왔다.
  - 설명은 공식 문구가 아니라 효과를 보고 직접 썼다. 공식 문구가 실린 곳(나무위키 등)이 있어도 저작권 때문에 옮겨 오지 않는다.
  - 나중에 PokéAPI에 한글이 생기면 그쪽이 먼저 쓰이므로 해당 항목은 지워도 된다. 쓰이지 않는 항목이 있으면 `npm run data`가 알려 준다.
- **한계**: 특성 데이터는 PokéAPI(본가 게임) 기준이다. 챔피언스에서 효과가 바뀐 특성은 반영되지 않는다.

## 타입 상성

- `type_efficacy`의 `damage_factor / 100`을 `chart[공격 타입 - 1][방어 타입 - 1]`에 넣는다. 값은 0, 0.5, 1, 2다.
- 기본 18타입만 쓴다. 19번 스텔라와 10001번대 특수 타입은 뺀다.
- 두 타입 포켓몬이 받는 배율은 두 값을 곱한 값이다 (4, 2, 1, 0.5, 0.25, 0).

## 스크린샷 인식용 데이터 (`recognition.json`)

팀 미리보기 스크린샷을 읽을 때 쓰는 데이터다. 읽는 방법은 [screenshot-recognition.md](screenshot-recognition.md)에 있다.

```json
"kangaskhan": { "gender": 8, "normal": [152, 1, 74, …], "shiny": [0, 0, 68, …] }
```

- 기본 모습 265개만 넣는다. 상대는 진화 전 모습으로 고르기 때문이다.
- `gender`: PokéAPI `pokemon_species.gender_rate` 값이다. -1은 성별 없음, 0은 수컷만, 8은 암컷만이고, 1~7은 둘 다 있다.
- `normal`, `shiny`: Pokémon HOME 3D 그림(일반·이로치)의 색 특징 27칸이다. 계산은 `src/spriteFeature.ts`의 `colorFeature`로 하고, 투명하지 않은 픽셀만 센다.
  - 같은 함수를 브라우저가 스크린샷에도 쓴다. `build-data.mjs`는 이 `.ts` 파일을 Node 22에서 바로 import 한다. 그래서 `spriteFeature.ts`는 다른 파일을 import 하지 않게 둔다.
  - HOME 그림 주소: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/<id>.png` (이로치는 `home/shiny/<id>.png`). 참전 기본 모습 265개 모두 일반·이로치 그림이 있다.
  - 받은 그림은 `.cache/home/`에 저장해 두고 다시 받지 않는다. 처음 한 번은 530장, 67MB 정도를 받는다. `.cache`는 `.gitignore`에 들어 있다.
  - PNG는 `scripts/png.mjs`(8비트, 인터레이스 없는 PNG만 지원)로 읽는다. 지원하지 않는 형식이면 오류를 내고 멈춘다.
- 게임 속 그림은 HOME 그림과 자세가 달라서 모양은 비교하지 않고 색 분포만 비교한다.

## 이미지

- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/<pokemon.id>.png`를 바로 불러온다(핫링크). 그래서 저장소에는 이미지가 없고, 이미지 트래픽은 우리 사이트 사용량에 포함되지 않는다.
- 불러오기에 실패하면 그 자리만 비운다. 설정에서 사진을 끄면 사진 자리에 도감 번호를 보여 준다.

## 참전 목록 (`data/roster.txt`)

- 한 줄에 identifier 하나를 쓰고, `#`으로 시작하는 줄은 주석이다. 패치마다 `# --- 버전 X (날짜, 레귤레이션) ---` 구역을 새로 만들고 출처를 적는다. 맨 위의 "현재 반영" 줄도 함께 고친다.
- 현재 상태: 버전 1.2.0 (2026-09-09, 레귤레이션 M-C), 347개 = 기본 모습 265 + 메가 82, 231종
- 이렇게 만들었다
  - **출시 ~ 1.1.0 (315개)**: Game8 스피드 목록(2026-06-30)에서 이름만 뽑아 PokéAPI identifier로 연결했다. 295개는 영어 이름으로 자동 연결됐고, 폼 표기가 다른 20개(킬가르도 폼, 루가루암 폼 등)는 직접 연결했다. 연결 스크립트는 한 번만 쓰고 저장소에 남기지 않았다.
  - **1.2.0 (+32개)**: Serebii 패치 노트와 Game8의 M-C 추가 목록으로 확인했다. Serebii의 사용 가능 포켓몬 목록(231종)과 종 수가 정확히 같아서 빠진 포켓몬이 없다고 판단했다. 새 메가의 스피드는 Serebii 챔피언스 도감과 대조했다.
- 넣는 기준
  - 스피드나 타입이 다른 모습은 따로 넣는다 (에써르 수컷 95, 암컷 85).
  - 능력치가 같은 모습은 기본형 하나만 넣는다 (시비꼬의 깃털 색 4종은 `squawkabilly-green-plumage`만).

### 패치로 참전 포켓몬이 바뀌면

1. 바뀐 내용을 확인한다: Serebii 패치 노트, Game8 새 포켓몬 목록, 공식 발표.
2. 포켓몬마다 identifier를 찾는다 (`pokemon-species/<영어 이름>`의 `varieties`).
3. `roster.txt`에 새 버전 구역을 만들어 추가하고, 맨 위 "현재 반영" 줄을 고친다. 메가를 넣을 때는 진화 전 모습이 이미 있는지 확인한다.
4. `npm run data`를 실행한다.
   - `PokéAPI에 없는 identifier` 오류가 나면 PokéAPI에 아직 들어오지 않은 것이다. 커뮤니티가 관리해서 늦을 수 있다. 지금은 기다리는 수밖에 없다 (보충 파일 기능은 아직 없다. docs/features.md의 다음에 할 만한 일 참고).
5. 새 포켓몬의 스피드 종족값을 Serebii 챔피언스 도감 등과 대조한다.
6. 출력에 "영문으로 대신한 것 N개"가 생기면 그 특성을 `ability-ko.json`에 보충한다. 새 포켓몬의 HOME 그림이 아직 없으면 `HOME 그림 다운로드 실패` 오류가 난다.
7. `src/App.tsx` 하단 문구("참전 목록: 버전 … 기준")와 README를 고친다.
8. 빌드, 린트, 화면을 확인한 뒤 커밋한다.

> 메모 (2026-10 기준, 확정 아님): 12월 업데이트에 메가히드런이 추가된다는 보도가 있었다. PokéAPI에는 `heatran-mega`가 이미 있다. 다만 `heatran`이 지금 roster에 없으니, 추가된다면 둘 다 넣어야 한다.

## 출처

- PokéAPI CSV: https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv
- PokéAPI 그림 (공식 일러스트, HOME 3D 그림): https://github.com/PokeAPI/sprites
- Game8 스피드 목록 (출시 ~ 1.1.0 참전 목록, 계산식 검증): https://game8.co/games/Pokemon-Champions/archives/594190
- Game8 레귤레이션 M-C 새 포켓몬: https://game8.co/games/Pokemon-Champions/archives/605517
- Serebii 패치 노트: https://www.serebii.net/pokemonchampions/patch.shtml
- Serebii 사용 가능 포켓몬: https://www.serebii.net/pokemonchampions/pokemon.shtml
- Serebii 챔피언스 도감 (예: 갑주무사): https://www.serebii.net/pokedex-champions/golisopod/
- Serebii 챔피언스 새 특성: https://www.serebii.net/pokemonchampions/newabilities.shtml
- GameWith 챔피언스 한국어 특성 목록: https://gamewith.ai/pokemon-champions/ko/abilities
- 스탯포인트 설명 (Bulbapedia): https://bulbapedia.bulbagarden.net/wiki/Stat_point
