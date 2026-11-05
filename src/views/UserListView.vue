<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import UserFilterBar from '../components/user/UserFilterBar.vue'
import UserTable from '../components/user/UserTable.vue'
import { createUserListFilters } from '../constants/listFilters'
import { getMemberList, updateMember } from '../services/businessApi'
import { downloadCsv } from '../utils/csv'
import { mapMemberToRow, memberStatusValue } from '../utils/memberDisplay'

const PAGE_SIZE = 10

const router = useRouter()
const users = ref([])
const selection = ref([])
const filters = ref(createUserListFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)

// 次数类筛选：空值不参与查询，非数字输入直接忽略。
function numberFilter(value) {
  const text = String(value ?? '').trim()
  if (!text) return undefined
  const number = Number(text)
  return Number.isFinite(number) ? number : undefined
}

// 详情页为独立路由页面（/users/:id），不在当前页弹窗展示。
function goDetail(user) {
  router.push(`/users/${user.id}`)
}

// 拉取会员列表：手机号、邮箱、城市、状态、注册时间区间、捐款/点灯/供奉次数均由服务端筛选。
async function loadUsers() {
  loading.value = true
  const { phone, email, status, startDate, endDate, donateCount, lightCount, worshipCount, city } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    phone: phone.trim() || undefined,
    email: email.trim() || undefined,
    city: city.trim() || undefined,
    status: status ? memberStatusValue[status] : undefined,
    donateCount: numberFilter(donateCount),
    lightCount: numberFilter(lightCount),
    worshipCount: numberFilter(worshipCount),
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const payload = await getMemberList(params)
    const result = payload?.data ?? payload
    const list = Array.isArray(result) ? result : result?.list
    users.value = Array.isArray(list) ? list.map(mapMemberToRow) : []
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : users.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
    selection.value = []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取用户列表失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadUsers()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadUsers()
}

function changePage(page) {
  currentPage.value = page
  loadUsers()
}

onMounted(loadUsers)

// 冻结 / 解冻：二次确认后只提交 id 与 status。
async function toggleStatus(user) {
  const nextStatus = user.status === 'normal' ? 'frozen' : 'normal'
  const actionText = nextStatus === 'frozen' ? '冻结' : '解冻'

  try {
    await ElMessageBox.confirm(`确定要${actionText}用户 ${user.id} 吗？`, `${actionText}确认`, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    // 用户取消操作时无需提示。
    return
  }

  try {
    await updateMember({ id: user.id, status: memberStatusValue[nextStatus] })
    ElMessage.success(`用户已${actionText}`)
    await loadUsers()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || `${actionText}失败`)
  }
}

// 批量冻结：跳过已冻结的用户，逐条提交后统一刷新列表。
async function batchFreeze() {
  if (!selection.value.length) {
    ElMessage.warning('请先选择需要冻结的用户')
    return
  }
  const targets = selection.value.filter((user) => user.status === 'normal')
  if (!targets.length) {
    ElMessage.info('所选用户均已是冻结状态')
    return
  }

  const results = await Promise.allSettled(
    targets.map((user) => updateMember({ id: user.id, status: memberStatusValue.frozen })),
  )
  const failed = results.find((result) => result.status === 'rejected')
  if (failed) {
    ElMessage.error(failed.reason?.userMessage || failed.reason?.message || '部分用户冻结失败')
  } else {
    ElMessage.success(`已冻结 ${targets.length} 位用户`)
  }
  await loadUsers()
}

// 导出 CSV：有勾选导勾选，否则导出当前页数据；加 BOM 防止 Excel 打开中文乱码。
function exportUsers() {
  const exportRows = selection.value.length ? selection.value : users.value
  const headers = [
    '邮箱', '善信名称', '用户ID', '注册时间', '捐款金额', '捐款次数', '捐物次数',
    '共建十方次数', '点灯次数', '神像供奉次数', '点灯金额', '供奉金额', '来源渠道', '状态',
  ]
  const lines = exportRows.map((user) => [
    user.email, user.nickname, user.id, user.registeredAt, user.donateAmount,
    user.donateCount ?? '—', user.donateItemCount ?? '—', user.coBuildCount ?? '—',
    user.lightCount ?? '—', user.worshipCount ?? '—', user.lightAmount, user.worshipAmount,
    user.source, user.status === 'normal' ? '正常' : '冻结中',
  ])
  downloadCsv('十方殿用户列表.csv', headers, lines)
}
</script>

<template>
  <main class="user-list-page">
    <header class="page-heading">
      <h1>用户列表</h1>
      <p>官网注册用户管理 · 支持冻结/解冻、查看用户画像</p>
    </header>

    <UserFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button :disabled="loading" @click="exportUsers">导出</el-button>
        <el-button class="batch-button" :disabled="loading" @click="batchFreeze">批量冻结</el-button>
      </div>

      <UserTable
        :users="users"
        :total="total"
        :current-page="currentPage"
        @selection-change="selection = $event"
        @toggle-status="toggleStatus"
        @detail="goDetail"
        @page-change="changePage"
      />
    </section>
  </main>
</template>

<style scoped lang="less">
.user-list-page {
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
  gap: 10px;
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

  .el-button {
    height: 29px;
    margin: 0;
    padding: 0 12px;
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary);
    border-radius: var(--admin-radius-sm);
  }

  .batch-button {
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}
</style>
