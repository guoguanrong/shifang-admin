<script setup>
import { Delete, EditPen, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({ roles: { type: Array, required: true } })
const emit = defineEmits(['view', 'edit', 'remove'])
</script>

<template>
  <el-table class="role-table" :data="roles" row-key="id" empty-text="暂无符合条件的角色">
    <el-table-column prop="number" label="ID" width="90" />
    <el-table-column prop="name" label="角色名称" min-width="170">
      <template #default="{ row }"><strong>{{ row.name }}</strong></template>
    </el-table-column>
    <el-table-column prop="parentName" label="上级角色" min-width="150" />
    <el-table-column prop="childCount" label="下级角色数" min-width="125" />
    <el-table-column prop="accountCount" label="绑定账号数量" min-width="135" />
    <el-table-column label="操作" min-width="200" fixed="right">
      <template #default="{ row }">
        <ActionLink :icon="View" text="查看权限" @click="emit('view', row)" />
        <ActionLink :icon="EditPen" text="编辑" @click="emit('edit', row)" />
        <span :title="row.childCount ? '请先处理下级角色' : row.accountCount ? '请先解除账号绑定' : ''">
          <ActionLink :icon="Delete" text="删除" danger :disabled="Boolean(row.childCount || row.accountCount)" @click="emit('remove', row)" />
        </span>
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="less">
.role-table {
  --el-table-border-color: var(--admin-border-light);
  --el-table-header-bg-color: var(--admin-surface-muted);
  --el-table-header-text-color: var(--admin-text-primary);
  --el-table-text-color: var(--admin-text-regular);
  --el-table-row-hover-bg-color: var(--admin-row-hover);
  width: 100%;
  font-size: 13px;

  :deep(th.el-table__cell) { height: 50px; color: var(--admin-text-regular); font-size: 12px; font-weight: 600; }
  :deep(td.el-table__cell) { height: 55px; padding: 4px 0; }
  :deep(.cell) { padding: 0 18px; }
  :deep(.el-table__row) { transition: background 0.18s ease; }
  :deep(.action-link) { padding: 6px 7px; border-radius: 6px; }
  :deep(.action-link:not(:disabled):hover) { background: var(--admin-primary-lighter); }
  :deep(.action-link.danger:not(:disabled):hover) { background: var(--admin-danger-light); }
  strong { color: var(--admin-text-primary); font-weight: 600; }
}
</style>
