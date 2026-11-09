<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Avatar, Calendar, Coin, Goods, Refresh, Ticket, User, Wallet } from '@element-plus/icons-vue'
import DashboardMetricCard from '../components/dashboard/DashboardMetricCard.vue'
import DashboardPanel from '../components/dashboard/DashboardPanel.vue'
import DashboardRangeTabs from '../components/dashboard/DashboardRangeTabs.vue'
import DashboardDonutChart from '../components/dashboard/charts/DashboardDonutChart.vue'
import DashboardLineChart from '../components/dashboard/charts/DashboardLineChart.vue'
import {
  getActivityRegisterStat,
  getDashboardStats,
  getDonateOrderStat,
  getDonateTargetProgress,
  getInteractionStat,
  getLightOrderStat,
  getMemberSourceStat,
  getTodoList,
  getTransactionAmountStat,
  getTransactionOrderStat,
  getWorshipOrderStat,
} from '../services/dashboardApi'

defineOptions({ name: 'DashboardView' })

const router = useRouter()
// 刷新按钮的 loading 状态与「数据更新于」时间。
const refreshing = ref(false)
const updatedAt = ref('—')
// mock 数据只提供图标名，映射到 Element Plus 图标组件。
const iconMap = { user: User, wallet: Wallet, coin: Coin, avatar: Avatar, ticket: Ticket, goods: Goods, calendar: Calendar }

// 顶部指标卡（顺序即展示顺序）；数据由 /data/stat/dashboard 填充。
const metrics = reactive([
  { id: 'users', label: '平台注册用户（总）', value: '—', primaryTrend: '', tone: 'primary', icon: 'user', path: '/users' },
  { id: 'donors', label: '捐赠用户（总）', value: '—', primaryTrend: '', tone: 'brand', icon: 'wallet', path: '/donations/records' },
  { id: 'amount', label: '捐赠金额（总）', value: '—', primaryTrend: '', tone: 'warning', icon: 'coin', path: '/donations/records' },
  { id: 'volunteers', label: '义工总数', value: '—', primaryTrend: '', tone: 'primary', icon: 'avatar', path: '/volunteers' },
  { id: 'orders', label: '今日新增订单', value: '—', primaryTrend: '', secondaryTrend: '', secondaryDown: false, tone: 'brand', icon: 'ticket', path: '/orders/lamps' },
  { id: 'donations', label: '今日新增捐赠', value: '—', primaryTrend: '', tone: 'warning', icon: 'goods', path: '/donations/records' },
  { id: 'activities', label: '7日道会活动报名人数', value: '—', primaryTrend: '', tone: 'danger', icon: 'calendar', path: '/activities/registrations' },
])
const iconFor = (name) => iconMap[name] || Ticket

// 数值格式化：千分位；金额按系统惯例以 $ 展示（后端返回数值，单位注记为元）。
function formatCount(value) {
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-US') : '—'
}

function formatMoney(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (num >= 10000) return `$ ${(Math.round(num / 100) / 100).toLocaleString('en-US')}万`
  return `$ ${num.toLocaleString('en-US')}`
}

// 环比格式化：数值按百分比展示，字符串原样，空值占位。
function formatTrend(value) {
  if (value === null || value === undefined || value === '') return '环比 —'
  if (typeof value === 'number') return `环比 ${value >= 0 ? '+' : ''}${value}%`
  return `环比 ${value}`
}

