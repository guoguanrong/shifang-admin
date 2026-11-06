<script setup>
import { computed, h, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RoleTable from '../components/permission/RoleTable.vue'
import RoleFormDialog from '../components/permission/RoleFormDialog.vue'
import { deleteSysRoles, getSysMenuList, getSysRoleList, saveSysRole, setSysRoleMenu, updateSysRole } from '../services/systemApi'

// 状态字典：接口 0.停用 / 1.正常，页面内部沿用 enabled / disabled。
const statusValue = { enabled: 1, disabled: 0 }
const statusKey = { 1: 'enabled', 0: 'disabled' }

// SysRoleVo → 表格行：绑定账号数取 userIdList，权限勾选取 menuIdList（查看/编辑权限用）。
function mapRole(item) {
  return {
    id: item.id,
    name: item.name || '—',
    key: item.key || '—',
    status: statusKey[Number(item.status)] || 'disabled',
    remark: item.remark || '',
    accountCount: item.userIdList?.length || 0,
    menuIdList: item.menuIdList || [],
  }
}

// 菜单列表组树：后端通常已带 children，扁平结构时按 pid 兜底组装。
function buildMenuTree(list) {
  if (list.some((item) => Array.isArray(item.children))) return list
  const byId = new Map(list.map((item) => [item.id, { ...item, children: [] }]))
  const roots = []
  list.forEach((item) => {
    const parent = byId.get(item.pid)
    if (parent) parent.children.push(byId.get(item.id))
    else roots.push(byId.get(item.id))
  })
  return roots
}

const roles = ref([])
const menus = ref([])
const loading = ref(false)
const searchInput = ref('')
const searchName = ref('')
const formVisible = ref(false)
const editingRole = ref(null)
const viewVisible = ref(false)
const viewedRole = ref(null)

const filteredRoles = computed(() => roles.value.filter((role) => role.name.toLowerCase().includes(searchName.value.trim().toLowerCase())))

// 查看弹窗回显：只勾叶子节点，父级由 el-tree 联动推导（避免父节点强制全选子级）。
const viewedLeafKeys = computed(() => {
  const leafIds = new Set()
  const walk = (nodes) => {
    nodes.forEach((node) => {
      if (node.children?.length) walk(node.children)
      else leafIds.add(node.id)
    })
  }
  walk(menus.value)
  return (viewedRole.value?.menuIdList || []).filter((id) => leafIds.has(id))
})

// 拉取角色（角色量小，一次取全，名称走前端过滤）。
async function loadRoles() {
  loading.value = true
  try {
    const result = await getSysRoleList({ page: 1, pageSize: 200 })
    const list = Array.isArray(result) ? result : result?.list
    roles.value = Array.isArray(list) ? list.map(mapRole) : []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取角色列表失败')
  } finally {
    loading.value = false
  }
}

// 拉取全量菜单树：权限树的勾选数据源（目录/菜单/按钮）。
async function loadMenus() {
  try {
    const result = await getSysMenuList({ page: 1, pageSize: 500 })
    const list = Array.isArray(result) ? result : result?.list
    menus.value = Array.isArray(list) ? buildMenuTree(list) : []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取菜单列表失败')
  }
}

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

// 保存角色：基本信息走 save/update，权限勾选单独走 setMenu。
async function saveRole(payload) {
  try {
    let roleId = editingRole.value?.id
    if (editingRole.value) {
      await updateSysRole({ id: roleId, name: payload.name, key: payload.key, status: statusValue[editingRole.value.status] })
    } else {
      const saved = await saveSysRole({ name: payload.name, key: payload.key, status: statusValue.enabled })
      // 新增接口未回传 id 时，从刷新后的列表里按 name+key 找回。
      roleId = saved?.id ?? saved?.data?.id
    }

    if (!roleId) {
      await loadRoles()
      roleId = roles.value.find((role) => role.name === payload.name && role.key === payload.key)?.id
    }
    if (!roleId) throw new Error('保存角色后未获取到角色 id')

    await setSysRoleMenu({ roleId, menuIdList: payload.menuIdList })
    ElMessage.success(editingRole.value ? '角色已更新' : '角色已新增')
    formVisible.value = false
    await loadRoles()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存角色失败')
  }
}

async function removeRole(role) {
  if (role.accountCount) return
  try {
    await ElMessageBox.confirm(
      h('div', [
        h('p', { style: 'margin: 0 0 8px' }, `确定删除角色 ${role.name} 吗？`),
        h('p', { style: 'margin: 0; color: var(--admin-warning); font-size: 12px' }, '删除后不可恢复，请谨慎操作。'),
      ]),
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    // 用户取消操作时无需提示。
    return
  }
  try {
    await deleteSysRoles([role.id])
    ElMessage.success('角色已删除')
    await loadRoles()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除角色失败')
  }
}

onMounted(() => {
  loadRoles()
  loadMenus()
})
</script>

<template>
  <main class="role-page">
    <header class="page-heading">
      <h1>角色权限</h1>
      <p>后台角色管理 · 菜单与操作权限配置</p>
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
        <el-button type="primary" :disabled="loading" @click="openAdd">+ 新增角色</el-button>
      </div>
      <RoleTable v-loading="loading" :roles="filteredRoles" @view="openView" @edit="openEdit" @remove="removeRole" />
    </section>

    <RoleFormDialog
      v-model="formVisible"
      :role="editingRole"
      :menus="menus"
      @save="saveRole"
    />
    <el-dialog v-model="viewVisible" :title="`查看权限 · ${viewedRole?.name || ''}`" width="560px" class="role-view-dialog" append-to-body destroy-on-close>
      <el-tree
        :data="menus"
        node-key="id"
        :props="{ label: 'title', children: 'children', disabled: () => true }"
        show-checkbox
        default-expand-all
        :default-checked-keys="viewedLeafKeys"
      />
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
  .el-tree {
    max-height: 380px;
    padding: 10px 6px;
    overflow-y: auto;
    background: var(--admin-surface-muted);
    border: 1px solid var(--admin-border-light);
    border-radius: 8px;
  }
}
</style>
