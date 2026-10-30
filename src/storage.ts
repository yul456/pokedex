import { useEffect, useState } from 'react'

// 브라우저 localStorage 에 { version, data } 형태로 저장한다
// 저장 형식을 바꿀 때는 version 을 올리고, parse 에서 옛 version 을 새 형식으로 바꿔 준다.
// 사생활 보호 모드처럼 저장소를 못 쓰는 환경에서도 화면은 동작하도록 오류는 무시한다.

export function readStored<T>(key: string, parse: (data: unknown, version: number) => T | null): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const stored = JSON.parse(raw) as { version?: unknown; data?: unknown }
    return parse(stored.data, typeof stored.version === 'number' ? stored.version : 0)
  } catch {
    // 저장된 값이 깨졌거나 저장소를 못 쓰면 없는 것으로 본다
    return null
  }
}

export function writeStored(key: string, version: number, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify({ version, data }))
  } catch {
    // 저장에 실패해도 화면은 그대로 동작
  }
}

// 위 형식으로 저장하는 useState
export function useStoredState<T>(
  key: string,
  version: number,
  parse: (data: unknown, version: number) => T | null,
  initial: T,
) {
  const [value, setValue] = useState<T>(() => readStored(key, parse) ?? initial)

  useEffect(() => {
    writeStored(key, version, value)
  }, [key, version, value])

  return [value, setValue] as const
}
