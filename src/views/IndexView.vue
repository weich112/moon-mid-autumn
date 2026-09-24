<script setup>
import { ref, onMounted } from 'vue'
import CloudLayer from '@/components/CloudLayer.vue'
import MoonView from '@/components/MoonView.vue'
import BlessCard from '@/components/BlessCard.vue'
import CustomInput from '@/components/CustomInput.vue'
import FooterNote from '@/components/FooterNote.vue'

const STORAGE_KEY = 'mid-autumn:user-bless'

const ready = ref(false)

/** 用户自定义祝福（持久化到 localStorage） */
const userBless = ref({ text: '', name: '' })

const mainTitle = '月满中秋 · 岁岁安康'
const subTitle = '但愿人长久，千里共婵娟'

const mainChars = [...mainTitle]
const subChars = [...subTitle]

/** 读取本地已保存的祝福 */
function loadUserBless() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.text === 'string') {
      userBless.value = { text: parsed.text, name: parsed.name || '' }
    }
  } catch {
    /* 数据损坏或隐私模式，忽略即可 */
  }
}

/** 保存用户祝福 */
function saveUserBless(payload) {
  userBless.value = { text: payload.text, name: payload.name || '' }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userBless.value))
  } catch {
    /* 忽略存储失败 */
  }
}

// 同步读取本地祝福，确保子组件首次渲染即拿到正确的初始值
loadUserBless()

onMounted(() => {
  // 下一帧再触发入场，确保初始样式已应用，动画得以播放
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ready.value = true
    })
  })
})
</script>

<template>
  <div class="index" :class="{ 'is-ready': ready }">
    <section class="hero">
      <div class="hero-clouds">
        <CloudLayer :depth="1" />
      </div>

      <MoonView class="hero-moon" :entered="ready" />

      <header class="hero-copy">
        <p class="hero-eyebrow">乙巳 · 中秋</p>

        <h1 class="hero-title" aria-label="月满中秋 · 岁岁安康">
          <span
            v-for="(char, i) in mainChars"
            :key="`m-${i}`"
            class="char"
            :class="{ 'is-space': char === ' ' }"
            :style="{ '--i': i }"
            aria-hidden="true"
            >{{ char === ' ' ? '\u00A0' : char }}</span
          >
        </h1>

        <p class="hero-sub" aria-label="但愿人长久，千里共婵娟">
          <span
            v-for="(char, i) in subChars"
            :key="`s-${i}`"
            class="char char--sub"
            :style="{ '--i': i }"
            aria-hidden="true"
            >{{ char }}</span
          >
        </p>
      </header>

      <div class="hero-scroll" aria-hidden="true">
        <span class="scroll-track"><span class="scroll-dot" /></span>
        <span class="scroll-text">向下 · 寄一份祝福</span>
      </div>
    </section>

    <section class="content">
      <BlessCard :custom-text="userBless.text" />
      <CustomInput
        :initial-text="userBless.text"
        :initial-name="userBless.name"
        @submit="saveUserBless"
      />
      <FooterNote :author="userBless.name" />
    </section>
  </div>
</template>

<style scoped>
.index {
  position: relative;
  z-index: 2;
}

/* ================= 首屏 ================= */
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(0.6rem, 2.5vh, 1.6rem);
  padding: 10vh 5vw 14vh;
  overflow: hidden;
}

.hero-clouds {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 2.2s var(--ease-out-soft) 0.7s;
}

.index.is-ready .hero-clouds {
  opacity: 1;
}

.hero-moon {
  z-index: var(--z-moon);
}

.hero-copy {
  position: relative;
  z-index: var(--z-content);
  text-align: center;
}

.hero-eyebrow {
  font-size: var(--fs-eyebrow);
  letter-spacing: var(--tracking-wide);
  color: var(--gold-200);
  opacity: 0;
  text-indent: var(--tracking-wide);
}

.index.is-ready .hero-eyebrow {
  animation: fade-up 1.1s var(--ease-out-soft) 1.05s forwards;
}

.hero-title {
  margin: 0.45rem 0 0.9rem;
  font-size: var(--fs-hero);
  font-weight: 500;
  letter-spacing: 0.06em;
  line-height: 1.3;
  color: var(--ink-100);
  text-shadow: 0 0 40px rgba(244, 233, 201, 0.35), 0 4px 30px rgba(0, 0, 0, 0.5);
}

.hero-sub {
  font-size: var(--fs-sub);
  font-weight: 300;
  letter-spacing: 0.24em;
  color: var(--ink-200);
  text-indent: 0.24em;
  opacity: 0.92;
  text-shadow: 0 0 26px rgba(244, 233, 201, 0.22);
}

/* 逐字入场 */
.char {
  display: inline-block;
  opacity: 0;
  will-change: transform, opacity, filter;
}

.index.is-ready .char {
  animation: char-in 1s var(--ease-out-soft) forwards;
  animation-delay: calc(1.2s + var(--i) * 0.085s);
}

.index.is-ready .char--sub {
  animation-delay: calc(1.95s + var(--i) * 0.06s);
}

.char.is-space {
  width: 0.35em;
}

/* 主标题字间点缀金光 */
.hero-title .char:not(.is-space) {
  text-shadow: 0 0 24px rgba(244, 233, 201, 0.28);
}

/* 向下滚动提示 */
.hero-scroll {
  position: absolute;
  bottom: clamp(18px, 4vh, 40px);
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--z-content);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  opacity: 0;
}

.index.is-ready .hero-scroll {
  animation: fade-up 1.2s var(--ease-out-soft) 3.2s forwards;
}

.scroll-track {
  position: relative;
  width: 1px;
  height: 46px;
  overflow: hidden;
  background: linear-gradient(180deg, transparent, rgba(216, 185, 106, 0.35), transparent);
}

.scroll-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 3px;
  height: 10px;
  margin-left: -1.5px;
  margin-top: -5px;
  border-radius: 3px;
  background: var(--gold-200);
  box-shadow: 0 0 10px 2px var(--gold-glow);
  animation: scroll-dot 2.6s var(--ease-in-out-soft) infinite;
}

.scroll-text {
  font-size: var(--fs-small);
  letter-spacing: 0.22em;
  color: var(--ink-400);
}

/* ================= 内容区 ================= */
.content {
  position: relative;
  z-index: var(--z-content);
  width: min(680px, 92vw);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(1.6rem, 4.5vh, 3rem);
  padding: clamp(2rem, 8vh, 5rem) 0 clamp(1rem, 4vh, 2rem);
}

@media (max-width: 640px) {
  .hero {
    padding: 8vh 6vw 16vh;
  }

  .hero-sub {
    letter-spacing: 0.14em;
    text-indent: 0.14em;
    line-height: 1.9;
  }
}
</style>
