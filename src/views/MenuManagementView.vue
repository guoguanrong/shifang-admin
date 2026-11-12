<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Document, EditPen, Grid, Menu as MenuIcon, Plus, Refresh, Setting, Tools, User } from '@element-plus/icons-vue'
import ActionLink from '../components/common/ActionLink.vue'
import MenuFormDialog from '../components/menu/MenuFormDialog.vue'
import { createMenuFilters } from '../constants/listFilters'
import { deleteSysMenu, getSysMenuById, getSysMenuList, saveSysMenu, updateSysMenu } from '../services/systemApi'

// 菜单管理：树形表格数据来自 POST /menu/list 的 SysMenuVo[]，
// 按 pid 在前端组装成树（目录 → 菜单 → 按钮三级）。
const TYPE_TEXT = { 1: '目录', 2: '菜单', 3: '按钮' }
const iconMap = { Menu: MenuIcon, Grid, Document, Setting, Tools, User }

const menus = ref([])
const treeData = ref([])
const loading = ref(false)
const filters = reactive(createMenuFilters())
const applied = reactive(createMenuFilters())
const selection = ref([])
const tableKey = ref(0)
const expandAll = ref(true)
const dialogVisible = ref(false)
const editingMenu = ref(null)
const presetParentId = ref(0)
const presetType = ref(1)

function iconFor(name) {
  return iconMap[name] || Document
}

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

// 兼容后端返回平铺数组或已带 children 的树。
function flatten(nodes) {
  return (nodes || []).flatMap((node) => [node, ...flatten(node.children || [])])
}

function normalize(item) {
  return {
    ...item,
    id: Number(item.id),
    pid: Number(item.pid ?? 0),
    type: Number(item.type ?? 2),
    seq: Number(item.seq ?? 0),
    status: Number(item.status ?? 1),
    hidden: Boolean(item.hidden),
    keepAlive: Boolean(item.keepAlive),
    linkType: Number(item.linkType ?? 1),
    title: item.title || '',
    path: item.path || '',
    component: item.component || '',
    perms: item.perms || '',
    icon: item.icon || '',
    queryParams: item.queryParams || '',
    remark: item.remark || '',
  }
}

function buildTree(list) {
  const byId = new Map(list.map((item) => [item.id, { ...item, children: [] }]))
  const roots = []
  byId.forEach((node) => {
    const parent = byId.get(node.pid)
    if (parent && parent.id !== node.id) parent.children.push(node)
    else roots.push(node)
  })
  const sort = (nodes) => {
    nodes.sort((a, b) => (a.seq || 0) - (b.seq || 0) || a.id - b.id)
    nodes.forEach((node) => {
      if (!node.children?.length) {
        delete node.children
        return
      }
      sort(node.children)
    })
  }
  sort(roots)
  return roots
}

async function loadMenus() {
  loading.value = true
  try {
    const payload = await getSysMenuList({ page: 1, pageSize: 500 })
    const rows = flatten(getList(payload)).map(normalize)
    menus.value = rows
    treeData.value = buildTree(rows)
    tableKey.value += 1
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '菜单列表加载失败')
  } finally {
    loading.value = false
  }
}

// 前端筛选并保留命中节点的祖先链，避免树结构被打断。
const filteredTree = computed(() => {
  const keyword = applied.title.trim().toLowerCase()
  const status = applied.status === '' ? null : Number(applied.status)
  if (!keyword && status === null) return treeData.value

  const byId = new Map(menus.value.map((item) => [item.id, item]))
  const ids = new Set()
  menus.value.forEach((item) => {
    if (keyword && !String(item.title).toLowerCase().includes(keyword)) return
    if (status !== null && item.status !== status) return
    ids.add(item.id)
    let parent = byId.get(item.pid)
    while (parent && !ids.has(parent.id)) {
      ids.add(parent.id)
      parent = byId.get(parent.pid)
    }
  })
  const pick = (nodes) => nodes
    .filter((node) => ids.has(node.id))
    .map((node) => {
      const next = { ...node }
      const children = pick(node.children || [])
      if (children.length) next.children = children
      else delete next.children
      return next
    })
  return pick(treeData.value)
})

