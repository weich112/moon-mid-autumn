import { createApp } from 'vue'
import App from './App.vue'

// 全局样式：变量 -> 基础重置 -> 关键帧，顺序不可颠倒
import './assets/styles/variables.css'
import './assets/styles/base.css'
import './assets/styles/animations.css'

createApp(App).mount('#app')
