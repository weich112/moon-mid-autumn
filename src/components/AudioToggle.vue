<script setup>
const props = defineProps({
  /** 是否正在发声 */
  playing: { type: Boolean, default: false },
  /** 是否被浏览器自动播放策略拦截 */
  blocked: { type: Boolean, default: false },
  /** 音源模式：'file' | 'synth' | 'idle' */
  mode: { type: String, default: 'idle' }
})

const emit = defineEmits(['toggle'])

function onClick() {
  emit('toggle')
}
</script>

<template>
  <div class="audio-toggle">
    <Transition name="hint-fade">
      <span v-if="blocked && !playing" class="audio-hint">轻触开启古风月色</span>
    </Transition>

    <button
      type="button"
      class="audio-btn"
      :class="{ 'is-playing': playing, 'is-blocked': blocked && !playing }"
      :aria-pressed="playing"
      :aria-label="playing ? '关闭背景音乐' : '开启背景音乐'"
      :title="playing ? '关闭背景音乐' : '开启背景音乐'"
      @click="onClick"
    >
      <span class="audio-ring" aria-hidden="true" />

      <!-- 播放中：跃动的音条；暂停：音符加斜杠 -->
      <svg v-if="playing" class="audio-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect class="bar bar-1" x="4" y="9" width="3" height="6" rx="1.5" />
        <rect class="bar bar-2" x="10.5" y="5" width="3" height="14" rx="1.5" />
        <rect class="bar bar-3" x="17" y="8" width="3" height="8" rx="1.5" />
      </svg>
      <svg v-else class="audio-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M9 18V6.9a1 1 0 0 1 .77-.97l7-1.75A1 1 0 0 1 18 5.15V16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="6.8" cy="18" r="2.6" fill="currentColor" />
        <circle cx="15.8" cy="16" r="2.6" fill="currentColor" />
        <path d="M3.5 3.5l17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.audio-toggle {
  position: fixed;
  right: clamp(16px, 3vw, 34px);
  bottom: clamp(16px, 3vw, 34px);
  z-index: var(--z-ui);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.audio-hint {
  padding: 0.4rem 0.9rem;
  font-size: var(--fs-small);
  letter-spacing: 0.12em;
  color: var(--ink-200);
  white-space: nowrap;
  border-radius: var(--radius-pill);
  background: rgba(12, 18, 38, 0.7);
  border: 1px solid rgba(216, 185, 106, 0.24);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  animation: hint-breathe 2.6s var(--ease-in-out-soft) infinite;
}

@keyframes hint-breathe {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.audio-btn {
  position: relative;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  color: var(--ink-100);
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  transition: transform var(--dur-fast) var(--ease-out-soft), color var(--dur-fast),
    box-shadow var(--dur-fast), border-color var(--dur-fast);
  -webkit-tap-highlight-color: transparent;
}

.audio-btn:hover {
  transform: translateY(-2px) scale(1.04);
  color: var(--gold-200);
  border-color: rgba(216, 185, 106, 0.5);
  box-shadow: 0 16px 40px -18px rgba(216, 185, 106, 0.9), inset 0 1px 0 var(--glass-highlight);
}

.audio-btn:active {
  transform: scale(0.96);
}

.audio-btn.is-playing {
  color: var(--gold-200);
  border-color: rgba(216, 185, 106, 0.55);
}

/* 播放时的外扩光环 */
.audio-ring {
  position: absolute;
  inset: -1px;
  border-radius: 50%;
  border: 1px solid rgba(216, 185, 106, 0.6);
  opacity: 0;
  pointer-events: none;
}

.audio-btn.is-playing .audio-ring {
  animation: audio-ring 2.4s var(--ease-out-soft) infinite;
}

@keyframes audio-ring {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

.audio-icon {
  width: 24px;
  height: 24px;
  overflow: visible;
}

.bar {
  fill: currentColor;
  transform-box: fill-box;
  transform-origin: center;
}

.audio-btn.is-playing .bar-1 {
  animation: bar-bounce 0.9s var(--ease-in-out-soft) infinite;
}
.audio-btn.is-playing .bar-2 {
  animation: bar-bounce 0.9s var(--ease-in-out-soft) 0.18s infinite;
}
.audio-btn.is-playing .bar-3 {
  animation: bar-bounce 0.9s var(--ease-in-out-soft) 0.36s infinite;
}

@keyframes bar-bounce {
  0%,
  100% {
    transform: scaleY(0.55);
  }
  50% {
    transform: scaleY(1.35);
  }
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: opacity 0.4s var(--ease-out-soft), transform 0.4s var(--ease-out-soft);
}

.hint-fade-enter-from,
.hint-fade-leave-to {
  opacity: 0;
  transform: translate3d(8px, 0, 0);
}

@media (max-width: 480px) {
  .audio-hint {
    display: none;
  }

  .audio-btn {
    width: 46px;
    height: 46px;
  }
}
</style>
