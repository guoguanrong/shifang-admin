// 会员（/member）字段的展示与映射工具：用户列表与用户详情共用，避免两份页面各写一套转换。

// 接口状态字典：1.正常 / 0.禁用（冻结）；页面内部沿用 normal / frozen 标识。
export const memberStatusValue = { normal: 1, frozen: 0 }

function toBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

// 金额：接口返回 '10.00' 这类字符串或数字，统一格式化为 $ 千分位展示。
export function formatMoney(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

// 次数：非数字（含接口尚未返回的字段）统一展示为占位符。
export function formatCount(value) {
  const count = Number(value)
  return Number.isFinite(count) ? count : null
}

// 从 registerAddress 提取城市：
//   '中国|浙江省|杭州市|电信|CN' → 杭州市；'Singapore|||StarHub Ltd|SG' → Singapore；
//   '浙江省,杭州市' → 杭州市；'成都市,移动' → 成都市；空或无法判断 → 占位符。
export function extractCity(address) {
  const text = String(address || '').trim()
  if (!text) return '—'

  const pipeParts = text.split('|').map((part) => part.trim()).filter(Boolean)
  const firstPipe = pipeParts[0] || ''
  if (firstPipe === '中国' && pipeParts.length >= 3) return pipeParts[2]
  if (firstPipe) return firstPipe.includes(',') ? firstPipe.split(',')[0].trim() : firstPipe

  // 首段为空（如 ',XNNET'）时无法判定城市。
  return '—'
}

// MemberVo → 用户列表行；counts 保留数值用于页内筛选，展示字段为字符串。
export function mapMemberToRow(member) {
  return {
    id: member.id,
    nickname: member.nickname || '—',
    email: member.email || '—',
    phone: member.phone || '—',
    city: extractCity(member.registerAddress),
    registeredAt: member.registerTime || '—',
    firstVisit: member.firstVisitTime || member.createTime || '—',
    source: member.source || '—',
    verified: toBoolean(member.realNameAuth),
    donateAmount: formatMoney(member.totalDonate),
    lightAmount: formatMoney(member.totalLight),
    worshipAmount: formatMoney(member.totalWorship),
    donateCount: formatCount(member.donateCount),
    // 捐物次数：接口暂未返回该字段（捐钱与捐物目前合并计入 donateCount）。
    donateItemCount: formatCount(member.donateItemCount),
    // 共建十方次数 = 捐款 + 捐物次数的合并统计，当前即接口的 donateCount。
    coBuildCount: formatCount(member.donateCount),
    lightCount: formatCount(member.lightCount),
    worshipCount: formatCount(member.worshipCount),
    status: Number(member.status) === memberStatusValue.normal ? 'normal' : 'frozen',
  }
}
