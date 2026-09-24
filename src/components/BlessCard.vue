<script setup>
import { ref, watch } from 'vue'
import { useRandomBless } from '@/composables/useRandomBless'

const props = defineProps({
  /** 用户自定义祝福（来自 localStorage），存在时优先展示 */
  customText: { type: String, default: '' }
})

const { current, pickRandom } = useRandomBless()

const text = ref(current.value)
const isCustom = ref(false)
const pulse = ref(false)

// 用户写入新祝福时，立即展示并高亮
watch(
  () => props.customText,
  (value) => {
    if (!value) return
    text.value = value
    isCustom.value = true
    pulse.value = false
    // 触发一次高亮动画
    requestAnimationFrame(() => {
      pulse.value = true
    })
  },
  { immediate: true }
)

/** 点击卡片：切换随机内置祝福 */
function onActivate() {
  text.value = pickRandom()
  isCustom.value = false
}

function onKeydown(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onActivate()
  }
}
</script>

<template>
  <article class="bless-card" :class="{ 'is-pulse': pulse }">
    <span class="card-corner card-corner--tl" aria-hidden="true" />
    <span class="card-corner card-corner--tr" aria-hidden="true" />
    <span class="card-corner card-corner--bl" aria-hidden="true" />
    <span class="card-corner card-corner--br" aria-hidden="true" />

    <div class="card-head">
      <span class="card-label">{{ isCustom ? '你的祝福' : '今宵寄语' }}</span>
      <span class="card-badge">{{ isCustom ? '已珍藏' : '月寄' }}</span>
    </div>

    <div
      class="card-body"
      role="button"
      tabindex="0"
      aria-label="点击更换一句中秋祝福"
      @click="onActivate"
      @keydown="onKeydown"
    >
      <Transition name="card-swap" mode="out-in">
        <p :key="text" class="card-text">{{ text }}</p>
      </Transition>
    </div>

    <p class="card-foot">
      <span class="dot" aria-hidden="true" />
      轻触卡片 · 再换一句祝福
    </p>
  </article>
</template>

<style scoped>
.bless-card {
  position: relative;
  padding: clamp(1.8rem, 5vw, 3rem) clamp(1.6rem, 5vw, 3rem);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  overflow: hidden;
  opacity: 0;
  animation: fade-up 1.1s var(--ease-out-soft) 2.7s forwards;
}

/* 卡面内侧细金边 */
.bless-card::after {
  content: '';
  position: absolute;
  inset: 9px;
  border: 1px solid rgba(216, 185, 106, 0.14);
  border-radius: calc(var(--radius-lg) - 9px);
  pointer-events: none;
}

/* 四角回纹装饰 */
.card-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 1px solid rgba(216, 185, 106, 0.5);
  pointer-events: none;
}

.card-corner--tl {
  top: 18px;
  left: 18px;
  border-right: none;
  border-bottom: none;
}
.card-corner--tr {
  top: 18px;
  right: 18px;
  border-left: none;
  border-bottom: none;
}
.card-corner--bl {
  bottom: 18px;
  left: 18px;
  border-right: none;
  border-top: none;
}
.card-corner--br {
  bottom: 18px;
  right: 18px;
  border-left: none;
  border-top: none;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.6rem;
}

.card-label {
  font-size: var(--fs-small);
  letter-spacing: var(--tracking-wide);
  color: var(--gold-200);
}

.card-badge {
  padding: 0.15rem 0.7rem;
  font-size: var(--fs-small);
  letter-spacing: 0.16em;
  color: var(--ink-200);
  border: 1px solid rgba(216, 185, 106, 0.32);
  border-radius: var(--radius-pill);
  background: rgba(216, 185, 106, 0.08);
}

.card-body {
  min-height: 5.5em;
  display: grid;
  place-items: center;
  cursor: pointer;
  user-select: none;
  border-radius: var(--radius-md);
  transition: background var(--dur-base) var(--ease-out-soft);
}

.card-body:hover {
  background: rgba(255, 250, 230, 0.04);
}

.card-text {
  font-size: clamp(1.15rem, 3.2vw, 1.5rem);
  line-height: 2.1;
  letter-spacing: 0.08em;
  text-align: center;
  color: var(--ink-100);
  white-space: pre-line;
  text-shadow: 0 2px 26px rgba(244, 233, 201, 0.22);
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 1.8rem;
  font-size: var(--fs-small);
  letter-spacing: 0.16em;
  color: var(--ink-400);
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold-300);
  box-shadow: 0 0 10px 1px var(--gold-glow);
}

/* 自定义祝福写入时的高亮 */
.bless-card.is-pulse {
  animation: card-pulse 1.6s var(--ease-out-soft);
}

@keyframes card-pulse {
  0% {
    box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  }
  35% {
    box-shadow: 0 0 0 2px rgba(216, 185, 106, 0.55), 0 0 50px -6px rgba(216, 185, 106, 0.6),
      var(--glass-shadow);
  }
  100% {
    box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  }
}

/* 文案切换 */
.card-swap-enter-active,
.card-swap-leave-active {
  transition: opacity 0.34s var(--ease-out-soft), transform 0.34s var(--ease-out-soft),
    filter 0.34s var(--ease-out-soft);
}

.card-swap-enter-from {
  opacity: 0;
  transform: translate3d(0, 14px, 0);
  filter: blur(6px);
}

.card-swap-leave-to {
  opacity: 0;
  transform: translate3d(0, -14px, 0);
  filter: blur(6px);
}
</style>
