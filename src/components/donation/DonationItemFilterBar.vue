<script setup>
import { reactive } from 'vue'

// 物品列表筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])

// 重置基准值，需与初始展示的查询条件保持一致。
const defaultForm = {
  name: '',
  status: '',
}

const form = reactive({ ...defaultForm })
// 下拉第一项固定为「全部」（value 为空串），与原型一致，因此不使用 clearable。
const statusOptions = [
  { label: '全部', value: '' },
  { label: '上架', value: 'on' },
  { label: '下架', value: 'off' },
]

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, defaultForm)
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field name-field">
      <span>物品名称</span>
      <el-input v-model="form.name" placeholder="请输入名称" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field status-field">
      <span>状态</span>
      <el-select v-model="form.status">
        <el-option v-for="item in statusOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="filter-actions">
      <el-button class="search-button" @click="emit('search', { ...form })">查询</el-button>
      <el-button @click="resetForm">重置</el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.filter-card {
  min-height: 70px;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 20px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);
}

.filter-field {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  color: var(--admin-text-regular);
  font-size: 13px;
  white-space: nowrap;

  :deep(.el-input),
  :deep(.el-select) {
    width: 160px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 35px;
    border-radius: var(--admin-radius-sm);
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;
  }
}

.name-field :deep(.el-input) { width: 180px; }
.status-field :deep(.el-select) { width: 95px; }

.filter-actions {
  display: flex;
  gap: 8px;
  margin-left: -2px;

  .el-button {
    height: 30px;
    margin: 0;
    padding: 0 12px;
    border-radius: var(--admin-radius-sm);
  }
}

.search-button {
  color: var(--admin-text-inverse);
  background: var(--admin-primary);
  border-color: var(--admin-primary);

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-primary-hover);
    border-color: var(--admin-primary-hover);
  }
}

@media (max-width: 1680px) {
  .filter-card {
    flex-wrap: wrap;
    gap: 10px 18px;
  }
}
</style>
