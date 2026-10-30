// PokéAPI CSV 데이터에서 챔피언스 참전 포켓몬만 골라 src/data/*.json 을 만든다.
// 실행: npm run data
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { colorFeature } from '../src/spriteFeature.ts'
import { decodePng } from './png.mjs'

const CSV_BASE = 'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv'
const LANG_KO = '3'
const LANG_EN = '9'
const STAT_SPEED = '6'

// 따옴표로 감싼 필드(쉼표·줄바꿈 포함)까지 처리하는 간단한 CSV 파서
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        field += c
      }
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

async function loadCsv(name) {
  const res = await fetch(`${CSV_BASE}/${name}.csv`)
  if (!res.ok) throw new Error(`${name}.csv 다운로드 실패: ${res.status}`)
  return parseCsv(await res.text())
}

// PokéAPI에 한글 폼 이름이 없는 폼은 직접 지정
const FORM_LABEL_KO = {
  'basculegion-male': '수컷',
  'basculegion-female': '암컷',
  'palafin-zero': '나이브폼',
  'palafin-hero': '마이티폼',
  'maushold-family-of-four': '네 식구',
  'maushold-family-of-three': '세 식구',
  'tauros-paldea-combat-breed': '팔데아 컴뱃종',
  'tauros-paldea-blaze-breed': '팔데아 블레이즈종',
  'tauros-paldea-aqua-breed': '팔데아 워터종',
}

const REGION_KO = { alola: '알로라', galar: '가라르', hisui: '히스이' }

function koreanName(p, speciesKo, formKo, repeated) {
  const id = p.identifier
  const mega = id.match(/-mega(?:-([xyz]))?$/)
  if (mega) {
    const gender = id.includes('-male-') ? ' (수컷)' : id.includes('-female-') ? ' (암컷)' : ''
    return `메가${speciesKo}${mega[1] ? ` ${mega[1].toUpperCase()}` : ''}${gender}`
  }
  const region = id.match(/-(alola|galar|hisui)$/)
  if (region) return `${speciesKo} (${REGION_KO[region[1]]})`
  if (FORM_LABEL_KO[id]) return `${speciesKo} (${FORM_LABEL_KO[id]})`
  // 로토무 폼은 폼 이름 자체가 이름 (예: 히트로토무)
  if (id.startsWith('rotom-') && formKo) return formKo
  // 기본 폼이 아니거나 같은 종이 여러 폼으로 참전할 때만 폼 이름을 붙인다 (예: 킬가르도 (블레이드폼))
  if ((p.is_default === '0' || repeated) && id.includes('-') && formKo) return `${speciesKo} (${formKo})`
  return speciesKo
}

// 메가냐오닉스처럼 PokéAPI 영어 이름에 성별이 빠진 메가진화 보완
function englishName(id, name) {
  if (/-male-mega$/.test(id)) return `${name} (Male)`
  if (/-female-mega$/.test(id)) return `${name} (Female)`
  return name
}

const roster = (await readFile(new URL('../data/roster.txt', import.meta.url), 'utf8'))
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))

const [
  pokemon,
  stats,
  speciesNames,
  forms,
  formNames,
  pokemonTypes,
  typeEfficacy,
  pokemonAbilities,
  abilities,
  abilityNames,
  abilityFlavorTexts,
  abilityProse,
  species,
] = await Promise.all(
  [
    'pokemon',
    'pokemon_stats',
    'pokemon_species_names',
    'pokemon_forms',
    'pokemon_form_names',
    'pokemon_types',
    'type_efficacy',
    'pokemon_abilities',
    'abilities',
    'ability_names',
    'ability_flavor_text',
    'ability_prose',
    'pokemon_species',
  ].map(loadCsv),
)

const byIdentifier = new Map(pokemon.map((p) => [p.identifier, p]))
const speedById = new Map(stats.filter((s) => s.stat_id === STAT_SPEED).map((s) => [s.pokemon_id, Number(s.base_stat)]))
const speciesName = new Map(
  speciesNames
    .filter((n) => n.local_language_id === LANG_KO || n.local_language_id === LANG_EN)
    .map((n) => [`${n.pokemon_species_id}:${n.local_language_id}`, n.name]),
)
const defaultFormId = new Map(forms.filter((f) => f.is_default === '1').map((f) => [f.pokemon_id, f.id]))
const formName = new Map(formNames.map((n) => [`${n.pokemon_form_id}:${n.local_language_id}`, n]))
const typesById = new Map()
for (const t of [...pokemonTypes].sort((a, b) => Number(a.slot) - Number(b.slot))) {
  typesById.set(t.pokemon_id, [...(typesById.get(t.pokemon_id) ?? []), Number(t.type_id)])
}
const abilityIdentifier = new Map(abilities.map((a) => [a.id, a.identifier]))
const abilitiesById = new Map()
for (const a of [...pokemonAbilities].sort((x, y) => Number(x.slot) - Number(y.slot))) {
  abilitiesById.set(a.pokemon_id, [...(abilitiesById.get(a.pokemon_id) ?? []), a])
}

