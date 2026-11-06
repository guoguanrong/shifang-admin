<script setup>
import { Delete, Edit, Hide, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  records: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：edit 打开新增/编辑弹窗，toggle 隐藏/恢复展示，remove 删除，page-change 由父级切换分页。
const emit = defineEmits(['edit', 'toggle', 'remove', 'page-change'])

// 祈福类型字典：peace 平安 / health 健康 / wealth 财运。
const blessingTypeText = {
  peace: '平安',
  health: '健康',
  wealth: '财运',
}
// 展示状态字典：shown 展示中 / hidden 隐藏中。
const statusText = {
  shown: '展示中',
  hidden: '隐藏中',
}
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="record-table" border :data="records" row-key="id">
      <el-table-column prop="name" label="信众" min-width="90">
        <template #default="{ row }">
          <strong class="name-cell">{{ row.name }}</strong>
        </template>
      </el-table-column>
      <el-table-column prop="occupation" label="职业" min-width="100" />
      <el-table-column prop="title" label="实录标题" min-width="250" show-overflow-tooltip />
      <el-table-column label="祈福类型" min-width="95">
        <template #default="{ row }">
          <span :class="['soft-tag', row.blessingType]">{{ blessingTypeText[row.blessingType] || row.blessingType || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="新增时间" min-width="165" />
      <el-table-column label="展示状态" min-width="90">
        <template #default="{ row }">
          <span :class="['soft-tag', row.status]">{{ statusText[row.status] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="Edit" text="编辑" @click="emit('edit', row)" />
          <ActionLink
            v-if="row.status === 'shown'"
            :icon="Hide"
            text="隐藏"
            @click="emit('toggle', row)"
          />
          <template v-else>
            <ActionLink :icon="View" text="恢复展示" @click="emit('toggle', row)" />
            <ActionLink :icon="Delete" text="删除" danger @click="emit('remove', row)" />
          </template>
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
.record-table {
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

.name-cell {
  color: var(--admin-text-primary);
  font-weight: 600;
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

  &.peace { color: var(--admin-success); background: var(--admin-success-light); }
  &.health { color: var(--admin-info); background: var(--admin-info-light); }
  &.wealth { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.shown { color: var(--admin-success); background: var(--admin-success-light); }
  &.hidden { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
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
