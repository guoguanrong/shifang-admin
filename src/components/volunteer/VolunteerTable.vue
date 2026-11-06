<script setup>
import { CircleClose, RefreshRight, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  volunteers: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  // 正在执行禁止/恢复请求的行 id，用于按钮 loading 态。
  togglingId: { type: [Number, String], default: null },
})

// 事件说明：detail 打开详情弹窗，toggle-ban 切换「禁止参加 / 恢复参加」，page-change 由父级切换分页。
const emit = defineEmits(['selection-change', 'detail', 'toggle-ban', 'page-change'])

// 状态展示字典：normal 正常 / banned 禁止参加。
const statusText = { normal: '正常', banned: '禁止参加' }
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="volunteer-table" border :data="volunteers" row-key="id" @selection-change="emit('selection-change', $event)">
      <el-table-column type="selection" width="42" />
      <el-table-column prop="name" label="善信姓名" min-width="100" />
      <el-table-column prop="phone" label="联络手机" min-width="125" />
      <el-table-column prop="post" label="申请岗位" min-width="95" />
      <el-table-column prop="availableTime" label="可服务时间" min-width="90" />
      <el-table-column prop="joinType" label="加入类型" min-width="90" />
      <el-table-column prop="joinedAt" label="加入时间" min-width="165" />
      <el-table-column label="状态" min-width="120">
        <template #default="{ row }">
          <div class="status-cell">
            <span :class="['status-tag', row.status]">{{ statusText[row.status] }}</span>
            <span v-if="row.status === 'banned' && row.banReason" class="ban-reason">禁止原因：{{ row.banReason }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="View" text="详情" @click="emit('detail', row)" />
          <ActionLink
            v-if="row.status === 'normal'"
            :icon="CircleClose"
            text="禁止参加"
            danger
            :disabled="row.id === togglingId"
            @click="emit('toggle-ban', row)"
          />
          <ActionLink
            v-else
            :icon="RefreshRight"
            text="恢复参加"
            :disabled="row.id === togglingId"
            @click="emit('toggle-ban', row)"
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

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.status-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);

  &.normal { color: var(--admin-success); background: var(--admin-success-light); }
  &.banned { color: var(--admin-danger); background: var(--admin-danger-light); }
}

.ban-reason {
  color: var(--admin-danger);
  font-size: 12px;
  line-height: 1.4;
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
