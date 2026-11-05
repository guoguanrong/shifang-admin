<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import OperationLogFilterBar from '../components/log/OperationLogFilterBar.vue'
import OperationLogTable from '../components/log/OperationLogTable.vue'
import { getSystemLogList } from '../services/businessApi'
import { createOperationLogFilters } from '../constants/listFilters'
import { downloadCsv } from '../utils/csv'

const PAGE_SIZE = 10
const logs = ref([])
const total = ref(0)
const loading = ref(false)
const filters = ref(createOperationLogFilters())
const currentPage = ref(1)

function mapLog(item) {
  return {
    id: item.id,
    operator: item.username || '',
    module: item.module || '',
    action: item.method || item.type || '',
    detail: item.desc || item.requestUri || '',
    ip: item.ip || '',
    time: item.requestTime || '',
  }
}

async function loadLogs() {
  loading.value = true
  try {
    const { name, module, startDate, endDate } = filters.value
    const result = await getSystemLogList({
      page: currentPage.value,
      pageSize: PAGE_SIZE,
      username: name || undefined,
      module: module || undefined,
      startTime: startDate ? `${startDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined,
    })
    const records = Array.isArray(result) ? result : result?.list || result?.records || []
    logs.value = records.map(mapLog)
    total.value = Number(result?.totalRow ?? result?.total ?? records.length)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '操作日志加载失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = form
  currentPage.value = 1
  loadLogs()
}

function reset(form) {
  filters.value = form
  currentPage.value = 1
  loadLogs()
}

function changePage(page) {
  currentPage.value = page
  loadLogs()
}

async function exportLogs() {
  let exportRows = logs.value
  try {
    const { name, module, startDate, endDate } = filters.value
    const result = await getSystemLogList({
      page: 1,
      pageSize: Math.max(total.value, PAGE_SIZE),
      username: name || undefined,
      module: module || undefined,
      startTime: startDate ? `${startDate} 00:00:00` : undefined,
      endTime: endDate ? `${endDate} 23:59:59` : undefined,
    })
    const records = Array.isArray(result) ? result : result?.list || result?.records || []
    exportRows = records.map(mapLog)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '操作日志导出失败')
    return
  }

  const headers = ['账号姓名', '操作模块', '操作', '详情', 'IP', '操作时间']
  const rows = exportRows.map((item) => [
    item.operator,
    item.module,
    item.action,
    item.detail,
    item.ip,
    item.time,
  ])
  downloadCsv('操作日志.csv', headers, rows)
  ElMessage.success('操作日志已导出')
}

onMounted(loadLogs)
</script>

<template>
  <main class="log-list-page">
    <header class="page-heading">
      <h1>操作日志</h1>
      <p>后台所有账号的操作留痕 · 仅超级管理员可见</p>
    </header>

    <OperationLogFilterBar @search="search" @reset="reset" />

    <section v-loading="loading" class="table-card">
      <div class="table-toolbar">
        <el-button class="export-button" @click="exportLogs">导出日志</el-button>
      </div>

      <OperationLogTable
        :logs="logs"
        :total="total"
        :current-page="currentPage"
        @page-change="changePage"
      />
    </section>
  </main>
</template>

<style scoped lang="less">
.log-list-page {
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
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  .export-button {
    height: 29px;
    margin: 0;
    padding: 0 12px;
    color: var(--admin-text-regular);
    background: var(--admin-surface);
    border-color: var(--admin-border-strong);
    border-radius: var(--admin-radius-sm);

    &:hover,
    &:focus {
      color: var(--admin-primary);
      border-color: var(--admin-primary);
    }
  }
}
</style>
