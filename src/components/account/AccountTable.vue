<script setup>
import { Delete, EditPen, Lock, RefreshRight, Unlock } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  accounts: { type: Array, required: true },
  total: { type: Number, required: true },
  currentPage: { type: Number, default: 1 },
})

const emit = defineEmits(['edit', 'reset-password', 'toggle-status', 'remove', 'page-change'])
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="account-table" :data="accounts" row-key="id" empty-text="暂无符合条件的账号">
      <el-table-column prop="id" label="ID" width="75" />
      <el-table-column prop="username" label="登录账号" min-width="145" show-overflow-tooltip />
      <el-table-column prop="name" label="账号姓名" min-width="130" show-overflow-tooltip />
      <el-table-column label="角色" min-width="145">
        <template #default="{ row }">
          <span class="role-tag">{{ row.roleNames?.length ? row.roleNames.join('、') : '未配置' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="90">
        <template #default="{ row }">
          <span :class="['status-tag', row.status]">{{ row.status === 'enabled' ? '启用' : '禁用' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最后登录" min-width="165" />
      <el-table-column label="操作" min-width="245" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="EditPen" text="编辑" @click="emit('edit', row)" />
          <ActionLink v-if="row.status === 'enabled'" :icon="RefreshRight" text="重置密码" @click="emit('reset-password', row)" />
          <ActionLink
            :icon="row.status === 'enabled' ? Lock : Unlock"
            :text="row.status === 'enabled' ? '禁用' : '启用'"
            :danger="row.status === 'enabled'"
            @click="emit('toggle-status', row)"
          />
          <ActionLink v-if="row.status === 'disabled'" :icon="Delete" text="删除" danger @click="emit('remove', row)" />
        </template>
      </el-table-column>
    </el-table>
    <footer v-if="total > 10" class="table-footer">
      <span>共 {{ total }} 个账号</span>
      <el-pagination
        :current-page="currentPage"
        background
        layout="prev, pager, next"
        :page-size="10"
        :total="total"
        @current-change="emit('page-change', $event)"
      />
    </footer>

  </div>
</template>

<style scoped lang="less">
.account-table {
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
  :deep(.action-link:hover) { background: var(--admin-primary-lighter); }
  :deep(.action-link.danger:hover) { background: var(--admin-danger-light); }
}

.role-tag,
.status-tag {
  display: inline-flex;
  align-items: center;
  min-height: 25px;
  padding: 3px 11px;
  border-radius: var(--admin-radius-pill);
  font-size: 12px;
}
.role-tag { color: var(--admin-text-regular); background: var(--admin-surface-muted); }
.role-tag.primary { color: var(--admin-primary-dark); background: var(--admin-primary-light); }
.status-tag { gap: 6px; font-weight: 500; }
.status-tag::before { width: 6px; height: 6px; content: ''; border-radius: 50%; background: currentColor; }
.status-tag.enabled { color: var(--admin-success); background: var(--admin-success-light); }
.status-tag.disabled { color: var(--admin-danger); background: var(--admin-danger-light); }

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 0 22px;
  color: var(--admin-text-secondary);
  font-size: 12px;
  border-top: 1px solid var(--admin-border-light);
}
</style>
