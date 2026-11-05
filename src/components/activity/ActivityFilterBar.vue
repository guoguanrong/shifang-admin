<script setup>
import { reactive } from 'vue'
import { createActivityFilters } from '../../constants/listFilters'

// 活动列表筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])

const form = reactive(createActivityFilters())
// 下拉第一项固定为「全部」（value 为空串），与原型一致，因此不使用 clearable。
const typeOptions = [
  { label: '全部', value: '' },
  { label: '集体活动', value: 'group' },
  { label: '专场预约', value: 'appointment' },
]
// 报名状态选项对齐接口 Activity.status（1.待报名 2.报名中 3.报名停止 4.已结束）。
const statusOptions = [
  { label: '全部', value: '' },
  { label: '待报名', value: 'pending' },
  { label: '报名中', value: 'enrolling' },
  { label: '报名停止', value: 'registrationStopped' },
  { label: '已结束', value: 'ended' },
]
const listedOptions = [
  { label: '全部', value: '' },
  { label: '上架', value: 'on' },
  { label: '暂不上架', value: 'off' },
]

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, createActivityFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field title-field">
      <span>活动标题</span>
      <el-input v-model="form.title" placeholder="请输入活动标题" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field type-field">
      <span>道会类型</span>
      <el-select v-model="form.type">
        <el-option v-for="item in typeOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="filter-field status-field">
      <span>活动状态</span>
      <el-select v-model="form.status">
        <el-option v-for="item in statusOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="filter-field listed-field">
      <span>上架状态</span>
      <el-select v-model="form.listed">
        <el-option v-for="item in listedOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="filter-field date-field">
      <span>道会时间</span>
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
    width: 140px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    min-height: 35px;
    border-radius: var(--admin-radius-sm);
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;
  }
}

.title-field :deep(.el-input) { width: 170px; }
.status-field :deep(.el-select) { width: 110px; }
.listed-field :deep(.el-select) { width: 110px; }

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
