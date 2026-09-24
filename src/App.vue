<script setup>
import { ref, onMounted } from 'vue'
import IndexView from '@/views/IndexView.vue'
import PetalParticle from '@/components/PetalParticle.vue'
import AudioToggle from '@/components/AudioToggle.vue'
import { useAudioBg } from '@/composables/useAudioBg'

const { playing, blocked, mode, init, toggle } = useAudioBg()

/** 夜空是否已就绪（控制整体渐显） */
const skyReady = ref(false)

/** 随机星点：位置、大小、闪烁节奏各不相同 */
const stars = Array.from({ length: 64 }, (_, i) => {
  const bright = Math.random()
  return {
    id: i,
    left: `${(Math.random() * 100).toFixed(2)}%`,
    top: `${(Math.random() * 72).toFixed(2)}%`,
    size: bright > 0.86 ? '2.4px' : '1.4px',
    delay: `${(Math.random() * 7).toFixed(2)}s`,
    duration: `${(2.6 + Math.random() * 4).toFixed(2)}s`,
    opacity: (0.25 + bright * 0.6).toFixed(2)
  }
})

onMounted(() => {
  requestAnimationFrame(() => {
    skyReady.value = true
  })
  // 初始化背景音乐（探测音源 + 恢复上次开关状态）
  init()
})
</script>

<template>
  <div class="app" :class="{ 'is-sky-ready': skyReady }">
    <!-- 夜空底层：渐显 -->
    <div class="sky" aria-hidden="true">
      <div class="sky-stars">
        <span
          v-for="star in stars"
          :key="star.id"
          class="star"
          :style="{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
            opacity: star.opacity
          }"
        />
      </div>

      <div class="sky-glow" />

      <!-- 远山剪影，压住画面底部，增加纵深 -->
      <svg class="sky-hills" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path
          d="M0 236 L120 206 L240 232 L360 180 L500 226 L640 168 L780 220 L920 176 L1080 224 L1220 190 L1360 228 L1440 208 L1440 320 L0 320 Z"
          fill="rgba(13, 21, 48, 0.72)"
        />
        <path
          d="M0 274 L140 250 L300 282 L460 236 L620 280 L800 240 L960 284 L1140 246 L1300 284 L1440 258 L1440 320 L0 320 Z"
          fill="rgba(7, 11, 26, 0.9)"
        />
      </svg>

      <div class="sky-vignette" />
    </div>

    <IndexView />

    <PetalParticle />

    <AudioToggle
      :playing="playing"
      :blocked="blocked"
      :mode="mode"
      @toggle="toggle"
    />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

/* ---------- 夜空 ---------- */
.sky {
  position: fixed;
  inset: 0;
  z-index: var(--z-sky);
  pointer-events: none;
  opacity: 0;
  transition: opacity 2s var(--ease-out-soft);
  background:
    radial-gradient(120% 80% at 50% 6%, rgba(36, 55, 111, 0.5) 0%, transparent 60%),
    radial-gradient(90% 70% at 84% 82%, rgba(26, 42, 92, 0.45) 0%, transparent 66%),
    linear-gradient(180deg, #05080f 0%, #070b1a 30%, #0a1024 62%, #05080f 100%);
}

.app.is-sky-ready .sky {
  opacity: 1;
}

.sky-stars {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 6px 1px rgba(220, 232, 255, 0.6);
  animation-name: twinkle;
  animation-timing-function: var(--ease-in-out-soft);
  animation-iteration-count: infinite;
  will-change: opacity, transform;
}

/* 月位处的柔光 */
.sky-glow {
  position: absolute;
  left: 50%;
  top: 32%;
  width: min(70vw, 760px);
  height: min(70vw, 760px);
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(244, 233, 201, 0.09) 0%, transparent 58%);
  filter: blur(22px);
}

.sky-hills {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: clamp(140px, 26vh, 260px);
}

/* 四角压暗，聚焦中心 */
.sky-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(130% 100% at 50% 40%, transparent 45%, rgba(3, 5, 12, 0.72) 100%);
}
</style>
