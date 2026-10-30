// HOME 그림(PNG)을 읽는 최소 디코더. 8비트·인터레이스 없는 PNG 만 지원하고, 결과는 브라우저 getImageData 와 같은 RGBA 배열
import { inflateSync } from 'node:zlib'

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('PNG 파일이 아님')
  let pos = 8
  let width, height, bitDepth, colorType, interlace, palette, transparency
  const idat = []
  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + length)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      interlace = data[12]
    } else if (type === 'PLTE') palette = data
    else if (type === 'tRNS') transparency = data
    else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    pos += 12 + length
  }
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  if (bitDepth !== 8 || interlace !== 0 || !channels) {
    throw new Error(`지원하지 않는 PNG (비트 ${bitDepth}, 색 형식 ${colorType}, 인터레이스 ${interlace})`)
  }

  // 줄마다 붙은 필터(0~4)를 풀어 원래 바이트로 되돌린다
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const bytes = Buffer.alloc(height * stride)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const cur = bytes.subarray(y * stride, (y + 1) * stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0
      const b = prev[x]
      const c = x >= channels ? prev[x - channels] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      cur[x] = v & 255
    }
    prev = cur
  }

  const data = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    let r, g, b
    let alpha = 255
    if (colorType === 6) [r, g, b, alpha] = bytes.subarray(i * 4, i * 4 + 4)
    else if (colorType === 2) [r, g, b] = bytes.subarray(i * 3, i * 3 + 3)
    else if (colorType === 3) {
      const k = bytes[i]
      ;[r, g, b] = palette.subarray(k * 3, k * 3 + 3)
      alpha = transparency && k < transparency.length ? transparency[k] : 255
    } else if (colorType === 0) r = g = b = bytes[i]
    else {
      r = g = b = bytes[i * 2]
      alpha = bytes[i * 2 + 1]
    }
    data.set([r, g, b, alpha], i * 4)
  }
  return { width, height, data }
}
