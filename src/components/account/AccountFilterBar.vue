<script setup>
import { reactive } from 'vue'
import { createAccountFilters } from '../../constants/listFilters'

defineProps({ roles: { type: Array, required: true } })
const emit = defineEmits(['search', 'reset'])
const form = reactive(createAccountFilters())

function resetForm() {
  Object.assign(form, createAccountFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <label class="filter-field name-field">
      <span>账号姓名</span>
      <el-input v-model="form.name" placeholder="请输入姓名" clearable @keyup.enter="emit('search', { ...form })" />
    </label>
    <label class="filter-field role-field">
      <span>角色</span>
      <el-tree-select
        v-model="form.roleId"
        :data="roles"
        node-key="id"
        check-strictly
        clearable
        placeholder="全部"
      />
    </label>
    <label class="filter-field status-field">
      <span>状态</span>
      <el-select v-model="form.status" placeholder="全部" clearable>
        <el-option label="启用" value="enabled" />
        <el-option label="禁用" value="disabled" />
      </el-select>
    </label>
    <div class="filter-actions">
      <el-button type="primary" @click="emit('search', { ...form })">查询</el-button>
      <el-button @click="resetForm">重置</el-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.filter-card {
  min-height: 80px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding: 17px 22px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 14px;
  box-shadow: 0 6px 22px rgba(38, 68, 75, 0.04);
}

.filter-field {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--admin-text-regular);
  font-size: 13px;
  white-space: nowrap;

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 38px;
    border-radius: 8px;
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;
    transition: box-shadow 0.18s ease;
  }
}

.name-field :deep(.el-input) { width: 178px; }
.role-field :deep(.el-select) { width: 152px; }
.status-field :deep(.el-select) { width: 112px; }
.filter-actions { display: flex; gap: 10px; }
.filter-actions .el-button { height: 38px; margin: 0; padding: 0 17px; border-radius: 8px; }
.filter-actions .el-button--primary { box-shadow: 0 4px 10px rgba(47, 156, 143, 0.12); }

@media (max-width: 768px) {
  .filter-card { padding: 16px; gap: 14px; }
  .filter-field { justify-content: space-between; width: 100%; }
  .name-field :deep(.el-input),
  .role-field :deep(.el-select),
  .status-field :deep(.el-select) { width: min(68%, 280px); }
  .filter-actions { width: 100%; justify-content: flex-end; }
}
</style>
