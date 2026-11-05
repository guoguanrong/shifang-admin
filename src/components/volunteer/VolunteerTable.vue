<script setup>
import { View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  volunteers: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：detail 打开详情弹窗，page-change 由父级切换分页。
// 义工列表只包含审核通过（status=2）的义工，接口没有「禁止参加」状态位与原因字段，故不提供切换操作。
const emit = defineEmits(['selection-change', 'detail', 'page-change'])
</script>

<template>
  <el-table class="volunteer-table" border :data="volunteers" row-key="id" @selection-change="emit('selection-change', $event)">
    <el-table-column type="selection" width="42" />
    <el-table-column prop="name" label="善信姓名" min-width="110" />
    <el-table-column prop="phone" label="联络手机" min-width="130" />
    <el-table-column prop="post" label="申请岗位" min-width="100" />
    <el-table-column prop="joinedAt" label="加入时间" min-width="165" />
    <el-table-column prop="declaration" label="申请留言" min-width="220" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.declaration || '—' }}
      </template>
    </el-table-column>
    <el-table-column label="操作" width="95" fixed="right">
      <template #default="{ row }">
        <ActionLink :icon="View" text="详情" @click="emit('detail', row)" />
      </template>
    </el-table-column>
  </el-table>

  <footer class="table-footer">
    <span>共 {{ total }} 条&nbsp; · &nbsp;每页 10 条</span>
    <el-pagination
      :current-page="currentPage"
      background
      layout="prev, pager, next"
      :page-size="10"
      :pager-count="5"
      :total="total"
      @current-change="emit('page-change', $event)"
    />
  </footer>
</template>

<style scoped lang="less">
.volunteer-table {
  --el-table-border-color: var(--admin-border);
  --el-table-header-bg-color: var(--admin-surface-muted);
  --el-table-header-text-color: var(--admin-text-primary);
  --el-table-text-color: var(--admin-text-regular);
  --el-table-row-hover-bg-color: var(--admin-row-hover);
  width: 100%;
  font-family: inherit;
  font-size: 13px;

  :deep(th.el-table__cell) {
    height: 48px;
    font-weight: 600;
  }

  :deep(td.el-table__cell) {
    height: 52px;
    padding: 4px 0;
  }
}

.table-footer {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: var(--admin-text-secondary);
  font-size: 12px;

  :deep(.el-pagination.is-background .btn-prev),
  :deep(.el-pagination.is-background .btn-next),
  :deep(.el-pagination.is-background .el-pager li) {
    background: var(--admin-surface);
    border: 1px solid var(--admin-border);
    border-radius: var(--admin-radius-xs);
  }

  :deep(.el-pagination.is-background .el-pager li.is-active) {
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}
</style>
