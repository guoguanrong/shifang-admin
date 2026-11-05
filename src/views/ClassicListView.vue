<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ClassicFilterBar from '../components/wellness/ClassicFilterBar.vue'
import ClassicTable from '../components/wellness/ClassicTable.vue'
import { createClassicFilters } from '../constants/listFilters'
import {
  deleteDaodianById,
  getDaodianById,
  getDaodianList,
  saveDaodian,
  updateDaodian,
  uploadBusinessFile,
} from '../services/businessApi'

const PAGE_SIZE = 10

const classics = ref([])
const filters = ref(createClassicFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const detailLoading = ref(false)
const uploading = ref(false)
const saving = ref(false)

function toBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

function parseInfoArr(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function mapClassic(item) {
  const show = toBoolean(item.show)
  return {
    id: item.id,
    coverImage: item.cover || '',
    cover: item.title?.slice(0, 1) || '典',
    title: item.title || '',
    intro: item.intro || '',
    reads: Number(item.readNum || 0),
    createdAt: item.createTime || '',
    show,
    status: show ? 'shown' : 'hidden',
    infoArr: parseInfoArr(item.infoArr),
  }
}

function getPage(payload) {
  const page = payload?.data && !payload.list && !payload.records ? payload.data : payload
  const list = Array.isArray(page) ? page : page?.list || page?.records || []
  return { page, list }
}

async function loadClassics() {
  loading.value = true
  const { title, status, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    searchKey: title.trim() || undefined,
    show: status ? status === 'shown' : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }
  try {
    const result = await getDaodianList(params)
    const { page, list } = getPage(result)
    classics.value = list.map(mapClassic)
    total.value = Number(page?.totalRow ?? classics.value.length)
    if (Number(page?.currentPage) > 0) currentPage.value = Number(page.currentPage)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取道典精读列表失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadClassics()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadClassics()
}

function changePage(page) {
  currentPage.value = page
  loadClassics()
}

// 隐藏 / 恢复展示：均为普通确认。
async function toggleStatus(classic) {
  const hiding = classic.status === 'shown'
  try {
    await ElMessageBox.confirm(
      hiding ? '确定隐藏该文章吗?' : '确定恢复展示该文章吗?',
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await updateDaodian({
      id: classic.id,
      cover: classic.coverImage,
      title: classic.title,
      intro: classic.intro,
      infoArr: classic.infoArr,
      readNum: classic.reads,
      show: !hiding,
    })
    if (filters.value.status && classics.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    ElMessage.success(hiding ? '文章已隐藏' : '文章已恢复展示')
    await loadClassics()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '更新文章展示状态失败')
  }
}

// 删除：附加风险提示。
async function removeClassic(classic) {
  try {
    await ElMessageBox.confirm(
      `<p style="margin:0 0 6px">确定删除该文章吗?</p>`
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
    await deleteDaodianById(classic.id)
    if (classics.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    ElMessage.success('文章已删除')
    await loadClassics()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除文章失败')
  }
}

const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  cover: '',
  coverPreview: '',
  title: '',
  intro: '',
  infoArrText: '[]',
  readNum: 0,
  show: true,
})

function releaseCoverPreview() {
  if (form.coverPreview?.startsWith('blob:')) URL.revokeObjectURL(form.coverPreview)
  form.coverPreview = ''
}

function fillForm(classic) {
  form.cover = classic.coverImage || ''
  form.coverPreview = classic.coverImage || ''
  form.title = classic.title || ''
  form.intro = classic.intro || ''
  form.infoArrText = JSON.stringify(parseInfoArr(classic.infoArr), null, 2)
  form.readNum = Number(classic.reads || 0)
  form.show = classic.show
}

function openAdd() {
  releaseCoverPreview()
  editingId.value = null
  detailLoading.value = false
  form.cover = ''
  form.coverPreview = ''
  form.title = ''
  form.intro = ''
  form.infoArrText = '[]'
  form.readNum = 0
  form.show = true
  dialogVisible.value = true
}

async function openEdit(classic) {
  releaseCoverPreview()
  editingId.value = classic.id
  fillForm(classic)
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const detail = await getDaodianById(classic.id)
    if (detail && editingId.value === classic.id) fillForm(mapClassic(detail))
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取文章详情失败，已使用列表数据')
  } finally {
    if (editingId.value === classic.id) detailLoading.value = false
  }
}

async function onCoverChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const previousCover = form.cover
  releaseCoverPreview()
  const previewUrl = URL.createObjectURL(file)
  form.coverPreview = previewUrl
  uploading.value = true
  try {
    const uploadedFile = await uploadBusinessFile(file)
    if (!uploadedFile?.url) throw new Error('封面上传成功但未返回图片地址')
    form.cover = uploadedFile.url
    ElMessage.success('封面上传成功')
  } catch (error) {
    URL.revokeObjectURL(previewUrl)
    form.cover = previousCover
    form.coverPreview = previousCover
    ElMessage.error(error.userMessage || error.message || '封面上传失败')
  } finally {
    uploading.value = false
  }
}

async function submitClassic() {
  if (saving.value || uploading.value || detailLoading.value) return
  if (!form.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }

  let infoArr
  try {
    infoArr = JSON.parse(form.infoArrText.trim() || '[]')
  } catch {
    ElMessage.warning('扩展信息必须是有效的 JSON 数组')
    return
  }
  if (!Array.isArray(infoArr)) {
    ElMessage.warning('扩展信息必须是 JSON 数组')
    return
  }

  const isEdit = editingId.value !== null
  const id = editingId.value
  const payload = {
    cover: form.cover,
    title: form.title.trim(),
    intro: form.intro.trim(),
    infoArr,
    readNum: Number(form.readNum || 0),
    show: form.show,
  }

  saving.value = true
  try {
    if (isEdit) {
      await updateDaodian({ ...payload, id })
    } else {
      await saveDaodian(payload)
      currentPage.value = 1
    }
    dialogVisible.value = false
    ElMessage.success(isEdit ? '文章已更新' : '文章已新增')
    await loadClassics()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存道典精读失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadClassics)
</script>

<template>
  <main class="classic-list-page">
    <header class="page-heading">
      <h1>道典精读</h1>
      <p>前台"道法养生-养生知识"的内容管理 · 新增/隐藏/恢复/编辑/内容维护,后台审核展示</p>
    </header>

    <ClassicFilterBar @search="search" @reset="reset" />

    <section v-loading="loading" class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增文章</el-button>
      </div>

      <ClassicTable
        :classics="classics"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeClassic"
        @page-change="changePage"
      />
    </section>

    <el-dialog
      v-model="dialogVisible"
      title="新增/编辑"
      width="600px"
      top="4vh"
      :close-on-click-modal="!saving && !uploading"
      :close-on-press-escape="!saving && !uploading"
      :show-close="!saving && !uploading"
      @closed="releaseCoverPreview"
    >
      <el-form v-loading="detailLoading" class="classic-form" label-position="top" @submit.prevent>
        <el-form-item label="封面图片">
          <label class="upload-box">
            <input type="file" accept="image/*" @change="onCoverChange" />
            <img v-if="form.coverPreview" :src="form.coverPreview" class="upload-preview" alt="文章封面" />
            <template v-else>
              <span class="add-icon">＋</span>
              <span>上传</span>
            </template>
          </label>
          <p class="field-tip">封面图用于前台文章卡片展示,建议 400×400</p>
        </el-form-item>

        <el-form-item label="文章标题" required>
          <el-input v-model="form.title" placeholder="请输入文章标题" maxlength="40" />
        </el-form-item>

        <el-form-item label="文章简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="请输入文章简介" maxlength="200" show-word-limit />
        </el-form-item>

        <el-form-item label="扩展内容 (infoArr)">
          <el-input
            v-model="form.infoArrText"
            type="textarea"
            :rows="10"
            placeholder="请输入 JSON 数组，例如：[]"
          />
          <p class="field-tip">接口文档未说明数组项结构，请按后端约定编辑；保存前会校验为 JSON 数组。</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="saving || uploading" @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving || uploading" :disabled="detailLoading" @click="submitClassic">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.classic-list-page {
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

.classic-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
  }
}

.upload-box {
  width: 96px;
  height: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--admin-text-secondary);
  font-size: 12px;
  cursor: pointer;
  border: 1px dashed var(--admin-border-strong);
  border-radius: var(--admin-radius-md);

  &:hover {
    color: var(--admin-primary);
    border-color: var(--admin-primary);
  }

  input[type='file'] {
    display: none;
  }

  .add-icon {
    font-size: 14px;
  }

  .upload-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: var(--admin-radius-sm);
  }
}

.field-tip {
  margin: 6px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
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
