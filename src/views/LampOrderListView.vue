<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LampOrderFilterBar from '../components/order/LampOrderFilterBar.vue'
import LampOrderTable from '../components/order/LampOrderTable.vue'
import { getLightList, getOrderList } from '../services/businessApi'
import { downloadCsv } from '../utils/csv'
import { mapOrder, orderStatusText, orderStatusValue, orderTypeValue } from '../utils/orderDisplay'

const PAGE_SIZE = 10

const orders = ref([])
// 灯型筛选项从接口拉取，避免硬编码与真实灯型不一致。
const lampOptions = ref([{ label: '全部', value: '' }])
const filters = ref({})
const selection = ref([])
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

// 拉取点灯订单：固定 type=1，订单号/手机号为接口精确查询，灯名走 lightName，周期走 cycleType。
async function loadOrders() {
  loading.value = true
  const { orderId, userPhone, lamp, cycle, status, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    type: orderTypeValue.lamp,
    orderNo: (orderId || '').trim() || undefined,
    mobile: (userPhone || '').trim() || undefined,
    lightName: lamp || undefined,
    cycleType: cycle === '' ? undefined : Number(cycle),
    status: status ? orderStatusValue[status] : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const payload = await getOrderList(params)
    const result = payload?.data ?? payload
    orders.value = getList(payload).map(mapOrder)
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : orders.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
    selection.value = []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取点灯订单失败')
  } finally {
    loading.value = false
  }
}

async function loadLampOptions() {
  try {
    const names = [...new Set(getList(await getLightList({ page: 1, pageSize: 200 })).map((item) => item.name).filter(Boolean))]
    lampOptions.value = [{ label: '全部', value: '' }, ...names.map((name) => ({ label: name, value: name }))]
  } catch {
    // 灯型加载失败不影响订单列表，保留「全部」。
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

onMounted(() => {
  loadOrders()
  loadLampOptions()
})

// 查看点灯预览：接口没有订单更新类接口，预览图（fileUrl）目前只读，不能后台补传。
const viewVisible = ref(false)
const previewImage = ref('')

function openPreview(order) {
  previewImage.value = order.previewImage
  viewVisible.value = true
}

// 导出订单 CSV：有勾选导勾选，否则导出当前页数据；加 BOM 防止 Excel 打开中文乱码。
function exportOrders() {
  const exportRows = selection.value.length ? selection.value : orders.value
  const headers = ['订单号', '用户', '善信手机号', '灯型', '善信姓名', '生辰', '祈福心愿', '数量', '供奉周期', '金额', '状态', '下单时间', '供奉到期时间']
  const lines = exportRows.map((item) => [
    item.orderNo,
    item.nickname,
    item.userPhone,
    item.lamp,
    item.name,
    item.birth,
    item.wish || '—',
    `${item.quantity} 盏`,
    item.period,
    `$${item.amount}`,
    orderStatusText[item.status],
    item.orderedAt,
    item.expireAt,
  ])
  downloadCsv('点灯订单.csv', headers, lines)
}
</script>

<template>
  <main class="order-list-page">
    <header class="page-heading">
      <h1>点灯订单</h1>
      <p>对用户在线上点灯下单的数据进行统计管理 - 对应"点灯"的订单记录</p>
    </header>

    <LampOrderFilterBar :lamp-options="lampOptions" @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="export-button" :disabled="loading" @click="exportOrders">导出订单</el-button>
      </div>

      <LampOrderTable
        v-loading="loading"
        :orders="orders"
        :total="total"
        :current-page="currentPage"
        @selection-change="selection = $event"
        @preview="openPreview"
        @page-change="changePage"
      />
    </section>

    <!-- 查看点灯预览：预览图由前台下单时生成，接口暂无订单图片更新能力 -->
    <el-dialog v-model="viewVisible" title="查看点灯预览" width="480px">
      <img v-if="previewImage" v-media-preview="previewImage" :src="previewImage" class="view-preview" alt="点灯预览图" />
      <p v-else class="empty-tip">暂无点灯预览图（接口未提供订单预览图上传能力）</p>
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

.view-preview {
  display: block;
  max-width: 100%;
  margin: 0 auto;
  border-radius: var(--admin-radius-sm);
}

.empty-tip {
  margin: 24px 0;
  color: var(--admin-text-secondary);
  font-size: 13px;
  text-align: center;
}
</style>
