<script setup>
import { reactive } from 'vue'

// 义工列表筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])

// 重置基准值，需与初始展示的查询条件保持一致。
// 义工列表固定只拉审核通过（status=2）的义工，接口无其他状态位，因此不再提供状态筛选。
const defaultForm = {
  name: '',
  phone: '',
  post: '',
}

const form = reactive({ ...defaultForm })
const postOptions = ['道场护持', '道会协助', '文宣服务', '线上服务']

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, defaultForm)
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field name-field">
      <span>善信姓名</span>
      <el-input v-model="form.name" placeholder="请输入姓名" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field phone-field">
      <span>联络手机</span>
      <el-input v-model="form.phone" placeholder="请输入手机号" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field post-field">
      <span>申请岗位</span>
      <el-select v-model="form.post" placeholder="全部" clearable>
        <el-option v-for="post in postOptions" :key="post" :label="post" :value="post" />
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
.post-field :deep(.el-select) { width: 130px; }

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
