<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import './setup'

// data 形如 [{ name, value }]；total 显示在环心。
const props = defineProps({
  data: { type: Array, required: true },
  total: { type: [Number, String], required: true },
})

// 环形图配色，按数据顺序依次取用。
const palette = ['#2f9c8f', '#4a7bb5', '#c69b52', '#d36d4b', '#7e6db7', '#82935d', '#4f8b8b', '#a17848']
const option = computed(() => ({
  animationDuration: 500,
  color: palette,
  tooltip: {
    trigger: 'item',
    formatter: '{b}<br/>{c} 单 · {d}%',
    backgroundColor: 'rgba(255,255,255,.98)',
    borderColor: '#dbe1e9',
    textStyle: { color: '#515a68', fontSize: 12 },
  },
  series: [{
    type: 'pie',
    radius: ['56%', '76%'],
    center: ['50%', '50%'],
    avoidLabelOverlap: true,
    itemStyle: { borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { scaleSize: 5 },
    data: props.data,
  }],
  // 环心文字：上方总数、下方说明。
  graphic: [
    { type: 'text', left: 'center', top: '41%', style: { text: String(props.total), fill: '#303744', fontSize: 18, fontWeight: 600, textAlign: 'center' } },
    { type: 'text', left: 'center', top: '55%', style: { text: '今日单量', fill: '#8993a1', fontSize: 10, textAlign: 'center' } },
  ],
}))
</script>

<template><VChart class="donut-chart" :option="option" autoresize /></template>

<style scoped>
/* 固定尺寸，窄屏略微缩小。 */
.donut-chart { width: 150px; height: 150px; flex: 0 0 150px; }
@media (max-width: 1400px) { .donut-chart { width: 130px; height: 130px; flex-basis: 130px; } }
</style>
