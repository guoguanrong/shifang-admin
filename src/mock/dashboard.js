// 数据看板的演示数据：顶部指标、折线图序列、环形图分组等，接口接入后可整体替换。
export const dashboardMetrics = [
  { id: 'users', label: '平台注册用户（总）', value: '12,846', primaryTrend: '今日 86，环比 +23.0%', tone: 'primary', icon: 'user', path: '/users' },
  { id: 'donors', label: '捐赠用户（总）', value: '3,215', primaryTrend: '今日 23，环比 +23.0%', tone: 'brand', icon: 'wallet', path: '/donations/records' },
  { id: 'amount', label: '捐赠金额（总）', value: '$ 268.45万', primaryTrend: '今日 $8.6万，环比 +23.0%', tone: 'warning', icon: 'coin', path: '/donations/records' },
  { id: 'volunteers', label: '义工总数', value: '368', primaryTrend: '今日 6，环比 +12.5%', tone: 'primary', icon: 'avatar', path: '/volunteers' },
  { id: 'orders', label: '今日新增订单', value: '156', primaryTrend: '点灯 138，环比 +23.8%', secondaryTrend: '供奉 18，环比 -8.4%', secondaryDown: true, tone: 'brand', icon: 'ticket', path: '/orders/lamps' },
  { id: 'donations', label: '今日新增捐赠', value: '234 笔', primaryTrend: '今日 234，环比 +23.2%', tone: 'warning', icon: 'goods', path: '/donations/records' },
  { id: 'activities', label: '7日道会活动报名人数', value: '23 人', primaryTrend: '今日 23 人，环比 +23.2%', tone: 'danger', icon: 'calendar', path: '/activities/registrations' },
  { id: 'retention', label: '7日留存用户数', value: '8,930', primaryTrend: '7日留存率 60.6%，环比 +23.2%', tone: 'primary', icon: 'flag', path: '/users' },
]

export const donationGoals = [
  { name: '斗姆元君大殿建设', status: '进行中', current: 410, target: 500, percent: 82, tone: 'warning' },
  { name: '明代壁画保护修复', status: '已完成', current: 86, target: 86, percent: 100, tone: 'success' },
  { name: '护道基金', status: '已停止', current: 30, target: 100, percent: 30, tone: 'muted' },
]

export const interactionRanking = [
  { name: '道教抽签', count: 9873 },
  { name: '电子护身符', count: 8642 },
  { name: '运势评测', count: 7215 },
  { name: '节气提醒', count: 6120 },
  { name: '五行人格测试', count: 5480 },
  { name: '中国道教星座', count: 4936 },
]

export const chartLabels = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

export const behaviorSeries = [
  { name: '游客用户访问数', color: '#7a70b7', data: [9750, 9100, 10800, 16200, 24100, 30700, 31500, 28800, 24300, 22600, 27900, 33100, 32800, 33600, 21900, 14800, 11600, 14300, 16100, 19800, 14600, 9700, 5800, 4200] },
  { name: '用户注册', color: '#4a7bb5', data: [2100, 3200, 3900, 4700, 4100, 3900, 4500, 5900, 7200, 7900, 7500, 5300, 4400, 3800, 5400, 5600, 5900, 4300, 2700, 1500, 1500, 2200, 2400, 2300] },
  { name: '用户活跃', color: '#3d7c50', data: [900, 1400, 1800, 2700, 2500, 2300, 1300, 1000, 1300, 2700, 3900, 4100, 3800, 2800, 2300, 3600, 4500, 5700, 4900, 4000, 3100, 2200, 2500, 2400] },
  { name: '用户留存', color: '#c69b52', data: [220, 310, 330, 360, 420, 390, 410, 450, 480, 520, 580, 560, 530, 490, 460, 430, 450, 470, 510, 480, 450, 410, 380, 350] },
]

export const amountSeries = [
  { name: '线上点灯（$）', color: '#c69b52', data: [4800, 4200, 5100, 8200, 12100, 15700, 16100, 14900, 12600, 11800, 14100, 16600, 16500, 17000, 10900, 7400, 5600, 7200, 8100, 10100, 7300, 4700, 2800, 2100] },
  { name: '神像供奉（$）', color: '#4a7bb5', data: [2800, 2500, 2300, 1400, 1500, 2200, 3500, 3700, 3900, 2600, 1900, 2300, 3500, 5100, 6900, 5800, 4700, 3600, 3500, 4000, 4700, 5000, 3900, 3000] },
  { name: '随喜捐赠（$）', color: '#3d7c50', data: [18400, 27400, 33200, 39400, 33400, 32400, 36700, 48800, 59600, 65700, 61700, 44300, 37600, 31500, 44700, 46200, 49500, 34500, 23100, 12400, 13500, 18300, 22100, 23300] },
]

export const orderSeries = [
  { name: '线上点灯（单）', color: '#c69b52', data: [164, 148, 181, 268, 398, 506, 519, 470, 402, 374, 457, 542, 538, 550, 360, 241, 190, 231, 263, 329, 235, 160, 94, 72] },
  { name: '神像供奉（单）', color: '#4a7bb5', data: [23, 21, 20, 14, 15, 22, 34, 35, 37, 24, 15, 19, 28, 41, 53, 45, 36, 29, 28, 31, 39, 41, 32, 24] },
  { name: '随喜捐赠（单）', color: '#3d7c50', data: [68, 94, 121, 148, 123, 118, 137, 184, 221, 242, 228, 165, 142, 118, 164, 170, 185, 122, 82, 43, 48, 65, 82, 87] },
]

export const donutGroups = [
  {
    title: '线上点灯', description: '5 个灯型 · 单量', total: 130,
    data: [
      { name: '光明灯', value: 43 }, { name: '太岁灯', value: 26 }, { name: '文昌灯', value: 18 },
      { name: '财神灯', value: 21 }, { name: '药王灯', value: 22 },
    ],
  },
  {
    title: '神像供奉', description: '13 尊神像 · 单量', total: 13,
    data: [
      { name: '斗姆元君', value: 2 }, { name: '北斗九皇', value: 1 }, { name: '六十甲子大将', value: 2 },
      { name: '三官大帝', value: 1 }, { name: '文昌帝君', value: 2 }, { name: '财神赵公明', value: 2 },
      { name: '关圣帝君', value: 1 }, { name: '王灵官', value: 2 },
    ],
  },
  {
    title: '随喜捐赠', description: '捐钱 · 捐物 · 单量', total: 82,
    data: [{ name: '捐钱', value: 61 }, { name: '捐物', value: 21 }],
  },
]
