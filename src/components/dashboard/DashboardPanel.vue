<script setup>
// compact 用于内容较少的概览卡片，收窄底部留白。
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  compact: { type: Boolean, default: false },
})
</script>

<template>
  <!-- 看板通用面板：左侧标题 + 右侧 actions 插槽 + 默认内容插槽。 -->
  <section :class="['dashboard-panel', { compact }]">
    <header class="panel-heading">
      <div class="panel-title">
        <h2>{{ title }}</h2>
        <span v-if="description">{{ description }}</span>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>

<style scoped lang="less">
.dashboard-panel {
  min-width: 0;
  padding: 21px 22px 22px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(38, 68, 75, 0.045);
}

.dashboard-panel.compact {
  padding-bottom: 16px;
}

.panel-heading {
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-title {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;

  /* 标题左侧的竖条由 ::before 绘制。 */
  h2 {
    position: relative;
    margin: 0;
    padding-left: 10px;
    color: var(--admin-text-primary);
    font-size: 16px;
    font-weight: 600;
    white-space: nowrap;

    &::before {
      position: absolute;
      top: 2px;
      bottom: 2px;
      left: 0;
      width: 3px;
      content: '';
      background: var(--admin-primary);
      border-radius: var(--admin-radius-pill);
    }
  }

  span {
    overflow: hidden;
    color: var(--admin-text-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@media (max-width: 1280px) {
  .dashboard-panel { padding-inline: 16px; }
  .panel-heading { align-items: flex-start; }
}
</style>
