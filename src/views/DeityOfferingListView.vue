<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DeityOfferingCards from '../components/deity/DeityOfferingCards.vue'
import { getInitialData } from '../services/dataSource'
import {
  deleteWorshipById,
  getWorshipById,
  getWorshipList,
  saveWorship,
  updateWorship,
  uploadBusinessFile,
} from '../services/businessApi'
import { syncTierShopItems, tierPricesFromShopItems, validateTierPrices } from '../utils/shopItemTiers'

const deities = ref([])
const mockDeities = getInitialData('deityOfferings')
const descriptionsByName = new Map(mockDeities.map(({ name, description }) => [name, description]))
const loading = ref(false)
const saving = ref(false)
const formLoading = ref(false)
const deletingId = ref(null)
const selectedImageFile = ref(null)
const localPreviewUrl = ref('')
const editVisible = ref(false)
const mode = ref('create')
const currentDeity = ref(null)

// 神像分类字典（接口 Worship.category）。
const categoryOptions = [
  { label: '财运', value: 1 },
  { label: '健康', value: 2 },
  { label: '事业', value: 3 },
  { label: '平安', value: 4 },
  { label: '学业', value: 5 },
]
// 标签固定三个输入框，每个限两个字，提交时用逗号拼接（接口 tag 为逗号分割字符串）。
const tagFields = ['tag1', 'tag2', 'tag3']
// 供奉金额四个档位：接口无价格字段，提交时落成四条捐钱类商品并回写 shopItemsIds。
const tierFields = ['tier1', 'tier2', 'tier3', 'tier4']

const form = reactive({
  matchGod: '',
  image: '',
  desc: '',
  category: '',
  christmas: '',
  source: '',
  merit: '',
  tag1: '',
  tag2: '',
  tag3: '',
  tier1: '',
  tier2: '',
  tier3: '',
  tier4: '',
})

// 当前神像已关联的商品 id，编辑时优先改这些商品的价格而不是新建。
const existingShopItemIds = ref([])

function getList(payload) {
  if (Array.isArray(payload)) return payload
  return payload?.list || payload?.records || payload?.data?.list || []
}

function clearLocalPreview() {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
  selectedImageFile.value = null
}

function resetForm() {
  clearLocalPreview()
  form.matchGod = ''
  form.image = ''
  form.desc = ''
  form.category = ''
  form.christmas = ''
  form.source = ''
  form.merit = ''
  form.tag1 = ''
  form.tag2 = ''
  form.tag3 = ''
  tierFields.forEach((key) => { form[key] = '' })
  existingShopItemIds.value = []
}

// 从关联商品列表按档位顺序回填四个金额输入框。
function fillTiers(shopItemsList) {
  const prices = tierPricesFromShopItems(shopItemsList, tierFields.length)
  tierFields.forEach((key, index) => {
    form[key] = prices[index]
  })
}

// 出参字段名为 shopItemIds（入参为 shopItemsIds），两个名字都兼容。
function readShopItemIds(source) {
  const ids = source?.shopItemIds ?? source?.shopItemsIds
    ?? (source?.shopItemsList || []).map((item) => item.id)
    ?? []
  return Array.isArray(ids) ? ids.map(Number).filter((id) => Number.isFinite(id) && id > 0) : []
}

// 将接口的 tag 字符串拆到三个输入框（多余标签丢弃）。
function fillTagFields(tag) {
  const tags = String(tag || '').split(/[,，]/).map((item) => item.trim())
  tagFields.forEach((key, index) => {
    form[key] = tags[index] || ''
  })
}

function openCreate() {
  mode.value = 'create'
  currentDeity.value = null
  resetForm()
  editVisible.value = true
}

