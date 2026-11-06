<script setup>
defineProps({
  registrations: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：page-change 由父级切换分页（本页无行操作）。
const emit = defineEmits(['selection-change', 'page-change'])

// 报名类型字典：group 集体活动 / appointment 专场预约。
const typeText = {
  group: '集体活动',
  appointment: '专场预约',
}
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="registration-table" border :data="registrations" row-key="id" @selection-change="emit('selection-change', $event)">
      <el-table-column type="selection" width="42" />
      <el-table-column prop="activityTitle" label="活动标题" min-width="190" show-overflow-tooltip />
      <el-table-column prop="activityTime" label="道会时间" min-width="170" show-overflow-tooltip />
      <el-table-column label="道会类型" min-width="95">
        <template #default="{ row }">
          <span class="soft-tag type">{{ typeText[row.type] }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="善信姓名" min-width="90" />
      <el-table-column prop="phone" label="善信手机" min-width="120" />
      <el-table-column label="随行人数" min-width="80">
        <template #default="{ row }">
          {{ row.companions }} 人
        </template>
      </el-table-column>
      <el-table-column prop="cert" label="凭证号" min-width="120" show-overflow-tooltip />
      <el-table-column prop="wish" label="祈福心愿" min-width="120" show-overflow-tooltip />
      <el-table-column prop="registeredAt" label="报名时间" min-width="165" />
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
.registration-table {
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

  &.type { color: var(--admin-warning); background: var(--admin-warning-light); }
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
