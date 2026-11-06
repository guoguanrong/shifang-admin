<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import NewsFilterBar from '../components/news/NewsFilterBar.vue'
import NewsTable from '../components/news/NewsTable.vue'
import { createNewsFilters } from '../constants/listFilters'
import {
  deleteDynamicById,
  getDynamicList,
  saveDynamic,
  updateDynamic,
  uploadBusinessFile,
} from '../services/businessApi'

const PAGE_SIZE = 10
const MAX_IMAGES = 6

const newsList = ref([])
const filters = ref(createNewsFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const uploading = ref(false)
const saving = ref(false)

function toBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
}

// 解析 cover：后端返回 JSON 数组字符串（多图）或单个 URL。
function parseNewsImages(value) {
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

function mapDynamic(item) {
  const show = toBoolean(item.show)
  return {
    id: item.id,
    title: item.title || '',
    detail: item.content || '',
    blessing: item.wishes || '',
    images: parseNewsImages(item.cover),
    reads: item.readNum ?? null,
    createdAt: item.createTime || '',
    show,
    status: show ? 'shown' : 'hidden',
  }
}

// 保存载荷：图片统一存 JSON 数组字符串，与寄语 imgArrUrls 模式一致。
function buildNewsPayload(news, show = news.status === 'shown') {
  const imageUrls = (news.images || [])
    .map((image) => image.remoteUrl || image.url)
    .filter((url) => url && !url.startsWith('blob:'))
  return {
    cover: imageUrls.length ? JSON.stringify(imageUrls) : '',
    title: news.title || '',
    content: news.detail || '',
    wishes: news.blessing || '',
    show,
  }
}

async function loadNews() {
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
    const result = await getDynamicList(params)
    const list = Array.isArray(result) ? result : result?.list
    newsList.value = Array.isArray(list) ? list.map(mapDynamic) : []
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : newsList.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取动态列表失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadNews()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadNews()
}

function changePage(page) {
  currentPage.value = page
  loadNews()
}

onMounted(loadNews)

// 隐藏 / 恢复展示：均为普通确认。
async function toggleStatus(news) {
  const hiding = news.status === 'shown'
  try {
    await ElMessageBox.confirm(
      hiding ? '确定隐藏该动态吗?' : '确定恢复展示该动态吗?',
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  try {
    await updateDynamic({ id: news.id, ...buildNewsPayload(news, hiding ? false : true) })
    ElMessage.success(hiding ? '动态已隐藏' : '动态已恢复展示')
    await loadNews()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '更新动态状态失败')
  }
}

// 删除：附加风险提示。
async function removeNews(news) {
  try {
    await ElMessageBox.confirm(
      `<p style="margin:0 0 6px">确定删除该动态吗?</p>`
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
    await deleteDynamicById(news.id)
    if (newsList.value.length === 1 && currentPage.value > 1) currentPage.value -= 1
    ElMessage.success('动态已删除')
    await loadNews()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除动态失败')
  }
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
const dialogVisible = ref(false)
const editingId = ref(null)
const editingShow = ref(true)
const form = reactive({
  title: '',
  detail: '',
  blessing: '',
  images: [],
})

function revokePreview(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
}

function releaseFormPreviews() {
  form.images.forEach((image) => revokePreview(image.url))
}

function openAdd() {
  releaseFormPreviews()
  editingId.value = null
  form.title = ''
  form.detail = ''
  form.blessing = ''
  form.images = []
  dialogVisible.value = true
}

function openEdit(news) {
  releaseFormPreviews()
  editingId.value = news.id
  editingShow.value = news.show
  form.title = news.title
  form.detail = news.detail
  form.blessing = news.blessing
  form.images = news.images.map((image) => ({ ...image }))
  dialogVisible.value = true
}

// 动态图片：本地多选追加，选中即上传，最多 6 张（重复选择会覆盖空位）。
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

// 提交：校验通过后新增或更新动态（编辑时保持原有展示状态）。
async function submitNews() {
  if (uploading.value || saving.value) return
  if (!form.title.trim()) {
    ElMessage.warning('请输入动态标题')
    return
  }
  if (form.images.some((image) => image.url.startsWith('blob:') && !image.remoteUrl)) {
    ElMessage.warning('图片尚未上传成功，请重试')
    return
  }

  const news = {
    title: form.title.trim(),
    detail: form.detail.trim(),
    blessing: form.blessing.trim(),
    images: form.images,
    status: editingShow.value ? 'shown' : 'hidden',
  }

  try {
    saving.value = true
    if (editingId.value !== null) {
      await updateDynamic({ id: editingId.value, ...buildNewsPayload(news) })
      ElMessage.success('动态已更新')
    } else {
      await saveDynamic(buildNewsPayload(news, true))
      ElMessage.success('动态已新增')
    }
    dialogVisible.value = false
    await loadNews()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存动态失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="news-list-page">
    <header class="page-heading">
      <h1>动态列表</h1>
      <p>前台"洞悉动态"的内容管理 - 发布/隐藏,发布后在前台同步展示</p>
    </header>

    <NewsFilterBar @search="search" @reset="reset" />

    <section v-loading="loading" class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增动态</el-button>
      </div>

      <NewsTable
        :news-list="newsList"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeNews"
        @page-change="changePage"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="600px" top="4vh">
      <el-form class="news-form" label-position="top" @submit.prevent>
        <el-form-item label="图片">
          <div class="image-grid">
            <div v-for="(image, index) in form.images" :key="index" class="image-tile">
              <img :src="image.url" alt="动态图片" />
              <i class="tile-remove" role="button" tabindex="0" @click="removeImage(index)" @keydown.enter.prevent="removeImage(index)">×</i>
            </div>
            <label v-if="form.images.length < MAX_IMAGES" class="image-add">
              <input type="file" accept="image/*" multiple @change="onImagesChange" />
              <span class="add-body">
                <span class="add-icon">＋</span>
                <span class="add-text">上传</span>
              </span>
            </label>
          </div>
          <p class="field-tip">图片用于前台动态卡片展示,最多 6 张</p>
        </el-form-item>
        <el-form-item label="动态标题" required>
          <el-input v-model="form.title" placeholder="请输入动态标题" maxlength="40" />
        </el-form-item>
        <el-form-item label="详细内容">
          <el-input v-model="form.detail" type="textarea" :rows="4" placeholder="请输入详细内容" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="祈福寄语">
          <el-input v-model="form.blessing" type="textarea" :rows="3" placeholder="请输入祈福寄语" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" @click="submitNews">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.news-list-page {
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

.news-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
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
