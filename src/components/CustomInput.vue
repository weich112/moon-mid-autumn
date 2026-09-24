<script setup>
import { ref, computed } from 'vue'
import { useRandomBless } from '@/composables/useRandomBless'

const props = defineProps({
  /** 已保存的用户祝福，用于回填 */
  initialText: { type: String, default: '' },
  initialName: { type: String, default: '' }
})

const emit = defineEmits(['submit'])

const MAX_TEXT = 40
const MAX_NAME = 8

const { pickRandom } = useRandomBless()

const text = ref(props.initialText || '')
const name = ref(props.initialName || '')
const toast = ref('')
let toastTimer = null

const remaining = computed(() => MAX_TEXT - text.value.length)
const canSubmit = computed(() => text.value.trim().length > 0)

/** 拾一句内置祝福作为灵感 */
function fillInspiration() {
  text.value = pickRandom().slice(0, MAX_TEXT)
}

function showToast(message) {
  toast.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = ''
  }, 2600)
}

/** 提交祝福，交由父级持久化 */
function onSubmit() {
  const value = text.value.trim()
  if (!value) {
    showToast('还未落笔，写一句心意吧')
    return
  }
  emit('submit', { text: value, name: name.value.trim() })
  showToast('祝福已寄出 · 已珍藏心间')
  text.value = ''
}
</script>

<template>
  <section class="custom-input">
    <header class="input-head">
      <span class="input-eyebrow">执笔 · 寄月</span>
      <h2 class="input-title">写下你的中秋祝福</h2>
      <p class="input-desc">落笔之后，它会留在这一轮月色里，下次来访依旧可见。</p>
    </header>

    <div class="field">
      <label class="field-label" for="bless-text">祝福语</label>
      <textarea
        id="bless-text"
        v-model="text"
        class="field-textarea"
        :maxlength="MAX_TEXT"
        rows="3"
        placeholder="例：愿此间灯火，皆为你而明。"
      />
      <span class="field-counter" :class="{ 'is-low': remaining <= 5 }">
        还可写 {{ remaining }} 字
      </span>
    </div>

    <div class="field field--inline">
      <label class="field-label" for="bless-name">署名（可不填）</label>
      <input
        id="bless-name"
        v-model="name"
        class="field-input"
        :maxlength="MAX_NAME"
        type="text"
        placeholder="如：阿月"
      />
    </div>

    <div class="input-actions">
      <button type="button" class="btn-ghost" @click="fillInspiration">拾一句灵感</button>
      <button type="button" class="btn-gold" :disabled="!canSubmit" @click="onSubmit">
        寄出祝福
      </button>
    </div>

    <Transition name="toast">
      <p v-if="toast" class="input-toast" role="status">{{ toast }}</p>
    </Transition>
  </section>
</template>

<style scoped>
.custom-input {
  position: relative;
  padding: clamp(1.6rem, 4.5vw, 2.6rem);
  border-radius: var(--radius-lg);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow), inset 0 1px 0 var(--glass-highlight);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  backdrop-filter: blur(var(--glass-blur)) saturate(135%);
  opacity: 0;
  animation: fade-up 1.1s var(--ease-out-soft) 3s forwards;
}

.input-head {
  margin-bottom: 1.8rem;
}

.input-eyebrow {
  font-size: var(--fs-small);
  letter-spacing: var(--tracking-wide);
  color: var(--gold-200);
}

.input-title {
  margin: 0.5rem 0 0.6rem;
  font-size: var(--fs-title);
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--ink-100);
}

.input-desc {
  font-size: var(--fs-small);
  line-height: 1.9;
  color: var(--ink-400);
}

.field {
  position: relative;
  margin-bottom: 1.4rem;
}

.field--inline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.field-label {
  display: block;
  margin-bottom: 0.6rem;
  font-size: var(--fs-small);
  letter-spacing: 0.16em;
  color: var(--ink-300);
}

.field-textarea,
.field-input {
  width: 100%;
  padding: 0.9rem 1.1rem;
  border-radius: var(--radius-md);
  background: rgba(8, 13, 28, 0.5);
  border: 1px solid rgba(216, 185, 106, 0.2);
  color: var(--ink-100);
  line-height: 1.9;
  letter-spacing: 0.05em;
  resize: none;
  transition: border-color var(--dur-fast) var(--ease-out-soft),
    box-shadow var(--dur-fast) var(--ease-out-soft), background var(--dur-fast);
}

.field-textarea::placeholder,
.field-input::placeholder {
  color: var(--ink-400);
}

.field-textarea:focus,
.field-input:focus {
  outline: none;
  border-color: rgba(216, 185, 106, 0.6);
  background: rgba(8, 13, 28, 0.72);
  box-shadow: 0 0 0 3px rgba(216, 185, 106, 0.12), 0 0 30px -10px rgba(216, 185, 106, 0.6);
}

.field--inline .field-input {
  flex: 1;
}

.field--inline .field-label {
  margin-bottom: 0;
  white-space: nowrap;
}

.field-counter {
  position: absolute;
  right: 0.9rem;
  bottom: 0.6rem;
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: var(--ink-400);
}

.field-counter.is-low {
  color: var(--gold-300);
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.6rem;
}

.btn-ghost,
.btn-gold {
  padding: 0.62rem 1.5rem;
  border-radius: var(--radius-pill);
  font-size: var(--fs-body);
  letter-spacing: 0.14em;
  transition: transform var(--dur-fast) var(--ease-out-soft), background var(--dur-fast),
    box-shadow var(--dur-fast), opacity var(--dur-fast);
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

.btn-gold:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 18px 38px -14px rgba(216, 185, 106, 1);
}

.btn-gold:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.input-toast {
  margin-top: 1.2rem;
  text-align: right;
  font-size: var(--fs-small);
  letter-spacing: 0.16em;
  color: var(--gold-200);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.4s var(--ease-out-soft), transform 0.4s var(--ease-out-soft);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate3d(0, 8px, 0);
}

@media (max-width: 560px) {
  .field--inline {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }

  .input-actions {
    justify-content: stretch;
  }

  .input-actions button {
    flex: 1;
  }
}
</style>
