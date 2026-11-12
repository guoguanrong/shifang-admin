<script setup>
import { computed, ref, watch } from 'vue'

// 角色权限配置树（原型「分组 → 页面 → 功能按钮」三级卡片）。
// 数据来自 POST /menu/list 的 SysMenuVo：type 1.目录 2.菜单 3.按钮，
// 提交给 POST /role/setMenu 的 menuIdList 需要包含目录/菜单/按钮各层节点 id，
// 因此半选的父级 id 也会一并输出，保证菜单树路径完整。
const props = defineProps({
  menus: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
  onlyChecked: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

// 后端已带 children 时按 type 定位层级；type 缺失时按树深度兜底。
function normalizePermissionTree(menus) {
  const groups = []
  let currentGroup = null
  let currentPage = null

  const levelOf = (node, depth) => {
    const type = Number(node?.type)
    if (type === 1) return 0
    if (type === 2) return 1
    if (type === 3) return 2
    return Math.min(depth, 2)
  }

  const ensureGroup = () => {
    if (!currentGroup) {
      currentGroup = { id: null, title: '其它权限', pages: [] }
      groups.push(currentGroup)
    }
    return currentGroup
  }

  const walk = (nodes, depth) => {
    ;(nodes || []).forEach((node) => {
      const id = Number(node.id)
      const title = node.title || node.name || '—'
      const level = levelOf(node, depth)
      const children = node.children || []

      if (level === 0) {
        currentGroup = { id, title, pages: [] }
        currentPage = null
        groups.push(currentGroup)
        walk(children, depth + 1)
        return
      }
      if (level === 1) {
        currentPage = { id, title, buttons: [] }
        ensureGroup().pages.push(currentPage)
        walk(children, depth + 1)
        return
      }
      if (!currentPage) {
        currentPage = { id: null, title: '未分组操作', buttons: [] }
        ensureGroup().pages.push(currentPage)
      }
      currentPage.buttons.push({ id, title })
    })
  }

  walk(menus, 0)
  return groups
}

const groups = computed(() => normalizePermissionTree(props.menus))
const selected = ref(new Set())
const expanded = ref(new Set())

function toIdSet(value) {
  return new Set((value || []).map(Number).filter((id) => Number.isFinite(id) && id > 0))
}

watch(() => props.modelValue, (value) => {
  if (props.readonly) {
    selected.value = toIdSet(value)
    return
  }
  const next = toIdSet(value)
  if (next.size === selected.value.size && [...next].every((id) => selected.value.has(id))) return
  selected.value = next
}, { immediate: true })

const validIds = (ids) => ids.filter((id) => Number.isFinite(id) && id > 0)
const pageLeafIds = (page) => (page.buttons.length ? page.buttons.map((btn) => btn.id) : [page.id])
const groupLeafIds = (group) => group.pages.flatMap(pageLeafIds)
const checkedCount = (ids) => ids.filter((id) => selected.value.has(id)).length

const pageChecked = (page) => {
  const ids = pageLeafIds(page)
  return ids.length > 0 && checkedCount(ids) === ids.length
}
const pageIndeterminate = (page) => checkedCount(pageLeafIds(page)) > 0 && !pageChecked(page)
const groupChecked = (group) => {
  const ids = groupLeafIds(group)
  return ids.length > 0 && checkedCount(ids) === ids.length
}
const groupIndeterminate = (group) => checkedCount(groupLeafIds(group)) > 0 && !groupChecked(group)

// 查看权限只渲染已授权项，可见的分组/页面一律呈现为已勾选（与原型一致）；
// 编辑态才按子项推导勾选/半选。
const displayGroupChecked = (group) => (props.readonly ? true : groupChecked(group))
const displayGroupIndeterminate = (group) => (props.readonly ? false : groupIndeterminate(group))
const displayPageChecked = (page) => (props.readonly ? true : pageChecked(page))
const displayPageIndeterminate = (page) => (props.readonly ? false : pageIndeterminate(page))

const allLeafIds = computed(() => groups.value.flatMap(groupLeafIds))
const allChecked = computed(() => allLeafIds.value.length > 0 && checkedCount(allLeafIds.value) === allLeafIds.value.length)
const allIndeterminate = computed(() => checkedCount(allLeafIds.value) > 0 && !allChecked.value)
const allIds = computed(() => validIds(groups.value.flatMap((group) => [
  group.id,
  ...group.pages.flatMap((page) => [page.id, ...page.buttons.map((btn) => btn.id)]),
])))

// 查看权限：只展示已授权的分组/页面；未授权的按钮仍列出但不高亮，避免误读为已授权。
const visibleGroups = computed(() => {
  if (!props.onlyChecked) return groups.value
  return groups.value
    .map((group) => ({
      ...group,
      pages: group.pages.filter((page) => (
        selected.value.has(page.id) || page.buttons.some((btn) => selected.value.has(btn.id))
      )),
    }))
    .filter((group) => group.pages.length)
})

const emptyText = computed(() => (props.onlyChecked ? '该角色暂未配置权限' : '暂无菜单权限数据'))

function emitChange() {
  const ids = new Set(selected.value)
  groups.value.forEach((group) => {
    group.pages.forEach((page) => {
      if (pageChecked(page) || pageIndeterminate(page)) ids.add(page.id)
    })
    if (groupChecked(group) || groupIndeterminate(group)) ids.add(group.id)
  })
  emit('update:modelValue', validIds([...ids]))
}

function setIds(ids, on) {
  if (props.readonly) return
  const next = new Set(selected.value)
  validIds(ids).forEach((id) => {
    if (on) next.add(id)
    else next.delete(id)
  })
  selected.value = next
  emitChange()
}

function toggleAll(on) {
  setIds(allIds.value, on)
}

function toggleGroup(group, on) {
  setIds([
    group.id,
    ...group.pages.flatMap((page) => [page.id, ...page.buttons.map((btn) => btn.id)]),
  ], on)
}

function togglePage(page, on) {
  setIds([page.id, ...page.buttons.map((btn) => btn.id)], on)
}

function toggleButton(id) {
  setIds([id], !selected.value.has(id))
}

function toggleExpand(group) {
  if (props.readonly) return
  const next = new Set(expanded.value)
  if (next.has(group.id)) next.delete(group.id)
  else next.add(group.id)
  expanded.value = next
}
</script>

<template>
  <div class="perm-box">
    <div v-if="!readonly" class="pm-all">
      <el-checkbox :model-value="allChecked" :indeterminate="allIndeterminate" @change="toggleAll">全选</el-checkbox>
      <span class="pm-all-sub">勾选全部菜单及功能按钮</span>
    </div>

    <p v-if="!visibleGroups.length" class="pm-empty">{{ emptyText }}</p>

    <section v-for="group in visibleGroups" :key="group.id ?? group.title" class="pm-g1">
      <div class="pm-h" @click="toggleExpand(group)">
        <span class="pm-ck" @click.stop>
          <el-checkbox
            :model-value="displayGroupChecked(group)"
            :indeterminate="displayGroupIndeterminate(group)"
            :disabled="readonly"
            @change="toggleGroup(group, $event)"
          />
        </span>
        <span class="pm-title">{{ group.title }}</span>
        <span class="pm-meta">{{ group.pages.length }} 项</span>
        <span v-if="!readonly" class="pm-chev">▾</span>
      </div>

      <div v-show="readonly || expanded.has(group.id)" class="pm-sub">
        <div v-for="page in group.pages" :key="page.id ?? page.title" class="pm-g2">
          <div class="pm-r2">
            <span class="pm-ck" @click.stop>
              <el-checkbox
                :model-value="displayPageChecked(page)"
                :indeterminate="displayPageIndeterminate(page)"
                :disabled="readonly"
                @change="togglePage(page, $event)"
              />
            </span>
            <span class="pm-title">{{ page.title }}</span>
          </div>
          <div v-if="page.buttons.length" class="pm-btns">
            <button
              v-for="btn in page.buttons"
              :key="btn.id"
              type="button"
              :class="['pm-btn', { ck: selected.has(btn.id) }]"
              :disabled="readonly"
              @click="toggleButton(btn.id)"
            >{{ btn.title }}</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
.perm-box {
  max-height: 420px;
  overflow-y: auto;
  padding: 4px;
  background: var(--admin-surface-muted);
  border: 1px solid var(--admin-border-light);
  border-radius: 10px;
}

.pm-all {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 4px;
  background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border-light);
  border-radius: 8px 8px 0 0;

  :deep(.el-checkbox__label) { font-weight: 600; color: var(--admin-text-primary); }
}

.pm-all-sub,
.pm-meta {
  color: var(--admin-text-muted);
  font-size: 12px;
}

.pm-empty {
  padding: 28px 0;
  color: var(--admin-text-secondary);
  font-size: 13px;
  text-align: center;
}

.pm-g1 {
  margin: 8px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 10px;
}

.pm-h {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  background: linear-gradient(105deg, var(--admin-surface) 60%, var(--admin-primary-lighter));

  .pm-meta { margin-left: auto; }
}

.pm-ck { display: inline-flex; align-items: center; }
.pm-title { color: var(--admin-text-primary); font-size: 13px; font-weight: 600; }
.pm-chev { color: var(--admin-text-muted); font-size: 11px; transition: transform .18s ease; }

.pm-sub { padding: 2px 14px 10px 38px; }

.pm-g2 {
  padding: 7px 0;
  border-top: 1px dashed var(--admin-border-light);

  &:first-child { border-top: 0; }

  .pm-title { font-size: 12.5px; font-weight: 500; color: var(--admin-text-regular); }
}

.pm-r2 { display: flex; align-items: center; gap: 8px; }

.pm-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 0 0 26px;
}

.pm-btn {
  padding: 3px 10px;
  color: var(--admin-text-secondary);
  font-size: 12px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 999px;
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease;

  &:hover:not(:disabled) { border-color: var(--admin-primary); }
  &:disabled { cursor: default; }

  &.ck {
    color: #8a6d3b;
    background: rgba(201, 160, 99, .14);
    border-color: rgba(201, 160, 99, .5);
  }
}
</style>
