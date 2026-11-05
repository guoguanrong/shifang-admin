<script setup>
import { Delete, Edit, Hide, VideoPlay, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  videos: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：edit 打开新增/编辑弹窗，toggle 隐藏/恢复展示，remove 删除，page-change 由父级切换分页。
const emit = defineEmits(['edit', 'toggle', 'remove', 'page-change'])

// 展示状态字典：shown 展示中 / hidden 隐藏中。
const statusText = {
  shown: '展示中',
  hidden: '隐藏中',
}
</script>

<template>
  <el-table class="video-table" border :data="videos" row-key="id">
    <el-table-column label="视频" width="90">
      <template #default="{ row }">
        <span class="video-tile">
          <el-icon :size="12"><VideoPlay /></el-icon>
          视频
        </span>
      </template>
    </el-table-column>
    <el-table-column prop="title" label="视频标题" min-width="170" show-overflow-tooltip />
    <el-table-column label="难度 · 时长 · 形式" min-width="165">
      <template #default="{ row }">
        {{ row.difficulty }} · {{ row.duration }}分钟 · {{ row.form }}
      </template>
    </el-table-column>
    <el-table-column prop="intro" label="视频简介" min-width="290" show-overflow-tooltip />
    <el-table-column label="播放次数" min-width="90">
      <template #default="{ row }">
        {{ row.plays.toLocaleString('en-US') }}
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
</template>

<style scoped lang="less">
.video-table {
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
    height: 56px;
    padding: 4px 0;
  }
}

.video-tile {
  width: 44px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--admin-text-inverse);
  font-size: 11px;
  background: #2f3238;
  border-radius: var(--admin-radius-sm);
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
