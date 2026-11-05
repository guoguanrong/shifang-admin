<script setup>
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import RegistrationFilterBar from '../components/activity/RegistrationFilterBar.vue'
import RegistrationTable from '../components/activity/RegistrationTable.vue'
import { getInitialData } from '../services/dataSource'
import { createRegistrationFilters } from '../constants/listFilters'
import { downloadCsv } from '../utils/csv'

const PAGE_SIZE = 10
// 报名类型字典：与 RegistrationTable 保持一致。
const typeText = {
  group: '集体活动',
  appointment: '专场预约',
}

// 复制一份 mock 数据，页面内的查询/导出只作用于内存副本。
const registrations = ref(getInitialData('activityRegistrations'))
const filters = ref(createRegistrationFilters())
const selection = ref([])
const currentPage = ref(1)

// 前端筛选：活动标题/绑定手机号/联系手机号模糊匹配，报名时间按日期闭区间比较（可留空）。
const filteredRegistrations = computed(() => {
  const { activityTitle, userPhone, phone, startDate, endDate } = filters.value
  return registrations.value.filter((item) => {
    const registeredDate = item.registeredAt.slice(0, 10)
    return (!activityTitle || item.activityTitle.includes(activityTitle))
      && (!userPhone || item.userPhone.includes(userPhone))
      && (!phone || item.phone.includes(phone))
      && (!startDate || registeredDate >= startDate)
      && (!endDate || registeredDate <= endDate)
  })
})

// 客户端分页：每页固定 10 条，切换筛选条件时由 search/reset 重置回第 1 页。
const pagedRegistrations = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredRegistrations.value.slice(start, start + PAGE_SIZE)
})

function search(form) {
  filters.value = form
  currentPage.value = 1
  ElMessage.success(`查询完成，共找到 ${filteredRegistrations.value.length} 条报名记录`)
}

function reset(form) {
  filters.value = form
  currentPage.value = 1
}

function changePage(page) {
  currentPage.value = page
}

// 导出名单：有勾选导勾选，否则导出全部筛选结果。
function exportRegistrations() {
  const exportRows = selection.value.length ? selection.value : filteredRegistrations.value
  const headers = ['活动标题', '道会时间', '道会类型', '用户', '绑定手机号', '善信姓名', '联络手机', '随行人数', '预约日期', '祈福心愿', '报名时间']
  const rows = exportRows.map((item) => [
    item.activityTitle,
    item.activityTime,
    typeText[item.type],
    `${item.nickname}（${item.userPhone}）`,
    item.userPhone,
    item.name,
    item.phone,
    `${item.companions} 人`,
    item.blessingDate || '—',
    item.wish,
    item.registeredAt,
  ])
  downloadCsv('报名名单.csv', headers, rows)
  ElMessage.success('报名名单已导出')
}
</script>

<template>
  <main class="registration-list-page">
    <header class="page-heading">
      <h1>报名记录</h1>
      <p>所有活动的报名名单 · 按活动/状态筛选与导出</p>
    </header>

    <RegistrationFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="export-button" @click="exportRegistrations">导出名单</el-button>
      </div>

      <RegistrationTable
        :registrations="pagedRegistrations"
        :total="filteredRegistrations.length"
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
