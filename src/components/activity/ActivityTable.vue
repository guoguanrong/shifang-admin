<script setup>
import { ref } from 'vue'
import { Bottom, Delete, Edit, Top } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  activities: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：edit 打开新增/编辑弹窗，toggle 上架/下架，remove 删除，page-change 由父级切换分页。
const emit = defineEmits(['edit', 'toggle', 'remove', 'page-change'])

// 图片为 http 外链时可能被浏览器按混合内容拦截，加载失败回退到文字占位。
const brokenImages = ref(new Set())

function markImageBroken(id) {
  brokenImages.value = new Set(brokenImages.value).add(id)
}

// 活动类型字典：group 集体活动 / appointment 专场预约。
const typeText = {
  group: '集体活动',
  appointment: '专场预约',
}
// 活动状态字典：与产品原型的五态保持一致。
const statusText = {
  pending: '待报名',
  enrolling: '报名中',
  registrationStopped: '报名停止',
  inProgress: '进行中',
  ended: '已结束',
}

// 报名人数：registered 为 null 展示 '—'；quota 为 null 展示 '不限'。
function formatEnrollment(activity) {
  if (activity.registered === null) return '—'
  return `${activity.registered}/${activity.quota ?? '不限'}`
}
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="activity-table" border :data="activities" row-key="id">
      <el-table-column label="活动图片" width="90">
        <template #default="{ row }">
          <img
            v-if="row.images[0]?.url && !brokenImages.has(row.id)"
            v-media-preview="(row.images ?? []).map((item) => item.url).filter(Boolean)"
            :src="row.images[0].url"
            class="activity-thumb-img"
            alt="活动图片"
            @error="markImageBroken(row.id)"
          />
          <span v-else class="activity-thumb">{{ row.title.slice(0, 1) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="活动标题" min-width="190" show-overflow-tooltip />
      <el-table-column prop="subtitle" label="活动副标题" min-width="160" show-overflow-tooltip />
      <el-table-column label="活动标签" min-width="170">
        <template #default="{ row }">
          <div class="tag-cell">
            <span v-for="tag in row.tags" :key="tag">{{ tag }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="道会类型" min-width="90">
        <template #default="{ row }">
          <span class="soft-tag type">{{ typeText[row.type] }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="timeText" label="道会时间" min-width="165" show-overflow-tooltip />
      <el-table-column prop="location" label="道会地点" min-width="150" show-overflow-tooltip />
      <el-table-column prop="joinWay" label="参加方式" min-width="130" show-overflow-tooltip />
      <el-table-column label="报名人数" min-width="85">
        <template #default="{ row }">
          {{ formatEnrollment(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="deadline" label="报名截止" min-width="145" show-overflow-tooltip />
      <el-table-column label="活动状态" min-width="90">
        <template #default="{ row }">
          <span :class="['soft-tag', row.status || 'pending']">{{ statusText[row.status] || '未设置' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上架状态" min-width="90">
        <template #default="{ row }">
          <span :class="['soft-tag', row.listed ? 'on' : 'off']">{{ row.listed ? '上架' : '暂不上架' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="Edit" text="编辑" @click="emit('edit', row)" />
          <ActionLink
            v-if="row.status !== 'ended'"
            :icon="row.listed ? Bottom : Top"
            :text="row.listed ? '下架' : '上架'"
            :danger="row.listed"
            @click="emit('toggle', row)"
          />
          <ActionLink
            v-if="!row.listed"
            :icon="Delete"
            text="删除"
            danger
            @click="emit('remove', row)"
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
.activity-table {
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

.activity-thumb {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--admin-text-secondary);
  font-size: 16px;
  background: var(--admin-surface-muted);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
}

.activity-thumb-img {
  width: 40px;
  height: 40px;
  display: block;
  object-fit: cover;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
}

.tag-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  span {
    padding: 1px 8px;
    color: var(--admin-primary);
    font-size: 11px;
    border: 1px solid var(--admin-primary-light-5);
    border-radius: var(--admin-radius-xs);
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
  &.pending { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
  &.enrolling { color: var(--admin-success); background: var(--admin-success-light); }
  &.registrationStopped { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.inProgress { color: var(--admin-info); background: var(--admin-info-light); }
  &.ended { color: var(--admin-info); background: var(--admin-info-light); }
  &.on { color: var(--admin-success); background: var(--admin-success-light); }
  &.off { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
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
