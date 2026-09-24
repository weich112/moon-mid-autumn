<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import cloudA from '@/assets/svg/cloud-a.svg?raw'
import cloudB from '@/assets/svg/cloud-b.svg?raw'

const props = defineProps({
  /** 视差强度倍数，1 为默认 */
  depth: { type: Number, default: 1 },
  /** 是否开启鼠标视差 */
  interactive: { type: Boolean, default: true }
})

/**
 * 四层云雾：由远及近，速度、透明度、视差倍率均不同，营造空间纵深。
 * depth 越大，跟随鼠标偏移越明显，视觉上越靠近观察者。
 */
const layers = [
  { id: 'far', svg: cloudA, top: '4%', scale: 1.5, opacity: 0.34, dur: 150, dir: 'normal', drift: 5 },
  { id: 'mid', svg: cloudB, top: '22%', scale: 1.12, opacity: 0.48, dur: 108, dir: 'reverse', drift: 12 },
  { id: 'near', svg: cloudA, top: '48%', scale: 0.86, opacity: 0.55, dur: 84, dir: 'normal', drift: 22 },
  { id: 'fore', svg: cloudB, top: '70%', scale: 0.66, opacity: 0.6, dur: 66, dir: 'reverse', drift: 34 }
]

const rootRef = ref(null)

let rafId = null
let pending = null
const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

function unitStyle(layer) {
  return {
    '--top': layer.top,
    '--scale': layer.scale,
    '--opacity': layer.opacity,
    '--dur': `${layer.dur}s`,
    '--dir': layer.dir,
    '--depth': (layer.drift * props.depth).toFixed(2)
  }
}

/** 写入归一化鼠标坐标，rAF 节流，避免高频 reflow */
function onPointerMove(event) {
  pending = event
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    const el = rootRef.value
    if (!el || !pending) return
    const x = (pending.clientX / window.innerWidth - 0.5) * 2
    const y = (pending.clientY / window.innerHeight - 0.5) * 2
    el.style.setProperty('--px', x.toFixed(3))
    el.style.setProperty('--py', y.toFixed(3))
  })
}

/** 鼠标移出窗口时缓缓回正 */
function onPointerOut(event) {
  if (event.relatedTarget) return
  const el = rootRef.value
  if (!el) return
  el.style.setProperty('--px', '0')
  el.style.setProperty('--py', '0')
}

onMounted(() => {
  if (!props.interactive || reduceMotion) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerout', onPointerOut, { passive: true })
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerout', onPointerOut)
})
</script>

<template>
  <div ref="rootRef" class="cloud-set" aria-hidden="true">
    <div
      v-for="layer in layers"
      :key="layer.id"
      class="cloud-unit"
      :class="`cloud-unit--${layer.id}`"
      :style="unitStyle(layer)"
    >
      <div class="cloud-parallax">
        <div class="cloud-drift">
          <span class="cloud-svg" v-html="layer.svg" />
          <span class="cloud-svg" v-html="layer.svg" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cloud-set {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: var(--z-cloud);
}

.cloud-unit {
  position: absolute;
  left: -30%;
  top: var(--top);
  width: 160%;
  opacity: var(--opacity);
  transform: scale(var(--scale));
  transform-origin: center center;
}

/* 视差层：滞后跟随，带缓动 */
.cloud-parallax {
  transform: translate3d(
    calc(var(--px, 0) * var(--depth) * 1px),
    calc(var(--py, 0) * var(--depth) * 0.6 * 1px),
    0
  );
  transition: transform 1.1s var(--ease-out-soft);
}

/* 漂移层：两张相同云图无缝循环 */
.cloud-drift {
  display: flex;
  width: 200%;
  animation: cloud-drift var(--dur) linear infinite;
  animation-direction: var(--dir, normal);
  will-change: transform;
}

.cloud-svg {
  flex: 0 0 50%;
  width: 50%;
}

.cloud-svg :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

/* 近处云更柔和地压暗，增强前后景层次 */
.cloud-unit--fore {
  filter: brightness(0.86);
}

.cloud-unit--far {
  filter: brightness(1.12);
}
</style>
