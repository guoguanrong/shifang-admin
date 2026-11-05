<script setup>
// 指标卡：primaryTrend / secondaryTrend 为两条环比文案，tone 决定图标配色，icon 是图标组件本身。
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  primaryTrend: { type: String, required: true },
  secondaryTrend: { type: String, default: '' },
  secondaryDown: { type: Boolean, default: false },
  tone: { type: String, default: 'primary' },
  icon: { type: [Object, Function], required: true },
})
</script>

<template>
  <!-- 顶部指标卡；标签后的问号用于提示当前展示的是演示数据。 -->
  <article :class="['metric-card', `tone-${tone}`]">
    <div class="metric-icon"><el-icon :size="21"><component :is="icon" /></el-icon></div>
    <div class="metric-copy">
      <div class="metric-label">
        <span>{{ label }}</span>
        <el-tooltip :content="`${label}为当前演示数据，接入接口后自动更新`" placement="top">
          <i>?</i>
        </el-tooltip>
      </div>
      <strong>{{ value }}</strong>
      <!-- 主/辅两条环比；secondaryDown 为真时第二条用红色向下箭头。 -->
      <div class="metric-trends">
        <span><b>▲</b> {{ primaryTrend }}</span>
        <span v-if="secondaryTrend" :class="{ down: secondaryDown }"><b>{{ secondaryDown ? '▼' : '▲' }}</b> {{ secondaryTrend }}</span>
      </div>
    </div>
  </article>
</template>

<style scoped lang="less">
/* 卡片主体；::after 用当前文字色画一个极淡的圆形底纹。 */
.metric-card {
  position: relative;
  min-width: 0;
  min-height: 136px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 22px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(38, 68, 75, 0.045);

  &::after {
    position: absolute;
    top: -44px;
    right: -35px;
    width: 105px;
    height: 105px;
    content: '';
    background: currentColor;
    border-radius: 50%;
    opacity: 0.055;
  }
}

.metric-icon {
  width: 48px;
  height: 48px;
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  color: var(--admin-primary);
  background: var(--admin-primary-light);
  border-radius: 12px;
}

/* 不同 tone 对应不同的图标配色。 */
.tone-brand .metric-icon { color: var(--admin-brand); background: var(--admin-info-light); }
.tone-warning .metric-icon { color: var(--admin-warning); background: var(--admin-warning-light); }
.tone-danger .metric-icon { color: var(--admin-danger); background: var(--admin-danger-light); }

.metric-copy { min-width: 0; }

.metric-label {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--admin-text-secondary);
  font-size: 12px;

  i {
    width: 14px;
    height: 14px;
    display: inline-grid;
    place-items: center;
    color: var(--admin-warning);
    font-size: 10px;
    font-style: normal;
    border: 1px solid currentColor;
    border-radius: 50%;
  }
}

.metric-copy > strong {
  display: block;
  margin: 7px 0 6px;
  color: var(--admin-text-primary);
  font-size: 27px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.5px;
}

.metric-trends {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
  color: var(--admin-success);
  font-size: 11px;

  b { font-size: 9px; }
  .down { color: var(--admin-danger); }
}

/* 窄屏隐藏图标并压缩内边距，保证数值完整显示。 */
@media (max-width: 1380px) {
  .metric-card { padding: 16px; }
  .metric-icon { display: none; }
}
</style>
