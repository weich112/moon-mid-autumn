import { ref } from 'vue'

/**
 * 内置中秋祝福语库
 * 兼顾经典诗词与温暖祝语，避免重复抽取时产生审美疲劳。
 */
export const BLESSINGS = [
  '但愿人长久，千里共婵娟。',
  '海上生明月，天涯共此时。',
  '露从今夜白，月是故乡明。',
  '今夜月明人尽望，不知秋思落谁家。',
  '此生此夜不长好，明月明年何处看。',
  '秋空明月悬，光彩露沾湿。',
  '一轮秋影转金波，飞镜又重磨。',
  '万里无云镜九州，最团圆夜是中秋。',
  '桂花浮玉，正月满天街，夜凉如洗。',
  '暑退九霄净，秋澄万景清。',
  '举杯邀明月，对影成三人。',
  '目穷淮海满如银，万道虹光育蚌珍。',
  '愿花好月圆，岁岁无忧，年年有今日。',
  '愿你所求皆如愿，所行化坦途。',
  '愿清风伴你行，明月照你归。',
  '愿人间皆安，山河无恙，灯火可亲。',
  '愿此间温柔，都被你轻轻收下。',
  '愿你有酒有诗，有远方，也有归途。',
  '愿今夜月色，替我好好拥抱你。',
  '愿日子清净，抬头遇见的都是柔情。',
  '愿思念有归处，团圆终有期。',
  '愿你我都如这轮圆月，圆满而明朗。',
  '凉风有信，秋月无边，愿你顺遂长安。',
  '山高水长，物象千万，皆不如你。'
]

/**
 * 隐藏彩蛋：长按圆月三秒后出现
 */
export const EASTER_EGG = {
  text: '月老悄悄记下了你的心愿 ——\n愿所念之人，岁岁平安；\n愿所盼之事，件件回响。',
  note: '此签只予有缘人 · 中秋吉'
}

/**
 * 随机祝福组合式函数
 * 采用「最近不重复」队列，保证连续抽取不会反复出现同一句。
 */
export function useRandomBless() {
  const current = ref(BLESSINGS[0])
  const history = []

  /**
   * 随机抽取一句祝福
   * @returns {string} 抽取到的祝福文本
   */
  function pickRandom() {
    const total = BLESSINGS.length
    if (total <= 1) {
      current.value = BLESSINGS[0]
      return current.value
    }

    let index = 0
    let guard = 0
    // 最多尝试 24 次，避开当前句与近期历史，避免死循环
    do {
      index = Math.floor(Math.random() * total)
      guard += 1
    } while (guard < 24 && (BLESSINGS[index] === current.value || history.includes(index)))

    history.push(index)
    const memory = Math.min(total - 1, 6)
    while (history.length > memory) history.shift()

    current.value = BLESSINGS[index]
    return current.value
  }

  return { blessings: BLESSINGS, current, pickRandom }
}
