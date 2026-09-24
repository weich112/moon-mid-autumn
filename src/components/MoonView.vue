<script setup>
import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import moonTexture from '@/assets/svg/moon-texture.svg?raw'
import { useRandomBless } from '@/composables/useRandomBless'
import TextRain from '@/components/TextRain.vue'

const props = defineProps({
  /** 入场动画是否触发 */
  entered: { type: Boolean, default: false }
})

/** 长按触发的毫秒数 */
const LONG_PRESS_MS = 3000
/** 允许的手指/鼠标抖动阈值（px），超过则视为拖动而非长按 */
const MOVE_TOLERANCE = 12

const { pickRandom } = useRandomBless()

const hovered = ref(false)
const pressing = ref(false)
const pressProgress = ref(0)

/** 全屏文字雨开关：长按圆月三秒切换 */
const rainActive = ref(false)

const modalOpen = ref(false)
const displayText = ref('')
const dialogNote = ref('')
const dialogRef = ref(null)
const discRef = ref(null)

const rootRef = ref(null)

let pressRaf = null
let pressStart = 0
let pressTimer = null
let startPoint = null
let longFired = false
let parallaxRaf = null

const moonTextureHtml = moonTexture

/* ---------------- 鼠标交互：月光偏移 ---------------- */

function onFieldMove(event) {
  if (parallaxRaf) return
  const { clientX, clientY } = event
  parallaxRaf = requestAnimationFrame(() => {
    parallaxRaf = null
    const el = rootRef.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const my = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    el.style.setProperty('--mx', Math.max(-1, Math.min(1, mx)).toFixed(3))
    el.style.setProperty('--my', Math.max(-1, Math.min(1, my)).toFixed(3))
    hovered.value = true
  })
}

function onFieldLeave() {
  hovered.value = false
  const el = rootRef.value
  if (!el) return
  el.style.setProperty('--mx', '0')
  el.style.setProperty('--my', '0')
}

/* ---------------- 长按检测 ---------------- */

function clearPress() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  if (pressRaf) {
    cancelAnimationFrame(pressRaf)
    pressRaf = null
  }
  pressing.value = false
  pressProgress.value = 0
  startPoint = null
}

function tickProgress(now) {
  const p = Math.min((now - pressStart) / LONG_PRESS_MS, 1)
  pressProgress.value = p
  if (p >= 1) {
    pressRaf = null
    toggleRain()
    return
  }
  pressRaf = requestAnimationFrame(tickProgress)
}

function onPointerDown(event) {
  if (event.pointerType === 'mouse' && event.button !== 0) return
  longFired = false
  pressing.value = true
  startPoint = { x: event.clientX, y: event.clientY }
  pressStart = performance.now()
  // 捕获指针：手指轻微移出月盘也不会中断长按
  try {
    event.currentTarget.setPointerCapture(event.pointerId)
  } catch {
    /* 个别浏览器不支持指针捕获，忽略即可 */
  }
  pressRaf = requestAnimationFrame(tickProgress)
}

function onPointerMove(event) {
  if (!pressing.value || !startPoint) return
  const dx = event.clientX - startPoint.x
  const dy = event.clientY - startPoint.y
  if (Math.hypot(dx, dy) > MOVE_TOLERANCE) clearPress()
}

function onPointerUp() {
  const wasPressing = pressing.value
  const progress = pressProgress.value
  clearPress()
  // 未达到长按时长则视为轻触，弹出祝福
  if (wasPressing && !longFired && progress < 1) openBless()
  longFired = false
}

/* ---------------- 弹窗逻辑 ---------------- */

function openModal() {
  modalOpen.value = true
  nextTick(() => dialogRef.value?.focus())
}

function openBless() {
  displayText.value = pickRandom()
  dialogNote.value = '月盈则满，人聚则圆。'
  openModal()
}

/**
 * 长按圆月满三秒：开启 / 关闭全屏文字雨
 * 取代旧的「长按弹出彩蛋弹窗」逻辑
 */
