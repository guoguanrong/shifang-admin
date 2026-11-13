<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import RecordFilterBar from '../components/record/RecordFilterBar.vue'
import RecordTable from '../components/record/RecordTable.vue'
import { createBelieverRecordFilters } from '../constants/listFilters'
import { deleteMemoirById, getMemoirById, getMemoirList, saveMemoir, updateMemoir } from '../services/businessApi'

const PAGE_SIZE = 10
const blessingTypeOptions = [
  { label: '平安', value: 'peace' },
  { label: '健康', value: 'health' },
  { label: '财运', value: 'wealth' },
]
const records = ref([])
const filters = ref(createBelieverRecordFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const { saving, allowSubmit, endSubmit } = useSubmitGuard()
const detailLoading = ref(false)

function toBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

function mapMemoir(item) {
  const type = item.type == null ? '' : String(item.type)
  return {
    id: item.id,
    name: item.username || '',
    occupation: item.job || '',
    title: item.title || '',
    content: item.content || '',
    blessingType: type,
    apiType: type,
    createdAt: item.createTime || '',
    status: toBoolean(item.show) ? 'shown' : 'hidden',
  }
}

async function loadRecords() {
  loading.value = true
  const { name, blessingType, status, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    searchKey: name.trim() || undefined,
    type: blessingType || undefined,
    show: status ? status === 'shown' : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const result = await getMemoirList(params)
    const list = Array.isArray(result) ? result : result?.list
    records.value = Array.isArray(list) ? list.map(mapMemoir) : []
    total.value = Number(result?.totalRow ?? records.value.length)
    if (Number(result?.currentPage) > 0) currentPage.value = Number(result.currentPage)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取实录列表失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadRecords()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadRecords()
}

function changePage(page) {
  currentPage.value = page
  loadRecords()
}

onMounted(loadRecords)

// 隐藏 / 恢复展示：均为普通确认。
async function toggleStatus(record) {
  const hiding = record.status === 'shown'
  try {
    await ElMessageBox.confirm(
      hiding ? '确定隐藏该实录吗?' : '确定恢复展示该实录吗?',
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await updateMemoir({
      id: record.id,
      username: record.name,
      job: record.occupation,
      title: record.title,
      content: record.content,
      type: record.apiType,
      show: !hiding,
    })
    ElMessage.success(hiding ? '实录已隐藏' : '实录已恢复展示')
    await loadRecords()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '更新实录状态失败')
  }
}

// 删除：按原型附加金色风险提示。
async function removeRecord(record) {
  try {
    await ElMessageBox.confirm(
      `<p style="margin:0 0 6px">确定删除该实录吗?</p>`
        + `<p style="margin:0;color:var(--admin-warning);font-size:12px">删除后不可恢复,请谨慎操作。</p>`,
      '操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
      },
    )
  } catch {
    return
  }
  try {
    await deleteMemoirById(record.id)
    if (records.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    ElMessage.success('实录已删除')
    await loadRecords()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除实录失败')
  }
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
const dialogVisible = ref(false)
const editingId = ref(null)
const editingShow = ref(true)
const form = reactive({
  name: '',
  occupation: '',
  title: '',
  content: '',
  blessingType: '',
})
const typeChoices = computed(() => {
  const options = [...blessingTypeOptions]
  if (form.blessingType && !options.some((item) => item.value === form.blessingType)) {
    options.push({ label: form.blessingType, value: form.blessingType })
  }
  return options
})

function openAdd() {
  editingId.value = null
  editingShow.value = true
  form.name = ''
  form.occupation = ''
  form.title = ''
  form.content = ''
  form.blessingType = ''
  dialogVisible.value = true
}

async function openEdit(row) {
  detailLoading.value = true
  try {
    const detail = await getMemoirById(row.id)
    const record = detail && typeof detail === 'object' ? mapMemoir(detail) : row
    editingId.value = record.id
    editingShow.value = record.status === 'shown'
    form.name = record.name
    form.occupation = record.occupation
    form.title = record.title
    form.content = record.content
    form.blessingType = record.apiType ?? record.blessingType
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取实录详情失败')
  } finally {
    detailLoading.value = false
  }
}

async function submitRecord() {
  if (!allowSubmit()) return
  if (!form.name.trim()) {
    ElMessage.warning('请输入信众名称')
    return
  }
  if (!form.title.trim()) {
    ElMessage.warning('请输入实录标题')
    return
  }
  if (!form.blessingType) {
    ElMessage.warning('请选择祈福类型')
    return
  }

  saving.value = true
  const payload = {
    username: form.name.trim(),
    job: form.occupation.trim(),
    title: form.title.trim(),
    content: form.content.trim(),
    type: form.blessingType,
    show: editingId.value ? editingShow.value : true,
  }

  try {
    if (editingId.value) {
      await updateMemoir({ id: editingId.value, ...payload })
      ElMessage.success('实录已更新')
    } else {
      currentPage.value = 1
      await saveMemoir(payload)
      ElMessage.success('实录已新增')
    }
    dialogVisible.value = false
    await loadRecords()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存实录失败')
  } finally {
    endSubmit()
  }
}
</script>

<template>
  <main class="record-list-page">
    <header class="page-heading">
      <h1>实录列表</h1>
      <p>前台"信众实录"的内容管理 · 发布/隐藏,发布后配合"信众实录"列表展示</p>
    </header>

    <RecordFilterBar @search="search" @reset="reset" />

    <section v-loading="loading" class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增实录</el-button>
      </div>

      <RecordTable
        :records="records"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeRecord"
        @page-change="changePage"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="560px">
      <el-form class="record-form" label-position="top" @submit.prevent>
        <div class="form-row">
          <el-form-item label="信众名称" required>
            <el-input v-model="form.name" placeholder="请输入信众名称" maxlength="20" />
          </el-form-item>
          <el-form-item label="职业">
            <el-input v-model="form.occupation" placeholder="请输入职业" maxlength="20" />
          </el-form-item>
        </div>
        <el-form-item label="实录标题" required>
          <el-input v-model="form.title" placeholder="请输入实录标题" maxlength="40" />
        </el-form-item>
        <el-form-item label="实录内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="请输入实录内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="祈福类型" required>
          <el-select v-model="form.blessingType" placeholder="请选择">
            <el-option v-for="item in typeChoices" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving || detailLoading" @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" :disabled="detailLoading" @click="submitRecord">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.record-list-page {
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
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  .add-button {
    height: 29px;
    margin: 0;
    padding: 0 12px;
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
    border-radius: var(--admin-radius-sm);
  }
}

.record-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
  }

  :deep(.el-select) {
    width: 100%;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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
