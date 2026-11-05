import { saveShopItems, updateShopItems } from '../services/businessApi'

// 四档金额与捐赠商品的同步工具：
// 接口（Worship / DonateTarget）本身没有四档价格字段，只有 shopItemsIds 关联商品，
// 因此把每个档位落成一条 type=1（捐钱）的上架商品，再把商品 id 回写给所属对象。

// 校验四档金额：全部必填、大于 0、最多两位小数；通过返回 null，否则返回提示文案。
export function validateTierPrices(prices) {
  for (let index = 0; index < prices.length; index += 1) {
    const value = prices[index]
    if (value === '' || value === null || value === undefined) return `请输入第 ${index + 1} 档金额`
    if (!/^\d+(\.\d{1,2})?$/.test(String(value))) return `第 ${index + 1} 档金额最多保留 2 位小数`
    if (Number(value) <= 0) return `第 ${index + 1} 档金额必须大于 0`
  }
  return null
}

// 从关联商品列表里按档位顺序取价格，用于编辑时回填四个输入框。
export function tierPricesFromShopItems(shopItemsList, count = 4) {
  const items = [...(shopItemsList || [])].sort((a, b) => Number(a.seq ?? 0) - Number(b.seq ?? 0))
  return Array.from({ length: count }, (_, index) => {
    const price = Number(items[index]?.price)
    return Number.isFinite(price) ? String(price) : ''
  })
}

// 按档位金额同步商品：已有 id 走修改，缺少的走新增，返回最终商品 id 列表。
export async function syncTierShopItems({ existingIds = [], prices, namePrefix, useType, picture = '' }) {
  const ids = []

  for (let index = 0; index < prices.length; index += 1) {
    const tier = index + 1
    const body = {
      name: `${namePrefix}档位${tier}`,
      useType,
      type: 1,
      unit: '次',
      price: Number(prices[index]),
      seq: tier,
      status: 1,
      picture,
    }
    const existingId = Number(existingIds[index])

    if (Number.isFinite(existingId) && existingId > 0) {
      await updateShopItems({ id: existingId, ...body })
      ids.push(existingId)
      continue
    }

    const created = await saveShopItems(body)
    const createdId = Number(created?.id ?? created)
    if (Number.isFinite(createdId) && createdId > 0) ids.push(createdId)
  }

  return ids
}
