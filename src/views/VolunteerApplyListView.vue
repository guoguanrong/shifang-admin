<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ApplyFilterBar from '../components/volunteer/ApplyFilterBar.vue'
import ApplyTable from '../components/volunteer/ApplyTable.vue'
import { createVolunteerApplicationFilters } from '../constants/listFilters'
import { getVolunteerList, updateVolunteer } from '../services/businessApi'
import { downloadCsv } from '../utils/csv'

const PAGE_SIZE = 10
// 状态字典：接口 1.待审核 / 2.审核通过 / 3.拒绝，页面内部沿用 pending / approved / rejected。
const statusText = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}
const statusValue = { pending: 1, approved: 2, rejected: 3 }
const statusKey = { 1: 'pending', 2: 'approved', 3: 'rejected' }

const applications = ref([])
const filters = ref(createVolunteerApplicationFilters())
const selection = ref([])
const currentPage = ref(1)
const total = ref(0)
const pendingCount = ref(0)
const loading = ref(false)
const reviewing = ref(false)

// VolunteerVo → 表格行：申请留言取 remark，可服务时间取 serviceTime，拒绝原因取 refuseReason。
function mapApplication(item) {
  return {
    id: item.id,
    name: item.username || '—',
    phone: item.phone || '—',
    post: item.applyPost || '—',
    availableTime: item.serviceTime || '—',
    appliedAt: item.createTime || '—',
    declaration: item.remark || '',
    status: statusKey[Number(item.status)] || 'pending',
    rejectReason: item.refuseReason || '',
  }
}

// 拉取申请列表：手机号右模糊、状态、申请岗位（精确）、申请时间区间均由服务端筛选。
async function loadApplications() {
  loading.value = true
  const { phone, status, post, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    phone: phone.trim() || undefined,
    status: status ? statusValue[status] : undefined,
    applyPost: post || undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const payload = await getVolunteerList(params)
    const result = payload?.data ?? payload
    const list = Array.isArray(result) ? result : result?.list
    applications.value = Array.isArray(list) ? list.map(mapApplication) : []
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : applications.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
    selection.value = []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取义工申请列表失败')
  } finally {
    loading.value = false
  }
}

// 顶部「待审核」条数：没有单独统计接口，用 status=1 取一次 totalRow，不受当前筛选影响。
async function loadPendingCount() {
  try {
    const payload = await getVolunteerList({ status: statusValue.pending, page: 1, pageSize: 1 })
    const result = payload?.data ?? payload
    pendingCount.value = Number(result?.totalRow) || 0
  } catch {
    pendingCount.value = 0
  }
}

function loadAll() {
  return Promise.all([loadApplications(), loadPendingCount()])
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadAll()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadAll()
}

function changePage(page) {
  currentPage.value = page
  loadApplications()
}

onMounted(loadAll)

// 审核弹窗状态：currentApplication 指向当前正在审核的那一条申请。
const reviewVisible = ref(false)
const currentApplication = ref(null)
const rejectReason = ref('')

function openReview(application) {
  currentApplication.value = application
  rejectReason.value = ''
  reviewVisible.value = true
}

