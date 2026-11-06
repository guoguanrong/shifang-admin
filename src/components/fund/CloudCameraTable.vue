<script setup>
import { Edit } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  cameras: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：edit 打开新增/编辑弹窗，page-change 由父级切换分页。
const emit = defineEmits(['edit', 'page-change'])

// 在线状态字典：on 在线 / off 离线。
const onlineText = {
  on: '在线',
  off: '离线',
}
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="camera-table" border :data="cameras" row-key="id">
      <el-table-column prop="code" label="摄像头编号" min-width="130" />
      <el-table-column prop="location" label="摄像头位置" min-width="200" />
      <el-table-column label="在线状态" min-width="90">
        <template #default="{ row }">
          <span :class="['soft-tag', row.online ? 'on' : 'off']">{{ onlineText[row.online ? 'on' : 'off'] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="物联配置" min-width="100">
        <template #default="{ row }">
          <span :class="['soft-tag', row.configStatus]">{{ row.configStatus === 'configured' ? '已配置' : '待配置' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="Edit" text="编辑" @click="emit('edit', row)" />
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
.camera-table {
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

  &.on { color: var(--admin-success); background: var(--admin-success-light); }
  &.off { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
  &.configured { color: var(--admin-success); background: var(--admin-success-light); }
  &.pending { color: var(--admin-warning); background: var(--admin-warning-light); }
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
