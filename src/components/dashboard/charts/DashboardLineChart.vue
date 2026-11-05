<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import './setup'

// labels 为横轴刻度；series 为多条折线；max 用于固定纵轴上限；unit 是数值单位（如 $）。
const props = defineProps({
  labels: { type: Array, required: true },
  series: { type: Array, required: true },
  max: { type: Number, default: undefined },
  unit: { type: String, default: '' },
})

// 折线配色，缺省时按顺序取用。
const palette = ['#2f9c8f', '#4a7bb5', '#c69b52', '#66717f']
const option = computed(() => ({
  animationDuration: 550,
  color: palette,
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderColor: '#dbe1e9',
    textStyle: { color: '#515a68', fontSize: 12 },
    valueFormatter: (value) => `${Number(value).toLocaleString()}${props.unit}`,
  },
  legend: {
    top: 0,
    right: 2,
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
    itemGap: 18,
    textStyle: { color: '#515a68', fontSize: 11 },
  },
  grid: { top: 48, right: 8, bottom: 6, left: 8, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.labels,
    axisLine: { lineStyle: { color: '#dbe1e9' } },
    axisTick: { show: false },
    axisLabel: { color: '#8993a1', fontSize: 11, interval: 2 },
  },
  yAxis: {
    type: 'value',
    max: props.max,
    splitNumber: 4,
    axisLabel: {
      color: '#8993a1',
      fontSize: 11,
      // 纵轴数值超过一万时换算成「万」，避免刻度过长。
      formatter: (value) => {
        if (props.unit === '$') return value >= 10000 ? `${value / 10000}万` : value
        return value >= 10000 ? `${value / 10000}万` : value
      },
    },
    splitLine: { lineStyle: { color: '#e9edf2' } },
  },
  // 每条折线可自带 color，未指定时按调色板顺序取色。
  series: props.series.map((item, index) => ({
    name: item.name,
    type: 'line',
    data: item.data,
    smooth: 0.15,
    symbol: 'circle',
    symbolSize: 6,
    showSymbol: true,
    lineStyle: { width: 2.5 },
    itemStyle: { borderWidth: 2, borderColor: '#fff' },
    emphasis: { focus: 'series' },
    color: item.color || palette[index % palette.length],
  })),
}))
</script>

<template><VChart class="line-chart" :option="option" autoresize /></template>

<style scoped>
/* 固定高度，窄屏适当降低。 */
.line-chart { width: 100%; height: 330px; }
@media (max-width: 1280px) { .line-chart { height: 300px; } }
</style>
