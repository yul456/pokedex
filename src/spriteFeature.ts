// 포켓몬 그림의 색 특징. 스크린샷 속 그림과 HOME 3D 그림(scripts/build-data.mjs)을 같은 방식으로 계산해서 비교한다
// 게임 그림은 HOME 그림과 자세가 달라서 모양 대신 "어떤 색이 얼마나 있는지"만 본다
// 이 파일은 Node 가 build-data.mjs·merge-memory.mjs 에서 바로 불러 쓰므로 다른 파일을 import 하지 않는다

// 색상 12칸 × 채도 2칸 + 무채색 밝기 3칸 = 27칸. 값의 합이 255 가 되도록 맞춘다
export const FEATURE_SIZE = 27

export function hsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max ? d / max : 0, max / 255]
}

// 팀 미리보기 칸의 붉은색(칸 바탕, 테두리, 배경 레이저 줄). 그림 색을 셀 때는 스크린샷·HOME 그림 양쪽에서 똑같이 뺀다
export function isCrimson(r: number, g: number, b: number) {
  const [h, s, v] = hsv(r, g, b)
  return (h >= 320 || h < 12) && s > 0.45 && v > 0.3
}

export function colorFeature(pixels: Iterable<ArrayLike<number>>) {
  const hist = new Array<number>(FEATURE_SIZE).fill(0)
  let total = 0
  for (const p of pixels) {
    const [r, g, b] = [p[0], p[1], p[2]]
    if (isCrimson(r, g, b)) continue
    const [h, s, v] = hsv(r, g, b)
    if (s >= 0.25 && v >= 0.25) hist[Math.floor(h / 30) * 2 + (s < 0.6 ? 0 : 1)]++
    else hist[24 + (v < 0.35 ? 0 : v < 0.7 ? 1 : 2)]++
    total++
  }
  return hist.map((n) => (total ? (n / total) * 255 : 0))
}

// 두 색 특징이 겹치는 정도 (0 ~ 1)
export function colorSimilarity(a: ArrayLike<number>, b: ArrayLike<number>) {
  let sum = 0
  for (let i = 0; i < FEATURE_SIZE; i++) sum += Math.min(a[i], b[i])
  return sum / 255
}

// 그림 지문: 그림 사각형을 12×12 칸으로 나눠 칸마다 평균 RGB 와 그림이 차지하는 비율(× 255)을 담는다
// 게임 그림끼리 비교할 때 쓴다 (한 번 고른 그림 기억하기, spriteMemory.ts)
export const PRINT_GRID = 12
export const PRINT_SIZE = PRINT_GRID * PRINT_GRID * 4

// 지문 차이(칸마다 0~255 차이의 평균)가 이보다 작으면 같은 그림으로 본다
export const SAME_SPRITE = 20

export function printDistance(a: ArrayLike<number>, b: ArrayLike<number>) {
  let sum = 0
  for (let i = 0; i < PRINT_SIZE; i++) sum += Math.abs(a[i] - b[i])
  return sum / PRINT_SIZE
}
