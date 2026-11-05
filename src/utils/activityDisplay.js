// 道会（/activity）模块的字典与双向映射：接口 ActivityVo ⇄ 页面模型，
// 列表页与新增/编辑弹窗都通过这里转换，避免同一套字段散落多处。

// 道会类型：1.集体活动 2.专场预约。
export const activityTypeValue = { group: 1, appointment: 2 }
export const activityTypeKey = { 1: 'group', 2: 'appointment' }

// 时间类型：1.固定时间 2.特定时间；固定方式：1.每月单日 2.每日时段。
export const activityTimeTypeValue = { fixed: 1, specific: 2 }
export const activityTimeTypeKey = { 1: 'fixed', 2: 'specific' }
export const activityFixTypeValue = { monthly: 1, daily: 2 }
export const activityFixTypeKey = { 1: 'monthly', 2: 'daily' }

// 参加方式：1.线上登记 2.线下亲临（接口为单选，无法表达「线上 + 线下」组合）。
export const activityJoinTypeValue = { online: 1, offline: 2 }
export const activityJoinTypeText = { 1: '线上登记', 2: '线下亲临' }

// 报名状态：1.待报名 2.报名中 3.报名停止 4.已结束。
export const activityStatusValue = { pending: 1, enrolling: 2, registrationStopped: 3, ended: 4 }
export const activityStatusKey = { 1: 'pending', 2: 'enrolling', 3: 'registrationStopped', 4: 'ended' }

// 上架状态：1.上架 2.暂不上架。
export const activityListedValue = { on: 1, off: 2 }

const ONLINE_OFFLINE_TEXT = '线上登记 / 线下亲临'

function splitByComma(text) {
  return String(text ?? '').split(/[,，]/).map((item) => item.trim()).filter(Boolean)
}

function joinByComma(list) {
  return (list ?? []).map((item) => String(item).trim()).filter(Boolean).join(',')
}

