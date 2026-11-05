<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Avatar, Calendar, Coin, Flag, Goods, Refresh, Ticket, User, Wallet } from '@element-plus/icons-vue'
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard.vue'
import DashboardPanel from '../components/dashboard/DashboardPanel.vue'
import DashboardRangeTabs from '../components/dashboard/DashboardRangeTabs.vue'
import DashboardDonutChart from '../components/dashboard/charts/DashboardDonutChart.vue'
import DashboardLineChart from '../components/dashboard/charts/DashboardLineChart.vue'
import {
  amountSeries,
  behaviorSeries,
  chartLabels,
  dashboardMetrics,
  donationGoals,
  donutGroups,
  interactionRanking,
  orderSeries,
} from '../mock/dashboard'

defineOptions({ name: 'DashboardView' })

const router = useRouter()
// 刷新按钮的 loading 状态与「数据更新于」时间。
const refreshing = ref(false)
const updatedAt = ref('2026-08-21 22:00:00')
// 每张图表各自维护时间范围：三张折线图 + 每个环形图分组。
const ranges = reactive({
  behavior: 'today',
  amount: 'today',
  order: 'today',
  donuts: Object.fromEntries(donutGroups.map((group) => [group.title, 'today'])),
})
// 自定义日期区间，结构同上。
const dateRanges = reactive({
  behavior: [],
  amount: [],
  order: [],
  donuts: Object.fromEntries(donutGroups.map((group) => [group.title, []])),
})
// mock 数据里只存图标名，这里映射到 Element Plus 的图标组件。
const iconMap = { user: User, wallet: Wallet, coin: Coin, avatar: Avatar, ticket: Ticket, goods: Goods, calendar: Calendar, flag: Flag }

// mock 数据只提供「今日」一份，按时间范围用固定系数放大，模拟不同区间的量级。
function scaleSeries(series, range) {
  const scaleMap = { today: 1, yesterday: 0.86, '7d': 6.4, '30d': 26.8, custom: 3.2 }
  const scale = scaleMap[range] || 1
  return series.map((item) => ({
    ...item,
    data: item.data.map((value) => Math.round(value * scale)),
  }))
}

// 三张折线图分别按各自的时间范围缩放。
const behaviorData = computed(() => scaleSeries(behaviorSeries, ranges.behavior))
const amountData = computed(() => scaleSeries(amountSeries, ranges.amount))
const orderData = computed(() => scaleSeries(orderSeries, ranges.order))
// 环形图同样按范围缩放，并同步重算总数（至少保留 1，避免出现 0 占比）。
const donutData = computed(() => Object.fromEntries(donutGroups.map((group) => {
  const scaleMap = { today: 1, yesterday: 0.86, '7d': 6.4, '30d': 26.8, custom: 3.2 }
  const scale = scaleMap[ranges.donuts[group.title]] || 1
  const data = group.data.map((item) => ({ ...item, value: Math.max(1, Math.round(item.value * scale)) }))
  return [group.title, { data, total: data.reduce((sum, item) => sum + item.value, 0) }]
})))

// 生成 'YYYY-MM-DD HH:mm:ss' 格式的当前时间。
function formatNow() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// 刷新为演示流程：延迟 650ms 后只更新展示的更新时间，未真正请求接口。
async function refreshDashboard() {
  if (refreshing.value) return
  refreshing.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  updatedAt.value = formatNow()
  refreshing.value = false
  ElMessage.success('看板数据已刷新')
}
</script>

