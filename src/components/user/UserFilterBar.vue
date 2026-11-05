<script setup>
import { reactive } from 'vue'
import { createUserListFilters } from '../../constants/listFilters'

// 用户列表筛选条：不含业务逻辑，仅收集条件并向上抛出 search / reset 事件。
const emit = defineEmits(['search', 'reset'])

// 重置基准值，需与初始展示的查询条件保持一致。
const form = reactive(createUserListFilters())

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, createUserListFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-row">
      <div class="filter-field phone-field">
        <span>绑定手机号码</span>
        <el-input v-model="form.phone" placeholder="请输入手机号" clearable @keyup.enter="emit('search', { ...form })" />
      </div>
      <div class="filter-field email-field">
        <span>邮箱</span>
        <el-input v-model="form.email" placeholder="请输入邮箱" clearable @keyup.enter="emit('search', { ...form })" />
      </div>
      <div class="filter-field status-field">
        <span>状态</span>
        <el-select v-model="form.status" placeholder="全部" clearable>
          <el-option label="正常" value="normal" />
          <el-option label="冻结中" value="frozen" />
        </el-select>
      </div>
      <div class="filter-field date-field">
        <span>注册时间</span>
        <el-date-picker v-model="form.startDate" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="年/月/日" />
        <em>至</em>
        <el-date-picker v-model="form.endDate" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="年/月/日" />
      </div>
      <div class="filter-field count-field">
        <span>捐款次数</span>
        <el-input v-model="form.donateCount" placeholder="不限" clearable @keyup.enter="emit('search', { ...form })" />
      </div>
      <div class="filter-field count-field">
        <span>点灯次数</span>
        <el-input v-model="form.lightCount" placeholder="不限" clearable @keyup.enter="emit('search', { ...form })" />
      </div>
      <div class="filter-field count-field">
        <span>供奉神像次数</span>
        <el-input v-model="form.worshipCount" placeholder="不限" clearable @keyup.enter="emit('search', { ...form })" />
      </div>
      <div class="filter-field city-field">
        <span>城市</span>
        <el-input v-model="form.city" placeholder="全部" clearable @keyup.enter="emit('search', { ...form })" />
      </div>
      <div class="filter-actions">
        <el-button class="search-button" @click="emit('search', { ...form })">查询</el-button>
        <el-button @click="resetForm">重置</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.filter-card {
  padding: 14px 20px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);
}

.filter-row {
  min-height: 42px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
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
    width: 140px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 35px;
    border-radius: var(--admin-radius-sm);
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;
  }
}

.phone-field :deep(.el-input) { width: 150px; }
.email-field :deep(.el-input) { width: 190px; }
.status-field :deep(.el-select) { width: 95px; }
.count-field :deep(.el-input) { width: 86px; }
.city-field :deep(.el-input) { width: 130px; }

.date-field {
  gap: 9px;

  :deep(.el-date-editor) {
    width: 150px;
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
  .filter-row {
    gap: 10px 14px;
  }
}
</style>
