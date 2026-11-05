<script setup>
import { reactive } from 'vue'
import { createClassicFilters } from '../../constants/listFilters'

// 道典精读筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])

const form = reactive(createClassicFilters())
// 下拉第一项固定为「全部」（value 为空串），与原型一致，因此不使用 clearable。
const statusOptions = [
  { label: '全部', value: '' },
  { label: '展示中', value: 'shown' },
  { label: '隐藏中', value: 'hidden' },
]

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, createClassicFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field title-field">
      <span>文章标题</span>
      <el-input v-model="form.title" placeholder="请输入文章标题" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field status-field">
      <span>展示状态</span>
      <el-select v-model="form.status">
        <el-option v-for="item in statusOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="filter-field date-field">
      <span>新增时间</span>
      <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="年/月/日" />
      <em>至</em>
      <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="年/月/日" />
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
    width: 150px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 35px;
    border-radius: var(--admin-radius-sm);
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;
  }
}

.title-field :deep(.el-input) { width: 160px; }
.status-field :deep(.el-select) { width: 95px; }

.date-field {
  gap: 9px;

  :deep(.el-date-editor) {
    width: 130px;
  }

  em {
    color: var(--admin-text-muted);
    font-style: normal;
  }
}

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
