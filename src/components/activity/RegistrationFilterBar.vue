<script setup>
import { reactive } from 'vue'
import { createRegistrationFilters } from '../../constants/listFilters'

// 报名记录筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])

const form = reactive(createRegistrationFilters())

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, createRegistrationFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field title-field">
      <span>活动标题</span>
      <el-input v-model="form.activityTitle" placeholder="请输入活动标题" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field user-phone-field">
      <span>绑定手机号</span>
      <el-input v-model="form.userPhone" placeholder="请输入绑定手机号" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field phone-field">
      <span>联络手机</span>
      <el-input v-model="form.phone" placeholder="请输入联络手机号" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field date-field">
      <span>报名时间</span>
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

  :deep(.el-input) {
    width: 150px;
  }

  :deep(.el-input__wrapper) {
    min-height: 35px;
    border-radius: var(--admin-radius-sm);
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;
  }
}

.title-field :deep(.el-input) { width: 160px; }
.phone-field :deep(.el-input) { width: 150px; }

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