// 拉取指标卡汇总，失败时保留占位不影响其他模块。
async function loadMetrics() {
  try {
    const data = await getDashboardStats()
    metrics[0].value = formatCount(data?.platformRegisterUserTotal)
    metrics[0].primaryTrend = `今日 ${formatCount(data?.todayPlatformRegisterUser)}，${formatTrend(data?.platformRegisterUserTrend)}`
    metrics[1].value = formatCount(data?.donateUserTotal)
    metrics[1].primaryTrend = `今日 ${formatCount(data?.todayNewDonateUser)}，${formatTrend(data?.donateUserTrend)}`
    metrics[2].value = formatMoney(data?.donateAmountTotal)
    metrics[2].primaryTrend = `今日 ${formatMoney(data?.todayDonateAmount)}，${formatTrend(data?.donateAmountTrend)}`
    metrics[3].value = formatCount(data?.volunteerTotal)
    metrics[3].primaryTrend = `今日 ${formatCount(data?.todayVolunteer)}，${formatTrend(data?.volunteerTrend)}`
    metrics[4].value = formatCount(data?.todayOrderTotal)
    metrics[4].primaryTrend = `点灯 ${formatCount(data?.todayLightOrder)}，${formatTrend(data?.todayLightOrderTrend)}`
    metrics[4].secondaryTrend = `供奉 ${formatCount(data?.todayWorshipOrder)}，${formatTrend(data?.todayWorshipOrderTrend)}`
    metrics[4].secondaryDown = String(data?.todayWorshipOrderTrend || '').startsWith('-')
    metrics[5].value = `${formatCount(data?.todayDonateOrder)} 笔`
    metrics[5].primaryTrend = `今日 ${formatCount(data?.todayDonateOrder)}，${formatTrend(data?.todayDonateOrderTrend)}`
    metrics[6].value = `${formatCount(data?.sevenDayActivityRegisterTotal)} 人`
    metrics[6].primaryTrend = `今日 ${formatCount(data?.todayActivityRegister)}，${formatTrend(data?.activityRegisterTrend)}`
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取看板指标失败')
  }
}

// ── 捐赠目标进度 ──
const GOAL_STATUS_TEXT = { 1: '进行中', 2: '已完成', 3: '已停止' }
const donationGoals = ref([])

// 统一取数组：兼容数组与 {list} 包装两种返回。
function asList(payload) {
  if (Array.isArray(payload)) return payload
  return Array.isArray(payload?.list) ? payload.list : []
}

async function loadGoalProgress() {
  try {
    const rows = asList(await getDonateTargetProgress())
    donationGoals.value = rows.map((row) => ({
      id: row.id,
      name: row.title || '—',
      status: GOAL_STATUS_TEXT[Number(row.status)] || '—',
      percent: Math.max(0, Math.min(100, Math.round(Number(row.progress) || 0))),
      current: Math.round(Number(row.completedAmount) / 10000 * 100) / 100,
      target: Math.round(Number(row.targetAmount) / 10000 * 100) / 100,
    }))
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取捐赠目标进度失败')
  }
}

// ── 待办事项 ──
// key 是后端标识，文案与跳转路径由前端映射；未识别的 key 兜底展示原值且不可跳转。
const TODO_META = {
  volunteer: { label: '待审核义工申请', path: '/volunteers/applications' },
}
const todos = ref([])

async function loadTodos() {
  try {
    const rows = asList(await getTodoList())
    todos.value = rows.map((row) => ({
      key: row.key,
      count: Number(row.count) || 0,
      ...(TODO_META[row.key] || { label: row.key, path: '' }),
    }))
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取待办事项失败')
  }
}

function goTodo(todo) {
  if (todo.path) router.push(todo.path)
}

// ── 互动统计 ──
const INTERACTION_LABELS = {
  divinationCount: '道教抽签',
  amuletCount: '电子护身符',
  fortuneCount: '运势评测',
  solarTermsCount: '节气提醒',
  constellationCount: '道教星座',
}
const interactionRanking = ref([])

async function loadInteraction() {
  try {
    const data = await getInteractionStat()
    interactionRanking.value = Object.entries(INTERACTION_LABELS)
      .map(([key, label]) => ({ name: label, count: Number(data?.[key]) || 0 }))
      .sort((a, b) => b.count - a.count)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取互动统计失败')
  }
}

// ── 折线图：交易金额 / 交易订单（rangeType 1.本月 2.上月 3.自定义）──
const amountRange = reactive({ range: 'month', dateRange: [] })
const orderRange = reactive({ range: 'month', dateRange: [] })
const amountData = ref({ labels: [], series: [] })
const orderData = ref({ labels: [], series: [] })
const amountMax = ref(undefined)

// 折线参数映射：本月/上月走枚举，自定义转 startDate/endDate。
function buildRangeParams(range, dateRange) {
  if (range === 'custom' && dateRange?.length === 2) {
    return { rangeType: 3, startDate: dateRange[0], endDate: dateRange[1] }
  }
  return { rangeType: range === 'lastMonth' ? 2 : 1 }
}

