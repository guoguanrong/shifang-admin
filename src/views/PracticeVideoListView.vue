<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import PracticeVideoFilterBar from '../components/wellness/PracticeVideoFilterBar.vue'
import PracticeVideoTable from '../components/wellness/PracticeVideoTable.vue'
import { createPracticeVideoFilters } from '../constants/listFilters'
import {
  deleteSportWellnessById,
  getSportWellnessById,
  getSportWellnessList,
  saveSportWellness,
  updateSportWellness,
} from '../services/businessApi'
import { useImmediateUpload } from '../utils/immediateUpload'

const PAGE_SIZE = 10

const videos = ref([])
const filters = ref(createPracticeVideoFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const { saving, allowSubmit, endSubmit } = useSubmitGuard()
const detailLoading = ref(false)
const localPreviewUrl = ref('')
const { uploading, uploadFile, runUpload } = useImmediateUpload()
let uploadToken = 0

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadVideos()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadVideos()
}

function changePage(page) {
  currentPage.value = page
  loadVideos()
}

function isShown(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

function normalizeVideo(item) {
  const shown = isShown(item.show)
  return {
    id: item.id,
    videoUrl: item.videoUrl || '',
    title: item.title || '',
    intro: item.intro || '',
    difficulty: item.difficulty || '入门',
    duration: Number(item.duration || 0),
    form: item.modality || '',
    modality: item.modality || '',
    plays: Number(item.playNum || 0),
    createdAt: String(item.createTime || ''),
    status: shown ? 'shown' : 'hidden',
    show: shown,
    playNum: Number(item.playNum || 0),
    infoArr: parseInfoArr(item.infoArr),
  }
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

function getPage(payload) {
  const page = payload?.data && !payload.list && !payload.records ? payload.data : payload
  const list = Array.isArray(page) ? page : page?.list || page?.records || []
  return { page, list }
}

async function loadVideos() {
  loading.value = true
  const { title, difficulty, status, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    searchKey: title.trim() || undefined,
    difficulty: difficulty || undefined,
    show: status ? status === 'shown' : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }
  try {
    const result = await getSportWellnessList(params)
    const { page, list } = getPage(result)
    videos.value = list.map(normalizeVideo)
    total.value = Number(page?.totalRow ?? videos.value.length)
    if (Number(page?.currentPage) > 0) currentPage.value = Number(page.currentPage)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取跟练视频失败')
  } finally {
    loading.value = false
  }
}

function toApiPayload(video) {
  return {
    videoUrl: video.videoUrl || '',
    title: video.title,
    intro: video.intro || '',
    difficulty: video.difficulty,
    duration: Number(video.duration),
    modality: video.modality || video.form || '',
    playNum: Number(video.playNum ?? video.plays ?? 0),
    show: video.show ?? video.status === 'shown',
    infoArr: Array.isArray(video.infoArr) ? video.infoArr : [],
  }
}

async function toggleStatus(video) {
  const hiding = video.status === 'shown'
  try {
    await ElMessageBox.confirm(
      hiding ? '确定隐藏该视频吗?' : '确定恢复展示该视频吗?',
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await updateSportWellness({ ...toApiPayload(video), id: video.id, show: !hiding })
    await loadVideos()
    ElMessage.success(hiding ? '视频已隐藏' : '视频已恢复展示')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '更新视频展示状态失败')
  }
}

// 删除：附加风险提示。
async function removeVideo(video) {
  try {
    await ElMessageBox.confirm(
      `<p style="margin:0 0 6px">确定删除该视频吗?</p>`
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
    await deleteSportWellnessById(video.id)
    if (currentPage.value > 1 && videos.value.length === 1) currentPage.value -= 1
    await loadVideos()
    ElMessage.success('视频已删除')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除视频失败')
  }
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  videoUrl: '',
  title: '',
  intro: '',
  difficulty: '入门',
  duration: '',
  modality: '坐立/站式',
  playNum: 0,
  show: true,
  infoArrText: '[]',
})

function openAdd() {
  clearLocalPreview()
  editingId.value = null
  form.videoUrl = ''
  form.title = ''
  form.intro = ''
  form.difficulty = '入门'
  form.duration = ''
  form.modality = '坐立/站式'
  form.playNum = 0
  form.show = true
  form.infoArrText = '[]'
  dialogVisible.value = true
}

function fillForm(video) {
  form.videoUrl = video.videoUrl || ''
  form.title = video.title || ''
  form.intro = video.intro || ''
  form.difficulty = video.difficulty || '入门'
  form.duration = video.duration || ''
  form.modality = video.modality || video.form || '坐立/站式'
  form.playNum = Number(video.playNum ?? video.plays ?? 0)
  form.show = video.show ?? video.status === 'shown'
  form.infoArrText = JSON.stringify(parseInfoArr(video.infoArr), null, 2)
}

async function openEdit(video) {
  clearLocalPreview()
  editingId.value = video.id
  fillForm(video)
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const detail = await getSportWellnessById(video.id)
    if (detail && editingId.value === video.id) fillForm(detail)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取视频详情失败，已使用列表数据')
  } finally {
    if (editingId.value === video.id) detailLoading.value = false
  }
}

function clearLocalPreview() {
  uploadToken += 1
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
}

// 选中视频立即上传：form.videoUrl 始终是服务端 URL，本地 blob 仅用于上传期间预览。
async function onVideoChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const previousUrl = form.videoUrl
  clearLocalPreview()
  const token = uploadToken
  localPreviewUrl.value = URL.createObjectURL(file)

  await runUpload(async () => {
    try {
      const url = await uploadFile(file, '视频')
      if (token !== uploadToken) return
      form.videoUrl = url
      ElMessage.success('视频上传成功')
    } catch (error) {
      if (token !== uploadToken) return
      clearLocalPreview()
      form.videoUrl = previousUrl
      ElMessage.error(error.userMessage || error.message || '视频上传失败')
    }
  })
}