function toggleRain() {
  longFired = true
  pressing.value = false
  pressProgress.value = 0
  rainActive.value = !rainActive.value
  // 轻微震动反馈（支持的设备）
  if (navigator.vibrate) navigator.vibrate(40)
}

function renewBless() {
  displayText.value = pickRandom()
  dialogNote.value = '月盈则满，人聚则圆。'
}

function closeBless() {
  modalOpen.value = false
  nextTick(() => discRef.value?.focus())
}

function onKeydown(event) {
  if (event.key === 'Escape') closeBless()
}

watch(modalOpen, (open) => {
  if (open) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  clearPress()
  window.removeEventListener('keydown', onKeydown)
  if (parallaxRaf) cancelAnimationFrame(parallaxRaf)
})

const ringStyle = computed(() => ({
  '--p': pressProgress.value,
  opacity: pressing.value ? 1 : 0
}))
</script>

<template>
  <div
    ref="rootRef"
    class="moon-view"
    :class="{ 'is-entered': entered, 'is-hover': hovered, 'is-pressing': pressing, 'is-rain-on': rainActive }"
  >
    <div
      class="moon-field"
      @pointermove="onFieldMove"
      @pointerleave="onFieldLeave"
      @contextmenu.prevent
    >
      <!-- 三层光晕：节奏不同，形成纵深呼吸 -->
      <span class="halo halo-1" aria-hidden="true" />
      <span class="halo halo-2" aria-hidden="true" />
      <span class="halo halo-3" aria-hidden="true" />

      <div class="moon-rail">
        <button
          ref="discRef"
          type="button"
          class="moon-disc"
          aria-label="轻触圆月，得一句中秋祝福；长按三秒，开启或关闭文字雨"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="clearPress"
          @keydown.enter.prevent="openBless"
          @keydown.space.prevent="openBless"
        >
          <span class="moon-texture" aria-hidden="true" v-html="moonTextureHtml" />
          <span class="moon-limb" aria-hidden="true" />
          <span class="moon-sheen" aria-hidden="true" />
        </button>

        <!-- 长按进度环 -->
        <span class="press-ring" :style="ringStyle" aria-hidden="true" />
      </div>
    </div>

    <p class="moon-hint">
      轻触圆月 · 拾一句祝福
      <span class="hint-divider">|</span>
      {{ rainActive ? '长按三秒 · 收拢文字雨' : '长按三秒 · 开启文字雨' }}
    </p>

    <!-- 祝福弹窗：传送至 body，避免受父级层叠影响 -->
    <Teleport to="body">
      <Transition name="bless-pop">
        <div v-if="modalOpen" class="bless-mask" @click.self="closeBless">
          <div
            ref="dialogRef"
            class="bless-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="中秋祝福"
            tabindex="-1"
            @click.stop
          >
            <span class="dialog-seal" aria-hidden="true">月</span>
            <p class="dialog-kicker">今宵 · 月寄一言</p>

            <Transition name="bless-swap" mode="out-in">
              <p :key="displayText" class="dialog-text">{{ displayText }}</p>
            </Transition>

            <span class="dialog-rule" aria-hidden="true" />
            <p class="dialog-note">{{ dialogNote }}</p>

            <div class="dialog-actions">
              <button type="button" class="btn-ghost" @click="renewBless">再换一句</button>
              <button type="button" class="btn-gold" @click="closeBless">收下</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 全屏祝福文字雨：长按圆月三秒开关，叠加在月亮与桂花花瓣之上 -->
    <TextRain :active="rainActive" />
  </div>
</template>

<style scoped>
.moon-view {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(0.8rem, 2.5vh, 1.6rem);
  opacity: 0;
}

.moon-view.is-entered {
  animation: moon-rise 1.9s var(--ease-out-soft) 0.25s forwards;
}

.moon-field {
  position: relative;
  display: grid;
  place-items: center;
  width: calc(var(--moon-size) * 2.5);
  height: calc(var(--moon-size) * 2.5);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  /* 触屏长按：禁止系统选中文本 / 弹出上下文菜单，保证长按手势纯净 */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* ---------- 光晕 ---------- */
.halo {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
}

.halo-1 {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, var(--glow-moon-outer) 0%, transparent 62%);
  filter: blur(28px);
  animation: halo-breathe 11s var(--ease-in-out-soft) infinite;
}