async function openEdit(deity) {
  mode.value = 'edit'
  currentDeity.value = deity
  clearLocalPreview()
  form.matchGod = deity.name
  form.image = deity.image
  form.desc = deity.desc
  form.category = deity.category || ''
  form.christmas = deity.christmas
  form.source = deity.source
  form.merit = deity.merit
  fillTagFields(deity.tag)
  fillTiers(deity.shopItemsList)
  existingShopItemIds.value = readShopItemIds(deity)
  editVisible.value = true
  formLoading.value = true

  try {
    const detail = await getWorshipById(deity.id)
    if (!detail || currentDeity.value?.id !== deity.id) return
    form.matchGod = detail.matchGod || deity.name
    form.image = detail.picture || ''
    form.desc = detail.desc || ''
    form.category = Number(detail.category) || ''
    form.christmas = detail.christmas || ''
    form.source = detail.source || ''
    form.merit = detail.merit || ''
    fillTagFields(detail.tag)
    fillTiers(detail.shopItemsList)
    existingShopItemIds.value = readShopItemIds(detail)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取供奉详情失败，已使用列表数据')
  } finally {
    formLoading.value = false
  }
}

function onImageChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  clearLocalPreview()
  selectedImageFile.value = file
  localPreviewUrl.value = URL.createObjectURL(file)
  form.image = localPreviewUrl.value
}

async function loadDeities() {
  loading.value = true
  try {
    const payload = await getWorshipList({ page: 1, pageSize: 1000 })
    deities.value = getList(payload).map((item) => ({
      id: item.id,
      name: item.matchGod || '',
      // 描述优先用接口 desc，没有则回退到本地演示文案。
      description: item.desc || descriptionsByName.get(item.matchGod) || '',
      desc: item.desc || '',
      category: Number(item.category) || '',
      christmas: item.christmas || '',
      source: item.source || '',
      merit: item.merit || '',
      tag: item.tag || '',
      shopItemsList: item.shopItemsList || [],
      image: item.picture || '',
    }))
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '供奉配置加载失败')
  } finally {
    loading.value = false
  }
}

async function submitDeity() {
  if (saving.value) return
  // 除「分类」外其余字段均必填；标签为一组，至少填写一个；四档金额由 validateTierPrices 校验。
  const requiredFields = [
    { key: 'image', label: '神像图' },
    { key: 'matchGod', label: '神像名称' },
    { key: 'desc', label: '神像描述' },
    { key: 'christmas', label: '圣诞' },
    { key: 'source', label: '来历' },
    { key: 'merit', label: '所求功德' },
  ]
  const missing = requiredFields.find(({ key }) => !String(form[key] ?? '').trim())
  if (missing) {
    ElMessage.warning(`请填写${missing.label}`)
    return
  }
  if (!tagFields.some((key) => String(form[key] ?? '').trim())) {
    ElMessage.warning('请至少填写一个标签')
    return
  }
  const tierError = validateTierPrices(tierFields.map((key) => form[key]))
  if (tierError) {
    ElMessage.warning(tierError)
    return
  }

  saving.value = true
  const isEdit = mode.value === 'edit'
  const deityId = currentDeity.value?.id
  const imageFile = selectedImageFile.value
  const matchGod = form.matchGod.trim()
  const payload = {
    matchGod,
    desc: form.desc.trim(),
    // 分类未选择时不提交，避免把已有值覆盖成 0。
    category: form.category === '' ? undefined : Number(form.category),
    christmas: form.christmas.trim(),
    source: form.source.trim(),
    merit: form.merit.trim(),
    tag: tagFields.map((key) => form[key].trim()).filter(Boolean).join(','),
  }
  try {
    let picture = form.image
    if (imageFile) {
      const uploadedFile = await uploadBusinessFile(imageFile)
      picture = uploadedFile?.url
      if (!picture) throw new Error('图片上传成功但未返回图片地址')
    }
    const finalPicture = picture || ''

    // 四档金额先落成四条捐钱类商品（已有的改价格，缺的新建），再把商品 id 写入供奉配置。
    const shopItemsIds = await syncTierShopItems({
      existingIds: existingShopItemIds.value,
      prices: tierFields.map((key) => form[key]),
      namePrefix: `${matchGod}·`,
      useType: '神像供奉',
      picture: finalPicture,
    })

    const requestBody = {
      picture: finalPicture,
      ...payload,
      shopItemsIds,
    }

    if (isEdit) {
      await updateWorship({ ...requestBody, id: deityId })
    } else {
      await saveWorship(requestBody)
    }

    editVisible.value = false
    await loadDeities()
    ElMessage.success(isEdit ? '供奉信息已更新' : '供奉配置已新增')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '供奉信息保存失败')
  } finally {
    saving.value = false
  }
}

