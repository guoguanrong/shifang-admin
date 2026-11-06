<script setup>
import { ref } from 'vue'
import { Upload, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  expenses: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  batchMode: { type: Boolean, default: false },
})

// 事件说明：勾选状态由父级管理；跨页时按 row-key 保留已选记录。
const emit = defineEmits(['detail', 'publish', 'page-change', 'selection-change'])
const tableRef = ref(null)
const canSelectExpense = (row) => row.status === 'pending'

function unselectExpense(expense) {
  tableRef.value?.toggleRowSelection(expense, false)
}

function clearSelection() {
  tableRef.value?.clearSelection()
}

defineExpose({ clearSelection, unselectExpense })

// 公示状态字典：pending 待公示 / published 已公示。
const statusText = {
  pending: '待公示',
  published: '已公示',
}

// 金额统一显示为 $18,600 格式。
function formatAmount(amount) {
  return `$${amount.toLocaleString('en-US')}`
}
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table ref="tableRef" class="expense-table" border :data="expenses" row-key="id" @selection-change="emit('selection-change', $event)">
      <el-table-column v-if="batchMode" type="selection" width="48" :selectable="canSelectExpense" reserve-selection />
      <el-table-column prop="id" label="支出编号" min-width="150" />
      <el-table-column prop="title" label="支出标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" min-width="95" />
      <el-table-column label="金额" min-width="100">
        <template #default="{ row }">
          {{ formatAmount(row.amount) }}
        </template>
      </el-table-column>
      <el-table-column prop="spentAt" label="支出时间" min-width="165" />
      <el-table-column prop="handler" label="经办人" min-width="85" />
      <el-table-column label="公示状态" min-width="90">
        <template #default="{ row }">
          <span :class="['soft-tag', row.status]">{{ statusText[row.status] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="View" text="详情" @click="emit('detail', row)" />
          <ActionLink
            v-if="row.status === 'pending'"
            :icon="Upload"
            text="公示"
            @click="emit('publish', row)"
          />
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

  </div>
</template>

<style scoped lang="less">
.expense-table {
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
  &.published { color: var(--admin-success); background: var(--admin-success-light); }
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