// 上级菜单下拉：按钮节点不能再挂子节点。
const parentOptions = computed(() => {
  const pick = (nodes) => nodes
    .filter((node) => Number(node.type) !== 3)
    .map((node) => {
      const children = pick(node.children || [])
      return children.length
        ? { id: node.id, title: node.title, children }
        : { id: node.id, title: node.title }
    })
  return [{ id: 0, title: '主类目', children: pick(treeData.value) }]
})

function search() {
  Object.assign(applied, filters)
}

function reset() {
  Object.assign(filters, createMenuFilters())
  Object.assign(applied, createMenuFilters())
}

function toggleExpand() {
  expandAll.value = !expandAll.value
  tableKey.value += 1
}

function openAdd(parentId = 0, defaultType = 1) {
  editingMenu.value = null
  presetParentId.value = Number(parentId)
  presetType.value = Number(defaultType)
  dialogVisible.value = true
}

function openAddChild(row) {
  const parentType = Number(row.type)
  openAdd(row.id, parentType === 1 ? 2 : parentType === 2 ? 3 : 2)
}

async function openEdit(row) {
  const id = Number(row.id)
  editingMenu.value = menus.value.find((item) => item.id === id) || normalize(row)
  presetParentId.value = Number(row.pid ?? 0)
  dialogVisible.value = true
  try {
    const detail = await getSysMenuById(id)
    if (editingMenu.value?.id === id) editingMenu.value = normalize(detail)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取菜单详情失败，已使用列表数据')
  }
}

// 级联删除：把目标节点及其所有后代 id 一起提交（/menu/delete 入参是 integer[]）。
function collectIds(id, acc = new Set()) {
  acc.add(Number(id))
  menus.value
    .filter((item) => Number(item.pid) === Number(id))
    .forEach((item) => collectIds(item.id, acc))
  return acc
}

async function removeMenu(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除「${row.title}」吗？其下级菜单会一并删除，删除后不可恢复。`,
      '删除菜单',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await deleteSysMenu([...collectIds(row.id)])
    ElMessage.success('菜单已删除')
    await loadMenus()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除菜单失败')
  }
}

async function batchRemove() {
  if (!selection.value.length) return
  const ids = new Set()
  selection.value.forEach((row) => collectIds(row.id, ids))
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selection.value.length} 个菜单及其下级菜单吗？删除后不可恢复。`,
      '级联删除',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await deleteSysMenu([...ids])
    ElMessage.success('菜单已删除')
    selection.value = []
    await loadMenus()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除菜单失败')
  }
}

async function saveMenu(payload) {
  try {
    if (editingMenu.value) await updateSysMenu({ id: editingMenu.value.id, ...payload })
    else await saveSysMenu(payload)
    ElMessage.success(editingMenu.value ? '菜单已更新' : '菜单已新增')
    dialogVisible.value = false
    await loadMenus()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存菜单失败')
  }
}

onMounted(loadMenus)
</script>