async function loadTransactionAmount() {
  try {
    const rows = asList(await getTransactionAmountStat(buildRangeParams(amountRange.range, amountRange.dateRange)))
    amountData.value = {
      labels: rows.map((row) => row.date),
      series: [
        { name: '线上点灯（$）', data: rows.map((row) => Number(row.lightAmount) || 0) },
        { name: '神像供奉（$）', data: rows.map((row) => Number(row.worshipAmount) || 0) },
        { name: '随喜捐赠（$）', data: rows.map((row) => Number(row.donateAmount) || 0) },
      ],
    }
    amountMax.value = undefined
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取交易金额统计失败')
  }
}

async function loadTransactionOrder() {
  try {
    const rows = asList(await getTransactionOrderStat(buildRangeParams(orderRange.range, orderRange.dateRange)))
    orderData.value = {
      labels: rows.map((row) => row.date),
      series: [
        { name: '线上点灯（单）', data: rows.map((row) => Number(row.lightCount) || 0) },
        { name: '神像供奉（单）', data: rows.map((row) => Number(row.worshipCount) || 0) },
        { name: '随喜捐赠（单）', data: rows.map((row) => Number(row.donateCount) || 0) },
      ],
    }
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取交易订单统计失败')
  }
}

// ── 环形图：五组分布（rangeType 1.今日 2.昨日 3.近7日 4.近30日 5.自定义）──
const DONUT_RANGE_VALUE = { today: 1, yesterday: 2, '7d': 3, '30d': 4, custom: 5 }
const donutDefs = [
  { key: 'light', title: '线上点灯', description: '灯型 · 完成订单数', fetcher: getLightOrderStat, map: (row) => ({ name: row.lightName || '—', value: Number(row.orderCount) || 0 }) },
  { key: 'worship', title: '神像供奉', description: '神像 · 完成订单数', fetcher: getWorshipOrderStat, map: (row) => ({ name: row.matchGod || '—', value: Number(row.orderCount) || 0 }) },
  { key: 'donate', title: '随喜捐赠', description: '捐钱 · 捐物 · 完成订单数', fetcher: getDonateOrderStat, map: (row) => ({ name: Number(row.donateType) === 2 ? '捐物' : '捐钱', value: Number(row.orderCount) || 0 }) },
  { key: 'activity', title: '活动报名', description: '按活动 · 报名人数', fetcher: getActivityRegisterStat, map: (row) => ({ name: row.title || '—', value: Number(row.registerCount) || 0 }) },
  { key: 'source', title: '用户来源', description: '按渠道 · 注册人数', fetcher: getMemberSourceStat, map: (row) => ({ name: row.source || '—', value: Number(row.registerCount) || 0 }) },
]
const donutRanges = reactive(Object.fromEntries(donutDefs.map((def) => [def.key, { range: 'today', dateRange: [] }])))
const donutData = reactive(Object.fromEntries(donutDefs.map((def) => [def.key, { data: [], total: 0 }])))

async function loadDonut(def) {
  const { range, dateRange } = donutRanges[def.key]
  const params = range === 'custom' && dateRange?.length === 2
    ? { rangeType: DONUT_RANGE_VALUE.custom, startDate: dateRange[0], endDate: dateRange[1] }
    : { rangeType: DONUT_RANGE_VALUE[range] || 1 }
  try {
    const rows = asList(await def.fetcher(params))
    const data = rows.map(def.map)
    donutData[def.key] = { data, total: data.reduce((sum, item) => sum + item.value, 0) }
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || `获取${def.title}统计失败`)
  }
}

// 生成 'YYYY-MM-DD HH:mm:ss' 格式的当前时间。
function formatNow() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// 刷新：重新拉取全部模块数据。
async function refreshDashboard() {
  if (refreshing.value) return
  refreshing.value = true
  await Promise.allSettled([
    loadMetrics(),
    loadGoalProgress(),
    loadTodos(),
    loadInteraction(),
    loadTransactionAmount(),
    loadTransactionOrder(),
    ...donutDefs.map((def) => loadDonut(def)),
  ])
  updatedAt.value = formatNow()
  refreshing.value = false
  ElMessage.success('看板数据已刷新')
}

onMounted(refreshDashboard)
</script>

