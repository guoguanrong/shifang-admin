<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import OnlineLampCards from '../components/online/OnlineLampCards.vue'
import MaterialSelectDialog from '../components/online/MaterialSelectDialog.vue'
import {
  deleteLightById,
  getLightById,
  getLightList,
  getShopItemsList,
  getWorshipList,
  saveLight,
  updateLight,
} from '../services/businessApi'
import { useImmediateUpload } from '../utils/immediateUpload'
import { lampDeityOptions } from '../mock/onlineLamps'

const lamps = ref([])
const materials = ref([])
const deityOptions = ref([...lampDeityOptions])
const loading = ref(false)
const { saving, allowSubmit, endSubmit } = useSubmitGuard()
const editVisible = ref(false)
const materialDialogVisible = ref(false)
const currentLamp = ref(null)
const localPreviewUrl = ref('')
const { uploading, uploadFile, runUpload } = useImmediateUpload()
// 每次重新选择/关闭弹窗都让进行中的上传失效，避免旧图 URL 覆盖新选择。
let uploadToken = 0
const form = reactive({
  name: '',
  image: '',
  dayPrice: '',
  monthPrice: '',
  yearPrice: '',
  desc: '',
  shopItemsIds: [],
  matchGod: '',
})

// 三档价格对应接口字段 dayPrice / monthPrice / yearPrice，校验时逐个提示。
const priceFields = [
  { key: 'dayPrice', label: '日供价格' },
  { key: 'monthPrice', label: '月供价格' },
  { key: 'yearPrice', label: '年供价格' },
]

const materialMap = computed(() => Object.fromEntries(materials.value.map((item) => [String(item.id), item])))

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

async function getAllPages(fetchPage, filters = {}) {
  const records = []
  let page = 1
  let totalPage = 1

  do {
    const payload = await fetchPage({ ...filters, page, pageSize: 200 })
    const result = payload?.data ?? payload
    const currentPageRecords = getList(result)
    records.push(...currentPageRecords)
    totalPage = Number(result?.totalPage) || 1
    if (!currentPageRecords.length || page >= totalPage) break
    page += 1
  } while (page <= 50)

  return records
}

function normalizeLamp(lamp) {
  // 入参用 shopItemsIds，列表出参 LightVo 用 shopItemIds，两个名字都兼容。
  const shopItemsIds = lamp.shopItemsIds ?? lamp.shopItemIds ?? lamp.shopItems ?? []
  return {
    ...lamp,
    image: lamp.picture || lamp.image || '',
    dayPrice: Number(lamp.dayPrice ?? lamp.price ?? 0),
    monthPrice: Number(lamp.monthPrice ?? 0),
    yearPrice: Number(lamp.yearPrice ?? 0),
    desc: lamp.desc || '',
    matchGod: lamp.matchGod || '',
    shopItemsIds: Array.isArray(shopItemsIds) ? shopItemsIds.map(Number) : [],
  }
}

async function loadLamps() {
  lamps.value = (await getAllPages(getLightList)).map(normalizeLamp)
}

async function loadMaterials() {
  materials.value = (await getAllPages(getShopItemsList, { status: 1 }))
    .filter((item) => Number(item.status) === 1)
    .map((item) => ({ ...item, id: Number(item.id) }))
}

async function loadDeityOptions() {
  const payload = await getWorshipList({ page: 1, pageSize: 1000 })
  const names = [...new Set(getList(payload).map((item) => item.matchGod).filter(Boolean))]
  if (names.length) deityOptions.value = names
}

async function loadPage() {
  loading.value = true
  const results = await Promise.allSettled([loadLamps(), loadMaterials(), loadDeityOptions()])
  const failed = results.find((result) => result.status === 'rejected')
  if (failed) ElMessage.error(failed.reason?.userMessage || failed.reason?.message || '点灯配置加载失败')
  loading.value = false
}

function isDeityTaken(deity) {
  return lamps.value.some((lamp) => lamp.id !== currentLamp.value?.id && lamp.matchGod === deity)
}

function clearLocalPreview() {
  uploadToken += 1
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
}

function resetForm() {
  form.name = ''
  form.image = ''
  form.dayPrice = ''
  form.monthPrice = ''
  form.yearPrice = ''
  form.desc = ''
  form.shopItemsIds = []
  form.matchGod = ''
}

function openCreate() {
  clearLocalPreview()
  currentLamp.value = null
  resetForm()
  editVisible.value = true
}

