<script setup>
import { computed } from 'vue'

// modelValue 为当前范围，dateRange 是自定义区间。
// mode='daily'（默认）：today / yesterday / 7d / 30d（对应接口 rangeType 1-4，custom=5）
// mode='monthly'：month / lastMonth（对应交易类接口 rangeType 1-2，custom=3）
const props = defineProps({
  modelValue: { type: String, required: true },
  dateRange: { type: Array, default: () => [] },
  mode: { type: String, default: 'daily' },
})
const emit = defineEmits(['update:modelValue', 'update:dateRange'])

// 选了自定义日期就自动切到 custom 模式，避免与快捷按钮的状态冲突。
const range = computed({
  get: () => props.dateRange,
  set: (value) => {
    emit('update:dateRange', value || [])
    if (value?.length) emit('update:modelValue', 'custom')
  },
})

// 快捷范围按钮，按模式切换（后端 rangeType 枚举见 dashboardApi.js）。
const options = computed(() => (
  props.mode === 'monthly'
    ? [
        { value: 'month', label: '本月' },
        { value: 'lastMonth', label: '上月' },
      ]
    : [
        { value: 'today', label: '今日' },
        { value: 'yesterday', label: '昨日' },
        { value: '7d', label: '近7日' },
        { value: '30d', label: '近30日' },
      ]
))
</script>

<template>
  <!-- 时间范围切换：快捷按钮 + 覆盖在「自定义」上的透明日期选择器。 -->
  <div class="range-control">
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      :class="{ active: modelValue === item.value }"
      @click="$emit('update:modelValue', item.value)"
    >{{ item.label }}</button>
    <el-date-picker
      v-model="range"
      class="custom-picker"
      type="daterange"
      unlink-panels
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD"
      :teleported="true"
    />
    <span :class="['custom-trigger', { active: modelValue === 'custom' }]">自定义</span>
  </div>
</template>

<style scoped lang="less">
.range-control {
  position: relative;
  width: max-content;
  max-width: 100%;
  display: flex;
  padding: 3px;
  background: var(--admin-surface-muted);
  border-radius: var(--admin-radius-md);

  button,
  .custom-trigger {
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 13px;
    color: var(--admin-text-secondary);
    font-size: 12px;
    white-space: nowrap;
    background: transparent;
    border: 0;
    border-radius: var(--admin-radius-sm);
  }

  button { cursor: pointer; }

  .active {
    color: var(--admin-primary);
    font-weight: 600;
    background: var(--admin-surface);
    box-shadow: 0 1px 3px rgba(46, 55, 70, 0.09);
  }
}

/* 「自定义」只是展示层，真正可点击的是覆盖在它上面的透明日期选择器。 */
.custom-trigger { pointer-events: none; }

:deep(.custom-picker) {
  position: absolute;
  z-index: 2;
  top: 3px;
  right: 3px;
  width: 64px !important;
  height: 28px;
  opacity: 0;
  cursor: pointer;

  .el-range-input,
  .el-range-separator,
  .el-input__icon { cursor: pointer; }
}
</style>