<template>
  <main class="menu-page">
    <header class="page-heading">
      <h1>菜单管理</h1>
      <p>维护系统菜单、目录、按钮与权限标识 · 支持树形展示与级联删除</p>
    </header>

    <div class="filter-card">
      <label class="filter-field">
        <span>菜单名称</span>
        <el-input v-model="filters.title" placeholder="请输入菜单名称" clearable @keyup.enter="search" />
      </label>
      <label class="filter-field">
        <span>状态</span>
        <el-select v-model="filters.status" placeholder="菜单状态">
          <el-option label="全部" value="" />
          <el-option label="正常" value="1" />
          <el-option label="停用" value="0" />
        </el-select>
      </label>
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button @click="reset">重置</el-button>
    </div>

    <section class="table-card">
      <div class="table-toolbar">
        <span>共 {{ menus.length }} 个菜单</span>
        <div class="toolbar-actions">
          <el-button type="primary" @click="openAdd()">+ 新增</el-button>
          <el-button :disabled="!selection.length" @click="batchRemove">
            <el-icon><Delete /></el-icon>级联删除
          </el-button>
          <el-button @click="toggleExpand">{{ expandAll ? '折叠' : '展开' }}</el-button>
          <el-button @click="loadMenus">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </div>

      <el-table
        :key="tableKey"
        v-loading="loading"
        class="menu-table"
        border
        :data="filteredTree"
        row-key="id"
        :tree-props="{ children: 'children' }"
        :default-expand-all="expandAll"
        empty-text="暂无菜单数据"
        @selection-change="selection = $event"
      >
        <el-table-column type="selection" width="46" />
        <el-table-column label="菜单名称" min-width="260">
          <template #default="{ row }">
            <span class="menu-name">
              <el-icon :size="14"><component :is="iconFor(row.icon)" /></el-icon>
              <span>{{ row.title }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <span :class="['type-tag', `type-${row.type}`]">{{ TYPE_TEXT[row.type] || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="seq" label="排序" width="80" />
        <el-table-column prop="perms" label="权限标识" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.perms || '—' }}</template>
        </el-table-column>
        <el-table-column prop="component" label="组件路径" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">{{ row.component || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <span :class="['status-tag', row.status === 1 ? 'normal' : 'disabled']">{{ row.status === 1 ? '正常' : '停用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ActionLink :icon="EditPen" text="编辑" @click="openEdit(row)" />
            <ActionLink v-if="row.type !== 3" :icon="Plus" text="新增" @click="openAddChild(row)" />
            <ActionLink :icon="Delete" text="删除" danger @click="removeMenu(row)" />
          </template>
        </el-table-column>
      </el-table>
    </section>

    <MenuFormDialog
      v-model="dialogVisible"
      :menu="editingMenu"
      :parent-id="presetParentId"
      :default-type="presetType"
      :parent-options="parentOptions"
      @save="saveMenu"
    />
  </main>
</template>

<style scoped lang="less">
.menu-page { padding: 16px 26px 36px; }

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

  h1 { margin: 0; color: var(--admin-text-primary); font-size: 23px; font-weight: 650; line-height: 1.3; }
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
  box-shadow: 0 6px 22px rgba(38, 68, 75, .04);

  .el-button { height: 38px; margin: 0; padding: 0 17px; border-radius: 8px; }
}

.filter-field {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-right: 16px;
  color: var(--admin-text-regular);
  font-size: 13px;

  :deep(.el-input),
  :deep(.el-select) { width: 200px; }
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) { min-height: 38px; border-radius: 8px; box-shadow: 0 0 0 1px var(--admin-border-strong) inset; }
}

.table-card {
  margin-top: 18px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(38, 68, 75, .045);
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

  .el-button { height: 36px; margin: 0; padding: 0 14px; border-radius: 8px; }
}

.toolbar-actions { display: flex; flex-wrap: wrap; gap: 8px; }

.menu-table {
  --el-table-border-color: var(--admin-border-light);
  --el-table-header-bg-color: var(--admin-surface-muted);
  --el-table-header-text-color: var(--admin-text-primary);
  --el-table-text-color: var(--admin-text-regular);
  width: 100%;
  font-size: 13px;

  :deep(th.el-table__cell) { height: 48px; font-weight: 600; }
  :deep(td.el-table__cell) { height: 50px; padding: 4px 0; }
  :deep(.action-link) { padding: 6px 7px; border-radius: 6px; }
}

.menu-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--admin-text-primary);
  font-weight: 500;

  .el-icon { color: var(--admin-primary); }
}

.type-tag,
.status-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);
}

.type-tag {
  &.type-1 { color: var(--admin-info); background: var(--admin-info-light); }
  &.type-2 { color: var(--admin-success); background: var(--admin-success-light); }
  &.type-3 { color: var(--admin-warning); background: var(--admin-warning-light, #f7ecd8); }
}

.status-tag {
  border-radius: var(--admin-radius-pill);
  &.normal { color: var(--admin-success); background: var(--admin-success-light); }
  &.disabled { color: var(--admin-danger); background: var(--admin-danger-light); }
}

@media (max-width: 768px) {
  .menu-page { padding: 18px 14px 28px; }
  .filter-card { padding: 16px; }
  .table-toolbar { padding: 12px 16px; }
}
</style>
