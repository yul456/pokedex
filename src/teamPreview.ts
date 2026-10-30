import recognition from './data/recognition.json'
import { BASE_POKEMON, BY_KEY, TYPES, type Pokemon } from './pokemon'
import { colorFeature, colorSimilarity, isCrimson } from './spriteFeature'
import { PRINT_GRID, PRINT_SIZE, printDistance, SAME_SPRITE, type MemoryEntry } from './spriteMemory'

// 팀 미리보기 스크린샷에서 상대 포켓몬 칸을 찾아 타입·성별·그림을 읽는다. 브라우저 안에서만 계산하고 밖으로 보내지 않는다
// 칸 하나: 빨간 칸 왼쪽에 포켓몬 그림, 오른쪽 위에 타입 아이콘 1~2개(왼쪽이 첫 번째 타입), 오른쪽 아래에 성별 표시(♂ 파랑, ♀ 빨강)
// 이름은 나오지 않으므로 타입·성별로 후보를 거르고, 그림 색이 HOME 그림과 비슷한 순서로 후보를 늘어놓는다

type RecognitionData = Record<string, { gender: number; normal: number[]; shiny: number[] }>
const DATA: RecognitionData = recognition

export type ImageLike = { width: number; height: number; data: ArrayLike<number> }
export type Box = { x: number; y: number; w: number; h: number }
export type Gender = 'male' | 'female' | 'none'

export type PreviewSlot = {
  sprite: Box // 그림이 있는 사각형 (원본 이미지 좌표)
  types: number[]
  gender: Gender
  candidates: Pokemon[] // 맞을 가능성이 높은 순서
  remembered: Pokemon | null // 기억해 둔 그림과 같으면 그 포켓몬
  print: Uint8Array // 기억용 그림 지문
}

type Panel = { top: number; bottom: number; left: number; right: number }

const TYPE_COLORS = Object.entries(TYPES).map(([id, { color }]) => ({
  id: Number(id),
  rgb: [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16)),
}))

// 칸 바탕의 진한 빨강
const isPanel = (r: number, g: number, b: number) => r >= 60 && g <= 45 && b >= 20 && b <= 110 && r > b * 1.1

function reader(img: ImageLike) {
  const { data, width } = img
  return {
    rgb: (x: number, y: number) => {
      const i = (y * width + x) * 4
      return [data[i], data[i + 1], data[i + 2]] as const
    },
    panel: (x: number, y: number) => {
      const i = (y * width + x) * 4
      return isPanel(data[i], data[i + 1], data[i + 2])
    },
  }
}

// 1. 빨간 칸 찾기: 빨간색이 많은 열 범위를 먼저 찾고, 그 안에서 빨간색이 많은 줄이 이어진 구간을 칸으로 본다
function findPanels(img: ImageLike): Panel[] {
  const { panel } = reader(img)
  const colRatio = Array.from({ length: img.width }, (_, x) => {
    let n = 0
    for (let y = 0; y < img.height; y++) if (panel(x, y)) n++
    return n / img.height
  })
  const maxCol = Math.max(...colRatio)
  if (maxCol < 0.05) return []
  const x0 = colRatio.findIndex((v) => v >= maxCol / 2)
  const x1 = img.width - 1 - [...colRatio].reverse().findIndex((v) => v >= maxCol / 2)

  const runs: { top: number; bottom: number }[] = []
  let start = -1
  let gap = 0
  for (let y = 0; y <= img.height; y++) {
    let n = 0
    if (y < img.height) for (let x = x0; x <= x1; x++) if (panel(x, y)) n++
    if (y < img.height && n / (x1 - x0 + 1) > 0.25) {
      if (start < 0) start = y
      gap = 0
    } else if (start >= 0 && (++gap > 3 || y === img.height)) {
      // 칸 높이는 너비의 20% 이상 (위쪽 이름표 같은 얇은 띠는 뺀다)
      if (y - gap - start >= 0.2 * (x1 - x0)) runs.push({ top: start, bottom: y - gap })
      start = -1
    }
  }

  // 높이가 비슷한 칸만 남긴다 (최대 6칸)
  const heights = runs.map((r) => r.bottom - r.top).sort((a, b) => a - b)
  const median = heights[heights.length >> 1]
  return runs
    .filter((r) => Math.abs(r.bottom - r.top - median) <= 0.3 * median)
    .slice(0, 6)
    .map((r) => {
      const rows = r.bottom - r.top + 1
      const ratio = (x: number) => {
        let n = 0
        for (let y = r.top; y <= r.bottom; y++) if (panel(x, y)) n++
        return n / rows
      }
      let left = x0
      while (left > 0 && ratio(left - 1) > 0.3) left--
      let right = x1
      while (right < img.width - 1 && ratio(right + 1) > 0.3) right++
      return { ...r, left, right }
    })
}

