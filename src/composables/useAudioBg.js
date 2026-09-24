import { ref, onBeforeUnmount } from 'vue'

/** 本地存储键：记录音乐开关状态 */
const STORAGE_KEY = 'mid-autumn:bgm'
/** 可选的自备 BGM 路径（存在则优先使用） */
const BGM_URL = '/audio/bgm.mp3'

/** 五声音阶（宫商角徵羽）音高，营造古筝质感 */
const PENTATONIC = [293.66, 329.63, 392.0, 440.0, 493.88, 587.33, 659.25, 783.99]
/** 旋律走向：固定骨架 + 少量随机，保证悦耳又不呆板 */
const MELODY = [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 4, 3, 2]
/** 每个音的基准间隔（秒） */
const STEP_TIME = 0.72

/**
 * 背景音乐控制：双方案自动降级
 * 1) 优先尝试加载 /audio/bgm.mp3
 * 2) 文件缺失时，用 Web Audio API 程序化合成古风环境音
 * 开关状态持久化到 localStorage，刷新后自动恢复。
 */
export function useAudioBg() {
  const enabled = ref(false) // 用户期望的开关状态
  const playing = ref(false) // 实际是否正在发声
  const blocked = ref(false) // 是否因浏览器自动播放策略被拦截
  const mode = ref('idle') // 'file' | 'synth' | 'idle'
  const ready = ref(false) // 初始化是否完成

  let initialized = false
  let audioEl = null
  let audioCtx = null
  let masterGain = null
  let delayNode = null
  let schedTimer = null
  let synthRunning = false
  let nextNoteTime = 0
  let step = 0
  let gestureBound = false

  /* ---------------- 文件方案 ---------------- */

  /** 探测 bgm.mp3 是否存在且为音频 */
  async function probeFile() {
    try {
      const res = await fetch(BGM_URL, { method: 'HEAD' })
      if (!res.ok) return false
      const type = res.headers.get('content-type') || ''
      return type.startsWith('audio')
    } catch {
      return false
    }
  }

  function setupFile() {
    audioEl = new Audio()
    audioEl.src = BGM_URL
    audioEl.loop = true
    audioEl.preload = 'auto'
    audioEl.volume = 0
  }

  /** 音量渐入，避免突兀 */
  function fadeVolume(target, duration = 1600) {
    if (!audioEl) return
    const from = audioEl.volume
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      audioEl.volume = from + (target - from) * p
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  /* ---------------- 合成方案 ---------------- */

  function setupSynth() {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) {
      mode.value = 'idle'
      return
    }
    audioCtx = new AC()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0
    masterGain.connect(audioCtx.destination)

    // 简单延时反馈，制造空谷回响的空间感
    delayNode = audioCtx.createDelay(1.0)
    delayNode.delayTime.value = 0.34
    const feedback = audioCtx.createGain()
    feedback.gain.value = 0.28
    const wet = audioCtx.createGain()
    wet.gain.value = 0.35

    masterGain.connect(delayNode)
    delayNode.connect(feedback)
    feedback.connect(delayNode)
    delayNode.connect(wet)
    wet.connect(audioCtx.destination)
  }

  /** 合成单个拨弦音 */
  function schedulePluck(time, freq) {
    const dur = 1.5
    const osc = audioCtx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(time)
    osc.stop(time + dur + 0.05)

    // 高八度泛音，增加清透的鎏金质感
    const shimmer = audioCtx.createOscillator()
    shimmer.type = 'sine'
    shimmer.frequency.value = freq * 2
    const shimmerGain = audioCtx.createGain()
    shimmerGain.gain.setValueAtTime(0.0001, time)
    shimmerGain.gain.exponentialRampToValueAtTime(0.12, time + 0.02)
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.9)
    shimmer.connect(shimmerGain)
    shimmerGain.connect(masterGain)
    shimmer.start(time)
    shimmer.stop(time + 1.0)
  }

  /** 低音长音铺底，每八拍一次 */
  function scheduleDrone(time, freq) {
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const gain = audioCtx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.linearRampToValueAtTime(0.09, time + 1.2)
    gain.gain.linearRampToValueAtTime(0.0001, time + 5.6)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start(time)
    osc.stop(time + 5.8)
  }

  /** 前瞻式调度器 */
  function scheduler() {
    if (!audioCtx) return
    const ahead = 0.7
    while (nextNoteTime < audioCtx.currentTime + ahead) {
      const noteIndex = MELODY[step % MELODY.length]
      schedulePluck(nextNoteTime, PENTATONIC[noteIndex])
      if (step % 8 === 0) scheduleDrone(nextNoteTime, PENTATONIC[0] / 2)
      // 偶尔留白，让旋律有呼吸
      nextNoteTime += STEP_TIME * (Math.random() < 0.16 ? 1.7 : 1)
      step += 1
    }
  }

  function startSynth() {
    if (!audioCtx || synthRunning) return
    synthRunning = true
    nextNoteTime = audioCtx.currentTime + 0.15
    step = 0
    // 主音量渐入
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
    masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime)
    masterGain.gain.linearRampToValueAtTime(0.16, audioCtx.currentTime + 1.8)
    schedTimer = window.setInterval(scheduler, 100)
  }

  function stopSynth() {
    if (!synthRunning) return
    synthRunning = false
    if (schedTimer) {
      clearInterval(schedTimer)
      schedTimer = null
    }
    if (audioCtx && masterGain) {
      const now = audioCtx.currentTime
      masterGain.gain.cancelScheduledValues(now)
      masterGain.gain.setValueAtTime(masterGain.gain.value, now)
      masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.6)
    }
  }

  /* ---------------- 播放控制 ---------------- */

  function bindGesture() {
    if (gestureBound) return
    gestureBound = true
    const handler = () => {
      unbindGesture()
      if (enabled.value) tryPlay()
    }
    window.addEventListener('pointerdown', handler, { once: true, passive: true })
    window.addEventListener('keydown', handler, { once: true })
    gestureListeners = { handler }
  }

  let gestureListeners = null

  function unbindGesture() {
    if (!gestureBound || !gestureListeners) return
    window.removeEventListener('pointerdown', gestureListeners.handler)
    window.removeEventListener('keydown', gestureListeners.handler)
    gestureBound = false
    gestureListeners = null
  }

  async function tryPlay() {
    if (!enabled.value) return
    try {
      if (mode.value === 'file') {
        await audioEl.play()
        fadeVolume(0.42)
      } else if (mode.value === 'synth') {
        if (audioCtx.state === 'suspended') await audioCtx.resume()
        startSynth()
      } else {
        return
      }
      playing.value = true
      blocked.value = false
      unbindGesture()
    } catch {
      // 自动播放被拦截：等待用户首次交互后再尝试
      playing.value = false
      blocked.value = true
      bindGesture()
    }
  }

  function stopPlay() {
    if (mode.value === 'file' && audioEl) {
      fadeVolume(0)
      window.setTimeout(() => {
        if (!enabled.value && audioEl) audioEl.pause()
      }, 900)
    } else if (mode.value === 'synth') {
      stopSynth()
    }
    playing.value = false
  }

  /** 切换播放 / 暂停 */
  function toggle() {
    enabled.value = !enabled.value
    try {
      localStorage.setItem(STORAGE_KEY, enabled.value ? 'on' : 'off')
    } catch {
      /* 隐私模式下 localStorage 可能不可用，忽略 */
    }
    if (enabled.value) tryPlay()
    else stopPlay()
  }

  /** 初始化：探测音源 + 恢复上次开关状态 */
  async function init() {
    if (initialized) return
    initialized = true

    const hasFile = await probeFile()
    mode.value = hasFile ? 'file' : 'synth'
    if (hasFile) setupFile()
    else setupSynth()

    let saved = 'off'
    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'off'
    } catch {
      saved = 'off'
    }

    ready.value = true

    if (saved === 'on') {
      enabled.value = true
      await tryPlay()
    }
  }

  onBeforeUnmount(() => {
    unbindGesture()
    if (schedTimer) clearInterval(schedTimer)
    if (audioEl) {
      audioEl.pause()
      audioEl.src = ''
    }
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {})
    }
  })

  return { enabled, playing, blocked, mode, ready, init, toggle, tryPlay }
}