async function openEdit(lamp) {
  clearLocalPreview()
  loading.value = true
  try {
    const detail = normalizeLamp(await getLightById(lamp.id))
    currentLamp.value = detail
    form.name = detail.name || ''
    form.image = detail.image
    form.dayPrice = detail.dayPrice
    form.monthPrice = detail.monthPrice
    form.yearPrice = detail.yearPrice
    form.desc = detail.desc
    form.shopItemsIds = [...detail.shopItemsIds]
    form.matchGod = detail.matchGod
    editVisible.value = true
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '点灯详情读取失败')
  } finally {
    loading.value = false
  }
}

// 选中图片立即上传：form.image 始终是服务端 URL，本地 blob 仅用于上传期间预览。
async function onImageChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const previousImage = form.image
  clearLocalPreview()
  const token = uploadToken
  localPreviewUrl.value = URL.createObjectURL(file)

  await runUpload(async () => {
    try {
      const url = await uploadFile(file, '图片')
      if (token !== uploadToken) return
      form.image = url
      ElMessage.success('图片上传成功')
    } catch (error) {
      if (token !== uploadToken) return
      clearLocalPreview()
      form.image = previousImage
      ElMessage.error(error.userMessage || error.message || '图片上传失败')
    }
  })
}

function removeMaterial(materialId) {
  form.shopItemsIds = form.shopItemsIds.filter((id) => Number(id) !== Number(materialId))
}

function applyMaterials(ids) {
  form.shopItemsIds = ids.map(Number)
}

async function submitLamp() {
  if (uploading.value || !allowSubmit()) return
  if (!form.name.trim()) {
    ElMessage.warning('请输入灯的名称')
    return
  }
  if (!form.image) {
    ElMessage.warning('请上传灯图片')
    return
  }
  // 除关联神像外均为必填：三档价格逐档校验。
  const invalidPrice = priceFields.find(({ key }) => {
    const value = form[key]
    return value === '' || value === null || !Number.isFinite(Number(value)) || Number(value) < 0
  })
  if (invalidPrice) {
    ElMessage.warning(`请输入正确的${invalidPrice.label}`)
    return
  }
  if (!form.desc.trim()) {
    ElMessage.warning('请输入灯盏描述')
    return
  }
  if (!form.shopItemsIds.length) {
    ElMessage.warning('请至少选择一项物料')
    return
  }
  if (form.matchGod && isDeityTaken(form.matchGod)) {
    ElMessage.warning('此神像已匹配其他灯型')
    return
  }

  saving.value = true
  try {
    const payload = {
      picture: form.image || '',
      name: form.name.trim(),
      desc: form.desc.trim(),
      dayPrice: Number(form.dayPrice),
      monthPrice: Number(form.monthPrice),
      yearPrice: Number(form.yearPrice),
      shopItemsIds: form.shopItemsIds.map(Number),
      // 关联神像是本页唯一可选项，未选择时提交空字符串。
      matchGod: form.matchGod || '',
    }
    if (currentLamp.value) {
      await updateLight({ id: currentLamp.value.id, ...payload })
    } else {
      await saveLight(payload)
    }
    editVisible.value = false
    clearLocalPreview()
    await loadLamps()
    ElMessage.success(currentLamp.value ? '灯位信息已更新' : '灯位已新增')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '点灯配置保存失败')
  } finally {
    endSubmit()
  }
}

async function removeLamp(lamp) {
  try {
    await ElMessageBox.confirm(`确定删除「${lamp.name}」吗？`, '删除灯型', { type: 'warning' })
    await deleteLightById(lamp.id)
    await loadLamps()
    ElMessage.success('灯型已删除')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.userMessage || error.message || '灯型删除失败')
    }
  }
}

onMounted(loadPage)
</script>

