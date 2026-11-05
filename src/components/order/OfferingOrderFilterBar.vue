<script setup>
import { reactive } from 'vue'
import { createOfferingOrderFilters } from '../../constants/listFilters'

// 供奉订单筛选条：收集条件后向上抛出 search / reset。
const emit = defineEmits(['search', 'reset'])

// 日期默认为空（与原型一致，placeholder 显示「年/月/日」），不填则不按时间过滤。
const form = reactive(createOfferingOrderFilters())
// 下拉首项固定为「全部」（value 为空串），与原型一致，因此不使用 clearable。
// 状态选项对齐接口字典：1.待支付 2.待供奉 3.供奉中 4.已过期。
const statusOptions = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'unpaid' },
  { label: '待供奉', value: 'pending' },
  { label: '供奉中', value: 'offering' },
  { label: '已过期', value: 'expired' },
]

// 重置后直接抛出 reset，父级会用默认条件立即刷新列表。
function resetForm() {
  Object.assign(form, createOfferingOrderFilters())
  emit('reset', { ...form })
}
</script>

<template>
  <div class="filter-card">
    <div class="filter-field order-field">
      <span>订单号</span>
      <el-input v-model="form.orderId" placeholder="请输入订单号" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field phone-field">
      <span>绑定手机号</span>
      <el-input v-model="form.userPhone" placeholder="请输入手机号" clearable @keyup.enter="emit('search', { ...form })" />
    </div>
    <div class="filter-field status-field">
      <span>状态</span>
      <el-select v-model="form.status">
        <el-option v-for="item in statusOptions" :key="item.label" :label="item.label" :value="item.value" />
      </el-select>
    </div>
    <div class="filter-field date-field">
      <span>下单时间</span>
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

.order-field :deep(.el-input) { width: 160px; }
.status-field :deep(.el-select) { width: 95px; }

.date-field {
  gap: 9px;

  :deep(.el-date-editor) {
    width: 140px;
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
