// 演示用线上点灯数据。
// initialLampMaterials 为物料包可选物品；initialOnlineLamps 为前台灯位配置。
// materials 存放已选物料包物品 id（最多 6 项）；litCount 来自订单管理，此处仅展示。
// matchGods 为灯型匹配的神像；同一神像同一时间只能被一款灯型匹配。
export const lampDeityOptions = [
  '斗姆元君',
  '北斗九皇',
  '六十甲子太岁',
  '三官大帝',
  '文昌帝君',
  '魁星帝君',
  '玄坛赵元帅',
  '王灵官',
  '关圣帝君',
  '东岳大帝',
  '九天应元雷声普化天尊',
]

export const initialLampMaterials = [
  { id: 'MAT-001', name: '香烛', price: 66, unit: '对', usage: '灯前供奉' },
  { id: 'MAT-002', name: '香油', price: 88, unit: '桶', usage: '添续油' },
  { id: 'MAT-003', name: '灯油', price: 30, unit: '壶', usage: '常明灯油' },
  { id: 'MAT-004', name: '疏文', price: 50, unit: '道', usage: '祈福疏文' },
  { id: 'MAT-005', name: '供花', price: 45, unit: '束', usage: '庄严灯前' },
  { id: 'MAT-006', name: '供果', price: 60, unit: '份', usage: '供养神明' },
  { id: 'MAT-007', name: '平安符', price: 50, unit: '道', usage: '护佑平安' },
  { id: 'MAT-008', name: '五色线', price: 35, unit: '条', usage: '结缘祈福' },
]

export const initialOnlineLamps = [
  { id: 'LAMP-001', name: '光明灯', description: '祈福延寿光明，逢考必过', applicable: '学业，考研，升学', tags: ['供奉全年', '含论文'], price: 99, materialPrice: 199, litCount: 3240, materials: ['MAT-001', 'MAT-003'], matchGods: ['北斗九皇'], image: '' },
  { id: 'LAMP-002', name: '太岁灯', description: '化解流年不利 · 保太岁平安', applicable: '本命年，犯太岁者适用', tags: ['供奉全年', '含论文'], price: 199, materialPrice: 199, litCount: 1860, materials: [], matchGods: ['六十甲子太岁', '东岳大帝'], image: '' },
  { id: 'LAMP-003', name: '文昌灯', description: '祈福学业进步，金榜题名', applicable: '备考，考研，晋职', tags: ['供奉全年', '含论文'], price: 129, materialPrice: 129, litCount: 1420, materials: ['MAT-004'], matchGods: ['文昌帝君', '魁星帝君'], image: '' },
  { id: 'LAMP-004', name: '财神灯', description: '财源顺遂事业，生意兴隆', applicable: '经营者，创业者，生意人', tags: ['供奉全年', '含论文'], price: 199, materialPrice: 199, litCount: 980, materials: [], matchGods: ['玄坛赵元帅', '关圣帝君'], image: '' },
  { id: 'LAMP-005', name: '药王灯', description: '祛病消灾延年，身心健康', applicable: '病者，病者家属，期望健康', tags: ['供奉全年', '含论文'], price: 99, materialPrice: 99, litCount: 1105, materials: [], matchGods: ['斗姆元君'], image: '' },
]