<template>
  <main class="lamp-list-page">
    <header class="page-heading">
      <div>
        <h1>线上点灯</h1>
        <p>维护官网灯型、价格、物料及匹配神像</p>
      </div>
      <el-button class="save-button" :disabled="loading" @click="openCreate">新增灯型</el-button>
    </header>

    <section v-loading="loading" class="lamp-panel">
      <div class="panel-toolbar">
        <span>共 {{ lamps.length }} 种灯</span>
      </div>
      <el-empty v-if="!loading && !lamps.length" description="暂无点灯配置" />
      <OnlineLampCards v-else :lamps="lamps" @edit="openEdit" @delete="removeLamp" />
    </section>

    <el-dialog v-model="editVisible" :title="currentLamp ? '编辑灯型' : '新增灯型'" width="520px" @closed="clearLocalPreview">
      <el-form class="lamp-form" label-position="top" @submit.prevent>
        <el-form-item label="灯名称" required>
          <el-input v-model="form.name" maxlength="50" placeholder="例如：光明灯" />
        </el-form-item>
        <el-form-item label="灯图片" required>
          <label class="upload-box">
            <input type="file" accept="image/*" :disabled="uploading || saving" @change="onImageChange" />
            <img v-if="localPreviewUrl || form.image" :src="localPreviewUrl || form.image" class="upload-preview" alt="灯图片预览" />
            <template v-else>
              <span class="upload-icon">⬆</span>
              <strong>点击上传灯图片</strong>
              <span class="upload-tip">仅限 1 张 · 建议尺寸 400 × 400</span>
            </template>
            <span v-if="uploading" class="upload-mask">上传中…</span>
          </label>
        </el-form-item>
        <el-form-item label="灯盏描述" required>
          <el-input
            v-model="form.desc"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请输入灯盏描述"
          />
        </el-form-item>
        <el-form-item label="点灯价格($)" required>
          <div class="price-grid">
            <label v-for="field in priceFields" :key="field.key" class="price-cell">
              <span>{{ field.label }}</span>
              <el-input v-model="form[field.key]" type="number" min="0" placeholder="请输入" />
            </label>
          </div>
          <p class="material-tip">日供 / 月供 / 年供三档价格均必填</p>
        </el-form-item>
        <el-form-item label="物料" required>
          <div class="material-chips">
            <span v-for="id in form.shopItemsIds" :key="id" class="material-chip">
              {{ materialMap[String(id)]?.name || id }}
              <i role="button" tabindex="0" @click="removeMaterial(id)" @keydown.enter.prevent="removeMaterial(id)">×</i>
            </span>
            <el-button class="add-material-button" :disabled="!materials.length" @click="materialDialogVisible = true">＋ 添加物料</el-button>
          </div>
          <p class="material-tip">最多选择 6 项上架物料</p>
        </el-form-item>
        <el-form-item label="匹配神像（选填）">
          <el-select v-model="form.matchGod" placeholder="请选择神像" class="deity-select">
            <el-option
              v-for="deity in deityOptions"
              :key="deity"
              :label="deity"
              :value="deity"
              :disabled="isDeityTaken(deity) && form.matchGod !== deity"
            >
              <span class="deity-option">
                <span>{{ deity }}</span>
                <em v-if="isDeityTaken(deity) && form.matchGod !== deity" class="deity-taken">已匹配其他灯型</em>
              </span>
            </el-option>
          </el-select>
          <p class="material-tip">一个神像只能匹配一款灯型</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="uploading || saving" @click="editVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" :disabled="uploading" @click="submitLamp">提交</el-button>
      </template>
    </el-dialog>

    <MaterialSelectDialog
      v-model="materialDialogVisible"
      :materials="materials"
      :selected-ids="form.shopItemsIds"
      @save="applyMaterials"
    />
  </main>
</template>

<style scoped lang="less">
.lamp-list-page {
  padding: 20px 14px 12px;
}

.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.lamp-panel {
  margin-top: 12px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);
}

.panel-toolbar {
  height: 50px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  span {
    color: var(--admin-text-secondary);
    font-size: 13px;
  }
}

.lamp-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
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
    color: var(--admin-text-muted);
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

  .upload-preview {
    max-width: 100%;
    max-height: 160px;
    border-radius: var(--admin-radius-sm);
  }
}

.price-grid {
  display: flex;
  gap: 10px;
  width: 100%;
}

.price-cell {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 4px;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.material-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.material-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  color: var(--admin-primary);
  font-size: 12px;
  background: var(--admin-primary-lighter);
  border: 1px solid var(--admin-primary-light-5);
  border-radius: var(--admin-radius-sm);

  i {
    color: var(--admin-text-secondary);
    font-size: 13px;
    font-style: normal;
    cursor: pointer;

    &:hover {
      color: var(--admin-danger);
    }
  }
}

.add-material-button {
  height: 26px;
  margin: 0;
  padding: 0 12px;
  color: var(--admin-primary);
  background: var(--admin-surface);
  border-color: var(--admin-primary);
  border-radius: var(--admin-radius-sm);

  &:hover,
  &:focus {
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary);
  }
}

.material-tip {
  margin: 8px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
}

.deity-select {
  width: 100%;
}

.deity-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .deity-taken {
    color: var(--admin-warning);
    font-size: 11px;
    font-style: normal;
    white-space: nowrap;
  }
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