.halo-2 {
  width: 74%;
  height: 74%;
  background: radial-gradient(circle, var(--glow-moon-mid) 0%, transparent 60%);
  filter: blur(22px);
  animation: halo-breathe 8s var(--ease-in-out-soft) 0.6s infinite;
}

.halo-3 {
  width: 52%;
  height: 52%;
  background: radial-gradient(circle, var(--glow-moon-inner) 0%, transparent 58%);
  filter: blur(16px);
  animation: halo-drift 13s var(--ease-in-out-soft) infinite;
}

/* ---------- 月盘 ---------- */
.moon-rail {
  position: relative;
  display: grid;
  place-items: center;
  transform: translate3d(calc(var(--mx, 0) * 12px), calc(var(--my, 0) * 10px), 0);
  transition: transform 0.7s var(--ease-out-soft);
}

.moon-disc {
  position: relative;
  width: var(--moon-size);
  height: var(--moon-size);
  border-radius: 50%;
  overflow: hidden;
  background:
    radial-gradient(circle at 38% 33%, var(--moon-core) 0%, var(--moon-soft) 42%, var(--moon-edge) 70%, var(--moon-deep) 100%);
  box-shadow:
    inset -16px -12px 38px var(--moon-shade),
    inset 12px 10px 30px rgba(255, 250, 230, 0.5),
    0 0 46px rgba(244, 233, 201, 0.35),
    0 0 120px rgba(216, 185, 106, 0.18);
  animation: moon-breathe 8s var(--ease-in-out-soft) infinite;
  will-change: transform, filter;
  cursor: pointer;
  transition: box-shadow var(--dur-base) var(--ease-out-soft);
}

.moon-view.is-hover .moon-disc {
  box-shadow:
    inset -16px -12px 38px var(--moon-shade),
    inset 12px 10px 30px rgba(255, 250, 230, 0.6),
    0 0 66px rgba(244, 233, 201, 0.55),
    0 0 190px rgba(216, 185, 106, 0.32);
}

.moon-view.is-hover .halo-1 {
  transform: scale(1.12);
}

.moon-texture {
  position: absolute;
  inset: 0;
  display: block;
  opacity: 0.4;
  mix-blend-mode: multiply;
}

.moon-texture :deep(svg) {
  width: 100%;
  height: 100%;
}

/* 立体明暗：边缘阴影 + 迎光高光 */
.moon-limb {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 253, 244, 0.55) 0%, transparent 42%),
    radial-gradient(circle at 78% 82%, rgba(120, 92, 46, 0.32) 0%, transparent 55%);
  pointer-events: none;
}

.moon-sheen {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.32) 0%, transparent 46%);
  mix-blend-mode: screen;
  pointer-events: none;
}

/* 长按进度环：conic-gradient 随进度填充 */
.press-ring {
  position: absolute;
  width: calc(var(--moon-size) + 30px);
  height: calc(var(--moon-size) + 30px);
  border-radius: 50%;
  background: conic-gradient(var(--gold-300) calc(var(--p, 0) * 360deg), transparent 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px));
  transition: opacity var(--dur-fast) var(--ease-out-soft);
  pointer-events: none;
}

/* ---------- 提示文字 ---------- */
.moon-hint {
  font-size: var(--fs-small);
  letter-spacing: 0.22em;
  color: var(--ink-300);
  opacity: 0;
  animation: fade-up 1.2s var(--ease-out-soft) 2.4s forwards;
  text-align: center;
}

.hint-divider {
  display: inline-block;
  margin: 0 0.6em;
  color: var(--gold-400);
  opacity: 0.7;
}

/* 文字雨开启时，提示文字转为鎏金，作为状态反馈 */
.moon-view.is-rain-on .moon-hint {
  color: var(--gold-200);
}

/* ---------- 弹窗 ---------- */
.bless-mask {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: grid;
  place-items: center;
  padding: 6vw;
  background: rgba(4, 7, 16, 0.62);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
}