async function deleteDeity(deity) {
  try {
    await ElMessageBox.confirm(`确定删除「${deity.name}」的供奉配置吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  deletingId.value = deity.id
  try {
    await deleteWorshipById(deity.id)
    await loadDeities()
    ElMessage.success('供奉配置已删除')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除供奉配置失败')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadDeities)
</script>

<template>
  <main class="deity-list-page">
    <header class="page-heading">
      <h1>神像供奉</h1>
      <p>维护官网神像的供奉图、描述、分类、标签与四档供奉金额</p>
    </header>

    <section class="deity-panel">
      <div class="panel-toolbar">
        <span>共 {{ deities.length }} 尊神像</span>
        <el-button type="primary" @click="openCreate">新增供奉配置</el-button>
      </div>

      <el-skeleton v-if="loading" :rows="4" animated />
      <el-empty v-else-if="!deities.length" description="暂无供奉配置" />
      <DeityOfferingCards v-else :deities="deities" :deleting-id="deletingId" @edit="openEdit" @delete="deleteDeity" />
    </section>

    <el-dialog
      v-model="editVisible"
      :title="mode === 'edit' ? '编辑供奉配置' : '新增供奉配置'"
      width="520px"
      :close-on-click-modal="!saving"
      :close-on-press-escape="!saving"
      :show-close="!saving"
      @closed="clearLocalPreview"
    >
      <el-form v-loading="formLoading" class="deity-form" label-position="top" @submit.prevent>
        <el-form-item label="神像图" required>
          <label class="upload-box">
            <input type="file" accept="image/*" @change="onImageChange" />
            <img v-if="form.image" :src="form.image" class="upload-preview" alt="神像图预览" />
            <template v-else>
              <span class="upload-icon">＋</span>
              <strong>点击上传神像图</strong>
              <span class="upload-tip">仅限 1 张 · 建议尺寸 400 × 400</span>
            </template>
          </label>
        </el-form-item>

        <el-form-item label="神像名称" required>
          <el-input v-model="form.matchGod" placeholder="请输入神像名称" maxlength="30" />
          <p class="form-tip">名称需与官网神像一致，避免供奉信息展示到错误神像。</p>
        </el-form-item>

        <el-form-item label="神像描述" required>
          <el-input v-model="form.desc" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入神像描述" />
        </el-form-item>

        <el-form-item label="神像分类">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option v-for="option in categoryOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="圣诞" required>
          <el-input v-model="form.christmas" maxlength="30" placeholder="神像生辰，例如：农历九月初一" />
        </el-form-item>

        <el-form-item label="来历" required>
          <el-input v-model="form.source" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入神像来历" />
        </el-form-item>

        <el-form-item label="所求功德" required>
          <el-input v-model="form.merit" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入所求功德" />
        </el-form-item>

        <el-form-item label="标签" required>
          <div class="tag-grid">
            <el-input v-for="key in tagFields" :key="key" v-model="form[key]" maxlength="2" placeholder="两个字" />
          </div>
          <p class="form-tip">最多三个标签，每个限 2 个字，至少填写一个。</p>
        </el-form-item>

        <el-form-item label="供奉金额($)(4档)" required>
          <div class="form-row">
            <el-input v-for="(key, index) in tierFields" :key="key" v-model="form[key]" type="number" min="0" step="0.01" :placeholder="`第 ${index + 1} 档`" />
          </div>
          <p class="form-tip">四个档位自动生成四条捐钱类商品，前台供奉页按档位金额展示。</p>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button :disabled="saving" @click="editVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" :disabled="formLoading" @click="submitDeity">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.deity-list-page {
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

.deity-panel {
  margin-top: 12px;
  overflow: hidden;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);
}

.panel-toolbar {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--admin-border-light);

  span {
    color: var(--admin-text-secondary);
    font-size: 13px;
  }
}

.deity-form {
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

.form-tip {
  margin: 6px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.tag-grid {
  display: flex;
  gap: 10px;
  width: 100%;

  :deep(.el-input) {
    flex: 1 1 0;
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
