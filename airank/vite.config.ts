import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，确保在任何部署环境下都能正常工作
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