const missing = roster.filter((id) => !byIdentifier.has(id))
if (missing.length) throw new Error(`PokéAPI에 없는 identifier: ${missing.join(', ')}`)

// 메가진화를 뺀 참전 폼이 2개 이상인 종
const speciesCount = new Map()
for (const id of roster) {
  if (id.includes('-mega')) continue
  const sid = byIdentifier.get(id).species_id
  speciesCount.set(sid, (speciesCount.get(sid) ?? 0) + 1)
}

const result = roster.map((identifier) => {
  const p = byIdentifier.get(identifier)
  const formId = defaultFormId.get(p.id)
  const formKo = formName.get(`${formId}:${LANG_KO}`)?.form_name || ''
  const enForm = formName.get(`${formId}:${LANG_EN}`)
  const speciesKo = speciesName.get(`${p.species_id}:${LANG_KO}`)
  const speciesEn = speciesName.get(`${p.species_id}:${LANG_EN}`)
  return {
    id: Number(p.id),
    key: identifier,
    dex: Number(p.species_id),
    name: koreanName(p, speciesKo, formKo, speciesCount.get(p.species_id) > 1),
    nameEn: englishName(identifier, enForm?.pokemon_name || speciesEn),
    types: typesById.get(p.id) ?? [],
    speed: speedById.get(p.id),
    mega: identifier.includes('-mega'),
    abilities: (abilitiesById.get(p.id) ?? []).map((a) => ({
      id: abilityIdentifier.get(a.ability_id),
      hidden: a.is_hidden === '1',
    })),
  }
})

result.sort((a, b) => b.speed - a.speed || a.dex - b.dex)
await writeFile(new URL('../src/data/pokemon.json', import.meta.url), JSON.stringify(result, null, 1) + '\n')
console.log(`src/data/pokemon.json: ${result.length}마리`)

// 타입 상성표: chart[공격 타입 id - 1][방어 타입 id - 1] = 피해 배율 (0, 0.5, 1, 2)
// 기본 18타입만 쓴다 (19번 스텔라, 10001번대 특수 타입 제외)
const TYPE_COUNT = 18
const chart = Array.from({ length: TYPE_COUNT }, () => Array(TYPE_COUNT).fill(1))
for (const e of typeEfficacy) {
  const attack = Number(e.damage_type_id)
  const defend = Number(e.target_type_id)
  if (attack <= TYPE_COUNT && defend <= TYPE_COUNT) chart[attack - 1][defend - 1] = Number(e.damage_factor) / 100
}
await writeFile(
  new URL('../src/data/type-chart.json', import.meta.url),
  `[\n${chart.map((row) => `  ${JSON.stringify(row)}`).join(',\n')}\n]\n`,
)
console.log('src/data/type-chart.json: 18 × 18')

