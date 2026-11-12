<script setup>
import { Delete, Edit } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  goals: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'remove'])

// 金额统一以「万」展示：整数不带小数，非整数最多保留 4 位（如 $499.9998万）。
function formatWan(amount) {
  const wan = amount / 10000
  const text = Number.isInteger(wan) ? String(wan) : String(parseFloat(wan.toFixed(4)))
  return `$${text}万`
}

// 完成进度：已筹 / 目标，封顶 100%。
function progressPercent(goal) {
  if (!Number(goal.targetAmount)) return 0
  return Math.min(100, Math.round((goal.raisedAmount / goal.targetAmount) * 100))
}

// 进度条颜色：已完成用功能绿，其余用中性灰。
function progressColor(goal) {
  return progressPercent(goal) >= 100 ? 'var(--admin-success)' : 'var(--admin-text-muted)'
}
</script>

<template>
  <el-table class="goal-table" border :data="goals" row-key="id">
    <el-table-column label="目标效果图" width="100">
      <template #default="{ row }">
        <img v-if="row.image" v-media-preview="row.image" :src="row.image" class="goal-thumb-img" alt="目标效果图" />
        <span v-else class="goal-thumb">{{ row.title.slice(0, 1) }}</span>
      </template>
    </el-table-column>
    <el-table-column label="目标主标题" min-width="190">
      <template #default="{ row }">
        <div class="title-cell">
          <strong>{{ row.title }}</strong>
          <span>{{ row.subtitle }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="捐赠类型" min-width="110">
      <template #default="{ row }">
        <!-- 一个目标可同时关联钱档位与实物商品，此时展示两个标签。 -->
        <div class="type-tags">
          <span
            v-for="type in (row.linkedTypes?.length ? row.linkedTypes : [Number(row.type) === 1 ? 1 : 2])"
            :key="type"
            :class="['soft-tag', type === 1 ? 'fund' : 'goods']"
          >{{ type === 1 ? '捐钱' : '捐物' }}</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="目标金额" min-width="110">
      <template #default="{ row }">
        {{ formatWan(row.targetAmount) }}
      </template>
    </el-table-column>
    <el-table-column label="已筹金额" min-width="95">
      <template #default="{ row }">
        {{ formatWan(row.raisedAmount) }}
      </template>
    </el-table-column>
    <el-table-column label="完成进度" min-width="170">
      <template #default="{ row }">
        <div class="progress-cell">
          <el-progress
            class="progress-bar"
            :percentage="progressPercent(row)"
            :stroke-width="8"
            :show-text="false"
            :color="progressColor(row)"
          />
          <span>{{ progressPercent(row) }}%</span>
        </div>
      </template>
    </el-table-column>
    <el-table-column label="状态" min-width="90">
      <template #default="{ row }">
        <span class="soft-tag">{{ row.status ?? '—' }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="createdAt" label="新增时间" min-width="165" />
    <el-table-column label="操作" width="145" fixed="right">
      <template #default="{ row }">
        <ActionLink :icon="Edit" text="编辑" @click="emit('edit', row)" />
        <ActionLink :icon="Delete" text="删除" danger @click="emit('remove', row)" />
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="less">
.goal-table {
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

.goal-thumb-img {
  width: 40px;
  height: 40px;
  display: block;
  object-fit: cover;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
}

.goal-thumb {
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

.title-cell {
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

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .progress-bar {
    flex: 1;
  }

  span {
    flex: 0 0 auto;
    color: var(--admin-text-secondary);
    font-size: 12px;
  }
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
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

  &.fund { color: var(--admin-success); background: var(--admin-success-light); }
  &.goods { color: var(--admin-info); background: var(--admin-info-light); }
}

</style>
