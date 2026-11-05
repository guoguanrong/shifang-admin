// 演示用动态数据。
// status: shown 展示中 / hidden 隐藏中；reads 为阅读量，null 表示未公布（展示 '—'）。
// images 为前台动态卡片图片（最多 6 张）。
export const initialNews = [
  {
    id: 'NEWS-0001', title: '斗姆元君大殿上梁大典圆满举行',
    detail: '上梁大典于农历吉日举行,依古制行科演教,百余名善信现场观礼,共沐大殿焕新祥和圆满殊胜。',
    blessing: '愿十方善信共沐道恩,大殿功成,香火绵延,福泽十方。',
    reads: 2386, createdAt: '2026-08-18 09:50:17', status: 'shown', images: [],
  },
  {
    id: 'NEWS-0002', title: '明代祖师殿保护修复工程启动',
    detail: '修复工程由文物保护专家团队主持,遵循最小干预原则,对全部13幅壁画进行背光检测与数字化建档,预计耗时36个月。',
    blessing: '匠心护道统,愿千年祖师殿焕彩重现,道魂永续。',
    reads: 3124, createdAt: '2026-08-12 11:15:42', status: 'shown', images: [],
  },
  {
    id: 'NEWS-0003', title: '十方殿道养生课程上线',
    detail: '道法养生系列课程正式上线,包含八段锦、太极与静坐引导课程,由道长与专业讲师联合录制每周更新。',
    blessing: '愿众生身安道隆,以养证道。',
    reads: 5286, createdAt: '2026-08-05 14:33:15', status: 'shown', images: [],
  },
  {
    id: 'NEWS-0004', title: '《道德》数字化工程进展报告',
    detail: '一期工程已完成扫描3000余册,全部高清古籍上线至云端礼库,通过线上多端开放公众查阅。',
    blessing: '经典数字化,道脉永续传播,惠及广大信众。',
    reads: 3942, createdAt: '2026-07-28 08:48:44', status: 'shown', images: [],
  },
  {
    id: 'NEWS-0005', title: '夏季祈福道会圆满结束',
    detail: '夏季祈福法会为期三日,依科演教,线上线下共计逾两千人参与,共祈法会圆满殊胜。',
    blessing: '法会圆满,福泽十方,愿善信所求皆遂。',
    reads: 2108, createdAt: '2026-07-20 11:57:13', status: 'shown', images: [],
  },
  {
    id: 'NEWS-0006', title: '端午 · 挂香囊祈安道会回顾',
    detail: '端午当日举行香囊派发活动,道长手书净符灵艾香囊,为十方善信驱邪纳祥。',
    blessing: '佩香囊,愿众生康健,无有灾吉。',
    reads: 1556, createdAt: '2026-06-10 14:05:41', status: 'shown', images: [],
  },
  {
    id: 'NEWS-0007', title: '秋季 · 拜斗法会',
    detail: '秋季拜斗法会已开放预约,内容详情见最新活动安排。',
    blessing: '斗柄运转,愿诸事顺遂,点亮心灯。',
    reads: 989, createdAt: '2026-06-15 11:36:40', status: 'hidden', images: [],
  },
  {
    id: 'NEWS-0008', title: '中元节 · 地官赦罪道会筹备公告',
    detail: '中元节地官赦罪道会筹备中,诵经排期与报名入口将于近期公布。',
    blessing: '中元地官赦罪,愿以此功德先人早登仙界。',
    reads: null, createdAt: '2026-05-10 09:20:00', status: 'hidden', images: [],
  },
]