// 2. 타입 아이콘: 칸 오른쪽 위에서 빨간색이 아닌 열 묶음을 아이콘으로 보고, 흰 무늬를 뺀 가운데 색과 가장 가까운 타입을 고른다
function readTypes(img: ImageLike, p: Panel) {
  const { rgb, panel } = reader(img)
  const w = p.right - p.left
  const h = p.bottom - p.top
  const xFrom = Math.round(p.left + 0.55 * w)
  const yFrom = Math.round(p.top + 0.03 * h)
  const yTo = Math.round(p.top + 0.5 * h)
  const isIcon = (x: number, y: number) => {
    const [r, g, b] = rgb(x, y)
    return !panel(x, y) && Math.max(r, g, b) >= 60
  }

  const clusters: { from: number; to: number }[] = []
  for (let x = xFrom; x < p.right - 1; x++) {
    let n = 0
    for (let y = yFrom; y < yTo; y++) if (isIcon(x, y)) n++
    const last = clusters[clusters.length - 1]
    if (n > 0.3 * (yTo - yFrom)) {
      if (last && last.to === x - 1) last.to = x
      else clusters.push({ from: x, to: x })
    }
  }

  // 아이콘은 거의 정사각형이라 너비가 칸 너비의 8~25% 인 묶음만 본다. 오른쪽 정렬이라 마지막 두 개까지
  return clusters
    .filter((c) => c.to - c.from >= 0.08 * w && c.to - c.from <= 0.25 * w)
    .slice(-2)
    .flatMap((c) => {
      const pixels: (readonly [number, number, number])[] = []
      for (let x = c.from; x <= c.to; x++)
        for (let y = yFrom; y < yTo; y++) {
          const color = rgb(x, y)
          if (isIcon(x, y) && Math.min(...color) <= 215) pixels.push(color)
        }
      if (pixels.length === 0) return []
      const median = [0, 1, 2].map((k) => pixels.map((c) => c[k]).sort((a, b) => a - b)[pixels.length >> 1])
      const nearest = TYPE_COLORS.map(({ id, rgb: t }) => ({ id, d: t.reduce((s, v, k) => s + (v - median[k]) ** 2, 0) })).sort(
        (a, b) => a.d - b.d,
      )[0]
      return [nearest.id]
    })
}

// 3. 성별 표시: 파란(♂)·빨간(♀) 픽셀 덩어리 중 동그랗게 꽉 찬 것만 인정한다 (배경 레이저 줄 같은 긴 선은 뺀다)
function readGender(img: ImageLike, p: Panel): Gender {
  const { rgb } = reader(img)
  const w = p.right - p.left
  const h = p.bottom - p.top
  const xFrom = Math.round(p.left + 0.55 * w)
  const yFrom = Math.round(p.top + 0.45 * h)
  const tests: [Gender, (r: number, g: number, b: number) => boolean][] = [
    ['male', (r, g, b) => b > 150 && b > r + 60 && b > g + 20],
    ['female', (r, g, b) => r > 170 && g < 90 && b < 110 && r > b + 80],
  ]
  let best: { gender: Gender; size: number } = { gender: 'none', size: 0 }
  for (const [gender, test] of tests) {
    const seen = new Set<number>()
    const inside = (x: number, y: number) => x >= xFrom && x < p.right && y >= yFrom && y < p.bottom
    for (let x = xFrom; x < p.right; x++)
      for (let y = yFrom; y < p.bottom; y++) {
        if (seen.has(y * img.width + x) || !test(...rgb(x, y))) continue
        // 이어진 덩어리 하나를 모은다 (8방향)
        const stack = [[x, y]]
        const blob: number[][] = []
        seen.add(y * img.width + x)
        while (stack.length) {
          const [cx, cy] = stack.pop()!
          blob.push([cx, cy])
          for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++) {
              const nx = cx + dx
              const ny = cy + dy
              if (!inside(nx, ny) || seen.has(ny * img.width + nx) || !test(...rgb(nx, ny))) continue
              seen.add(ny * img.width + nx)
              stack.push([nx, ny])
            }
        }
        const xs = blob.map((b) => b[0])
        const ys = blob.map((b) => b[1])
        const bw = Math.max(...xs) - Math.min(...xs) + 1
        const bh = Math.max(...ys) - Math.min(...ys) + 1
        const round = bw / bh > 0.6 && bw / bh < 1.6 && bh > 0.08 * h && bh < 0.4 * h && blob.length / (bw * bh) > 0.4
        if (round && blob.length > best.size) best = { gender, size: blob.length }
      }
  }
  return best.gender
}