<template>
  <!-- 数据看板：顶部指标卡 → 概览三栏 → 三张折线图 → 环形图分组。 -->
  <main class="dashboard-page">
    <header class="dashboard-heading">
      <div>
        <h1>数据看板</h1>
        <p>官网核心运营数据一览 <i>·</i> 数据更新于 {{ updatedAt }}</p>
      </div>
      <el-button :loading="refreshing" @click="refreshDashboard">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </header>

    <!-- 指标卡整体可点击，跳转到对应的业务列表页。 -->
    <section class="metric-grid">
      <DashboardMetricCard
        v-for="item in dashboardMetrics"
        :key="item.id"
        v-bind="item"
        :icon="iconMap[item.icon]"
        class="clickable-card"
        @click="router.push(item.path)"
      />
    </section>

    <!-- 概览区：捐赠目标进度、待办事项、互动排行。 -->
    <section class="overview-grid">
      <DashboardPanel title="捐赠目标进度" description="数据来源：捐赠管理 · 捐赠目标" compact>
        <div class="goal-list">
          <button v-for="goal in donationGoals" :key="goal.name" type="button" class="goal-row" @click="router.push('/donations/goals')">
            <span class="goal-name"><b>{{ goal.name }}</b><small>{{ goal.status }}</small></span>
            <el-progress
              :percentage="goal.percent"
              :stroke-width="8"
              :show-text="false"
              :status="goal.percent === 100 ? 'success' : undefined"
            />
            <span class="goal-value">${{ goal.current }}万 / ${{ goal.target }}万 <b>· {{ goal.percent }}%</b></span>
          </button>
        </div>
      </DashboardPanel>

      <DashboardPanel title="待办事项" description="需要及时处理" compact>
        <button type="button" class="todo-row" @click="router.push('/volunteers/applications')">
          <span class="todo-icon">审</span>
          <span class="todo-name">待审核义工申请</span>
          <span class="todo-action">前往处理 →</span>
          <b>12 条</b>
        </button>
      </DashboardPanel>

      <DashboardPanel title="用户评测互动数据" description="累计参与次数" compact>
        <ol class="ranking-list">
          <li v-for="item in interactionRanking" :key="item.name">
            <span>{{ item.name }}</span><b>{{ item.count.toLocaleString() }} 次</b>
          </li>
        </ol>
      </DashboardPanel>
    </section>

    <!-- 折线图：标题右侧挂时间范围切换，纵轴上限在「今日」时固定。 -->
    <DashboardPanel class="chart-panel" title="用户行为数据">
      <template #actions>
        <DashboardRangeTabs v-model="ranges.behavior" v-model:date-range="dateRanges.behavior" />
      </template>
      <DashboardLineChart :labels="chartLabels" :series="behaviorData" :max="ranges.behavior === 'today' ? 39000 : undefined" />
    </DashboardPanel>

    <DashboardPanel class="chart-panel" title="交易金额数据统计">
      <template #actions>
        <DashboardRangeTabs v-model="ranges.amount" v-model:date-range="dateRanges.amount" />
      </template>
      <DashboardLineChart :labels="chartLabels" :series="amountData" :max="ranges.amount === 'today' ? 75000 : undefined" unit="$" />
    </DashboardPanel>

    <DashboardPanel class="chart-panel" title="交易订单数据统计">
      <template #actions>
        <DashboardRangeTabs v-model="ranges.order" v-model:date-range="dateRanges.order" />
      </template>
      <DashboardLineChart :labels="chartLabels" :series="orderData" :max="ranges.order === 'today' ? 1000 : undefined" />
    </DashboardPanel>

    <!-- 环形图分组，每组自带时间范围切换与图例列表。 -->
    <section class="donut-grid">
      <DashboardPanel v-for="group in donutGroups" :key="group.title" :title="group.title" :description="group.description" compact>
        <template #actions>
          <DashboardRangeTabs v-model="ranges.donuts[group.title]" v-model:date-range="dateRanges.donuts[group.title]" />
        </template>
        <div class="donut-content">
          <DashboardDonutChart :data="donutData[group.title].data" :total="donutData[group.title].total" />
          <ul>
            <li v-for="item in donutData[group.title].data" :key="item.name">
              <span>{{ item.name }}</span>
              <b>{{ item.value }}</b>
              <small>{{ Math.round(item.value / donutData[group.title].total * 100) }}%</small>
            </li>
          </ul>
        </div>
      </DashboardPanel>
    </section>
  </main>
</template>

<style scoped lang="less">
.dashboard-page {
  padding: 16px 26px 36px;
}

