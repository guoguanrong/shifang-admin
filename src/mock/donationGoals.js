// 演示用捐赠目标数据。
// type: fund 捐钱 / goods 捐物；status: running 进行中 / achieved 已完成 / stopped 已停止。
// targetAmount / raisedAmount 单位为元，展示时换算为「万」。
export const initialDonationGoals = [
  { id: 'GOAL-001', title: '斗姆元君大殿建设', subtitle: '神殿基建 · 一期工程', type: 'fund', targetAmount: 4999998, raisedAmount: 0, status: 'running', createdAt: '2026-09-08 23:24:27', tiers: [50, 199, 999, 9999], image: '' },
  { id: 'GOAL-002', title: '斗姆元君大殿重塑', subtitle: '神殿重塑 · 一期工程', type: 'fund', targetAmount: 5000000, raisedAmount: 4100000, status: 'stopped', createdAt: '2026-01-01 09:00:00', tiers: [100, 599, 1999, 9999], image: '' },
  { id: 'GOAL-003', title: '明代祖师殿保护修复', subtitle: '文物保护 · 修复中', type: 'fund', targetAmount: 860000, raisedAmount: 860000, status: 'achieved', createdAt: '2025-03-01 09:00:00', tiers: [50, 199, 999, 9999], image: '' },
  { id: 'GOAL-004', title: '《道德》数字化工程', subtitle: '文存工程 · 三期', type: 'fund', targetAmount: 3000000, raisedAmount: 1350000, status: 'stopped', createdAt: '2026-05-01 09:00:00', tiers: [50, 199, 999, 9999], image: '' },
  { id: 'GOAL-005', title: '护道基金', subtitle: '日常维护基金', type: 'goods', targetAmount: 1000000, raisedAmount: 300000, status: 'stopped', createdAt: '2025-09-01 09:00:00', tiers: [50, 199, 999, 9999], image: '' },
]
