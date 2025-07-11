import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // 使用相对路径，适应任何部署环境
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      // 排除所有src/data目录下的.json文件，确保它们不会被编译进去
      external: (id) => {
        // 排除src/data目录下的.json文件，但允许其他.json文件
        if (id.includes('/src/data/') && id.endsWith('.json')) {
          return true
        }
        return false
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
})
