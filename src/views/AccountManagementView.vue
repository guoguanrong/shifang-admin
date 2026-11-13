<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { computed, h, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AccountFilterBar from '../components/account/AccountFilterBar.vue'
import AccountFormDialog from '../components/account/AccountFormDialog.vue'
import AccountTable from '../components/account/AccountTable.vue'
import { createAccountFilters } from '../constants/listFilters'
import {
  adminUpdateUserPwd,
  deleteSysUsers,
  getSysRoleList,
  getSysUserList,
  saveSysUser,
  updateSysUser,
  updateSysUserStatus,
} from '../services/systemApi'

const PAGE_SIZE = 10
const DEFAULT_PASSWORD = '123456'

// 状态字典：接口 0.禁用 / 1.正常，页面内部沿用 enabled / disabled。
const statusValue = { enabled: 1, disabled: 0 }
const statusKey = { 1: 'enabled', 0: 'disabled' }

// SysUserVo → 表格行：角色取roleIdList/roleNameList，最后登录取lastLoginTime。
function mapAccount(item) {
  return {
    id: item.id,
    username: item.username || '—',
    name: item.nickname || '—',
    status: statusKey[Number(item.status)] || 'disabled',
    lastLogin: item.lastLoginTime || '—',
    roleId: item.roleIdList?.[0] ?? '',
    roleNames: item.roleNameList || [],
  }
}

const accounts = ref([])
const roleRecords = ref([])
const filters = ref(createAccountFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const { saving, allowSubmit, endSubmit } = useSubmitGuard()
const dialogVisible = ref(false)
const editingAccount = ref(null)

// 后端角色为平铺结构（无 parentId），构建成单层树供 tree-select 使用。
const roles = computed(() => roleRecords.value.map((role) => ({ id: role.id, label: role.name, children: [] })))
const accountNames = computed(() => accounts.value.map((account) => account.username))

// 拉取账号列表：姓名关键词、状态由服务端筛选；接口不支持按角色筛选，
// 选择角色时在当前页内过滤展示（totalRow 仍为服务端总数）。
async function loadAccounts() {
  loading.value = true
  const { name, status } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    searchKey: name.trim() || undefined,
    status: status ? statusValue[status] : undefined,
  }

  try {
    const result = await getSysUserList(params)
    const list = Array.isArray(result) ? result : result?.list
    const rows = Array.isArray(list) ? list.map(mapAccount) : []
    const { roleId } = filters.value
    accounts.value = roleId ? rows.filter((row) => row.roleId === roleId) : rows
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : rows.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取账号列表失败')
  } finally {
    loading.value = false
  }
}

// 角色下拉数据：量级小，一次取全。
async function loadRoles() {
  try {
    const result = await getSysRoleList({ page: 1, pageSize: 200 })
    const list = Array.isArray(result) ? result : result?.list
    roleRecords.value = Array.isArray(list) ? list : []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取角色列表失败')
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadAccounts()
}

function changePage(page) {
  currentPage.value = page
  loadAccounts()
}

function openAdd() {
  editingAccount.value = null
  dialogVisible.value = true
}

function openEdit(account) {
  editingAccount.value = account
  dialogVisible.value = true
}

// 保存账号：新增带默认密码，角色走 roleIdList；编辑时提交 id。
async function saveAccount(payload) {
  if (!allowSubmit()) return
  saving.value = true
  const base = {
    username: payload.username,
    nickname: payload.name,
    status: statusValue[payload.status] ?? statusValue.enabled,
    roleIdList: payload.roleId ? [payload.roleId] : [],
  }
  try {
    if (editingAccount.value) {
      await updateSysUser({ id: editingAccount.value.id, ...base })
      ElMessage.success('账号已更新')
    } else {
      await saveSysUser({ ...base, password: DEFAULT_PASSWORD, type: 'SYS_USER' })
      ElMessage.success('账号已新增，默认密码为 123456')
    }
    dialogVisible.value = false
    await loadAccounts()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存账号失败')
  } finally {
    endSubmit()
  }
}

function confirmation(message, note) {
  return h('div', [
    h('p', { style: 'margin: 0 0 8px' }, message),
    h('p', { style: 'margin: 0; color: var(--admin-warning); font-size: 12px' }, note),
  ])
}

// 重置密码：管理员接口，重置为默认密码。
async function resetPassword(account) {
  try {
    await ElMessageBox.confirm(
      confirmation(`确定重置账号 ${account.username} 的密码吗？`, '重置后需告知本人修改。'),
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    // 用户取消操作时无需提示。
    return
  }
  try {
    await adminUpdateUserPwd(account.id, DEFAULT_PASSWORD)
    ElMessage.success(`账号 ${account.username} 的密码已重置为 ${DEFAULT_PASSWORD}`)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '重置密码失败')
  }
}

async function toggleStatus(account) {
  const enabling = account.status === 'disabled'
  try {
    await ElMessageBox.confirm(
      confirmation(
        `确定${enabling ? '启用' : '禁用'}账号 ${account.username} 吗？`,
        enabling ? '启用后该账号可正常登录后台。' : '禁用后该账号将无法登录后台。',
      ),
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    // 用户取消操作时无需提示。
    return
  }
  try {
    await updateSysUserStatus({ id: account.id, status: statusValue[enabling ? 'enabled' : 'disabled'] })
    ElMessage.success(`账号已${enabling ? '启用' : '禁用'}`)
    await loadAccounts()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || `${enabling ? '启用' : '禁用'}失败`)
  }
}

async function removeAccount(account) {
  try {
    await ElMessageBox.confirm(
      confirmation(`确定删除账号 ${account.username} 吗？`, '删除后无法恢复。'),
      '操作确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' },
    )
  } catch {
    // 用户取消操作时无需提示。
    return
  }
  try {
    await deleteSysUsers([account.id])
    ElMessage.success('账号已删除')
    // 删除的是当前页最后一条时回退一页。
    const lastPage = Math.max(1, Math.ceil((total.value - 1) / PAGE_SIZE))
    currentPage.value = Math.min(currentPage.value, lastPage)
    await loadAccounts()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除账号失败')
  }
}

onMounted(() => {
  loadRoles()
  loadAccounts()
})
</script>

<template>
  <main class="account-page">
    <header class="page-heading">
      <h1>账号管理</h1>
      <p>后台管理账号 · 按角色分类与维护</p>
    </header>

    <AccountFilterBar :roles="roles" @search="search" @reset="search" />

    <section class="table-card">
      <div class="table-toolbar">
        <span>共 {{ total }} 个账号</span>
        <el-button type="primary" :disabled="loading" @click="openAdd">+ 新增账号</el-button>
      </div>
      <AccountTable
        v-loading="loading"
        :accounts="accounts"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @reset-password="resetPassword"
        @toggle-status="toggleStatus"
        @remove="removeAccount"
        @page-change="changePage"
      />
    </section>

    <AccountFormDialog
      v-model="dialogVisible"
      :account="editingAccount"
      :roles="roles"
      :account-names="accountNames"
      :saving="saving"
      @save="saveAccount"
    />
  </main>
</template>

<style scoped lang="less">
.account-page {
  padding: 16px 26px 36px;
}

.page-heading {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 0 0 22px;
  padding-left: 17px;

  &::before {
    position: absolute;
    top: 4px;
    bottom: 2px;
    left: 0;
    width: 4px;
    content: '';
    background: linear-gradient(180deg, var(--admin-primary), var(--admin-primary-light-7));
    border-radius: var(--admin-radius-pill);
  }

  h1 {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 23px;
    font-weight: 650;
    letter-spacing: 0.02em;
    line-height: 1.3;
  }

  p {
    margin: 0;
    color: var(--admin-text-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
}

.table-card {
  margin-top: 18px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(38, 68, 75, 0.045);
}

.table-toolbar {
  min-height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 22px;
  color: var(--admin-text-regular);
  font-size: 13px;
  border-bottom: 1px solid var(--admin-border-light);
  background: linear-gradient(105deg, var(--admin-surface) 55%, var(--admin-primary-lighter));

  .el-button {
    height: 36px;
    margin: 0;
    padding: 0 16px;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(47, 156, 143, 0.14);
    transition: transform 0.18s ease, box-shadow 0.18s ease;

    &:hover { transform: translateY(-1px); box-shadow: 0 7px 14px rgba(47, 156, 143, 0.19); }
  }
}

@media (max-width: 768px) {
  .account-page { padding: 18px 14px 28px; }
  .page-heading { margin-bottom: 18px; }
  .table-toolbar { padding: 12px 16px; }
}
</style>
