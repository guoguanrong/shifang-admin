<script setup>
import { View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'
import { orderStatusText } from '../../utils/orderDisplay'

defineProps({
  orders: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：preview 查看供奉图片，page-change 由父级切换分页。
const emit = defineEmits(['selection-change', 'preview', 'page-change'])
</script>

<template>
  <el-table class="order-table" border :data="orders" row-key="id" @selection-change="emit('selection-change', $event)">
    <el-table-column type="selection" width="42" />
    <el-table-column prop="orderNo" label="订单号" min-width="140" />
    <el-table-column label="用户" min-width="140">
      <template #default="{ row }">
        <div class="user-cell">
          <strong>{{ row.nickname }}</strong>
          <span>{{ row.userPhone }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="project" label="供奉项目" min-width="150" />
    <el-table-column prop="name" label="善信姓名" min-width="95" />
    <el-table-column label="祈福心愿" min-width="180" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.wish || '—' }}
      </template>
    </el-table-column>
    <el-table-column label="金额" min-width="70">
      <template #default="{ row }">
        ${{ row.amount }}
      </template>
    </el-table-column>
    <el-table-column label="状态" min-width="90">
      <template #default="{ row }">
        <span :class="['soft-tag', row.status]">{{ orderStatusText[row.status] }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="orderedAt" label="下单时间" min-width="165" />
    <el-table-column prop="expireAt" label="供奉到期时间" min-width="165" />
    <el-table-column label="操作" width="135" fixed="right">
      <template #default="{ row }">
        <ActionLink :icon="View" text="查看供奉图片" @click="emit('preview', row)" />
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
.order-table {
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

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    color: var(--admin-text-primary);
    font-weight: 600;
  }

  span {
    color: var(--admin-text-secondary);
    font-size: 12px;
  }
}

.soft-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);

  &.pending { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.offering { color: var(--admin-success); background: var(--admin-success-light); }
  &.unpaid { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
  &.expired { color: var(--admin-danger); background: var(--admin-danger-light); }
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
