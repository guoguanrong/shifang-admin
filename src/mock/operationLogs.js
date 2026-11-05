// 演示用操作日志数据（后台所有账号的操作留痕，仅超级管理员可见）。
export const initialOperationLogs = [
  { id: 'LOG-1208', operator: '管理员(admin)', module: '活动管理', action: '发布活动', detail: '发布活动「端午 · 祈福纳祥道会」', ip: '192.168.1.10', time: '2026-08-21 22:00:11' },
  { id: 'LOG-1207', operator: '道慧(niaorong01)', module: '动态管理', action: '编辑动态', detail: '编辑动态「中元节 · 地官赦罪道会筹备公告」', ip: '192.168.1.23', time: '2026-08-21 18:22:28' },
  { id: 'LOG-1206', operator: '道远(hudong01)', module: '活动管理', action: '编辑报名', detail: '修改中元节道会报名 1 名(徐敏敏)', ip: '192.168.1.31', time: '2026-08-21 16:40:45' },
  { id: 'LOG-1205', operator: '道远(caiwu01)', module: '资金公示', action: '新增支出', detail: '新增支出 ZC-2026-0821-02 大殿彩绘原料采购', ip: '192.168.1.45', time: '2026-08-21 14:05:02' },
  { id: 'LOG-1204', operator: '道安(yigong01)', module: '义工管理', action: '审核申请', detail: '通过义工申请 1 条(陈文文 · 道场维护)', ip: '192.168.1.52', time: '2026-08-21 11:30:19' },
  { id: 'LOG-1203', operator: '道慈(kefu01)', module: '用户管理', action: '查看用户', detail: '查看用户「张慧敏」详情', ip: '192.168.1.60', time: '2026-08-21 10:12:36' },
  { id: 'LOG-1202', operator: '管理员(admin)', module: '权限管理', action: '重置密码', detail: '重置账号 shibo01 密码', ip: '192.168.1.10', time: '2026-08-20 21:36:53' },
  { id: 'LOG-1201', operator: '道时(waiwei01)', module: '多语言', action: '更新词条', detail: '更新英文词条「共修十方」翻译', ip: '192.168.1.70', time: '2026-08-20 15:18:10' },
]

// 操作模块下拉选项（与 mock 数据中的模块保持一致）。
export const logModuleOptions = [
  '活动管理',
  '动态管理',
  '资金公示',
  '义工管理',
  '用户管理',
  '权限管理',
  '多语言',
]