// yigui / benefit 在接口里是 JSON 数组（元素形如 {name, desc}），可能返回字符串或已解析的数组。
function parseJsonArray(value) {
  if (Array.isArray(value)) return value
  const text = String(value ?? '').trim()
  if (!text) return []
  try {
    const parsed = JSON.parse(text)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function stringifyJsonArray(list) {
  return JSON.stringify(list ?? [])
}

// 列表展示的「道会时间」文本：接口没有该字段，按时间类型/固定方式组装。
function buildTimeText(activity) {
  const startHour = activity.startHour || ''
  const endHour = activity.endHour || ''
  const range = startHour && endHour ? `${startHour} - ${endHour}` : ''

  if (Number(activity.activityType) === activityTypeValue.appointment) {
    const aheadDays = Number(activity.aheadDays)
    return Number.isFinite(aheadDays) && aheadDays > 0 ? `预约制 · 提前 ${aheadDays} 日` : '预约制'
  }
  if (Number(activity.timeType) === activityTimeTypeValue.specific) {
    return activity.startTime && activity.endTime ? `${activity.startTime} - ${activity.endTime}` : '时间另行通知'
  }
  if (Number(activity.fixType) === activityFixTypeValue.daily) return `每日 ${range}`
  return `每月 ${activity.day ?? '—'} 日 ${range}`
}

// ActivityVo → 页面模型。
export function mapActivity(activity) {
  const limitUser = Number(activity.limitUser)
  const joinType = Number(activity.joinType)

  return {
    id: activity.id,
    title: activity.title || '',
    subtitle: activity.subTitle || '',
    tags: splitByComma(activity.tag),
    // 接口只有 pictureUrls 逗号串，图片的 label / caption 无对应字段。
    images: splitByComma(activity.pictureUrls).map((url) => ({ url, label: '', caption: '' })),
    type: activityTypeKey[Number(activity.activityType)] || 'group',
    timeType: activityTimeTypeKey[Number(activity.timeType)] || 'fixed',
    timeMode: activityFixTypeKey[Number(activity.fixType)] || 'monthly',
    monthDay: Number(activity.day) || 1,
    startTime: activity.startHour || '09:00',
    endTime: activity.endHour || '11:00',
    // 特定时间的起止日期回填到弹窗的日期区间控件。
    specificRange: Number(activity.timeType) === activityTimeTypeValue.specific
      ? [activity.startTime || '', activity.endTime || '']
      : [],
    timeText: buildTimeText(activity),
    location: activity.location || '',
    joinWay: activityJoinTypeText[joinType] || ONLINE_OFFLINE_TEXT,
    joinType: Number.isFinite(joinType) && joinType > 0 ? joinType : null,
    // 接口未返回已报名人数，列表统一展示 '—'。
    registered: null,
    quota: Number.isFinite(limitUser) && limitUser > 0 ? limitUser : null,
    deadline: activity.registerEndTime || '',
    aheadDays: Number(activity.aheadDays) || null,
    intro: activity.intro || '',
    rituals: parseJsonArray(activity.yigui).map((item) => ({
      title: item?.name ?? item?.title ?? '',
      subtitle: item?.desc ?? item?.subtitle ?? '',
    })),
    benefits: parseJsonArray(activity.benefit)
      .map((item) => (typeof item === 'string' ? item : (item?.name ?? item?.desc ?? '')))
      .filter(Boolean),
    audiences: splitByComma(activity.matchCrowd),
    status: activityStatusKey[Number(activity.status)] || 'pending',
    listed: Number(activity.type) === activityListedValue.on,
    createTime: activity.createTime || '',
  }
}

// 页面模型 → 接口 Activity（新增/修改入参）。
export function buildActivityPayload(row) {
  const isSpecific = row.timeType === 'specific'
  const [specificStart = '', specificEnd = ''] = row.specificRange ?? []
  const isAppointment = row.type === 'appointment'

  // 「线上登记 / 线下亲临」组合态接口无法表达（joinType 只有 1/2），此时不提交该字段。
  const joinType = row.joinWay === '线上登记'
    ? activityJoinTypeValue.online
    : (row.joinWay === '线下亲临' ? activityJoinTypeValue.offline : undefined)

  return {
    pictureUrls: (row.images ?? []).map((image) => image.url).filter(Boolean).join(','),
    title: row.title,
    subTitle: row.subtitle,
    tag: joinByComma(row.tags),
    activityType: activityTypeValue[row.type] ?? activityTypeValue.group,
    timeType: activityTimeTypeValue[row.timeType] ?? activityTimeTypeValue.fixed,
    // 专场预约不区分固定方式；固定时间的「每周几」接口没有字段，只提交固定方式本身。
    fixType: isAppointment ? null : (activityFixTypeValue[row.timeMode] ?? activityFixTypeValue.monthly),
    aheadDays: isAppointment ? (Number(row.aheadDays) || null) : null,
    day: !isAppointment && row.timeMode === 'monthly' ? (Number(row.monthDay) || null) : null,
    startTime: isSpecific ? (specificStart || null) : null,
    endTime: isSpecific ? (specificEnd || null) : null,
    startHour: isAppointment || isSpecific ? null : (row.startTime || null),
    endHour: isAppointment || isSpecific ? null : (row.endTime || null),
    location: row.location || null,
    joinType,
    limitUser: row.quota === null || row.quota === '' ? null : Number(row.quota),
    registerEndTime: row.deadline || null,
    intro: row.intro || '',
    yigui: stringifyJsonArray((row.rituals ?? []).map((item) => ({ name: item.title, desc: item.subtitle }))),
    // 功德利益在弹窗里是单行文本，接口的 benefit 为 {name, desc} 结构，故文本写入 name。
    benefit: stringifyJsonArray((row.benefits ?? []).filter(Boolean).map((text) => ({ name: text, desc: '' }))),
    matchCrowd: joinByComma(row.audiences),
    type: row.listed ? activityListedValue.on : activityListedValue.off,
    status: activityStatusValue[row.status] ?? activityStatusValue.pending,
  }
}
