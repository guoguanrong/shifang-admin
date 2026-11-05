<script setup>
import { donateTypeText } from '../../utils/orderDisplay'

defineProps({
  records: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：page-change 由父级切换分页（本页无行操作）。
const emit = defineEmits(['selection-change', 'page-change'])

// 金额统一显示为 $1,234 格式。
function formatAmount(amount) {
  const value = Number(amount)
  return Number.isFinite(value) ? `$${value.toLocaleString('en-US')}` : '—'
}
</script>

<template>
  <el-table class="donation-table" border :data="records" row-key="id" @selection-change="emit('selection-change', $event)">
    <el-table-column type="selection" width="42" />
    <el-table-column prop="orderNo" label="捐赠单号" min-width="130" />
    <el-table-column label="用户" min-width="140">
      <template #default="{ row }">
        <div class="user-cell">
          <strong>{{ row.nickname }}</strong>
          <span>{{ row.userPhone }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="name" label="善信姓名" min-width="95" />
    <el-table-column prop="phone" label="联络手机" min-width="125" />
    <el-table-column prop="email" label="邮箱" min-width="185" show-overflow-tooltip />
    <el-table-column prop="purpose" label="捐赠目标" min-width="150" show-overflow-tooltip />
    <el-table-column label="捐赠类型" min-width="135">
      <template #default="{ row }">
        {{ donateTypeText[row.type] || '—' }}
      </template>
    </el-table-column>
    <el-table-column label="捐赠物品" min-width="140" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.goods || '—' }}
      </template>
    </el-table-column>
    <el-table-column label="金额" min-width="90">
      <template #default="{ row }">
        {{ formatAmount(row.amount) }}
      </template>
    </el-table-column>
    <el-table-column label="支付渠道" min-width="95">
      <template #default="{ row }">
        {{ row.channel || '—' }}
      </template>
    </el-table-column>
    <el-table-column label="祈福留言" min-width="185" show-overflow-tooltip>
      <template #default="{ row }">
        {{ row.message || '—' }}
      </template>
    </el-table-column>
    <el-table-column prop="donatedAt" label="捐赠时间" min-width="165" />
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
.donation-table {
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
