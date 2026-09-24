<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  /** 强制指定粒子数量；不传则按设备性能自动计算 */
  count: { type: Number, default: 0 }
})

const canvasRef = ref(null)

let ctx = null
let particles = []
let rafId = null
let lastTime = 0
let width = 0
let height = 0
let dpr = 1
let running = false
let resizeTimer = null

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 按设备能力决定粒子数量：
 * - 尊重「减弱动态效果」偏好
 * - 移动端 / 触摸设备大幅降低数量
 * - 低核心数设备适度降低
 */
function computeCount() {
  if (props.count > 0) return props.count
  if (reduceMotion) return 8

  const w = window.innerWidth
  const cores = navigator.hardwareConcurrency || 4
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches

  if (coarse || w < 768) return w < 420 ? 14 : 22
  if (cores <= 4) return 30
  return 48
}

/** 生成单个桂花花瓣 */
function createParticle(fromTop = false) {
  const size = 4 + Math.random() * 7
  return {
    baseX: Math.random() * width,
    x: 0,
    y: fromTop ? -20 - Math.random() * height * 0.4 : Math.random() * height,
    size,
    vy: 12 + Math.random() * 26, // 下落速度 px/s
    wind: -14 + Math.random() * 22, // 水平风 px/s
    sway: 8 + Math.random() * 22, // 摆动幅度
    swayFreq: 0.4 + Math.random() * 0.9, // 摆动频率
    phase: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI * 2,
    vr: -0.7 + Math.random() * 1.4, // 自转速度 rad/s
    alpha: 0.45 + Math.random() * 0.5,
    hue: 40 + Math.random() * 12
  }
}

function buildParticles() {
  const total = computeCount()
  particles = Array.from({ length: total }, () => createParticle(false))
}

/** 自适应画布尺寸（DPR 上限 2，防止高分屏过度绘制） */
function resize() {
  const canvas = canvasRef.value
  if (!canvas) return
  width = window.innerWidth
  height = window.innerHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

/** 绘制一朵四瓣桂花 */
function drawFlower(p) {
  const s = p.size
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.globalAlpha = p.alpha

  ctx.fillStyle = `hsl(${p.hue} 62% 64%)`
  for (let i = 0; i < 4; i += 1) {
    ctx.rotate(Math.PI / 2)
    ctx.beginPath()
    ctx.ellipse(0, -s * 0.5, s * 0.42, s * 0.62, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = `hsl(${p.hue - 8} 72% 48%)`
  ctx.beginPath()
  ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

/** 主循环：dt 归一化，保证不同刷新率速度一致 */
function frame(time) {
  if (!running) return
  const dt = Math.min((time - lastTime) / 1000, 0.05)
  lastTime = time

  ctx.clearRect(0, 0, width, height)

  for (const p of particles) {
    p.phase += p.swayFreq * dt
    p.y += p.vy * dt
    p.baseX += p.wind * dt
    p.rot += p.vr * dt
    p.x = p.baseX + Math.sin(p.phase) * p.sway

    // 越界回收：从顶部重新开始
    if (p.y > height + 30 || p.baseX < -60 || p.baseX > width + 60) {
      Object.assign(p, createParticle(true))
      p.x = p.baseX
    }

    drawFlower(p)
  }

  rafId = requestAnimationFrame(frame)
}

function start() {
  if (running || !ctx) return
  running = true
  lastTime = performance.now()
  rafId = requestAnimationFrame(frame)
}

function stop() {
  running = false
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function onVisibilityChange() {
  if (document.hidden) stop()
  else start()
}

function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    resize()
    buildParticles()
  }, 200)
}

onMounted(() => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  resize()
  buildParticles()
  start()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  stop()
  if (resizeTimer) clearTimeout(resizeTimer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('resize', onResize)
  particles = []
})
</script>

<template>
  <canvas ref="canvasRef" class="petal-canvas" aria-hidden="true" />
</template>

<style scoped>
.petal-canvas {
  position: fixed;
  inset: 0;
  z-index: var(--z-petal);
  pointer-events: none;
  opacity: 0.9;
}
</style>