// 通过：二次确认后只提交 id 与 status=2。
async function approveApplication() {
  const target = currentApplication.value
  try {
    await ElMessageBox.confirm(
      `确定通过 ${target.name}（${target.phone}）的义工申请吗？通过后将进入义工列表。`,
      '通过确认',
      { confirmButtonText: '通过', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  reviewing.value = true
  try {
    await updateVolunteer({ id: target.id, status: statusValue.approved })
    reviewVisible.value = false
    ElMessage.success('已通过该申请')
    await loadAll()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '审核通过失败')
  } finally {
    reviewing.value = false
  }
}

// 拒绝：原因必填，提交 id + status=3 + refuseReason，表格状态列会展示该原因。
async function rejectApplication() {
  const target = currentApplication.value
  const reason = rejectReason.value.trim()
  if (!reason) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  try {
    await ElMessageBox.confirm(`确定拒绝 ${target.name}（${target.phone}）的义工申请吗？`, '拒绝确认', {
      confirmButtonText: '拒绝',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  reviewing.value = true
  try {
    await updateVolunteer({ id: target.id, status: statusValue.rejected, refuseReason: reason })
    reviewVisible.value = false
    ElMessage.success('已拒绝该申请')
    await loadAll()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '拒绝申请失败')
  } finally {
    reviewing.value = false
  }
}

// 导出 CSV：有勾选导勾选，否则导出当前页数据；加 BOM 防止 Excel 打开中文乱码。
function exportApplications() {
  const exportRows = selection.value.length ? selection.value : applications.value
  const headers = ['申请ID', '善信姓名', '联络手机', '申请岗位', '可服务时间', '申请时间', '申请留言', '状态', '拒绝原因']
  const lines = exportRows.map((item) => [
    item.id,
    item.name,
    item.phone,
    item.post,
    item.availableTime,
    item.appliedAt,
    item.declaration || '—',
    statusText[item.status],
    item.rejectReason || '—',
  ])
  downloadCsv('义工申请列表.csv', headers, lines)
}
</script>

<template>
  <main class="apply-list-page">
    <header class="page-heading">
      <h1>义工申请列表</h1>
      <p>审核用户「加入义工」的申请，审核通过后进入义工列表</p>
    </header>

    <ApplyFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span>共 <b>{{ pendingCount }}</b> 条待审核</span>
        <span class="selection-info"><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="export-button" :disabled="loading" @click="exportApplications">导出</el-button>
      </div>

      <ApplyTable
        :applications="applications"
        :total="total"
        :current-page="currentPage"
        @selection-change="selection = $event"
        @review="openReview"
        @page-change="changePage"
      />
    </section>

    <el-dialog v-model="reviewVisible" title="义工申请审核" width="580px">
      <el-descriptions v-if="currentApplication" class="review-descriptions" :column="1" border size="small">
        <el-descriptions-item label="申请ID">{{ currentApplication.id }}</el-descriptions-item>
        <el-descriptions-item label="善信姓名">{{ currentApplication.name }}</el-descriptions-item>
        <el-descriptions-item label="联络手机">{{ currentApplication.phone }}</el-descriptions-item>
        <el-descriptions-item label="申请岗位">{{ currentApplication.post }}</el-descriptions-item>
        <el-descriptions-item label="可服务时间">{{ currentApplication.availableTime }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentApplication.appliedAt }}</el-descriptions-item>
        <el-descriptions-item label="申请留言">{{ currentApplication.declaration || '—' }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <span :class="['soft-tag', currentApplication.status]">{{ statusText[currentApplication.status] }}</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentApplication.status === 'rejected'" label="拒绝原因">
          {{ currentApplication.rejectReason }}
        </el-descriptions-item>
      </el-descriptions>

      <el-input
        v-if="currentApplication && currentApplication.status === 'pending'"
        v-model="rejectReason"
        class="reject-input"
        type="textarea"
        :rows="3"
        maxlength="100"
        show-word-limit
        placeholder="请填写拒绝原因（拒绝时必填）"
      />

      <template #footer>
        <el-button @click="reviewVisible = false">关闭</el-button>
        <template v-if="currentApplication && currentApplication.status === 'pending'">
          <el-button class="reject-button" :disabled="reviewing" @click="rejectApplication">拒绝</el-button>
          <el-button class="approve-button" :disabled="reviewing" @click="approveApplication">通过</el-button>
        </template>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.apply-list-page {
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

.review-descriptions {
  :deep(.el-descriptions__label) {
    width: 96px;
  }
}

.reject-input {
  margin-top: 14px;
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

  &.pending { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.approved { color: var(--admin-success); background: var(--admin-success-light); }
  &.rejected { color: var(--admin-danger); background: var(--admin-danger-light); }
}

.reject-button {
  color: var(--admin-danger);
  border-color: var(--admin-danger);

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-danger);
    border-color: var(--admin-danger);
  }
}

.approve-button {
  color: var(--admin-text-inverse);
  background: var(--admin-primary);
  border-color: var(--admin-primary);

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-primary-hover);
    border-color: var(--admin-primary-hover);
  }
}
</style>
