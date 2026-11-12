// 订单（/order）模块的字典与行模型：点灯订单与供奉订单共用一份映射，避免两页各写一套。

// 订单类型：1.点灯订单，2.神像供奉订单，3.捐赠订单。
export const orderTypeValue = { lamp: 1, offering: 2, donation: 3 }

// 订单状态：1.待支付，2.待供奉，3.供奉中，4.已过期。
// 页面内部沿用字符串标识（unpaid / pending / offering / expired），与接口数值双向映射。
export const orderStatusValue = { unpaid: 1, pending: 2, offering: 3, expired: 4 }
export const orderStatusKey = { 1: 'unpaid', 2: 'pending', 3: 'offering', 4: 'expired' }
export const orderStatusText = {
  unpaid: '待支付',
  pending: '待供奉',
  offering: '供奉中',
  expired: '已过期',
}

// 点灯订单周期：接口 cycleType 1.一年 2.一月 3.一天，列表展示为「年 / 月 / 天」。
export const orderCycleText = { 1: '年', 2: '月', 3: '天' }
// 筛选下拉使用数值选项，空串代表全部。
export const orderCycleOptions = [
  { label: '全部', value: '' },
  { label: '年', value: 1 },
  { label: '月', value: 2 },
  { label: '天', value: 3 },
]

// 捐赠类型：接口 donateType 1.捐钱 2.捐物；页面内部沿用 fund / goods 标识。
export const donateTypeKey = { 1: 'fund', 2: 'goods' }
export const donateTypeText = {
  fund: '捐钱 · 随喜功德',
  goods: '捐物 · 物品供养',
}

export function formatOrderMoney(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'
}

// 接口没有下单用户的昵称字段，只能用会员ID / 游客ID 标识用户身份。
function describeUser(order) {
  if (Number.isFinite(Number(order.memberId)) && Number(order.memberId) > 0) return `会员 #${order.memberId}`
  if (order.uvid) return `游客 ${String(order.uvid).slice(0, 8)}`
  return '—'
}

// OrderVo（捐赠订单 type=3）→ 捐赠记录行。接口没有支付渠道字段，channel 固定为空值展示。
export function mapDonationOrder(order, shopItemNames = {}) {
  const shopItemsId = Number(order.shopItemsId)
  return {
    id: order.id,
    orderNo: order.orderNo || '—',
    nickname: describeUser(order),
    userPhone: order.mobile || '—',
    name: order.username || '—',
    phone: order.mobile || '—',
    email: order.email || '—',
    purpose: order.donateTarget?.title || '—',
    type: donateTypeKey[Number(order.donateType)] || '',
    goods: Number.isFinite(shopItemsId) && shopItemsId > 0
      ? (shopItemNames[shopItemsId] || `商品 #${shopItemsId}`)
      : '—',
    amount: Number(order.amount ?? 0),
    channel: '',
    message: order.prayWish || '',
    donatedAt: order.createTime || '—',
    status: orderStatusKey[Number(order.status)] || 'unpaid',
  }
}

// OrderVo.fileUrl 既可能是图片也可能是视频，预览弹窗需按扩展名区分渲染。
const VIDEO_URL_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i
export function isVideoFileUrl(url) {
  return VIDEO_URL_RE.test(String(url || ''))
}

// OrderVo → 表格行。
export function mapOrder(order) {
  const fileUrl = order.fileUrl || ''
  const isVideo = isVideoFileUrl(fileUrl)
  return {
    id: order.id,
    orderNo: order.orderNo || '—',
    nickname: describeUser(order),
    userPhone: order.mobile || '—',
    name: order.username || '—',
    email: order.email || '—',
    birth: order.birthday || '—',
    wish: order.prayWish || '',
    quantity: Number(order.number ?? 0),
    amount: formatOrderMoney(order.amount),
    period: orderCycleText[Number(order.cycleType)] || '—',
    status: orderStatusKey[Number(order.status)] || 'unpaid',
    orderedAt: order.createTime || '—',
    expireAt: order.expirationTime || '—',
    previewImage: isVideo ? '' : fileUrl,
    previewVideo: isVideo ? fileUrl : '',
    lamp: order.light?.name || '—',
    project: order.worship?.matchGod || '—',
  }
}
