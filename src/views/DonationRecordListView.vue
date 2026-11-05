<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import DonationFilterBar from '../components/donation/DonationFilterBar.vue'
import DonationTable from '../components/donation/DonationTable.vue'
import { createDonationRecordFilters } from '../constants/listFilters'
import { getOrderList, getShopItemsList } from '../services/businessApi'
import { downloadCsv } from '../utils/csv'
import { donateTypeText, mapDonationOrder, orderTypeValue } from '../utils/orderDisplay'

const PAGE_SIZE = 10

const records = ref([])
// 商品 id → 名称映射，用于「捐赠物品」列（OrderVo 只返回 shopItemsId）。
const shopItemNames = ref({})
const filters = ref(createDonationRecordFilters())
const selection = ref([])
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

// 捐赠类型（donateType）不是 OrderDTO 的查询参数，只能对当前页数据做页内筛选。
const filteredRecords = computed(() => {
  const type = filters.value.type
  return type ? records.value.filter((item) => item.type === type) : records.value
})

// 工具栏「累计」：当前页（筛选后）的捐赠金额合计，接口未提供汇总能力。
const totalAmount = computed(() => (
  filteredRecords.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)
))

// 拉取捐赠订单：固定 type=3，联络手机为接口精确查询。
async function loadRecords() {
  loading.value = true
  const { phone, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    type: orderTypeValue.donation,
    mobile: (phone || '').trim() || undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const payload = await getOrderList(params)
    const result = payload?.data ?? payload
    records.value = getList(payload).map((item) => mapDonationOrder(item, shopItemNames.value))
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : records.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
    selection.value = []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取捐赠记录失败')
  } finally {
    loading.value = false
  }
}

// 预取全量捐赠物品，把 shopItemsId 翻译成物品名称。
async function loadShopItemNames() {
  const names = {}
  try {
    let page = 1
    let totalPage = 1
    do {
      const payload = await getShopItemsList({ page, pageSize: 200 })
      const result = payload?.data ?? payload
      const list = getList(payload)
      list.forEach((item) => { names[Number(item.id)] = item.name || `商品 #${item.id}` })
      totalPage = Number(result?.totalPage) || 1
      page += 1
    } while (page <= totalPage && page <= 50)
    shopItemNames.value = names
  } catch {
    // 物品名称加载失败不阻断列表，列内退回展示「商品 #id」。
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadRecords()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadRecords()
}

function changePage(page) {
  currentPage.value = page
  loadRecords()
}

onMounted(async () => {
  await loadShopItemNames()
  await loadRecords()
})

// 导出明细 CSV：有勾选导勾选，否则导出当前页数据；加 BOM 防止 Excel 打开中文乱码。
function exportRecords() {
  const exportRows = selection.value.length ? selection.value : filteredRecords.value
  const headers = ['捐赠单号', '用户', '善信姓名', '联络手机', '邮箱', '捐赠目标', '捐赠类型', '捐赠物品', '金额', '支付渠道', '祈福留言', '捐赠时间']
  const lines = exportRows.map((item) => [
    item.orderNo,
    `${item.nickname}（${item.userPhone}）`,
    item.name,
    item.phone,
    item.email,
    item.purpose,
    donateTypeText[item.type] || '—',
    item.goods || '—',
    `$${item.amount.toLocaleString('en-US')}`,
    item.channel || '—',
    item.message || '—',
    item.donatedAt,
  ])
  downloadCsv('捐赠记录明细.csv', headers, lines)
}
</script>

<template>
  <main class="donation-list-page">
    <header class="page-heading">
      <h1>捐赠记录</h1>
      <p>前台“善款捐赠/随喜捐赠”产生的捐赠流水</p>
    </header>

    <DonationFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span>本页累计 <b>${{ totalAmount.toLocaleString('en-US') }}</b></span>
        <span class="selection-info"><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="export-button" :disabled="loading" @click="exportRecords">导出明细</el-button>
      </div>

      <DonationTable
        v-loading="loading"
        :records="filteredRecords"
        :total="total"
        :current-page="currentPage"
        @selection-change="selection = $event"
        @page-change="changePage"
      />
    </section>
  </main>
</template>

<style scoped lang="less">
.donation-list-page {
  padding: 20px 14px 12px;
}

.page-heading {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin: 0 6px 14px;

  h1 {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 20px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--admin-text-placeholder);
    font-size: 13px;
  }
}

.table-card {
  margin-top: 12px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);
}

.table-toolbar {
  height: 58px;
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  span {
    color: var(--admin-text-secondary);
    font-size: 13px;
  }

  b {
    color: var(--admin-primary);
    font-weight: 500;
  }

  .selection-info {
    margin-left: auto;
  }

  .export-button {
    height: 29px;
    margin: 0;
    padding: 0 12px;
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary);
    border-radius: var(--admin-radius-sm);
  }
}
</style>
