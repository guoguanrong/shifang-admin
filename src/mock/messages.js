// 演示用各界寄语数据。
// media: video 视频（videoUrl，最多 1 个） / image 图片（images，最多 6 张）；
// status: shown 展示中 / hidden 隐藏中。category 直接存分类文案。
export const initialMessages = [
  {
    id: 'MSG-0001', media: 'video', category: '知名人士', title: '楼宇烈寄语',
    content: '文化复兴,从敬畏传统开始。十方殿之善举,令人感慨。',
    detail: '楼宇烈先生为北京大学教授,数十年致力于中国哲学与道教文化研究。此为十方殿智能化之心守护道脉,让传统文化在新时代焕发生机与光芒。',
    videoUrl: '', images: [], createdAt: '2026-08-12 09:15:00', status: 'shown',
  },
  {
    id: 'MSG-0002', media: 'video', category: '知名人士', title: '团结寄语',
    content: '千年来,薪火相传,十方殿这方净土为万邦善信共有的一家。',
    detail: '善信们寄望十方殿能坚持圣贤文化物料创作,延续十方殿的共生事业,让文化以艺术形式被更多人看见。',
    videoUrl: '', images: [], createdAt: '2026-08-05 14:30:00', status: 'shown',
  },
  {
    id: 'MSG-0003', media: 'image', category: '知名人士', title: '敬上寄语',
    content: '记录历史,也创造里程碑,积十方之愿的共修善举行善教。',
    detail: '影像由一批守经六代后裔守护,被视为民间自发保护文化遗产的行动影像记录,传承。',
    videoUrl: '', images: [], createdAt: '2026-07-28 10:00:00', status: 'shown',
  },
  {
    id: 'MSG-0004', media: 'image', category: '道内人士', title: '中国道教协会寄语',
    content: '道法自然,众善奉持,十方殿之乃为善德之道。',
    detail: '中国道教协会肯定寄语十方殿,肯定其在团结海内外华人信众、传播道教文化方面所付出的努力。',
    videoUrl: '', images: [], createdAt: '2026-07-15 16:20:00', status: 'shown',
  },
  {
    id: 'MSG-0005', media: 'image', category: '道内人士', title: '龙虎山天师府寄语',
    content: '正一之源,源远流长,愿与十方殿共续道缘。',
    detail: '龙虎山天师府传承千年道脉,正一道祖庭福地千年,愿十方殿与各地宫观携手,共续道缘。',
    videoUrl: '', images: [], createdAt: '2026-07-02 11:08:00', status: 'shown',
  },
  {
    id: 'MSG-0006', media: 'video', category: '道内人士', title: '青城山道院长寄语',
    content: '清静无为,修身养性,积福十方殿将这份心意,广为传扬。',
    detail: '青城山道长多年来践行仙道贵生之旨,寄望十方殿传达两方,为十方善信坚定信道之善。',
    videoUrl: '', images: [], createdAt: '2026-06-20 09:40:00', status: 'shown',
  },
  {
    id: 'MSG-0007', media: 'image', category: '其他重要人士', title: '敦煌研究院团队寄语',
    content: '以文物活起来,让文化传下去,愿修缮修复工程圆满成。',
    detail: '敦煌文物研究院团队关注十方殿文物数字化保护修复工程,愿以专业之力共襄盛举。',
    videoUrl: '', images: [], createdAt: '2026-06-08 15:00:00', status: 'shown',
  },
  {
    id: 'MSG-0008', media: 'image', category: '其他重要人士', title: '马来西亚檀香寺寄语',
    content: '国之交在于民相亲,十方殿以科技传播道学文化,是大智慧。',
    detail: '国际友方马来西亚寄语,认为十方殿用智能化方式传播道学文化,让古老智慧触及年轻一代,是一件大善。',
    videoUrl: '', images: [], createdAt: '2026-05-30 10:12:00', status: 'hidden',
  },
]

// 寄语分类下拉选项（与 mock 数据中的分类保持一致）。
export const messageCategoryOptions = ['知名人士', '道内人士', '其他重要人士']
