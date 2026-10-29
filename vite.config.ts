import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 주소가 https://yul456.github.io/MySample/ 이라 하위 경로를 지정
  base: '/MySample/',
})
