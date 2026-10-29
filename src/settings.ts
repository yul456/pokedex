import { createContext, useContext } from 'react'

// 화면 전체에 적용되는 보기 설정 (브라우저에 저장, App 에서 SettingsContext 로 내려 준다)
export type Settings = {
  showImages: boolean // 끄면 포켓몬 사진 대신 도감 번호
}

export const DEFAULT_SETTINGS: Settings = { showImages: true }
export const SETTINGS_STORAGE = { key: 'champions-speed/settings', version: 1 }

export function parseSettings(data: unknown, version: number): Settings | null {
  if (version !== SETTINGS_STORAGE.version || typeof data !== 'object' || data === null) return null
  const stored = data as Record<string, unknown>
  return {
    showImages: typeof stored.showImages === 'boolean' ? stored.showImages : DEFAULT_SETTINGS.showImages,
  }
}

export const SettingsContext = createContext<Settings>(DEFAULT_SETTINGS)

export function useSettings() {
  return useContext(SettingsContext)
}