async function submitVideo() {
  if (uploading.value || detailLoading.value || !allowSubmit()) return
  if (!form.title.trim()) {
    ElMessage.warning('请输入视频标题')
    return
  }
  if (!form.duration || !Number.isInteger(Number(form.duration)) || Number(form.duration) <= 0) {
    ElMessage.warning('请输入正确的时长')
    return
  }
  if (!form.videoUrl) {
    ElMessage.warning('请先上传跟练视频文件')
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
    title: form.title.trim(),
    intro: form.intro.trim(),
    difficulty: form.difficulty,
    duration: Number(form.duration),
    modality: form.modality,
    playNum: Number(form.playNum || 0),
    show: form.show,
    infoArr,
  }

  saving.value = true
  try {
    const requestBody = { ...payload, videoUrl: form.videoUrl }

    if (isEdit) {
      await updateSportWellness({ ...requestBody, id })
    } else {
      await saveSportWellness(requestBody)
      currentPage.value = 1
    }

    dialogVisible.value = false
    await loadVideos()
    ElMessage.success(isEdit ? '视频已更新' : '视频已新增')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存跟练视频失败')
  } finally {
    endSubmit()
  }

}

onMounted(loadVideos)
</script>

<template>
  <main class="video-list-page">
    <header class="page-heading">
      <h1>跟练视频</h1>
      <p>前台"道法养生-跟练视频"的内容管理 · 隐藏/恢复/删除,隐藏后在前台隐藏展示</p>
    </header>

    <PracticeVideoFilterBar @search="search" @reset="reset" />

    <section v-loading="loading" class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增视频</el-button>
      </div>

      <PracticeVideoTable
        :videos="videos"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeVideo"
        @page-change="changePage"
      />
    </section>

    <el-dialog
      v-model="dialogVisible"
      title="新增/编辑"
      width="600px"
      top="4vh"
      :close-on-click-modal="!saving && !uploading"
      :show-close="!saving && !uploading"
      @closed="clearLocalPreview"
    >
      <el-form v-loading="detailLoading" class="video-form" label-position="top" @submit.prevent>
        <el-form-item label="视频文件">
          <label class="upload-box">
            <input type="file" accept="video/*" :disabled="uploading || saving" @change="onVideoChange" />
            <video v-if="localPreviewUrl || form.videoUrl" :src="localPreviewUrl || form.videoUrl" class="upload-preview" controls />
            <template v-else>
              <span class="upload-icon">
                <el-icon><VideoPlay /></el-icon>
                上传视频
              </span>
            </template>
            <span v-if="uploading" class="upload-mask">上传中…</span>
          </label>
          <p class="field-tip">{{ uploading ? '视频上传中，请稍候…' : '跟练视频文件,最多 1 个' }}</p>
        </el-form-item>

        <el-form-item label="视频标题" required>
          <el-input v-model="form.title" placeholder="请输入视频标题" maxlength="40" />
        </el-form-item>

        <el-form-item label="视频简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" placeholder="请输入视频简介" maxlength="200" show-word-limit />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="难度">
            <el-select v-model="form.difficulty">
              <el-option label="入门" value="入门" />
              <el-option label="进阶" value="进阶" />
            </el-select>
          </el-form-item>
          <el-form-item label="时长(分钟)">
            <el-input v-model="form.duration" type="number" placeholder="请输入时长" min="1" />
          </el-form-item>
        </div>

        <el-form-item label="形式">
          <el-select v-model="form.modality">
            <el-option label="坐立/站式" value="坐立/站式" />
            <el-option label="站式" value="站式" />
            <el-option label="坐式" value="坐式" />
          </el-select>
        </el-form-item>

        <el-form-item label="扩展信息 (infoArr)">
          <el-input
            v-model="form.infoArrText"
            type="textarea"
            :rows="8"
            placeholder="请输入 JSON 数组，例如：[]"
          />
          <p class="field-tip">接口文档仅定义为 JSON 数组，未说明数组项字段；请按后端约定填写。</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="uploading || saving" @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" :disabled="uploading || detailLoading" @click="submitVideo">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.video-list-page {
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

.video-form {
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

.upload-box {
  position: relative;
  width: 100%;
  min-height: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 14px;
  cursor: pointer;
  border: 1px dashed var(--admin-border-strong);
  border-radius: var(--admin-radius-md);

  &:hover {
    border-color: var(--admin-primary);
  }

  input[type='file'] {
    display: none;
  }

  .upload-icon {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--admin-text-muted);
    font-size: 13px;
  }

  .upload-preview {
    max-width: 100%;
    max-height: 220px;
    border-radius: var(--admin-radius-sm);
  }
}

.field-tip {
  margin: 6px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
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
