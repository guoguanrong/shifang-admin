// 活动报名记录：接口 ActivityRegisterVo → 页面模型。
// 文档：POST /activityRegister/list 返回 {list, currentPage, totalPage, totalRow}，
// 每条记录带 username/mobile/followUser/prayWish/cert/createTime 与嵌套 activity(ActivityVo)。
import { activityTypeKey, buildTimeText } from './activityDisplay.js'

export function getRegisterList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return { list: result, totalRow: result.length, totalPage: 1, currentPage: 1 }
  return {
    list: result?.list || result?.records || [],
    totalRow: Number(result?.totalRow),
    totalPage: Number(result?.totalPage),
    currentPage: Number(result?.currentPage),
  }
}

export function mapRegistration(record) {
  const activity = record?.activity ?? {}
  return {
    id: record?.id,
    activityId: record?.activityId ?? activity.id ?? null,
    activityTitle: activity.title || '',
    activityTime: buildTimeText(activity),
    type: activityTypeKey[Number(activity.activityType)] || 'group',
    name: record?.username || '',
    phone: record?.mobile || '',
    companions: Number(record?.followUser ?? 0),
    wish: record?.prayWish || '',
    cert: record?.cert || '',
    registeredAt: record?.createTime || '',
  }
}
