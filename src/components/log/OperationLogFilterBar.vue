<script setup>
import { reactive } from 'vue'
import { createOperationLogFilters } from '../../constants/listFilters'
import { getDataOptions } from '../../services/dataSource'

// 操作日志筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])
const logModuleOptions = getDataOptions('logModules')

const form = reactive(createOperationLogFilters())

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, createOperationLogFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field name-field">
      <span>账号姓名</span>
      <el-input v-model="form.name" placeholder="请输入姓名" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field module-field">
      <span>操作模块</span>
      <el-select v-model="form.module">
        <el-option label="全部" value="" />
        <el-option v-for="item in logModuleOptions" :key="item" :label="item" :value="item" />
      </el-select>
    </div>
    <div class="filter-field date-field">
      <span>操作时间</span>
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

.name-field :deep(.el-input) { width: 130px; }
.module-field :deep(.el-select) { width: 120px; }

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
