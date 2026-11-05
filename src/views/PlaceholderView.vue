<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

// 占位页：菜单已配置但业务尚未实现时，由 router 的 componentMap 统一回退到此页。
const route = useRoute()
const pageTitle = computed(() => route.meta.title || '功能页面')
</script>

<template>
  <main class="placeholder-page">
    <section class="placeholder-card">
      <span class="placeholder-icon">▦</span>
      <h1>{{ pageTitle }}</h1>
      <p>路由已配置，业务页面将在后续迭代中接入。</p>
    </section>
  </main>
</template>

<style scoped lang="less">
.placeholder-page {
  min-height: calc(100vh - var(--admin-topbar-height) - var(--admin-tabbar-height));
  display: grid;
  place-items: center;
  padding: 24px;
}

.placeholder-card {
  width: min(440px, 100%);
  padding: 54px 30px;
  text-align: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(38, 68, 75, 0.045);

  h1 { margin: 16px 0 8px; color: var(--admin-text-primary); font-size: 22px; }
  p { margin: 0; color: var(--admin-text-secondary); font-size: 14px; }
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  display: grid;
  margin: 0 auto;
  place-items: center;
  color: var(--admin-text-inverse);
  font-size: 22px;
  background: var(--admin-primary);
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(47, 156, 143, 0.18);
}
</style>
