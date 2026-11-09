import http from './http'

// 首页数据统计接口（Apifox：首页统计模块）。全部 GET、无 body；
// 带 rangeType 的接口：startDate/endDate 仅自定义档必填。

// 顶部指标卡汇总：DataStatVo（注册/捐赠用户/金额/义工/今日订单/7日报名 + 各环比）。
export function getDashboardStats() {
  return http.get('/data/stat/dashboard')
}

// 捐赠目标进度：[{ id, title, targetAmount, completedAmount, status, progress }]
export function getDonateTargetProgress() {
  return http.get('/data/stat/donate-target-progress')
}

// 待办事项：[{ key, count }]
export function getTodoList() {
  return http.get('/data/stat/todo-list')
}

// 互动统计：{ divinationCount 抽签, amuletCount 护身符, fortuneCount 运势, solarTermsCount 节气, constellationCount 星座 }
export function getInteractionStat() {
  return http.get('/data/stat/interaction')
}

// ── 折线图类：rangeType 1.本月 / 2.上月 / 3.自定义(startDate+endDate 必填) ──

// 交易金额序列：[{ date, lightAmount, worshipAmount, donateAmount }]
export function getTransactionAmountStat(params) {
  return http.get('/data/stat/transaction-amount', { params })
}

// 交易订单序列：[{ date, lightCount, worshipCount, donateCount }]
export function getTransactionOrderStat(params) {
  return http.get('/data/stat/transaction-order-count', { params })
}

// ── 环形图类：rangeType 1.今日 / 2.昨日 / 3.近7日 / 4.近30日 / 5.自定义(startDate+endDate 必填) ──

// 点灯灯型分布：[{ lightName, orderCount }]
export function getLightOrderStat(params) {
  return http.get('/data/stat/light-order', { params })
}

// 神像供奉分布：[{ matchGod, orderCount }]
export function getWorshipOrderStat(params) {
  return http.get('/data/stat/worship-order', { params })
}

// 捐赠类型分布：[{ donateType(1.捐钱 2.捐物), orderCount }]
export function getDonateOrderStat(params) {
  return http.get('/data/stat/donate-order', { params })
}

// 活动报名分布：[{ activityId, title, registerCount }]
export function getActivityRegisterStat(params) {
  return http.get('/data/stat/activity-register', { params })
}

// 用户来源渠道分布：[{ source, registerCount }]
export function getMemberSourceStat(params) {
  return http.get('/data/stat/member-source', { params })
}