.bless-dialog {
  position: relative;
  width: min(520px, 90vw);
  padding: clamp(2.2rem, 6vw, 3.4rem) clamp(1.6rem, 5vw, 3rem);
  text-align: center;
  border-radius: var(--radius-lg);
  background: var(--glass-bg-strong);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  outline: none;
}

.bless-dialog::before {
  content: '';
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(216, 185, 106, 0.18);
  border-radius: calc(var(--radius-lg) - 10px);
  pointer-events: none;
}

.dialog-seal {
  display: inline-grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: 1rem;
  font-size: 1.35rem;
  color: var(--ink-inverse);
  border-radius: 12px;
  background: linear-gradient(145deg, var(--gold-100), var(--gold-300));
  box-shadow: 0 8px 24px -10px rgba(216, 185, 106, 0.9);
  animation: seal-breathe 4.5s var(--ease-in-out-soft) infinite;
}

.dialog-kicker {
  font-size: var(--fs-small);
  letter-spacing: var(--tracking-wide);
  color: var(--gold-200);
  opacity: 0.85;
}

.dialog-text {
  margin: 1.4rem 0;
  font-size: clamp(1.15rem, 3.4vw, 1.6rem);
  line-height: 2.1;
  letter-spacing: 0.08em;
  color: var(--ink-100);
  white-space: pre-line;
  text-shadow: 0 2px 24px rgba(244, 233, 201, 0.25);
}

.dialog-rule {
  display: block;
  width: 64px;
  height: 1px;
  margin: 0 auto 1rem;
  background: linear-gradient(90deg, transparent, var(--gold-300), transparent);
}

.dialog-note {
  font-size: var(--fs-small);
  letter-spacing: 0.18em;
  color: var(--ink-300);
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.btn-ghost,
.btn-gold {
  padding: 0.6rem 1.6rem;
  border-radius: var(--radius-pill);
  font-size: var(--fs-body);
  letter-spacing: 0.14em;
  transition: transform var(--dur-fast) var(--ease-out-soft), background var(--dur-fast),
    box-shadow var(--dur-fast);
}

.btn-ghost {
  color: var(--ink-200);
  border: 1px solid rgba(216, 185, 106, 0.3);
}

.btn-ghost:hover {
  background: rgba(216, 185, 106, 0.12);
  transform: translateY(-2px);
}

.btn-gold {
  color: var(--ink-inverse);
  background: linear-gradient(145deg, var(--gold-100), var(--gold-300));
  box-shadow: 0 12px 30px -14px rgba(216, 185, 106, 0.95);
}

.btn-gold:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 38px -14px rgba(216, 185, 106, 1);
}

/* 弹窗进出场 */
.bless-pop-enter-active,
.bless-pop-leave-active {
  transition: opacity 0.45s var(--ease-out-soft);
}

.bless-pop-enter-from,
.bless-pop-leave-to {
  opacity: 0;
}

.bless-pop-enter-active .bless-dialog,
.bless-pop-leave-active .bless-dialog {
  transition: transform 0.55s var(--ease-spring), opacity 0.45s var(--ease-out-soft);
}

.bless-pop-enter-from .bless-dialog,
.bless-pop-leave-to .bless-dialog {
  transform: translate3d(0, 28px, 0) scale(0.94);
  opacity: 0;
}

/* 文案切换 */
.bless-swap-enter-active,
.bless-swap-leave-active {
  transition: opacity 0.32s var(--ease-out-soft), transform 0.32s var(--ease-out-soft);
}

.bless-swap-enter-from {
  opacity: 0;
  transform: translate3d(0, 12px, 0);
}

.bless-swap-leave-to {
  opacity: 0;
  transform: translate3d(0, -12px, 0);
}

@media (max-width: 640px) {
  .moon-field {
    width: calc(var(--moon-size) * 2.1);
    height: calc(var(--moon-size) * 2.1);
  }

  .moon-hint {
    line-height: 2.2;
  }

  .hint-divider {
    display: block;
    margin: 0.2em 0;
    opacity: 0;
  }
}
</style>
