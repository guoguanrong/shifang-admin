// 演示用义工数据（申请审核通过后进入此列表）。
// status: normal 正常 / suspended 禁止参加（suspended 时必填 suspendReason）。
export const initialVolunteers = [
  { id: 'VOL-0001', name: '黄文博', phone: '15810152360', post: '道场护持', availableTime: '均可', joinedAt: '2026-08-18 11:18:46', declaration: '愿以供养之心服务十方善信。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0002', name: '冯素珍', phone: '18710193012', post: '道会协助', availableTime: '周末', joinedAt: '2026-08-16 08:05:17', declaration: '愿在道会期间协助引导信众与现场秩序。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0003', name: '高淑芬', phone: '15010126638', post: '文宣服务', availableTime: '节假日', joinedAt: '2026-04-22 11:36:40', declaration: '可协助海报、推文等宣传物料制作。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0004', name: '刘冬梅', phone: '13310019086', post: '道会协助', availableTime: '均可', joinedAt: '2026-03-08 14:10:42', declaration: '熟悉道会流程，可协助斋堂事务。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0005', name: '陈国栋', phone: '18610185593', post: '线上服务', availableTime: '周末', joinedAt: '2026-02-14 11:57:13', declaration: '互联网从业者，可协助线上运营与维护。', status: 'suspended', suspendReason: '多次无故缺席活动安排' },
  { id: 'VOL-0006', name: '杨志刚', phone: '13510034472', post: '道场护持', availableTime: '周末', joinedAt: '2026-01-25 08:23:11', declaration: '喜欢园艺，愿协助庭院草木修剪。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0007', name: '徐凤英', phone: '13910082210', post: '文宣服务', availableTime: '节假日', joinedAt: '2025-12-19 08:44:44', declaration: '擅长摄影摄像，可记录道场活动。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0008', name: '王道明', phone: '13010007741', post: '道场护持', availableTime: '均可', joinedAt: '2025-11-02 14:31:15', declaration: '在道观做志工多年，熟悉殿堂值守。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0009', name: '赵青岚', phone: '13610357715', post: '文宣服务', availableTime: '周末', joinedAt: '2025-10-12 09:20:33', declaration: '常往来宫观与香客之间，可协助接待导览。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0010', name: '孙海涛', phone: '13910994545', post: '线上服务', availableTime: '均可', joinedAt: '2025-09-28 16:05:52', declaration: '退休教师，愿协助线上答疑与留言整理。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0011', name: '郑素心', phone: '15110136889', post: '道会协助', availableTime: '节假日', joinedAt: '2025-09-05 10:47:26', declaration: '家离道观较近，道会期间可随叫随到。', status: 'normal', suspendReason: '' },
  { id: 'VOL-0012', name: '何明轩', phone: '13510448820', post: '道场护持', availableTime: '周末', joinedAt: '2025-08-17 19:03:21', declaration: '愿协助殿堂洒扫与香烛布置。', status: 'normal', suspendReason: '' },
]