<template>
  <!-- 数据看板：顶部指标卡 → 概览三栏 → 折线图 → 环形图分组。 -->
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
        v-for="item in metrics"
        :key="item.id"
        v-bind="item"
        :icon="iconFor(item.icon)"
        class="clickable-card"
        @click="item.path && router.push(item.path)"
      />
    </section>

    <!-- 概览区：捐赠目标进度、待办事项、互动排行。 -->
    <section class="overview-grid">
      <DashboardPanel title="捐赠目标进度" description="数据来源：捐赠管理 · 捐赠内容" compact>
        <div v-if="donationGoals.length" class="goal-list">
          <button v-for="goal in donationGoals" :key="goal.id" type="button" class="goal-row" @click="router.push('/donations/goals')">
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
        <p v-else class="empty-hint">暂无捐赠目标</p>
      </DashboardPanel>

      <DashboardPanel title="待办事项" description="需要及时处理" compact>
        <template v-if="todos.length">
          <button
            v-for="todo in todos"
            :key="todo.key"
            type="button"
            class="todo-row"
            @click="goTodo(todo)"
          >
            <span class="todo-icon">审</span>
            <span class="todo-name">{{ todo.label }}</span>
            <span v-if="todo.path" class="todo-action">前往处理 →</span>
            <b>{{ todo.count }} 条</b>
          </button>
        </template>
        <p v-else class="empty-hint">暂无待办</p>
      </DashboardPanel>

      <DashboardPanel title="用户评测互动数据" description="累计参与次数" compact>
        <ol class="ranking-list">
          <li v-for="item in interactionRanking" :key="item.name">
            <span>{{ item.name }}</span><b>{{ item.count.toLocaleString() }} 次</b>
          </li>
        </ol>
      </DashboardPanel>
    </section>

    <!-- 折线图：交易类统计按「本月 / 上月 / 自定义」切换。 -->
    <DashboardPanel class="chart-panel" title="交易金额数据统计">
      <template #actions>
        <DashboardRangeTabs v-model="amountRange.range" v-model:date-range="amountRange.dateRange" mode="monthly" />
      </template>
      <DashboardLineChart :labels="amountData.labels" :series="amountData.series" :max="amountMax" unit="$" />
    </DashboardPanel>

    <DashboardPanel class="chart-panel" title="交易订单数据统计">
      <template #actions>
        <DashboardRangeTabs v-model="orderRange.range" v-model:date-range="orderRange.dateRange" mode="monthly" />
      </template>
      <DashboardLineChart :labels="orderData.labels" :series="orderData.series" />
    </DashboardPanel>

    <!-- 环形图分组，每组自带时间范围切换与图例列表。 -->
    <section class="donut-grid">
      <DashboardPanel v-for="def in donutDefs" :key="def.key" :title="def.title" :description="def.description" compact>
        <template #actions>
          <DashboardRangeTabs
            v-model="donutRanges[def.key].range"
            v-model:date-range="donutRanges[def.key].dateRange"
          />
        </template>
        <div class="donut-content">
          <DashboardDonutChart :data="donutData[def.key].data" :total="donutData[def.key].total" />
          <ul v-if="donutData[def.key].data.length">
            <li v-for="item in donutData[def.key].data" :key="item.name">
              <span>{{ item.name }}</span>
              <b>{{ item.value }}</b>
              <small>{{ donutData[def.key].total ? Math.round(item.value / donutData[def.key].total * 100) : 0 }}%</small>
            </li>
          </ul>
          <p v-else class="empty-hint">暂无数据</p>
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

.empty-hint {
  margin: 6px 0;
  color: var(--admin-text-muted);
  font-size: 12px;
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

/* 环形图三列布局（5 组自动换行为 3+2）；范围切换控件按比例缩小以适配窄卡片。 */
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
  .donut-grid { grid-template-columns: 1fr 1fr; }
  .donut-content ul { grid-template-columns: repeat(4, minmax(90px, 1fr)); }
}

/* 再窄一档：指标卡两列，概览与环形图均单列。 */
@media (max-width: 1220px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .overview-grid { grid-template-columns: 1fr; }
  .overview-grid > :last-child { grid-column: auto; }
  .ranking-list { grid-template-columns: repeat(2, 1fr); }
  .donut-grid { grid-template-columns: 1fr; }
  .donut-content ul { grid-template-columns: repeat(3, minmax(90px, 1fr)); }
}
</style>
