<script setup>
import { Delete, Edit, Hide, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  classics: { type: Array, required: true },
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
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="classic-table" border :data="classics" row-key="id">
      <el-table-column label="封面" width="80">
        <template #default="{ row }">
          <img v-if="row.coverImage" v-media-preview="row.coverImage" :src="row.coverImage" class="cover-img" alt="文章封面" />
          <span v-else class="cover-tile">{{ row.cover }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="文章标题" min-width="190" show-overflow-tooltip />
      <el-table-column prop="intro" label="文章简介" min-width="310" show-overflow-tooltip />
      <el-table-column label="阅读量" min-width="80">
        <template #default="{ row }">
          {{ row.reads.toLocaleString('en-US') }}
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
.classic-table {
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

.cover-tile {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--admin-warning);
  font-size: 15px;
  font-weight: 600;
  background: var(--admin-warning-light);
  border-radius: var(--admin-radius-sm);
}

.cover-img {
  width: 40px;
  height: 40px;
  display: block;
  object-fit: cover;
  border: 1px solid var(--admin-border);
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