// 특성 사전: 참전 포켓몬이 쓰는 특성만, 식별자 → 이름·설명
// 설명은 게임 안 문구(가장 최근 버전)를 쓰고, 한글이 없으면 영어 문구 → 영어 효과 요약 순으로 대신 쓴다
const abilityName = new Map(abilityNames.map((n) => [`${n.ability_id}:${n.local_language_id}`, n.name]))
const latestFlavorText = new Map()
for (const f of abilityFlavorTexts) {
  const key = `${f.ability_id}:${f.language_id}`
  const prev = latestFlavorText.get(key)
  if (!prev || Number(f.version_group_id) > Number(prev.version_group_id)) latestFlavorText.set(key, f)
}
const shortEffectEn = new Map(
  abilityProse.filter((p) => p.local_language_id === LANG_EN).map((p) => [p.ability_id, p.short_effect]),
)
// 줄바꿈 정리, 효과 요약의 [표시글]{mechanic:이름} 링크 표기를 글자만 남긴다
const cleanText = (text) =>
  text
    .replace(/\[([^\]]*)\]\{[^:}]*:([^}]*)\}/g, (_, label, target) => label || target.replace(/-/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()

// PokéAPI 에 한글이 없는 특성은 직접 관리하는 보충 파일(data/ability-ko.json)로 채운다
const abilityKo = JSON.parse(await readFile(new URL('../data/ability-ko.json', import.meta.url), 'utf8')).abilities

const abilityByIdentifier = new Map(abilities.map((a) => [a.identifier, a.id]))
const usedAbilities = [...new Set(result.flatMap((p) => p.abilities.map((a) => a.id)))].sort()
const abilityDict = Object.fromEntries(
  usedAbilities.map((identifier) => {
    const id = abilityByIdentifier.get(identifier)
    const supplement = abilityKo[identifier] ?? {}
    const nameKo = abilityName.get(`${id}:${LANG_KO}`) ?? supplement.name
    const textKo = latestFlavorText.get(`${id}:${LANG_KO}`)?.flavor_text
    const textEn = latestFlavorText.get(`${id}:${LANG_EN}`)?.flavor_text ?? shortEffectEn.get(id)
    const written = !textKo && supplement.description
    return [
      identifier,
      {
        name: nameKo ?? abilityName.get(`${id}:${LANG_EN}`) ?? identifier,
        description: cleanText(textKo ?? supplement.description ?? textEn ?? ''),
        ...(nameKo ? {} : { englishName: true }),
        ...(written ? { writtenDescription: true } : {}),
        ...(textKo || written || !textEn ? {} : { englishDescription: true }),
      },
    ]
  }),
)
const unusedSupplement = Object.keys(abilityKo).filter((k) => !usedAbilities.includes(k))
if (unusedSupplement.length) console.log(`참고: ability-ko.json 에만 있고 쓰이지 않는 특성 ${unusedSupplement.join(', ')}`)
await writeFile(new URL('../src/data/abilities.json', import.meta.url), JSON.stringify(abilityDict, null, 1) + '\n')
const englishOnly = Object.values(abilityDict).filter((a) => a.englishName || a.englishDescription).length
const written = Object.values(abilityDict).filter((a) => a.writtenDescription).length
console.log(`src/data/abilities.json: ${usedAbilities.length}개 (직접 쓴 설명 ${written}개, 영문으로 대신한 것 ${englishOnly}개)`)

// 스크린샷 인식용 데이터: 기본 모습마다 성별 비율과 HOME 3D 그림(일반·이로치)의 색 특징
// gender: PokéAPI gender_rate (-1 성별 없음, 0 수컷만, 8 암컷만, 그 사이는 둘 다)
// 그림은 .cache/home 에 받아 두고 다시 받지 않는다 (처음 한 번은 500장 넘게, 60MB 정도 받는다)
const HOME_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home'
const homeCache = new URL('../.cache/home/', import.meta.url)
await mkdir(homeCache, { recursive: true })

async function homeImage(id, shiny) {
  const file = new URL(`${shiny ? 'shiny-' : ''}${id}.png`, homeCache)
  try {
    return await readFile(file)
  } catch {
    const res = await fetch(`${HOME_BASE}/${shiny ? 'shiny/' : ''}${id}.png`)
    if (!res.ok) throw new Error(`HOME 그림 다운로드 실패: ${id}${shiny ? ' (이로치)' : ''} ${res.status}`)
    const png = Buffer.from(await res.arrayBuffer())
    await writeFile(file, png)
    return png
  }
}

// 투명하지 않은 픽셀만 센다
async function homeColors(id, shiny) {
  const { width, height, data } = decodePng(await homeImage(id, shiny))
  const pixels = []
  for (let i = 0; i < width * height; i++) if (data[i * 4 + 3] >= 128) pixels.push(data.subarray(i * 4, i * 4 + 3))
  return colorFeature(pixels).map(Math.round)
}

const genderRate = new Map(species.map((s) => [Number(s.id), Number(s.gender_rate)]))
const recognition = []
const bases = result.filter((p) => !p.mega)
// 한꺼번에 너무 많이 받으면 실패해서 6개씩 나눠 받는다
for (let i = 0; i < bases.length; i += 6) {
  recognition.push(
    ...(await Promise.all(
      bases.slice(i, i + 6).map(async (p) => [
        p.key,
        { gender: genderRate.get(p.dex), normal: await homeColors(p.id, false), shiny: await homeColors(p.id, true) },
      ]),
    )),
  )
}
recognition.sort(([a], [b]) => a.localeCompare(b))
await writeFile(
  new URL('../src/data/recognition.json', import.meta.url),
  `{\n${recognition.map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(',\n')}\n}\n`,
)
console.log(`src/data/recognition.json: ${recognition.length}개 (스크린샷 인식용 성별·그림 색)`)
