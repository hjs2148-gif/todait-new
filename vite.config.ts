import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// 빌드마다 번호를 붙이고 version.json으로도 내보낸다. 열려 있던 앱이 새 버전을 알아채고 새로 고침을 권한다 (src/Update.tsx)
const BUILD = String(Date.now())
const version: Plugin = {
  name: 'todait-version',
  apply: 'build',
  generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD }) }) },
}

export default defineConfig({ base: './', plugins: [react(), version], define: { __BUILD__: JSON.stringify(BUILD) }, server: { port: 5173 } })
