<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  /** 是否开启祝福文字雨 */
  active: { type: Boolean, default: false },
  /** 强制指定每条图层的文字数量；不传则按设备自动限制 */
  count: { type: Number, default: 0 }
})

/** 自定义祝福的本地存储键（与 CustomInput 保持一致，此处只读不改） */
const STORAGE_KEY = 'mid-autumn:user-bless'

/**
 * 短句现代祝福语库（非文言文），适合文字雨快速阅读
 */
const MODERN_BLESSINGS = [
  '中秋快乐',
  '阖家团圆',
  '月圆人团圆',
  '学业进步',
  '早日回家团圆',
  '身体健康',
  '心想事成',
  '平安喜乐',
  '万事胜意',
  '前程似锦',
  '步步高升',
  '好运连连',
  '笑口常开',
  '团团圆圆',
  '岁岁平安',
  '梦想成真',
  '幸福安康',
  '顺顺利利',
  '喜乐无忧',
  '得偿所愿',
  '一路生花',
  '未来可期',
  '万事顺遂',
  '事事如意',
  '愿你岁岁平安',
  '愿你诸事顺利',
  '花好月圆人长久',
  '月光所至皆是团圆',
  '愿所有美好如期而至',
  '愿你被世界温柔以待',
  '愿你眼里有光心中有暖',
  '愿爱与温暖常伴你左右',
  '愿你所念皆如愿',
  '愿你和家人共享天伦',
  '团圆美满阖家欢乐',
  '幸福安康喜乐无忧',
  '月圆饼圆人团圆',
  '祝你和家人幸福快乐',
  '愿你余生皆欢喜',
  '岁岁欢愉年年胜意',
  '平安喜乐顺遂无忧',
  '愿此月光照亮你的归途',
  '愿你每天都被温柔以待',
  '中秋佳节幸福美满',
  '身体健康万事如意',
  '愿时光温柔岁月无忧',
  '好运常伴左右',
  '前路皆坦途'
]

/**
 * 三层景深图层：Z 轴越靠前，字号越大、越清晰、下落越快（运动视差），
 * 配合舞台 perspective 形成真实 3D 纵深感。
 */
const LAYERS = [
  { id: 'back', z: -340, opacity: 0.42, blur: 2.2, durMul: 1.42, sizeMul: 0.82 },
  { id: 'mid', z: -110, opacity: 0.74, blur: 0.7, durMul: 1.05, sizeMul: 1.0 },
  { id: 'front', z: 150, opacity: 0.97, blur: 0, durMul: 0.8, sizeMul: 1.18 }
]

/** 变暗时长（屏幕慢慢变黑），与 CSS transition 保持一致 */
const DIM_MS = 2200
/** 关闭时文字淡出后的清空延时 */
const CLEAR_MS = 520

/** 文案池：内置短句祝福 + 用户自定义（去重），每次开启时重新读取以纳入最新祝福 */
let pool = [...MODERN_BLESSINGS]

function refreshPool() {
  const next = [...MODERN_BLESSINGS]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const text = parsed && typeof parsed.text === 'string' ? parsed.text.trim() : ''
      if (text && !next.includes(text)) next.push(text)
    }
  } catch {
    /* 隐私模式或数据损坏，忽略 */
  }
  pool = next
}

const reduceMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 三层各自的文字节点列表（每层长度恒定，落到底部原位替换，实现内存回收） */
const rain = reactive({ back: [], mid: [], front: [] })

const dim = ref(false) // 画面是否已变暗
const closing = ref(false) // 是否正在收拢（淡出文字）
const paused = ref(false) // 页面隐藏时暂停
const lite = ref(false) // 移动端：关闭景深模糊，节省 GPU

let seed = 0
let dimTimer = null
let clearTimer = null
let resizeTimer = null

const rand = (min, max) => min + Math.random() * (max - min)

const hasDrops = computed(
  () => rain.back.length + rain.mid.length + rain.front.length > 0
)

/** 探测是否为移动端 / 低性能设备 */
function detectLite() {
  const w = window.innerWidth
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  lite.value = w < 768 || coarse
}

/**
 * 每条图层的文字数量：手机端自动限流，避免卡顿
 */
