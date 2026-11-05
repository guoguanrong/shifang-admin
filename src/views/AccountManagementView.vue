<script setup>
import { computed, h, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import AccountFilterBar from '../components/account/AccountFilterBar.vue'
import AccountFormDialog from '../components/account/AccountFormDialog.vue'
import AccountTable from '../components/account/AccountTable.vue'
import { createAccountFilters } from '../constants/listFilters'
import { usePermissionsStore } from '../stores/permissions'

const PAGE_SIZE = 10
const permissionsStore = usePermissionsStore()
const { accounts, roles: roleRecords } = storeToRefs(permissionsStore)
const roles = computed(() => {
  const byId = Object.fromEntries(roleRecords.value.map((role) => [role.id, { id: role.id, label: role.name, children: [] }]))
  const roots = []
  roleRecords.value.forEach((role) => {
    if (role.parentId && byId[role.parentId]) byId[role.parentId].children.push(byId[role.id])
    else roots.push(byId[role.id])
  })
  return roots
})
const roleLabels = computed(() => Object.fromEntries(roleRecords.value.map((role) => [role.id, role.name])))
const filters = ref(createAccountFilters())
const currentPage = ref(1)
const dialogVisible = ref(false)
const editingAccount = ref(null)

const filteredAccounts = computed(() => {
  const { name, roleId, status } = filters.value
  const keyword = name.trim().toLowerCase()
  return accounts.value.filter((account) => (
    (!keyword || account.name.toLowerCase().includes(keyword) || account.username.toLowerCase().includes(keyword))
    && (!roleId || account.roleId === roleId)
    && (!status || account.status === status)
  ))
})
const pagedAccounts = computed(() => filteredAccounts.value.slice((currentPage.value - 1) * PAGE_SIZE, currentPage.value * PAGE_SIZE))
const accountNames = computed(() => accounts.value.map((account) => account.username))

function search(form) {
  filters.value = form
  currentPage.value = 1
}

function openAdd() {
  editingAccount.value = null
  dialogVisible.value = true
}

function openEdit(account) {
  editingAccount.value = account
  dialogVisible.value = true
}

function saveAccount(payload) {
  if (editingAccount.value) {
    Object.assign(editingAccount.value, { name: payload.name, roleId: payload.roleId, status: payload.status })
    ElMessage.success('账号已更新')
  } else {
    const nextId = Math.max(0, ...accounts.value.map((account) => account.id)) + 1
    accounts.value.unshift({ id: nextId, ...payload, lastLogin: '—' })
    currentPage.value = 1
    ElMessage.success('账号已新增，默认密码为 123456')
  }
}

function confirmation(message, note) {
  return h('div', [
    h('p', { style: 'margin: 0 0 8px' }, message),
    h('p', { style: 'margin: 0; color: var(--admin-warning); font-size: 12px' }, note),
  ])
}

async function resetPassword(account) {
  try {
    await ElMessageBox.confirm(
      confirmation(`确定重置账号 ${account.username} 的密码吗？`, '重置后需告知本人修改。'),
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
    ElMessage.info(`演示操作已确认：账号 ${account.username} 的默认密码为 123456`)
  } catch {
    // 取消操作。
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
    account.status = enabling ? 'enabled' : 'disabled'
    ElMessage.success(`账号已${enabling ? '启用' : '禁用'}`)
  } catch {
    // 取消操作。
  }
}

async function removeAccount(account) {
  try {
    await ElMessageBox.confirm(
      confirmation(`确定删除账号 ${account.username} 吗？`, '删除后无法恢复。'),
      '操作确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' },
    )
    accounts.value = accounts.value.filter((item) => item.id !== account.id)
    const lastPage = Math.max(1, Math.ceil(filteredAccounts.value.length / PAGE_SIZE))
    currentPage.value = Math.min(currentPage.value, lastPage)
    ElMessage.success('账号已删除')
  } catch {
    // 取消操作。
  }
}
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
        <span>共 {{ filteredAccounts.length }} 个账号</span>
        <el-button type="primary" @click="openAdd">+ 新增账号</el-button>
      </div>
      <AccountTable
        :accounts="pagedAccounts"
        :roles="roleLabels"
        :total="filteredAccounts.length"
        :current-page="currentPage"
        @edit="openEdit"
        @reset-password="resetPassword"
        @toggle-status="toggleStatus"
        @remove="removeAccount"
        @page-change="currentPage = $event"
      />
    </section>

    <AccountFormDialog
      v-model="dialogVisible"
      :account="editingAccount"
      :roles="roles"
      :account-names="accountNames"
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
