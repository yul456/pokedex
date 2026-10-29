import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages 주소가 https://yul456.github.io/<저장소 이름>/ 이라 그 하위 경로를 base 로 쓴다.
// 저장소 이름은 GitHub Actions 가 GITHUB_REPOSITORY(예: yul456/pokedex)로 알려 주므로 이름을 바꿔도 고칠 필요가 없다.
// <사용자>.github.io 저장소(루트 주소)와 로컬 개발은 '/'
function pagesBase() {
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  return repo && !repo.endsWith('.github.io') ? `/${repo}/` : '/'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: pagesBase(),
})
