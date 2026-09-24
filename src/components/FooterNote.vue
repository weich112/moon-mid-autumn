<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** 用户署名，若有则显示 */
  author: { type: String, default: '' }
})

const year = new Date().getFullYear()
const sealText = computed(() => (props.author ? props.author.slice(0, 4) : '月寄'))
</script>

<template>
  <footer class="footer-note">
    <div class="footer-divider" aria-hidden="true">
      <span class="line" />
      <span class="mark">✕</span>
      <span class="line" />
    </div>

    <p class="footer-bless">但愿人长久，千里共婵娟</p>

    <div class="footer-sign">
      <span class="footer-seal" aria-hidden="true">{{ sealText }}</span>
      <div class="footer-meta">
        <p class="footer-title">月寄中秋 · 岁岁安康</p>
        <p class="footer-sub">
          <span v-if="author">署名 · {{ author }} · </span>
          制于 {{ year }} 年中秋
        </p>
      </div>
    </div>

    <p class="footer-credit">以 Vue 3 + Vite 手作 · 月色长明</p>
  </footer>
</template>

<style scoped>
.footer-note {
  padding: clamp(2.4rem, 6vh, 4rem) 0 clamp(1.6rem, 4vh, 2.4rem);
  text-align: center;
  opacity: 0;
  animation: fade-up 1.1s var(--ease-out-soft) 3.25s forwards;
}

.footer-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.6rem;
}

.footer-divider .line {
  width: clamp(40px, 16vw, 120px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(216, 185, 106, 0.5), transparent);
}

.footer-divider .mark {
  font-size: 0.75rem;
  color: var(--gold-300);
  opacity: 0.8;
}

.footer-bless {
  font-size: clamp(1rem, 2.6vw, 1.25rem);
  letter-spacing: 0.28em;
  color: var(--ink-200);
  text-indent: 0.28em;
  text-shadow: 0 2px 22px rgba(244, 233, 201, 0.2);
}

.footer-sign {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.8rem;
  padding: 0.9rem 1.4rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(216, 185, 106, 0.18);
  background: rgba(18, 26, 52, 0.3);
  text-align: left;
}

.footer-seal {
  display: inline-grid;
  place-items: center;
  min-width: 44px;
  height: 44px;
  padding: 0 0.3rem;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: var(--ink-inverse);
  border-radius: 10px;
  background: linear-gradient(145deg, var(--gold-100), var(--gold-300));
  box-shadow: 0 8px 22px -10px rgba(216, 185, 106, 0.9);
}

.footer-title {
  font-size: var(--fs-body);
  letter-spacing: 0.14em;
  color: var(--ink-100);
}

.footer-sub {
  margin-top: 0.25rem;
  font-size: var(--fs-small);
  letter-spacing: 0.12em;
  color: var(--ink-400);
}

.footer-credit {
  margin-top: 2rem;
  font-size: var(--fs-small);
  letter-spacing: 0.2em;
  color: var(--ink-400);
  opacity: 0.7;
}
</style>
