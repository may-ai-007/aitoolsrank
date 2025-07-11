import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

// 复制JSON数据文件到构建目录的插件
const copyJsonDataPlugin = () => {
  return {
    name: 'copy-json-data',
    buildEnd: async () => {
      // 确保dist/assets/data目录存在
      const dataDir = resolve(__dirname, 'dist/assets/data')
      fs.mkdirSync(dataDir, { recursive: true })
      
      // 复制数据文件
      const srcDataDir = resolve(__dirname, 'src/data')
      
      // 遍历语言目录
      for (const lang of ['en', 'zh']) {
        const srcLangDir = path.join(srcDataDir, lang)
        const destLangDir = path.join(dataDir, lang)
        
        // 确保目标语言目录存在
        fs.mkdirSync(destLangDir, { recursive: true })
        
        // 如果源语言目录存在
        if (fs.existsSync(srcLangDir)) {
          // 读取目录中的所有文件
          const files = fs.readdirSync(srcLangDir)
          
          // 复制所有JSON文件
          for (const file of files) {
            if (file.endsWith('.json')) {
              const srcFile = path.join(srcLangDir, file)
              const destFile = path.join(destLangDir, file)
              fs.copyFileSync(srcFile, destFile)
              console.log(`数据文件已复制: ${srcFile} -> ${destFile}`)
            }
          }
        }
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    copyJsonDataPlugin(),
  ],
  base: './', // 使用相对路径，适应任何部署环境
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 确保构建失败时输出详细信息
    reportCompressedSize: true,
    minify: 'terser',
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
      output: {
        // 确保资源路径使用相对路径
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name]-[hash][extname]'
          
          if (/\.(png|jpe?g|gif|svg|webp)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
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