// 4. 그림: 칸 왼쪽 62% 에서 빨간 칸 색이 아닌 픽셀. 위아래·좌우 1% 씩 튀는 점은 잘라서 사각형을 잡는다
function readSprite(img: ImageLike, p: Panel) {
  const { rgb, panel } = reader(img)
  const w = p.right - p.left
  const h = p.bottom - p.top
  const xs: number[] = []
  const ys: number[] = []
  const pixels: (readonly [number, number, number])[] = []
  for (let x = Math.round(p.left + 0.04 * w); x < Math.round(p.left + 0.62 * w); x++)
    for (let y = Math.round(p.top + 0.04 * h); y < Math.round(p.bottom - 0.04 * h); y++) {
      const color = rgb(x, y)
      if (panel(x, y) || isCrimson(...color)) continue
      xs.push(x)
      ys.push(y)
      pixels.push(color)
    }
  if (pixels.length === 0) return null
  const cut = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b)
    return [sorted[Math.floor(sorted.length * 0.01)], sorted[Math.ceil(sorted.length * 0.99) - 1]]
  }
  const [x1, x2] = cut(xs)
  const [y1, y2] = cut(ys)
  const box = { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 }

  // 지문: 사각형을 12×12 칸으로 나눠 칸마다 평균 색과 그림이 차지하는 비율
  const sum = new Float64Array(PRINT_GRID * PRINT_GRID * 4)
  const area = new Float64Array(PRINT_GRID * PRINT_GRID)
  for (let y = box.y; y < box.y + box.h; y++)
    for (let x = box.x; x < box.x + box.w; x++) {
      const cell =
        Math.min(PRINT_GRID - 1, Math.floor(((y - box.y) / box.h) * PRINT_GRID)) * PRINT_GRID +
        Math.min(PRINT_GRID - 1, Math.floor(((x - box.x) / box.w) * PRINT_GRID))
      area[cell]++
      const color = rgb(x, y)
      if (panel(x, y) || isCrimson(...color)) continue
      sum[cell * 4] += color[0]
      sum[cell * 4 + 1] += color[1]
      sum[cell * 4 + 2] += color[2]
      sum[cell * 4 + 3]++
    }
  const print = new Uint8Array(PRINT_SIZE)
  for (let cell = 0; cell < PRINT_GRID * PRINT_GRID; cell++) {
    const n = sum[cell * 4 + 3]
    if (!n) continue
    print[cell * 4] = sum[cell * 4] / n
    print[cell * 4 + 1] = sum[cell * 4 + 1] / n
    print[cell * 4 + 2] = sum[cell * 4 + 2] / n
    print[cell * 4 + 3] = (n / area[cell]) * 255
  }
  return { box, feature: colorFeature(pixels), print }
}

// 성별 표시와 맞는지 (PokéAPI gender_rate: -1 성별 없음, 0 수컷만, 8 암컷만)
function genderMatches(p: Pokemon, gender: Gender) {
  const rate = DATA[p.key].gender
  if (gender === 'none') return rate === -1
  if (rate === -1 || rate === (gender === 'male' ? 8 : 0)) return false
  if (gender === 'male') return !p.key.endsWith('-female')
  // 암컷 모습이 따로 참전하지 않으면(화염레오 등) 수컷 모습으로 본다
  return !(p.key.endsWith('-male') && BY_KEY.has(p.key.replace(/-male$/, '-female')))
}

export function analyzeTeamPreview(img: ImageLike, memory: MemoryEntry[]): PreviewSlot[] {
  return findPanels(img).flatMap((panel): PreviewSlot[] => {
    const sprite = readSprite(img, panel)
    if (!sprite) return []
    const types = readTypes(img, panel)
    const gender = readGender(img, panel)

    // 타입·성별이 모두 맞는 포켓몬 → 타입만 맞는 포켓몬 → 타입이 하나라도 겹치는 포켓몬 → 전체 순으로 후보를 넓힌다
    const sameTypes = BASE_POKEMON.filter((p) => p.types.join() === types.join())
    const pool = [
      sameTypes.filter((p) => genderMatches(p, gender)),
      sameTypes,
      BASE_POKEMON.filter((p) => p.types.some((t) => types.includes(t))),
      BASE_POKEMON,
    ].find((list) => list.length > 0)!

    // 이로치 색은 10% 깎아서 비교한다 (상대가 이로치인 경우는 드물다)
    const score = (p: Pokemon) =>
      Math.max(colorSimilarity(sprite.feature, DATA[p.key].normal), colorSimilarity(sprite.feature, DATA[p.key].shiny) * 0.9)
    const ranked = pool
      .map((p) => ({ p, s: score(p) }))
      .sort((a, b) => b.s - a.s)
      .map(({ p }) => p)

    // 기억해 둔 그림은 타입을 잘못 읽어도 그대로 믿는다 (게임 그림끼리 비교라 정확하다)
    const nearest = memory
      .map((m) => ({ key: m.key, d: printDistance(m.print, sprite.print) }))
      .sort((a, b) => a.d - b.d)[0]
    const remembered = nearest && nearest.d < SAME_SPRITE ? BY_KEY.get(nearest.key)! : null

    return [
      {
        sprite: sprite.box,
        types,
        gender,
        candidates: (remembered ? [remembered, ...ranked.filter((p) => p !== remembered)] : ranked).slice(0, 12),
        remembered,
        print: sprite.print,
      },
    ]
  })
}
