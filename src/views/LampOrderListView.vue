<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import LampOrderFilterBar from '../components/order/LampOrderFilterBar.vue'
import LampOrderTable from '../components/order/LampOrderTable.vue'
import http from '../services/http'
import { getLightList, getOrderList } from '../services/businessApi'
import { exportOrders as exportOrderList } from '../services/exportApi'
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
const exporting = ref(false)

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

// /order/list 与 /order/export 使用同一份 OrderDTO：固定 type=1，订单号/手机号精确查询，灯名走 lightName，周期走 cycleType。
function buildQuery() {
  const { orderId, userPhone, lamp, cycle, status, startDate, endDate } = filters.value
  return {
    type: orderTypeValue.lamp,
    orderNo: (orderId || '').trim() || undefined,
    mobile: (userPhone || '').trim() || undefined,
    lightName: lamp || undefined,
    cycleType: cycle === '' || cycle == null ? undefined : Number(cycle),
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
    // 点灯订单的 fileUrl 是视频（接口描述：点灯视频或供奉图片）。
    orders.value = getList(payload).map((item) => mapOrder(item, 'video'))
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

// 查看点灯视频：按原型展示订单明细 + 16:9 播放区；fileUrl 可能是视频，也可能是图片。
const viewVisible = ref(false)
const currentOrder = ref(null)
const previewImage = ref('')
const previewVideo = ref('')
const videoPlaying = ref(false)
const videoDuration = ref('')
const mediaLoading = ref(false)
const mediaError = ref('')
const videoPlayer = ref(null)
let localMediaUrl = ''
let previewToken = 0

const dialogTitle = computed(() => (previewImage.value ? '查看点灯预览图' : '查看点灯视频'))
const previewUser = computed(() => {
  const order = currentOrder.value
  if (!order) return '—'
  const name = order.name && order.name !== '—' ? order.name : order.nickname
  const phone = order.userPhone && order.userPhone !== '—' ? order.userPhone : ''
  return `${name || '—'} ${phone}`.trim()
})
const previewVideoTitle = computed(() => {
  const lamp = currentOrder.value?.lamp
  return `${lamp && lamp !== '—' ? lamp : '点灯'} · 燃灯供奉实录`
})
const previewMeta = computed(() => {
  const time = currentOrder.value?.orderedAt || '—'
  return `${time} · 时长 ${videoDuration.value || '—'}`
})

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const total = Math.round(seconds)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function resetPreview() {
  previewToken += 1
  videoPlaying.value = false
  videoDuration.value = ''
  mediaLoading.value = false
  mediaError.value = ''
  previewImage.value = ''
  previewVideo.value = ''
  if (localMediaUrl) {
    URL.revokeObjectURL(localMediaUrl)
    localMediaUrl = ''
  }
}

function closePreview() {
  resetPreview()
  currentOrder.value = null
}

function isDirectUrl(url) {
  return /^(https?:)?\/\//i.test(url) || /^(data|blob):/i.test(url)
}

// 站内相对地址（如 /sys/file/download/{id}）需走统一实例携带会话头，转成 Blob URL 后才可播放。
async function resolveMediaUrl(url) {
  if (isDirectUrl(url)) return { url, objectUrl: '' }
  const config = { responseType: 'blob', rawResponse: true, timeout: 180000 }
  if (url.startsWith('/api/')) config.baseURL = ''
  const response = await http.get(url, config)
  const blob = response.data
  if (!(blob instanceof Blob) || /json/i.test(blob.type)) throw new Error('素材地址未返回可用的媒体文件')
  const objectUrl = URL.createObjectURL(blob)
  return { url: objectUrl, objectUrl }
}

// 接口没有时长字段，预读视频元数据后把真实时长显示在卡片上。
function probeDuration(url, token) {
  const probe = document.createElement('video')
  probe.preload = 'metadata'
  probe.addEventListener('loadedmetadata', () => {
    if (token === previewToken) videoDuration.value = formatDuration(probe.duration)
    probe.removeAttribute('src')
    probe.load()
  })
  probe.src = url
}

async function openPreview(order) {
  resetPreview()
  const token = previewToken
  currentOrder.value = order
  viewVisible.value = true

  const rawUrl = order.previewVideo || order.previewImage || ''
  if (!rawUrl) return

  mediaLoading.value = true
  try {
    const media = await resolveMediaUrl(rawUrl)
    if (token !== previewToken) {
      if (media.objectUrl) URL.revokeObjectURL(media.objectUrl)
      return
    }
    // 相对地址生成的 Blob URL 由本次弹窗持有，关闭时统一释放。
    localMediaUrl = media.objectUrl
    if (order.previewVideo) {
      previewVideo.value = media.url
      probeDuration(media.url, token)
    } else {
      previewImage.value = media.url
    }
  } catch {
    if (token === previewToken) mediaError.value = '点灯素材加载失败，请检查文件地址是否可访问'
  } finally {
    if (token === previewToken) mediaLoading.value = false
  }
}

async function playVideo() {
  if (mediaLoading.value) return
  if (!previewVideo.value) {
    ElMessage.info(mediaError.value || '该订单暂无点灯视频素材，视频由道长燃灯后上传')
    return
  }
  videoPlaying.value = true
  await nextTick()
  try {
    await videoPlayer.value?.play?.()
  } catch {
    // 浏览器阻止自动播放时，由视频控件手动播放。
  }
}

function onVideoLoaded(event) {
  videoDuration.value = formatDuration(event.target?.duration)
}

function onVideoError() {
  videoPlaying.value = false
  videoDuration.value = ''
  mediaError.value = '点灯视频加载失败，请检查文件地址是否可访问'
}

// 勾选行走前端 CSV：/order/export 只支持按筛选条件导出，不支持按 id 列表导出。
function downloadSelectedOrders() {
  const headers = ['订单号', '用户', '善信手机号', '灯型', '善信姓名', '生辰', '祈福心愿', '数量', '供奉周期', '金额', '状态', '下单时间', '供奉到期时间']
  const lines = selection.value.map((item) => [
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

// 未勾选时调用 /order/export（type=1），按当前筛选条件导出全量点灯订单。
async function exportOrders() {
  if (exporting.value) return
  if (selection.value.length) {
    downloadSelectedOrders()
    return
  }

  exporting.value = true
  try {
    await exportOrderList(buildQuery(), '点灯订单')
    ElMessage.success('点灯订单已导出')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '导出点灯订单失败')
  } finally {
    exporting.value = false
  }
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
        <el-button class="export-button" :loading="exporting" :disabled="loading" @click="exportOrders">导出订单</el-button>
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

    <!-- 查看点灯视频：按原型展示订单明细与 16:9 播放区 -->
    <el-dialog
      v-model="viewVisible"
      :title="dialogTitle"
      width="720px"
      destroy-on-close
      @closed="closePreview"
    >
      <template v-if="currentOrder">
        <div class="info-list">
          <div class="info-row"><span class="info-label">订单号</span><span class="info-value">{{ currentOrder.orderNo }}</span></div>
          <div class="info-row"><span class="info-label">用户</span><span class="info-value">{{ previewUser }}</span></div>
          <div class="info-row"><span class="info-label">灯型</span><span class="info-value">{{ currentOrder.lamp }} ×{{ currentOrder.quantity }}盏</span></div>
          <div class="info-row"><span class="info-label">当前状态</span><span :class="['soft-tag', currentOrder.status]">{{ orderStatusText[currentOrder.status] || '—' }}</span></div>
        </div>

        <div v-loading="mediaLoading" class="preview-stage">
          <img
            v-if="previewImage"
            v-media-preview="previewImage"
            :src="previewImage"
            class="stage-media"
            alt="点灯预览图"
          />
          <video
            v-else-if="videoPlaying && previewVideo"
            ref="videoPlayer"
            :src="previewVideo"
            class="stage-media"
            controls
            @loadedmetadata="onVideoLoaded"
            @error="onVideoError"
          />
          <template v-else>
            <button type="button" class="play-button" :aria-label="`播放${previewVideoTitle}`" @click="playVideo">
              <span class="play-icon" aria-hidden="true"></span>
            </button>
            <strong class="stage-title">{{ previewVideoTitle }}</strong>
            <span class="stage-meta">{{ previewMeta }}</span>
            <span v-if="mediaError || (!previewVideo && !previewImage)" class="stage-hint">{{ mediaError || '该订单暂无点灯视频素材' }}</span>
          </template>
        </div>
      </template>
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
  margin-bottom: 12px;

  .info-row {
    display: flex;
    min-height: 40px;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px dashed var(--admin-border-light);

    &:last-child {
      border-bottom: 0;
    }
  }

  .info-label {
    flex: 0 0 116px;
    color: var(--admin-text-secondary);
    font-size: 13px;
  }

  .info-value {
    color: var(--admin-text-primary);
    font-size: 14px;
  }
}

.preview-stage {
  position: relative;
  width: 100%;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  // 默认保持 16:9；矮屏再限制高度，保证卡片与底部按钮都在弹窗可视范围内。
  max-height: 380px;
  color: #f0e8d8;
  background: #1c1a17;
  border-radius: 10px;
}

.stage-media {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #1c1a17;
}

.play-button {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: rgba(240, 232, 216, 0.15);
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;

  &:hover {
    background: rgba(240, 232, 216, 0.26);
    transform: scale(1.05);
  }
}

.play-icon {
  width: 0;
  height: 0;
  margin-left: 5px;
  border-top: 11px solid transparent;
  border-bottom: 11px solid transparent;
  border-left: 18px solid #f0e8d8;
}

.stage-title {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.stage-meta {
  color: rgba(240, 232, 216, 0.55);
  font-size: 12px;
}

.stage-hint {
  position: absolute;
  bottom: 14px;
  color: rgba(240, 232, 216, 0.42);
  font-size: 11px;
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

@media (max-height: 800px) {
  .preview-stage {
    max-height: 36vh;
  }
}
</style>
