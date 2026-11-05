<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExpenseFilterBar from '../components/fund/ExpenseFilterBar.vue'
import ExpenseTable from '../components/fund/ExpenseTable.vue'
import { getInitialData } from '../services/dataSource'
import { createFundExpenseFilters } from '../constants/listFilters'

const PAGE_SIZE = 10
// 支出分类下拉选项（与筛选条、新增弹窗共用）。
const categoryOptions = ['法事活动', '建筑修缮', '工程设备', '文化项目', '行政管理']
// 公示状态字典：与 ExpenseTable 保持一致。
const statusText = {
  pending: '待公示',
  published: '已公示',
}

// 复制一份 mock 数据，公示/编辑只作用于内存副本。
const expenses = ref(getInitialData('fundExpenses').map((item) => ({
  ...item,
  attachments: item.attachments.map((attachment) => ({ ...attachment })),
})))
const filters = ref(createFundExpenseFilters())
const currentPage = ref(1)
const expenseTableRef = ref(null)
const batchMode = ref(false)
const selectedExpenses = ref([])
const selectedPendingExpenses = computed(() => selectedExpenses.value.filter((item) => item.status === 'pending'))

// 前端筛选：标题模糊匹配，分类/公示状态精确匹配，支出时间按日期闭区间比较（可留空）。
const filteredExpenses = computed(() => {
  const { title, category, status, startDate, endDate } = filters.value
  return expenses.value.filter((item) => {
    const spentDate = item.spentAt.slice(0, 10)
    return (!title || item.title.includes(title))
      && (!category || item.category === category)
      && (!status || item.status === status)
      && (!startDate || spentDate >= startDate)
      && (!endDate || spentDate <= endDate)
  })
})

// 工具栏「本月累计」：仅统计当前自然月，不受列表筛选条件影响。
const totalAmountText = computed(() => {
  const now = new Date()
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const total = expenses.value
    .filter((item) => item.spentAt.startsWith(monthPrefix))
    .reduce((sum, item) => sum + item.amount, 0)
  return `$${(total / 10000).toFixed(1)}万`
})

// 客户端分页：每页固定 10 条，切换筛选条件时由 search/reset 重置回第 1 页。
const pagedExpenses = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredExpenses.value.slice(start, start + PAGE_SIZE)
})

function search(form) {
  cancelBatch()
  filters.value = form
  currentPage.value = 1
  ElMessage.success(`查询完成，共找到 ${filteredExpenses.value.length} 条支出记录`)
}

function reset(form) {
  cancelBatch()
  filters.value = form
  currentPage.value = 1
}

function changePage(page) {
  currentPage.value = page
}

// 金额统一显示为 $18,600 格式。
function formatAmount(amount) {
  return `$${amount.toLocaleString('en-US')}`
}

