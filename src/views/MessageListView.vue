<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { VideoPlay } from '@element-plus/icons-vue'
import MessageFilterBar from '../components/message/MessageFilterBar.vue'
import MessageTable from '../components/message/MessageTable.vue'
import { getDataOptions } from '../services/dataSource'
import { createMessageFilters } from '../constants/listFilters'
import {
  deleteWishesById,
  getWishesById,
  getWishesList,
  saveWishes,
  updateWishes,
  uploadBusinessFile,
} from '../services/businessApi'

const PAGE_SIZE = 10
const MAX_IMAGES = 6

const messages = ref([])
const messageCategoryOptions = getDataOptions('messageCategories')
const filters = ref(createMessageFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const uploading = ref(false)
const { saving, allowSubmit, endSubmit } = useSubmitGuard()

function toBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

function parseImageUrls(value) {
  if (Array.isArray(value)) {
    return value.map((url) => typeof url === 'string' ? url : url?.url).filter(Boolean)
      .map((url) => ({ url, remoteUrl: url }))
  }
  if (typeof value !== 'string' || !value.trim()) return []

  try {
    const parsed = JSON.parse(value)
    const urls = Array.isArray(parsed) ? parsed : [parsed]
    return urls.map((url) => typeof url === 'string' ? url : url?.url).filter(Boolean)
      .map((url) => ({ url, remoteUrl: url }))
  } catch {
    return [{ url: value, remoteUrl: value }]
  }
}

function mapWish(item) {
  const images = parseImageUrls(item.imgArrUrls)
  const videoUrl = item.videoUrl || ''
  const show = toBoolean(item.show)
  return {
    id: item.id,
    type: item.type,
    media: videoUrl ? 'video' : images.length ? 'image' : 'unknown',
    videoUrl,
    images,
    category: item.category || '',
    title: item.title || '',
    content: item.content || '',
    detail: item.detail || '',
    createdAt: item.createTime || '',
    show,
    status: show ? 'shown' : 'hidden',
  }
}

function buildWishPayload(message, show = message.status === 'shown') {
  const imageUrls = (message.images || [])
    .map((image) => image.remoteUrl || image.url)
    .filter((url) => url && !url.startsWith('blob:'))
  const payload = {
    videoUrl: message.media === 'video' ? message.videoUrl || '' : '',
    imgArrUrls: message.media === 'image' ? JSON.stringify(imageUrls) : '',
    category: message.category || '',
    title: message.title || '',
    content: message.content || '',
    detail: message.detail || '',
    show,
  }
  // 类型：1=视频 2=图片，按当前媒体类型写入。
  payload.type = message.media === 'video' ? 1 : 2
  return payload
}

async function loadMessages() {
  loading.value = true
  const { title, category, status, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    searchKey: title.trim() || undefined,
    category: category || undefined,
    show: status ? status === 'shown' : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const result = await getWishesList(params)
    const list = Array.isArray(result) ? result : result?.list
    messages.value = Array.isArray(list) ? list.map(mapWish) : []
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : messages.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取寄语列表失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadMessages()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadMessages()
}

function changePage(page) {
  currentPage.value = page
  loadMessages()
}

onMounted(loadMessages)

// 隐藏 / 恢复展示：均为普通确认。
async function toggleStatus(message) {
  const hiding = message.status === 'shown'
  try {
    await ElMessageBox.confirm(
      hiding ? '确定隐藏该寄语吗?' : '确定恢复展示该寄语吗?',
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await updateWishes({ id: message.id, ...buildWishPayload(message, hiding ? false : true) })
    ElMessage.success(hiding ? '寄语已隐藏' : '寄语已恢复展示')
    await loadMessages()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '更新寄语状态失败')
  }
}

// 删除：附加风险提示。
async function removeMessage(message) {
  try {
    await ElMessageBox.confirm(
      `<p style="margin:0 0 6px">确定删除该寄语吗?</p>`
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
    await deleteWishesById(message.id)
    if (messages.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    ElMessage.success('寄语已删除')
    await loadMessages()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除寄语失败')
  }
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  media: 'video',
  type: null,
  videoUrl: '',
  videoPreviewUrl: '',
  images: [],
  category: '',
  title: '',
  content: '',
  detail: '',
  show: true,
})

function revokePreview(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function releaseFormPreviews() {
  revokePreview(form.videoPreviewUrl)
  form.images.forEach((image) => revokePreview(image.url))
}

function openAdd() {
  releaseFormPreviews()
  editingId.value = null
  form.media = 'video'
  form.type = null
  form.videoUrl = ''
  form.videoPreviewUrl = ''
  form.images = []
  form.category = ''
  form.title = ''
  form.content = ''
  form.detail = ''
  form.show = true
  dialogVisible.value = true
}

async function openEdit(message) {
  let record
  try {
    record = mapWish(await getWishesById(message.id) || message)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取寄语详情失败')
    return
  }

  releaseFormPreviews()
  editingId.value = record.id
  form.media = record.media
  form.type = record.type ?? null
  form.videoUrl = record.videoUrl
  form.videoPreviewUrl = record.videoUrl
  form.images = record.images.map((image) => ({ ...image }))
  form.category = record.category
  form.title = record.title
  form.content = record.content
  form.detail = record.detail
  form.show = record.show
  dialogVisible.value = true
}

// 切换媒体时清空另一类已选素材，避免同时保存视频与图片。
function onMediaChange() {
  releaseFormPreviews()
  form.type = null
  form.videoUrl = ''
  form.videoPreviewUrl = ''
  form.images = []
}

async function onVideoChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  revokePreview(form.videoPreviewUrl)
  form.videoPreviewUrl = URL.createObjectURL(file)
  form.videoUrl = ''
  uploading.value = true

  try {
    const uploadedFile = await uploadBusinessFile(file)
    if (!uploadedFile?.url) throw new Error('视频上传成功但未返回文件地址')
    form.videoUrl = uploadedFile.url
    ElMessage.success('视频上传成功')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '视频上传失败')
  } finally {
    uploading.value = false
  }
}

async function onImagesChange(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  if (!files.length) return
  uploading.value = true
  let uploadedCount = 0

  try {
    for (const file of files) {
      if (form.images.length >= MAX_IMAGES) {
        ElMessage.warning(`最多上传 ${MAX_IMAGES} 张图片`)
        break
      }

      const previewUrl = URL.createObjectURL(file)
      try {
        const uploadedFile = await uploadBusinessFile(file)
        if (!uploadedFile?.url) throw new Error('图片上传成功但未返回文件地址')
        form.images.push({ url: previewUrl, remoteUrl: uploadedFile.url })
        uploadedCount += 1
      } catch (error) {
        revokePreview(previewUrl)
        ElMessage.error(error.userMessage || error.message || '图片上传失败')
        break
      }
    }
  } finally {
    uploading.value = false
  }

  if (uploadedCount === files.length) {
    ElMessage.success('图片上传完成')
  }
}

function removeImage(index) {
  const [removed] = form.images.splice(index, 1)
  revokePreview(removed?.url)
}

onUnmounted(releaseFormPreviews)

// 提交：校验通过后新增（置顶）或更新寄语。
async function submitMessage() {
  if (uploading.value || !allowSubmit()) return
  if (!form.category) {
    ElMessage.warning('请选择分类')
    return
  }
  if (!form.title.trim()) {
    ElMessage.warning('请输入寄语标题')
    return
  }
  if (form.media === 'video' && form.videoPreviewUrl.startsWith('blob:') && !form.videoUrl) {
    ElMessage.warning('视频尚未上传成功，请重试')
    return
  }
  if (form.media === 'image' && form.images.some((image) => image.url.startsWith('blob:') && !image.remoteUrl)) {
    ElMessage.warning('图片尚未上传成功，请重试')
    return
  }
  if (form.media === 'video' && !form.videoUrl) {
    ElMessage.warning('请先上传视频')
    return
  }
  if (form.media === 'image' && !form.images.length) {
    ElMessage.warning('请先上传图片')
    return
  }

  const message = {
    ...form,
    category: form.category,
    title: form.title.trim(),
    content: form.content.trim(),
    detail: form.detail.trim(),
  }

  try {
    saving.value = true
    if (editingId.value !== null) {
      await updateWishes({ id: editingId.value, ...buildWishPayload(message, form.show) })
      ElMessage.success('寄语已更新')
    } else {
      await saveWishes(buildWishPayload(message, true))
      ElMessage.success('寄语已新增')
    }
    dialogVisible.value = false
    await loadMessages()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存寄语失败')
  } finally {
    endSubmit()
  }
}
</script>

<template>
  <main class="message-list-page">
    <header class="page-heading">
      <h1>寄语列表</h1>
      <p>前台"各界寄语"的寄语管理 · 发布/隐藏,发布后在前台同步展示</p>
    </header>

    <MessageFilterBar @search="search" @reset="reset" />

    <section v-loading="loading" class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增寄语</el-button>
      </div>

      <MessageTable
        :messages="messages"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeMessage"
        @page-change="changePage"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="600px" top="4vh">
      <el-form class="message-form" label-position="top" @submit.prevent>
        <el-form-item label="寄语媒体">
          <el-radio-group v-model="form.media" :disabled="uploading || saving" @change="onMediaChange">
            <el-radio value="video">视频(最多1个)</el-radio>
            <el-radio value="image">图片(最多6张)</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 视频模式：单选上传，虚线框内即时预览 -->
        <el-form-item v-if="form.media === 'video'">
          <label class="upload-box">
            <input type="file" accept="video/*" :disabled="uploading || saving" @change="onVideoChange" />
            <video v-if="form.videoPreviewUrl || form.videoUrl" :src="form.videoPreviewUrl || form.videoUrl" class="upload-preview" controls />
            <template v-else>
              <span class="upload-icon">
                <el-icon><VideoPlay /></el-icon>
                上传视频
              </span>
            </template>
          </label>
          <p class="field-tip">{{ uploading ? '视频上传中…' : '视频用于前台寄语卡片播放,最多 1 个' }}</p>
        </el-form-item>

        <!-- 图片模式：多选追加，最多 6 张 -->
        <el-form-item v-else>
          <div class="image-grid">
            <div v-for="(image, index) in form.images" :key="index" class="image-tile">
              <img :src="image.url" alt="寄语图片" />
              <i class="tile-remove" role="button" tabindex="0" @click="removeImage(index)" @keydown.enter.prevent="removeImage(index)">×</i>
            </div>
            <label v-if="form.images.length < MAX_IMAGES" class="image-add">
              <input type="file" accept="image/*" multiple :disabled="uploading || saving" @change="onImagesChange" />
              <span class="add-body">
                <span class="add-icon">＋</span>
                <span class="add-text">上传图片</span>
                <em>{{ form.images.length }}/{{ MAX_IMAGES }}</em>
              </span>
            </label>
          </div>
          <p class="field-tip">{{ uploading ? '图片上传中…' : '图片用于前台寄语卡片轮播,最多 6 张' }}</p>
        </el-form-item>

        <el-form-item label="分类" required>
          <el-select v-model="form.category" placeholder="请选择">
            <el-option v-for="item in messageCategoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="寄语标题" required>
          <el-input v-model="form.title" placeholder="请输入寄语标题" maxlength="40" />
        </el-form-item>
        <el-form-item label="寄语内容">
          <el-input v-model="form.content" type="textarea" :rows="3" placeholder="请输入寄语内容" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="详细内容">
          <el-input v-model="form.detail" type="textarea" :rows="4" placeholder="请输入详细内容" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="uploading || saving" @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" :disabled="uploading" @click="submitMessage">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.message-list-page {
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

.message-form {
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
