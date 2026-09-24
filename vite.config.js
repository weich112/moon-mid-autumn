import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Vite 配置：仅启用 Vue 单文件组件与 @ 路径别名，保持轻量、无额外依赖
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 5173,
    open: false
  },
  build: {
    target: 'es2019',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 800
  }
})
