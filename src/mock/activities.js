// 演示用活动数据（法会/祈福活动）。
// type: group 集体活动 / appointment 专场预约；timeType: fixed 固定时间 / specific 特定时间；
// timeMode: monthly 每月单日 / daily 每日时段；status 与产品原型五态保持一致；
// listed: true 上架 / false 暂不上架。quota 为 null 表示不限；registered 为 null 表示不展示报名人数（'—'）。
// timeText 为列表展示文本；其余时间字段供编辑弹窗回填。
export const initialActivities = [
  {
    id: 'ACT-001', title: '中元节 · 天官赐福道会', subtitle: '天官赐福 · 消灾解厄', tags: ['天官赐福', '消灾解厄'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 22, startTime: '09:00', endTime: '11:00', timeText: '2027-02-22 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: 0, quota: 400, deadline: '2027-02-21 18:00', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-002', title: '正月初九 · 玉皇圣帝诞辰', subtitle: '玉皇圣诞 · 祈福纳祥', tags: ['玉皇圣诞', '祈福纳祥'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 9, startTime: '09:00', endTime: '11:00', timeText: '2027-02-25 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: 0, quota: 300, deadline: '2027-02-14 18:00', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-003', title: '腊八 · 施粥祈福道会', subtitle: '腊八施粥 · 广结善缘', tags: ['腊八施粥', '广结善缘'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 8, startTime: '09:00', endTime: '11:00', timeText: '2027-01-26 09:00 - 11:00',
    location: '十方殿 · 山门广场', joinWay: '线上登记 / 线下亲临', registered: 0, quota: 300, deadline: '2027-01-25 18:00', status: 'pending', listed: false,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-004', title: '下元节 · 水官解厄道会', subtitle: '水官解厄 · 消灾厄运', tags: ['水官解厄', '消灾厄运'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 23, startTime: '09:00', endTime: '11:00', timeText: '2026-11-23 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: 42, quota: 400, deadline: '2026-11-22 18:00', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-005', title: '北斗九皇诞 · 拜斗消灾延寿', subtitle: '九皇圣诞 · 拜斗延寿', tags: ['拜斗延寿', '消灾解厄'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 18, startTime: '09:00', endTime: '10:30', timeText: '2026-10-18 09:00 - 10:30',
    location: '十方殿 · 斗姆殿', joinWay: '线上登记 / 线下亲临', registered: 258, quota: 500, deadline: '2026-10-17 18:00', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-006', title: '中元节 · 地官赦罪道会', subtitle: '地官赦罪 · 追思超度', tags: ['追思超度', '疏文星递', '线上登记'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 15, startTime: '09:00', endTime: '11:00', timeText: '2026-08-27 09:00 - 11:00',
    location: '十方殿 · 斗姆元君大殿', joinWay: '线上登记 / 线下亲临', registered: 196, quota: 500, deadline: '2026-08-26 18:00', status: 'ended', listed: true,
    images: [
      { url: '', label: '中元坛场', caption: '香云缭绕 · 庄严如法' },
      { url: '', label: '高功诵经', caption: '依科演教 · 环环相扣' },
      { url: '', label: '十方善信', caption: '同愿同行 · 心愿上达' },
    ],
    intro: '地官赦罪,追思超度,慎终追远。中元节为地官大帝圣诞,亦是地官赦罪之日……',
    rituals: [
      { title: '开坛请圣', subtitle: '洒净坛场,恭请地官大帝降临坛场' },
      { title: '诵经礼忏', subtitle: '依科演教,诵经礼忏,庄严如法' },
    ],
    benefits: ['追思超度', '为历代宗亲、故去亲人超度祈福', '赦解解厄', '化解一年灾厄与不顺'],
    audiences: ['追思先人者', '求赦解厄者', '重视传统孝道者'],
  },
  {
    id: 'ACT-007', title: '清明祈福道会 · 追思超度', subtitle: '清明追思 · 慎终追远', tags: ['清明追思', '超度先人'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 4, startTime: '09:00', endTime: '11:00', timeText: '2026-04-04 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: null, quota: 400, deadline: '2026-04-03 18:00', status: 'ended', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-008', title: '春季祈福道会', subtitle: '开春祈福 · 恭迎神诞', tags: ['开春祈福', '恭迎神诞'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 21, startTime: '09:00', endTime: '11:00', timeText: '2026-03-21 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: null, quota: 400, deadline: '2026-03-20 18:00', status: 'ended', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-009', title: '朔望祈福共修道会', subtitle: '每月初一 · 十五 共修道业', tags: ['朔望共修', '疏文星递', '消灾解厄'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 15, startTime: '09:00', endTime: '11:00', timeText: '每月 1/15 日 09:00 - 11:00',
    location: '线上', joinWay: '线上登记 / 线下亲临', registered: 86, quota: 200, deadline: '每月十四前一天', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-010', title: '消灾祈福 · 顺天应时', subtitle: '消灾解厄 · 太岁化解', tags: ['消灾解厄', '太岁化解', '逢本命年'],
    type: 'appointment', timeType: 'specific', timeMode: 'monthly', monthDay: 1, startTime: '09:00', endTime: '11:00', timeText: '预约制 · 提前 3 日',
    location: '线上', joinWay: '线上登记 / 线下亲临', registered: 312, quota: null, deadline: '长期开放', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-011', title: '专场祈福 · 个人及全家', subtitle: '预约制 · 每人可约', tags: ['预约制', '每人可约', '专场独立记录'],
    type: 'appointment', timeType: 'specific', timeMode: 'monthly', monthDay: 1, startTime: '09:00', endTime: '11:00', timeText: '预约制 · 提前 3 日',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: 48, quota: null, deadline: '长期开放', status: 'enrolling', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-012', title: '重阳登高祈福道会', subtitle: '重阳敬老 · 祈福延年', tags: ['重阳祈福', '敬老延年'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 9, startTime: '09:00', endTime: '11:00', timeText: '2025-10-29 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: null, quota: 400, deadline: '2025-10-28 18:00', status: 'ended', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
  {
    id: 'ACT-013', title: '冬至 · 元始天尊圣诞道会', subtitle: '冬至一阳生 · 祈福迎祥', tags: ['冬至祈福', '迎祥纳福'],
    type: 'group', timeType: 'fixed', timeMode: 'monthly', monthDay: 22, startTime: '09:00', endTime: '11:00', timeText: '2025-12-21 09:00 - 11:00',
    location: '十方殿', joinWay: '线上登记 / 线下亲临', registered: null, quota: 400, deadline: '2025-12-20 18:00', status: 'ended', listed: true,
    images: [], intro: '', rituals: [], benefits: [], audiences: [],
  },
]

// 法会地点下拉选项（与 mock 数据中的地点保持一致）。
export const activityLocationOptions = ['十方殿', '十方殿 · 斗姆元君大殿', '十方殿 · 斗姆殿', '十方殿 · 山门广场', '线上']
