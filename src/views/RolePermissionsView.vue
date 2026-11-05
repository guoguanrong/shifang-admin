<script setup>
import { computed, h, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import PermissionTree from '../components/permission/PermissionTree.vue'
import RoleFormDialog from '../components/permission/RoleFormDialog.vue'
import RoleTable from '../components/permission/RoleTable.vue'
import { getDataOptions } from '../services/dataSource'
import { usePermissionsStore } from '../stores/permissions'

const permissionsStore = usePermissionsStore()
const { accounts, roles } = storeToRefs(permissionsStore)
const permissionGroups = getDataOptions('permissionGroups')
const searchInput = ref('')
const searchName = ref('')
const formVisible = ref(false)
const editingRole = ref(null)
const viewVisible = ref(false)
const viewedRole = ref(null)

const displayRoles = computed(() => {
  const names = Object.fromEntries(roles.value.map((role) => [role.id, role.name]))
  return roles.value.map((role) => ({
    ...role,
    parentName: role.parentId ? names[role.parentId] || '—' : '—',
    childCount: roles.value.filter((item) => item.parentId === role.id).length,
    accountCount: accounts.value.filter((account) => account.roleId === role.id).length,
  }))
})
const filteredRoles = computed(() => displayRoles.value.filter((role) => role.name.toLowerCase().includes(searchName.value.trim().toLowerCase())))

function search() {
  searchName.value = searchInput.value
}

function reset() {
  searchInput.value = ''
  searchName.value = ''
}

function openAdd() {
  editingRole.value = null
  formVisible.value = true
}

function openEdit(role) {
  editingRole.value = roles.value.find((item) => item.id === role.id)
  formVisible.value = true
}

function openView(role) {
  viewedRole.value = roles.value.find((item) => item.id === role.id)
  viewVisible.value = true
}

function saveRole(payload) {
  if (editingRole.value) {
    Object.assign(editingRole.value, payload)
    ElMessage.success('角色已更新')
  } else {
    const number = Math.max(0, ...roles.value.map((role) => role.number)) + 1
    roles.value.push({ id: `role-${number}`, number, ...payload })
    ElMessage.success('角色已新增')
  }
}

async function removeRole(role) {
  if (role.childCount || role.accountCount) return
  try {
    await ElMessageBox.confirm(
      h('div', [
        h('p', { style: 'margin: 0 0 8px' }, `确定删除角色 ${role.name} 吗？`),
        h('p', { style: 'margin: 0; color: var(--admin-warning); font-size: 12px' }, '删除后不可恢复，请谨慎操作。'),
      ]),
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
    roles.value = roles.value.filter((item) => item.id !== role.id)
    ElMessage.success('角色已删除')
  } catch {
    // 取消操作。
  }
}
</script>

<template>
  <main class="role-page">
    <header class="page-heading">
      <h1>角色权限</h1>
      <p>后台角色管理 · 支持多级角色与菜单、操作权限配置</p>
    </header>

    <div class="filter-card">
      <label class="filter-field">
        <span>角色名称</span>
        <el-input v-model="searchInput" placeholder="请输入角色名称" clearable @keyup.enter="search" />
      </label>
      <el-button type="primary" @click="search">查询</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <section class="table-card">
      <div class="table-toolbar">
        <span>共 {{ filteredRoles.length }} 个角色</span>
        <el-button type="primary" @click="openAdd">+ 新增角色</el-button>
      </div>
      <RoleTable :roles="filteredRoles" @view="openView" @edit="openEdit" @remove="removeRole" />
    </section>

    <RoleFormDialog
      v-model="formVisible"
      :role="editingRole"
      :roles="roles"
      :groups="permissionGroups"
      @save="saveRole"
    />
    <el-dialog v-model="viewVisible" :title="`查看权限 · ${viewedRole?.name || ''}`" width="560px" class="role-view-dialog" append-to-body>
      <PermissionTree :model-value="viewedRole?.permissions || []" :groups="permissionGroups" readonly />
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.role-page { padding: 16px 26px 36px; }
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

  h1 { margin: 0; color: var(--admin-text-primary); font-size: 23px; font-weight: 650; letter-spacing: 0.02em; line-height: 1.3; }
  p { margin: 0; color: var(--admin-text-secondary); font-size: 13px; line-height: 1.5; }
}
.filter-card {
  min-height: 80px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 17px 22px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(38, 68, 75, 0.04);

  .el-button { height: 38px; margin: 0; padding: 0 17px; border-radius: 8px; }
  .el-button--primary { box-shadow: 0 4px 10px rgba(47, 156, 143, 0.12); }
}
.filter-field {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
  color: var(--admin-text-regular);
  font-size: 13px;

  :deep(.el-input) { width: 200px; }
  :deep(.el-input__wrapper) { min-height: 38px; border-radius: 8px; box-shadow: 0 0 0 1px var(--admin-border-strong) inset; }
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
  .role-page { padding: 18px 14px 28px; }
  .page-heading { margin-bottom: 18px; }
  .filter-card { padding: 16px; }
  .table-toolbar { padding: 12px 16px; }
}
</style>

<style lang="less">
.role-view-dialog {
  width: min(620px, calc(100vw - 28px)) !important;
  border: 1px solid var(--admin-border-light);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 72px rgba(29, 54, 58, 0.18);

  .el-dialog__header { padding: 22px 26px; margin: 0; border-bottom: 1px solid var(--admin-border-light); background: linear-gradient(110deg, var(--admin-surface), var(--admin-primary-lighter)); }
  .el-dialog__title { color: var(--admin-text-primary); font-size: 17px; font-weight: 650; }
  .el-dialog__body { padding: 22px 26px 26px; }
}
</style>
