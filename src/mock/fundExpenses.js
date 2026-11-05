// 演示用善款支出数据。
// status: pending 待公示 / published 已公示（公示后前台「资金公示-善款支出」可见）。
// attachments 为凭证附件：type 用于角标（pdf/word/png），name/size 展示用。
export const initialFundExpenses = [
  {
    id: 'ZC-2026-0821-02', title: '中元节法会供品采购', category: '法事活动', amount: 18600,
    spentAt: '2026-08-21 11:18:46', handler: '道远',
    description: '用于法事活动相关支出,款项经负责人审核确认后列支,原始凭证留存备查。',
    attachments: [
      { name: '凭证-发票.pdf', size: '1.2 MB', type: 'pdf' },
      { name: '凭证-采购明细单.docx', size: '880 KB', type: 'word' },
    ],
    status: 'pending',
  },
  {
    id: 'ZC-2026-0821-03', title: '大殿彩绘原料采购(二期)', category: '建筑修缮', amount: 126000,
    spentAt: '2026-08-21 08:05:17', handler: '王工',
    description: '大殿彩绘二期原料采购,含矿物颜料与金箔,款项经负责人审核确认后列支,原始凭证留存备查。',
    attachments: [{ name: '凭证-原料采购发票.pdf', size: '960 KB', type: 'pdf' }],
    status: 'pending',
  },
  {
    id: 'ZC-2026-0820-05', title: '青石板材补运费用', category: '建筑修缮', amount: 52400,
    spentAt: '2026-08-20 14:31:15', handler: '张工',
    description: '青石板材补运及吊装费用,款项经负责人审核确认后列支,原始凭证留存备查。',
    attachments: [{ name: '凭证-运输结算单.pdf', size: '1.1 MB', type: 'pdf' }],
    status: 'published',
  },
  {
    id: 'ZC-2026-0816-02', title: '上梁大典仪式用品', category: '法事活动', amount: 56800,
    spentAt: '2026-08-18 09:44:44', handler: '道远',
    description: '上梁大典仪式用品采购,含法器、供器与礼炮,原始凭证留存备查。',
    attachments: [{ name: '凭证-法物清单.pdf', size: '820 KB', type: 'pdf' }],
    status: 'published',
  },
  {
    id: 'ZC-2026-0815-01', title: '壁画修复设备/高清扫描仪', category: '工程设备', amount: 98000,
    spentAt: '2026-08-15 11:57:13', handler: '赵教授',
    description: '壁画修复工程设备采购,含高清扫描仪一台,原始凭证留存备查。',
    attachments: [
      { name: '凭证-设备采购合同.pdf', size: '2.3 MB', type: 'pdf' },
      { name: '凭证-验收单.png', size: '450 KB', type: 'png' },
    ],
    status: 'pending',
  },
  {
    id: 'ZC-2026-0812-04', title: '《道德》数字化工程费用', category: '文化项目', amount: 46000,
    spentAt: '2026-08-12 17:10:42', handler: '温慧',
    description: '《道德》数字化工程扫描与校对费用,原始凭证留存备查。',
    attachments: [{ name: '凭证-服务结算单.pdf', size: '730 KB', type: 'pdf' }],
    status: 'published',
  },
  {
    id: 'ZC-2026-0810-02', title: '办公用品与行政开支', category: '行政管理', amount: 8320,
    spentAt: '2026-08-10 10:23:11', handler: '温慧',
    description: '办公室日常办公用品与行政开支,原始凭证留存备查。',
    attachments: [{ name: '凭证-办公用品明细.docx', size: '620 KB', type: 'word' }],
    status: 'published',
  },
  {
    id: 'ZC-2026-0808-01', title: '大殿木构件(上梁用材)', category: '建筑修缮', amount: 286000,
    spentAt: '2026-08-08 11:36:40', handler: '李工',
    description: '大殿上梁用木构件采购,含金丝楠木梁与斗拱组件,原始凭证留存备查。',
    attachments: [
      { name: '凭证-木构件采购合同.pdf', size: '3.1 MB', type: 'pdf' },
      { name: '凭证-付款回单.png', size: '380 KB', type: 'png' },
    ],
    status: 'published',
  },
]
