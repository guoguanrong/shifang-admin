<script setup>
import { Bottom, Delete, Edit, Top } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  items: { type: Array, required: true },
})

const emit = defineEmits(['edit', 'toggle', 'remove'])

// 状态字典：on 上架 / off 下架。
const statusText = {
  on: '上架',
  off: '下架',
}
</script>

<template>
  <el-table class="item-table" border :data="items" row-key="id">
    <el-table-column label="物品图片" min-width="100">
      <template #default="{ row }">
        <img v-if="row.image" :src="row.image" class="item-thumb-img" alt="物品图片" />
        <span v-else class="item-thumb">{{ row.name.slice(0, 1) }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="name" label="物品名称" min-width="180" />
    <el-table-column label="类型" min-width="80">
      <template #default="{ row }">
        <span>{{ Number(row.type) === 1 ? '捐钱' : Number(row.type) === 2 ? '捐物' : row.type }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="usage" label="物品用途" min-width="140" />
    <el-table-column prop="unit" label="单位" min-width="70" />
    <el-table-column label="价格" min-width="85">
      <template #default="{ row }">
        ${{ row.price }}
      </template>
    </el-table-column>
    <el-table-column label="状态" min-width="85">
      <template #default="{ row }">
        <span :class="['soft-tag', Number(row.status) === 1 ? 'on' : 'off']">{{ statusText[Number(row.status) === 1 ? 'on' : 'off'] }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="createdAt" label="新增时间" min-width="150" />
    <el-table-column label="操作" width="190" fixed="right">
      <template #default="{ row }">
        <ActionLink :icon="Edit" text="编辑" @click="emit('edit', row)" />
        <ActionLink
          :icon="Number(row.status) === 1 ? Bottom : Top"
          :text="Number(row.status) === 1 ? '下架' : '上架'"
          :danger="Number(row.status) === 1"
          @click="emit('toggle', row)"
        />
        <ActionLink :icon="Delete" text="删除" danger @click="emit('remove', row)" />
      </template>
    </el-table-column>
  </el-table>
</template>

<style scoped lang="less">
.item-table {
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

.item-thumb-img {
  width: 40px;
  height: 40px;
  display: block;
  object-fit: cover;
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
}

.item-thumb {
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
}

</style>
