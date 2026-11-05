<script setup>
// 表格操作按钮：图标 + 文案，单行展示。icon 传入 @element-plus/icons-vue 的图标组件。
// danger 为 true 时显示红色（删除/下架/停止等负向操作）。
defineProps({
  icon: { type: [Object, Function], required: true },
  text: { type: String, required: true },
  danger: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<template>
  <button type="button" :class="['action-link', { danger }]" :disabled="disabled" @click="$emit('click')">
    <el-icon class="action-icon" :size="13">
      <component :is="icon" />
    </el-icon>
    <span class="action-text">{{ text }}</span>
  </button>
</template>

<style scoped lang="less">
.action-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 6px;
  font-family: inherit;
  font-size: 12px;
  white-space: nowrap;
  color: var(--admin-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.18s ease;

  .action-icon {
    flex: 0 0 auto;
  }

  &:hover {
    color: var(--admin-primary-hover);
  }

  &.danger {
    color: var(--admin-danger);

    &:hover {
      color: var(--admin-danger);
      opacity: 0.75;
    }
  }

  &:disabled {
    color: var(--admin-text-muted);
    cursor: not-allowed;
    opacity: 0.65;

    &:hover {
      color: var(--admin-text-muted);
      opacity: 0.65;
    }
  }
}
</style>
