import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/aitoolsrank/', // 添加基本路径，适应 GitHub Pages 部署
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // 禁用小文件内联，确保JSON等资源文件作为独立文件处理
  },
  assetsInclude: ['**/*.json'], // 将JSON文件视为资源文件
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