.dashboard-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin: 0 0 22px;
  padding-left: 17px;
  position: relative;

  &::before {
    position: absolute;
    top: 4px;
    bottom: 2px;
    left: 0;
    width: 4px;
    content: '';
    background: linear-gradient(180deg, var(--admin-primary), var(--admin-primary-light-7));
    border-radius: var(--admin-radius-pill);
  }

  h1 {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 23px;
    font-weight: 650;
  }

  p {
    margin: 7px 0 0;
    color: var(--admin-text-placeholder);
    font-size: 12px;

    i { margin: 0 5px; font-style: normal; }
  }

  .el-button {
    height: 36px;
    color: var(--admin-primary);
    background: var(--admin-surface);
    border-color: var(--admin-border-strong);
    border-radius: 8px;
  }
}

/* 四列指标卡，窄屏降为两列。 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.clickable-card {
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: var(--admin-primary-light-7);
    box-shadow: 0 8px 20px rgba(46, 55, 70, 0.08);
    transform: translateY(-2px);
  }
}

/* 概览三栏，列宽比例按设计稿分配。 */
.overview-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.goal-list { display: grid; gap: 14px; }

.goal-row {
  width: 100%;
  display: grid;
  grid-template-columns: 132px minmax(90px, 1fr) 132px;
  align-items: center;
  gap: 10px;
  padding: 0;
  text-align: left;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.goal-name {
  display: flex;
  flex-direction: column;
  gap: 3px;

  b { color: var(--admin-text-regular); font-size: 12px; font-weight: 500; }
  small { color: var(--admin-text-muted); font-size: 10px; }
}

.goal-value {
  color: var(--admin-text-secondary);
  font-size: 11px;
  text-align: right;
  white-space: nowrap;

  b { color: var(--admin-primary); font-weight: 500; }
}

:deep(.goal-row .el-progress-bar__outer) { background: var(--admin-neutral-light); }

.todo-row {
  width: 100%;
  display: grid;
  grid-template-columns: 34px 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 9px 2px;
  color: var(--admin-text-regular);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: var(--admin-radius-md);
  cursor: pointer;

  &:hover { background: var(--admin-primary-lighter); }
  > b { color: var(--admin-text-muted); font-size: 11px; font-weight: 400; }
}

.todo-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: var(--admin-warning);
  background: var(--admin-warning-light);
  border-radius: var(--admin-radius-md);
}

.todo-name { font-size: 12px; }
.todo-action { color: var(--admin-primary); font-size: 11px; }

.ranking-list {
  display: grid;
  gap: 11px;
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--admin-text-regular);
    font-size: 12px;
  }

  b { color: var(--admin-text-secondary); font-size: 11px; font-weight: 400; }
}

.chart-panel { margin-top: 16px; }

/* 环形图三列；范围切换控件按比例缩小以适配窄卡片。 */
.donut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;

  :deep(.range-control) { transform: scale(0.9); transform-origin: right center; }
}

.donut-content {
  min-height: 156px;
  display: flex;
  align-items: center;
  gap: 12px;

  ul {
    min-width: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(90px, 1fr));
    flex: 1;
    gap: 8px 14px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 7px;
    color: var(--admin-text-regular);
    font-size: 11px;

    &::before {
      width: 7px;
      height: 7px;
      content: '';
      background: var(--admin-primary);
      border-radius: 50%;
    }

    span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    b { color: var(--admin-text-primary); font-weight: 500; }
    small { color: var(--admin-text-muted); }
  }
}

/* 中等屏幕：概览降为两列，环形图单列并铺开图例。 */
@media (max-width: 1480px) {
  .overview-grid { grid-template-columns: 1.15fr 1fr; }
  .overview-grid > :last-child { grid-column: 1 / -1; }
  .ranking-list { grid-template-columns: repeat(3, 1fr); column-gap: 26px; }
  .donut-grid { grid-template-columns: 1fr; }
  .donut-content ul { grid-template-columns: repeat(4, minmax(90px, 1fr)); }
}

/* 再窄一档：指标卡两列，概览与环形图均单列。 */
@media (max-width: 1220px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .overview-grid { grid-template-columns: 1fr; }
  .overview-grid > :last-child { grid-column: auto; }
  .ranking-list { grid-template-columns: repeat(2, 1fr); }
  .donut-content ul { grid-template-columns: repeat(3, minmax(90px, 1fr)); }
}
</style>
