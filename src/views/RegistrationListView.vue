<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import RegistrationFilterBar from '../components/activity/RegistrationFilterBar.vue'
import RegistrationTable from '../components/activity/RegistrationTable.vue'
import { createRegistrationFilters } from '../constants/listFilters'
import { getActivityRegisterList } from '../services/businessApi'
import { exportActivityRegistrations } from '../services/exportApi'
import { getRegisterList, mapRegistration } from '../utils/registrationDisplay'
import { downloadCsv } from '../utils/csv'

const PAGE_SIZE = 10

// 报名类型字典：与 RegistrationTable 保持一致。
const typeText = {
  group: '集体活动',
  appointment: '专场预约',
}

const registrations = ref([])
const filters = ref(createRegistrationFilters())
const selection = ref([])
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const exporting = ref(false)

// /activityRegister/list 与 /activityRegister/export 使用同一份 ActivityRegisterDTO：
// searchKey 关键词、mobile 善信手机号、报名时间区间。
function buildQuery() {
  const { searchKey, mobile, startDate, endDate } = filters.value
  return {
    searchKey: searchKey.trim() || undefined,
    mobile: mobile.trim() || undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }
}

// 仅列表需要分页；导出直接传 buildQuery()，按筛选条件导出全量。
function buildParams() {
  return { ...buildQuery(), page: currentPage.value, pageSize: PAGE_SIZE }
}

async function loadRegistrations() {
  loading.value = true
  try {
    const result = getRegisterList(await getActivityRegisterList(buildParams()))
    registrations.value = result.list.map(mapRegistration)
    total.value = Number.isFinite(result.totalRow) && result.totalRow > 0
      ? result.totalRow
      : registrations.value.length
    // 仅在请求页超出总页数时回退，避免后端不认 page 时把翻页拉回第一页。
    if (Number.isFinite(result.totalPage) && result.totalPage > 0 && currentPage.value > result.totalPage) {
      currentPage.value = Number.isFinite(result.currentPage) && result.currentPage > 0
        ? result.currentPage
        : result.totalPage
    }
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取报名记录失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadRegistrations)

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadRegistrations()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadRegistrations()
}

function changePage(page) {
  currentPage.value = page
  loadRegistrations()
}

// 勾选行走前端 CSV：/activityRegister/export 只支持按筛选条件导出，不支持按 id 列表导出。
function downloadSelectedRegistrations() {
  const headers = ['活动标题', '道会时间', '道会类型', '善信姓名', '善信手机', '随行人数', '凭证号', '祈福心愿', '报名时间']
  const rows = selection.value.map((item) => [
    item.activityTitle,
    item.activityTime,
    typeText[item.type],
    item.name,
    item.phone,
    `${item.companions} 人`,
    item.cert || '—',
    item.wish,
    item.registeredAt,
  ])
  downloadCsv('报名名单.csv', headers, rows)
  ElMessage.success(`报名名单已导出（${selection.value.length} 条）`)
}

// 未勾选时调用 /activityRegister/export，服务端按筛选条件导出全量报名记录。
async function exportRegistrations() {
  if (exporting.value) return
  if (selection.value.length) {
    downloadSelectedRegistrations()
    return
  }

  exporting.value = true
  try {
    await exportActivityRegistrations(buildQuery(), '报名名单')
    ElMessage.success('报名名单已导出')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '导出报名名单失败')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <main class="registration-list-page">
    <header class="page-heading">
      <h1>报名记录</h1>
      <p>所有活动的报名名单 · 按关键词/手机号/报名时间筛选与导出</p>
    </header>

    <RegistrationFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="export-button" :loading="exporting" :disabled="loading" @click="exportRegistrations">导出名单</el-button>
      </div>

      <RegistrationTable
        v-loading="loading"
        :registrations="registrations"
        :total="total"
        :current-page="currentPage"
        @selection-change="selection = $event"
        @page-change="changePage"
      />
    </section>
  </main>
</template>

<style scoped lang="less">
.registration-list-page {
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
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
    border-radius: var(--admin-radius-sm);
  }
}
</style>