function perLayerCount() {
  if (props.count > 0) return Math.max(1, Math.round(props.count / LAYERS.length))
  if (reduceMotion) return 0
  const w = window.innerWidth
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
  if (w < 420) return 5
  if (coarse || w < 768) return 7
  return 14
}

/**
 * 生成一条随机文字
 * @param {object} layer 所属图层配置
 * @param {boolean} initial 是否为开场填充（用负延迟让满屏立刻铺开）
 */
function createDrop(layer, initial = false) {
  const text = pool[Math.floor(Math.random() * pool.length)] || '中秋快乐'
  const dur = rand(6, 13) * layer.durMul
  return {
    id: (seed += 1),
    text,
    // 竖排文字为窄列，横向可铺满整个屏幕，密度更高
    x: rand(2, 96),
    size: (rand(0.9, 1.3) * layer.sizeMul).toFixed(2),
    // 图层透明度与随机透明度相乘，叠加出层次
    opacity: (layer.opacity * rand(0.7, 1)).toFixed(2),
    tone: ['var(--gold-100)', 'var(--gold-200)', 'var(--moon-soft)', 'var(--ink-100)'][
      Math.floor(Math.random() * 4)
    ],
    ry: rand(6, 16).toFixed(1), // 3D 翻转基准角
    dur: dur.toFixed(2),
    delay: (initial ? -rand(0, dur) : rand(0, 1.2)).toFixed(2),
    sway: rand(5, 16).toFixed(1),
    swayDur: rand(2.2, 5).toFixed(2),
    swayDelay: rand(0, 2).toFixed(2),
    blur: lite.value ? 0 : layer.blur
  }
}

/** 开启：为三层补满文字 */
function startRain() {
  refreshPool()
  const n = perLayerCount()
  for (const layer of LAYERS) {
    rain[layer.id] = n > 0 ? Array.from({ length: n }, () => createDrop(layer, true)) : []
  }
}

/** 关闭：先淡出文字，再清空节点释放内存 */
function stopRain() {
  if (!hasDrops.value) {
    closing.value = false
    return
  }
  closing.value = true
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    rain.back = []
    rain.mid = []
    rain.front = []
    closing.value = false
    clearTimer = null
  }, CLEAR_MS)
}

/**
 * 单条文字落到底部：本层原位替换为一条全新随机文字
 * 节点总数恒定，不增长，天然完成内存回收
 */
function onDropEnd(layerId, id, event) {
  if (event.target !== event.currentTarget) return
  if (closing.value) return
  const arr = rain[layerId]
  const index = arr.findIndex((d) => d.id === id)
  if (index === -1) return
  const layer = LAYERS.find((l) => l.id === layerId)
  const next = arr.slice()
  next[index] = createDrop(layer, false)
  rain[layerId] = next
}

function onVisibilityChange() {
  paused.value = document.hidden
}

/** 屏幕尺寸变化：按新档位重建数量 / 关闭景深模糊（防抖） */
function onResize() {
  if (resizeTimer) clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    detectLite()
    if (!props.active) return
    startRain()
  }, 260)
}

/**
 * 开 / 关主流程
 * 开启：屏幕先慢慢变暗 → 变暗结束后开始落字
 * 关闭：先淡出文字 → 再恢复画面
 */
watch(
  () => props.active,
  (on) => {
    if (dimTimer) {
      clearTimeout(dimTimer)
      dimTimer = null
    }
    if (on) {
      if (clearTimer) {
        clearTimeout(clearTimer)
        clearTimer = null
      }
      closing.value = false
      dim.value = true // 触发渐渐变黑
      dimTimer = setTimeout(() => {
        startRain()
        dimTimer = null
      }, DIM_MS)
    } else {
      stopRain()
      dim.value = false
    }
  }
)

