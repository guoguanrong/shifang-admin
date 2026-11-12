<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import OfferingOrderFilterBar from '../components/order/OfferingOrderFilterBar.vue'
import OfferingOrderTable from '../components/order/OfferingOrderTable.vue'
import { getOrderList } from '../services/businessApi'
import { exportOrders as exportOrderList } from '../services/exportApi'
import { downloadCsv } from '../utils/csv'
import { mapOrder, orderStatusText, orderStatusValue, orderTypeValue } from '../utils/orderDisplay'

const PAGE_SIZE = 10

const orders = ref([])
const filters = ref({})
const selection = ref([])
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const exporting = ref(false)

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

// /order/list 与 /order/export 使用同一份 OrderDTO：固定 type=2，订单号/手机号为接口精确查询。
function buildQuery() {
  const { orderId, userPhone, status, startDate, endDate } = filters.value
  return {
    type: orderTypeValue.offering,
    orderNo: (orderId || '').trim() || undefined,
    mobile: (userPhone || '').trim() || undefined,
    status: status ? orderStatusValue[status] : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }
}

// 仅列表需要分页；导出直接传 buildQuery()，按筛选条件导出全量。
function buildParams() {
  return { ...buildQuery(), page: currentPage.value, pageSize: PAGE_SIZE }
}

async function loadOrders() {
  loading.value = true
  try {
    const payload = await getOrderList(buildParams())
    const result = payload?.data ?? payload
    orders.value = getList(payload).map(mapOrder)
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : orders.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
    selection.value = []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取供奉订单失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadOrders()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadOrders()
}

function changePage(page) {
  currentPage.value = page
  loadOrders()
}

onMounted(loadOrders)

// 查看供奉图片：接口没有订单更新类接口，图片（fileUrl）目前只读，不能后台补传。
const viewVisible = ref(false)
const currentOrder = ref(null)
const previewImage = ref('')

function openPreview(order) {
  currentOrder.value = order
  previewImage.value = order.previewImage
  viewVisible.value = true
}

// 勾选行走前端 CSV：/order/export 只支持按筛选条件导出，不支持按 id 列表导出。
function downloadSelectedOrders() {
  const headers = ['订单号', '用户', '善信手机号', '供奉项目', '善信姓名', '祈福心愿', '金额', '状态', '下单时间']
  const lines = selection.value.map((item) => [
    item.orderNo,
    item.nickname,
    item.userPhone,
    item.project,
    item.name,
    item.wish || '—',
    `$${item.amount}`,
    orderStatusText[item.status],
    item.orderedAt,
  ])
  downloadCsv('供奉订单.csv', headers, lines)
}

// 未勾选时调用 /order/export（type=2），按当前筛选条件导出全量供奉订单。
async function exportOrders() {
  if (exporting.value) return
  if (selection.value.length) {
    downloadSelectedOrders()
    return
  }

  exporting.value = true
  try {
    await exportOrderList(buildQuery(), '供奉订单')
    ElMessage.success('供奉订单已导出')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '导出供奉订单失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <main class="order-list-page">
    <header class="page-heading">
      <h1>供奉订单</h1>
      <p>神像供奉订单流水 - 对应前台"神像供奉"</p>
    </header>

    <OfferingOrderFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="export-button" :loading="exporting" :disabled="loading" @click="exportOrders">导出订单</el-button>
      </div>

      <OfferingOrderTable
        v-loading="loading"
        :orders="orders"
        :total="total"
        :current-page="currentPage"
        @selection-change="selection = $event"
        @preview="openPreview"
        @page-change="changePage"
      />
    </section>

    <!-- 查看供奉图片：图片由前台供奉流程生成，接口暂无订单图片更新能力 -->
    <el-dialog v-model="viewVisible" title="查看供奉图片" width="520px">
      <div v-if="currentOrder" class="info-list">
        <div class="info-row"><span class="info-label">订单号</span><span>{{ currentOrder.orderNo }}</span></div>
        <div class="info-row"><span class="info-label">用户</span><span>{{ currentOrder.name }} {{ currentOrder.userPhone }}</span></div>
        <div class="info-row"><span class="info-label">供奉项目</span><span>{{ currentOrder.project }}</span></div>
        <div class="info-row"><span class="info-label">当前状态</span><span :class="['soft-tag', currentOrder.status]">{{ orderStatusText[currentOrder.status] }}</span></div>
      </div>

      <div class="preview-stage">
        <img v-if="previewImage" v-media-preview="previewImage" :src="previewImage" alt="供奉图片" />
        <template v-else>
          <strong>暂无供奉图片</strong>
          <p>接口未提供订单图片上传能力，仅展示下单时已生成的 fileUrl</p>
        </template>
      </div>
      <template #footer>
        <el-button @click="viewVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.order-list-page {
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

  .export-button {
    margin-left: auto;
    height: 29px;
    padding: 0 12px;
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary);
    border-radius: var(--admin-radius-sm);
  }
}

.info-list {
  margin-bottom: 14px;

  .info-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--admin-border-light);

    &:last-child {
      border-bottom: 0;
    }
  }

  .info-label {
    flex: 0 0 72px;
    color: var(--admin-text-secondary);
    font-size: 13px;
  }

  span:not(.info-label):not(.soft-tag) {
    color: var(--admin-text-primary);
    font-size: 13px;
  }
}

.preview-stage {
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  background: #262a31;
  border-radius: var(--admin-radius-md);

  img {
    display: block;
    max-width: 100%;
    border-radius: var(--admin-radius-sm);
  }

  strong {
    color: #d9b36c;
    font-size: 15px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: rgba(255, 255, 255, 0.55);
    font-size: 12px;
  }
}

.soft-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);

  &.unpaid { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
  &.pending { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.offering { color: var(--admin-success); background: var(--admin-success-light); }
  &.expired { color: var(--admin-danger); background: var(--admin-danger-light); }
}
</style>
