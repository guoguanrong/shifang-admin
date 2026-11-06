<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import RegistrationFilterBar from '../components/activity/RegistrationFilterBar.vue'
import RegistrationTable from '../components/activity/RegistrationTable.vue'
import { createRegistrationFilters } from '../constants/listFilters'
import { getActivityRegisterList } from '../services/businessApi'
import { getRegisterList, mapRegistration } from '../utils/registrationDisplay'
import { downloadCsv } from '../utils/csv'

const PAGE_SIZE = 10
const EXPORT_PAGE_SIZE = 200
const MAX_EXPORT_PAGES = 50

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

// 与 ActivityRegisterDTO 对齐：searchKey 关键词、mobile 善信手机号、报名时间区间。
function buildParams(page = currentPage.value, pageSize = PAGE_SIZE) {
  const { searchKey, mobile, startDate, endDate } = filters.value
  return {
    page,
    pageSize,
    searchKey: searchKey.trim() || undefined,
    mobile: mobile.trim() || undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }
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

// 服务端分页后，导出全量需要按当前筛选条件逐页拉取。
async function fetchAllRegistrations() {
  const rows = []
  let page = 1
  while (page <= MAX_EXPORT_PAGES) {
    const result = getRegisterList(await getActivityRegisterList(buildParams(page, EXPORT_PAGE_SIZE)))
    rows.push(...result.list)
    if (!result.list.length) break
    const hasTotal = Number.isFinite(result.totalRow) && result.totalRow > 0
    const hasPages = Number.isFinite(result.totalPage) && result.totalPage > 0
    if (hasTotal && rows.length >= result.totalRow) break
    if (hasPages && page >= result.totalPage) break
    // 后端可能限制 pageSize，只有总数与页数都缺失时才按「不满一页」收尾。
    if (!hasTotal && !hasPages && result.list.length < EXPORT_PAGE_SIZE) break
    page += 1
  }
  return rows.map(mapRegistration)
}

// 导出名单：有勾选导勾选，否则导出当前筛选条件下的全部记录。
async function exportRegistrations() {
  loading.value = true
  try {
    const exportRows = selection.value.length ? selection.value : await fetchAllRegistrations()
    const headers = ['活动标题', '道会时间', '道会类型', '善信姓名', '善信手机', '随行人数', '凭证号', '祈福心愿', '报名时间']
    const rows = exportRows.map((item) => [
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
    ElMessage.success(`报名名单已导出（${exportRows.length} 条）`)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '导出报名名单失败')
  } finally {
    loading.value = false
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
        <el-button class="export-button" :disabled="loading" @click="exportRegistrations">导出名单</el-button>
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