// 公示（单条）：按原型使用「操作确认」。
async function publishExpense(expense) {
  try {
    await ElMessageBox.confirm('确定公示该支出吗?', '操作确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  expense.status = 'published'
  expenseTableRef.value?.unselectExpense(expense)
  ElMessage.success('该支出已公示')
}

function cancelBatch() {
  expenseTableRef.value?.clearSelection()
  batchMode.value = false
  selectedExpenses.value = []
}

// 首次点击进入勾选模式；再次点击只公示已选的待公示支出。
async function publishBatch() {
  if (!batchMode.value) {
    if (!filteredExpenses.value.some((item) => item.status === 'pending')) {
      ElMessage.warning('当前没有待公示的支出')
      return
    }
    expenseTableRef.value?.clearSelection()
    selectedExpenses.value = []
    batchMode.value = true
    return
  }

  const pendingList = selectedPendingExpenses.value
  if (!pendingList.length) {
    ElMessage.warning('请先选择需要公示的支出')
    return
  }

  try {
    await ElMessageBox.confirm(`确定公示选中的 ${pendingList.length} 条支出吗?`, '操作确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }
  pendingList.forEach((item) => {
    item.status = 'published'
  })
  cancelBatch()
  ElMessage.success(`已公示 ${pendingList.length} 条支出`)
}

// 支出详情弹窗。
const detailVisible = ref(false)
const currentExpense = ref(null)

function openDetail(expense) {
  currentExpense.value = expense
  detailVisible.value = true
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  title: '',
  category: '',
  amount: '',
  spentAt: '',
  handler: '',
  description: '',
  attachments: [],
})

function openAdd() {
  editingId.value = null
  form.title = ''
  form.category = ''
  form.amount = ''
  form.spentAt = ''
  form.handler = ''
  form.description = ''
  form.attachments = []
  dialogVisible.value = true
}

function openEdit(expense) {
  editingId.value = expense.id
  form.title = expense.title
  form.category = expense.category
  form.amount = expense.amount
  form.spentAt = expense.spentAt.slice(0, 10)
  form.handler = expense.handler
  form.description = expense.description
  form.attachments = expense.attachments.map((attachment) => ({ ...attachment }))
  dialogVisible.value = true
}

// 凭证附件：按扩展名识别角标类型，格式化文件体积。
function detectAttachmentType(name) {
  const extension = name.split('.').pop()?.toLowerCase()
  if (extension === 'pdf') return 'pdf'
  if (extension === 'doc' || extension === 'docx') return 'word'
  if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') return 'png'
  return 'file'
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// 凭证附件：支持多选上传，无数量限制。
function onAttachmentsChange(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  files.forEach((file) => {
    form.attachments.push({
      name: file.name,
      size: formatSize(file.size),
      type: detectAttachmentType(file.name),
    })
  })
}

function removeAttachment(index) {
  form.attachments.splice(index, 1)
}

// 生成 'YYYY-MM-DD HH:mm:ss' 格式的当前时间，作为新增支出的支出时间兜底。
function formatNow() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// 提交：校验通过后新增（置顶）或更新支出。
function submitExpense() {
  if (!form.title.trim()) {
    ElMessage.warning('请输入支出标题')
    return
  }
  if (!form.category) {
    ElMessage.warning('请选择支出分类')
    return
  }
  if (!form.amount || Number(form.amount) <= 0) {
    ElMessage.warning('请输入正确的金额')
    return
  }

  const spentAt = form.spentAt ? `${form.spentAt} ${formatNow().slice(11)}` : formatNow()
  const payload = {
    title: form.title.trim(),
    category: form.category,
    amount: Number(form.amount),
    spentAt,
    handler: form.handler.trim(),
    description: form.description.trim(),
  }

  if (editingId.value) {
    const target = expenses.value.find((item) => item.id === editingId.value)
    Object.assign(target, payload, {
      attachments: form.attachments.map((attachment) => ({ ...attachment })),
    })
    ElMessage.success('支出已更新')
  } else {
    const ymd = spentAt.slice(0, 10).replaceAll('-', '')
    const seq = expenses.value.filter((item) => item.id.startsWith(`ZC-${ymd}`)).length + 1
    expenses.value.unshift({
      id: `ZC-${ymd}-${String(seq).padStart(2, '0')}`,
      ...payload,
      attachments: form.attachments.map((attachment) => ({ ...attachment })),
      status: 'pending',
    })
    ElMessage.success('支出已新增')
  }

  dialogVisible.value = false
}
</script>

<template>
  <main class="expense-list-page">
    <header class="page-heading">
      <h1>善款支出</h1>
      <p>前台"资金公示-善款支出"的数据源 · 支出需公示后前台可见</p>
    </header>

    <ExpenseFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span>本月累计 <b>{{ totalAmountText }}</b></span>
        <span v-if="batchMode" class="selection-count">已选 {{ selectedPendingExpenses.length }} 条待公示</span>
        <div class="toolbar-actions">
          <el-button v-if="batchMode" @click="cancelBatch">取消选择</el-button>
          <el-button class="batch-button" @click="publishBatch">{{ batchMode ? `确认公示（${selectedPendingExpenses.length}）` : '批量公示' }}</el-button>
          <el-button class="add-button" @click="openAdd">+ 新增支出</el-button>
        </div>
      </div>

      <ExpenseTable
        ref="expenseTableRef"
        :expenses="pagedExpenses"
        :total="filteredExpenses.length"
        :current-page="currentPage"
        :batch-mode="batchMode"
        @detail="openDetail"
        @publish="publishExpense"
        @page-change="changePage"
        @selection-change="selectedExpenses = $event"
      />
    </section>

    <!-- 支出详情弹窗 -->
    <el-dialog v-model="detailVisible" title="支出详情" width="560px">
      <div v-if="currentExpense" class="info-list">
        <div class="info-row"><span class="info-label">支出编号</span><span>{{ currentExpense.id }}</span></div>
        <div class="info-row"><span class="info-label">支出标题</span><span>{{ currentExpense.title }}</span></div>
        <div class="info-row"><span class="info-label">支出分类</span><span>{{ currentExpense.category }}</span></div>
        <div class="info-row"><span class="info-label">金额</span><span>{{ formatAmount(currentExpense.amount) }}</span></div>
        <div class="info-row"><span class="info-label">支出时间</span><span>{{ currentExpense.spentAt }}</span></div>
        <div class="info-row"><span class="info-label">经办人</span><span>{{ currentExpense.handler }}</span></div>
        <div class="info-row info-column">
          <span class="info-label">支出说明</span>
          <p class="info-text">{{ currentExpense.description }}</p>
          <span class="info-hint">仅限内部查看,用户端不展示</span>
        </div>
        <div class="info-row info-column">
          <span class="info-label">凭证附件</span>
          <div class="attachment-list">
            <div v-for="attachment in currentExpense.attachments" :key="attachment.name" class="attachment-item">
              <span :class="['file-badge', attachment.type]">{{ attachment.type === 'word' ? 'WORD' : attachment.type.toUpperCase() }}</span>
              <span class="file-name">{{ attachment.name }}</span>
            </div>
          </div>
        </div>
        <div class="info-row">
          <span class="info-label">公示状态</span>
          <span :class="['soft-tag', currentExpense.status]">{{ statusText[currentExpense.status] }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增/编辑" width="560px" top="4vh">
      <el-form class="expense-form" label-position="top" @submit.prevent>
        <el-form-item label="支出标题" required>
          <el-input v-model="form.title" placeholder="请输入支出标题" maxlength="40" />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="支出分类" required>
            <el-select v-model="form.category" placeholder="请选择">
              <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item label="金额($)" required>
            <el-input v-model="form.amount" type="number" placeholder="请输入金额" min="0" />
          </el-form-item>
        </div>
        <div class="form-row">
          <el-form-item label="支出时间">
            <el-date-picker v-model="form.spentAt" type="date" value-format="YYYY-MM-DD" format="YYYY/MM/DD" placeholder="请选择日期" />
          </el-form-item>
          <el-form-item label="经办人">
            <el-input v-model="form.handler" placeholder="请输入或选择经办人" maxlength="20" />
          </el-form-item>
        </div>
        <el-form-item label="支出说明">
          <el-input v-model="form.description" type="textarea" :rows="4" placeholder="说明用途" maxlength="300" />
          <p class="field-tip">仅限内部查看,用户端不展示</p>
        </el-form-item>
        <el-form-item label="凭证附件">
          <label class="upload-box">
            <input type="file" multiple @change="onAttachmentsChange" />
            <span class="upload-icon">✈</span>
            <strong>点击上传凭证附件</strong>
            <span class="upload-tip">支持 Word / PDF / PNG 等格式,可上传多个,无数量限制</span>
          </label>
          <div class="attachment-list">
            <div v-for="(attachment, index) in form.attachments" :key="`${attachment.name}-${index}`" class="attachment-item">
              <span :class="['file-badge', attachment.type]">{{ attachment.type === 'word' ? 'WORD' : attachment.type.toUpperCase() }}</span>
              <span class="file-name">{{ attachment.name }}</span>
              <span class="file-size">{{ attachment.size }}</span>
              <i class="file-remove" role="button" tabindex="0" @click="removeAttachment(index)" @keydown.enter.prevent="removeAttachment(index)">×</i>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" @click="submitExpense">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.expense-list-page {
  padding: 20px 14px 12px;
}

.page-heading {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin: 0 6px 14px;

  h1 {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 20px;
    font-weight: 600;
  }

  p {
    margin: 0;
    color: var(--admin-text-placeholder);
    font-size: 13px;
  }
}

.table-card {
  margin-top: 12px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);
}

.table-toolbar {
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  span {
    color: var(--admin-text-secondary);
    font-size: 13px;
  }

  b {
    color: var(--admin-primary);
    font-weight: 500;
  }

  .toolbar-actions {
    display: flex;
    gap: 10px;
    margin-left: auto;
  }

  .selection-count {
    padding: 6px 10px;
    background: var(--admin-primary-lighter);
    border-radius: 8px;
  }

  .el-button {
    height: 29px;
    margin: 0;
    padding: 0 12px;
    border-radius: var(--admin-radius-sm);
  }

  .batch-button {
    color: var(--admin-warning);
    background: var(--admin-warning-light);
    border-color: var(--admin-warning);
  }

  .add-button {
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}

.info-list {
  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--admin-border-light);

    &:last-child {
      border-bottom: 0;
    }
  }

  .info-label {
    flex: 0 0 72px;
    color: var(--admin-text-secondary);
    font-size: 13px;
    line-height: 22px;
  }

  span:not(.info-label):not(.soft-tag) {
    color: var(--admin-text-primary);
    font-size: 13px;
  }

  .info-column {
    flex-direction: column;
    gap: 6px;
  }

  .info-text {
    margin: 0;
    color: var(--admin-text-primary);
    font-size: 13px;
    line-height: 1.6;
  }

  .info-hint {
    color: var(--admin-text-muted);
    font-size: 12px;
  }
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
}

.file-badge {
  width: 34px;
  height: 24px;
  display: grid;
  place-items: center;
  color: var(--admin-text-inverse);
  font-size: 9px;
  font-weight: 700;
  border-radius: var(--admin-radius-xs);

  &.pdf { background: #d9534f; }
  &.word { background: #2b7cd3; }
  &.png { background: #2f9c8f; }
  &.file { background: var(--admin-text-secondary); }
}

.file-name {
  color: var(--admin-text-primary);
  font-size: 13px;
}

.file-size {
  color: var(--admin-text-muted);
  font-size: 12px;
}

.file-remove {
  margin-left: auto;
  color: var(--admin-text-muted);
  font-size: 15px;
  font-style: normal;
  cursor: pointer;

  &:hover {
    color: var(--admin-danger);
  }
}

.expense-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
  }

  :deep(.el-select),
  :deep(.el-date-editor.el-input),
  :deep(.el-date-editor.el-input__wrapper) {
    width: 100%;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.upload-box {
  width: 100%;
  min-height: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px;
  cursor: pointer;
  background: var(--admin-warning-light);
  border: 1px dashed var(--admin-warning);
  border-radius: var(--admin-radius-md);

  &:hover {
    opacity: 0.85;
  }

  input[type='file'] {
    display: none;
  }

  .upload-icon {
    color: var(--admin-warning);
    font-size: 18px;
  }

  strong {
    color: var(--admin-text-regular);
    font-size: 13px;
    font-weight: 500;
  }

  .upload-tip {
    color: var(--admin-text-muted);
    font-size: 12px;
  }
}

.field-tip {
  margin: 6px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
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

  &.pending { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.published { color: var(--admin-success); background: var(--admin-success-light); }
}

.save-button {
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
</style>
