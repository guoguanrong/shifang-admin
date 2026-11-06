<script setup>
import { Lock, Unlock, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

// 用户表格：纯展示组件，所有数据变更与详情页跳转交由父级处理。
defineProps({
  users: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

const emit = defineEmits(['selection-change', 'toggle-status', 'detail', 'page-change'])
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="user-table" border :data="users" row-key="id" @selection-change="emit('selection-change', $event)">
      <el-table-column type="selection" width="42" fixed="left" />
      <el-table-column prop="email" label="邮箱" min-width="210" fixed="left" show-overflow-tooltip />
      <el-table-column prop="nickname" label="善信名称" min-width="120" fixed="left" show-overflow-tooltip />
      <el-table-column prop="id" label="用户ID" min-width="80" />
      <el-table-column prop="registeredAt" label="注册时间" min-width="165" />
      <el-table-column prop="donateAmount" label="捐款金额" min-width="100" />
      <el-table-column label="捐款次数" min-width="90">
        <template #default="{ row }">{{ row.donateCount ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="捐物次数" min-width="90">
        <template #default="{ row }">{{ row.donateItemCount ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="共建十方次数" min-width="110">
        <template #default="{ row }">{{ row.coBuildCount ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="点灯次数" min-width="90">
        <template #default="{ row }">{{ row.lightCount ?? '—' }}</template>
      </el-table-column>
      <el-table-column label="神像供奉次数" min-width="110">
        <template #default="{ row }">{{ row.worshipCount ?? '—' }}</template>
      </el-table-column>
      <el-table-column prop="lightAmount" label="点灯金额" min-width="100" />
      <el-table-column prop="worshipAmount" label="供奉金额" min-width="100" />
      <el-table-column prop="source" label="来源渠道" min-width="110" show-overflow-tooltip />
      <el-table-column label="状态" min-width="90" fixed="right">
        <template #default="{ row }">
          <span :class="['soft-tag', row.status]">{{ row.status === 'normal' ? '正常' : '冻结中' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="130" fixed="right">
        <template #default="{ row }">
          <ActionLink
            v-if="row.status === 'normal'"
            :icon="Lock"
            text="冻结"
            danger
            @click="emit('toggle-status', row)"
          />
          <ActionLink
            v-else
            :icon="Unlock"
            text="解冻"
            @click="emit('toggle-status', row)"
          />
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

  </div>
</template>

<style scoped lang="less">
.user-table {
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
    height: 49px;
    padding: 0;
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

  &.normal { color: var(--admin-success); background: var(--admin-success-light); }
  &.frozen { color: var(--admin-danger); background: var(--admin-danger-light); }
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