onMounted(() => {
  detectLite()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('resize', onResize, { passive: true })
  if (props.active) {
    dim.value = true
    dimTimer = setTimeout(() => {
      startRain()
      dimTimer = null
    }, DIM_MS)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('resize', onResize)
  if (dimTimer) clearTimeout(dimTimer)
  if (clearTimer) clearTimeout(clearTimer)
  if (resizeTimer) clearTimeout(resizeTimer)
  rain.back = []
  rain.mid = []
  rain.front = []
})
</script>

<template>
  <!-- 传送至 body，避免受月亮 transform 祖先影响，确保覆盖全屏 -->
  <Teleport to="body">
    <div class="rain-root" :class="{ 'is-paused': paused }" aria-hidden="true">
      <!-- 全屏渐暗遮罩：长按三秒后先变黑，再落字 -->
      <div class="rain-dim" :class="{ 'is-on': dim }" />

      <!-- 3D 舞台：perspective 提供纵深厚，三层 translateZ 拉开景深 -->
      <div class="rain-stage" :class="{ 'is-closing': closing }">
        <div
          v-for="layer in LAYERS"
          :key="layer.id"
          class="rain-layer"
          :style="{ transform: `translateZ(${layer.z}px)` }"
        >
          <span
            v-for="drop in rain[layer.id]"
            :key="drop.id"
            class="rain-drop"
            :style="{
              left: drop.x + '%',
              '--dur': drop.dur + 's',
              '--delay': drop.delay + 's',
              '--ry': drop.ry + 'deg'
            }"
            @animationend="onDropEnd(layer.id, drop.id, $event)"
          >
            <span
              class="rain-text"
              :style="{
                '--fs': drop.size,
                '--tone': drop.tone,
                '--sway': drop.sway + 'px',
                '--sway-dur': drop.swayDur + 's',
                '--sway-delay': drop.swayDelay + 's',
                opacity: drop.opacity,
                filter: drop.blur ? `blur(${drop.blur}px)` : 'none'
              }"
              >{{ drop.text }}</span
            >
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.rain-root {
  position: fixed;
  inset: 0;
  z-index: 36; /* 覆盖月亮与桂花花瓣(30)，低于音乐按钮(40)与弹窗(100) */
  overflow: hidden;
  pointer-events: none;
  contain: layout paint;
}

/* ---------- 渐暗遮罩 ---------- */
.rain-dim {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at 50% 42%,
    rgba(5, 8, 18, 0.66) 0%,
    rgba(2, 3, 9, 0.94) 78%
  );
  opacity: 0;
  transition: opacity 2.2s var(--ease-out-soft);
}

.rain-dim.is-on {
  opacity: 1;
}

/* ---------- 3D 舞台 ---------- */
.rain-stage {
  position: absolute;
  inset: 0;
  perspective: 1100px;
  perspective-origin: 50% 28%;
  transform-style: preserve-3d;
  transition: opacity 0.44s var(--ease-out-soft);
}

.rain-stage.is-closing {
  opacity: 0;
}

.rain-root.is-paused .rain-drop,
.rain-root.is-paused .rain-text {
  animation-play-state: paused;
}

/* 每层仅保留 translateZ 与 preserve-3d，避免 opacity/filter 抹平 3D */
.rain-layer {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  will-change: transform;
}

/* 外层：自上而下坠落，并在坠落过程中做 3D 翻转（rotateY） */
.rain-drop {
  position: absolute;
  top: 0;
  display: block;
  transform-style: preserve-3d;
  animation: rain-fall var(--dur, 10s) linear var(--delay, 0s) 1 both;
  will-change: transform;
}

/* 内层：轻微左右摇摆 */
.rain-text {
  display: inline-block;
  white-space: nowrap;
  /* 竖排国风写法：文字自上而下，逐字直立 */
  writing-mode: vertical-rl;
  text-orientation: upright;
  -webkit-text-orientation: upright;
  line-height: 1.05;
  font-size: calc(clamp(0.9rem, 3.6vw, 1.75rem) * var(--fs, 1));
  color: var(--tone, var(--gold-100));
  letter-spacing: 0.08em;
  text-shadow: 0 0 12px rgba(216, 185, 106, 0.45), 0 2px 12px rgba(0, 0, 0, 0.6);
  animation: rain-sway var(--sway-dur, 3.5s) ease-in-out var(--sway-delay, 0s) infinite alternate;
  will-change: transform;
}

@keyframes rain-fall {
  from {
    transform: translate3d(0, -16vh, 0) rotateY(var(--ry, 12deg));
  }
  to {
    transform: translate3d(0, 116vh, 0) rotateY(calc(var(--ry, 12deg) * -0.6));
  }
}

@keyframes rain-sway {
  from {
    transform: translate3d(calc(var(--sway, 14px) * -1), 0, 0);
  }
  to {
    transform: translate3d(var(--sway, 14px), 0, 0);
  }
}
</style>
