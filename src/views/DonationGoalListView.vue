<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DonationGoalTable from '../components/donation/DonationGoalTable.vue'
import {
  deleteDonateTargetById,
  getDonateTargetById,
  getDonateTargetList,
  getShopItemsList,
  saveDonateTarget,
  updateDonateTarget,
  uploadBusinessFile,
} from '../services/businessApi'
import { syncTierShopItems, tierPricesFromShopItems, validateTierPrices } from '../utils/shopItemTiers'

const goals = ref([])
const shopItems = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const editingId = ref(null)
const selectedImageFile = ref(null)
const localPreviewUrl = ref('')
const form = reactive({
  title: '',
  subtitle: '',
  targetAmount: '',
  type: 1,
  shopItemsIds: [],
  image: '',
  tier1: '',
  tier2: '',
  tier3: '',
  tier4: '',
})

// 捐钱类型下的四个金额档位：接口无价格字段，提交时落成四条捐钱类商品并回写 shopItemsIds。
const tierFields = ['tier1', 'tier2', 'tier3', 'tier4']
// 编辑时优先复用已关联的商品 id，避免每次保存都新建一批商品。
const existingTierIds = ref([])

// 从关联商品列表按 seq 回填四个档位金额。
function fillTiers(shopItemsList) {
  const prices = tierPricesFromShopItems(shopItemsList, tierFields.length)
  tierFields.forEach((key, index) => {
    form[key] = prices[index]
  })
}

const selectableShopItems = computed(() => shopItems.value.filter((item) => (
  Number(item.status) === 1 || form.shopItemsIds.includes(Number(item.id))
)))

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
    const pageRecords = getList(result)
    records.push(...pageRecords)
    totalPage = Number(result?.totalPage) || 1
    if (!pageRecords.length || page >= totalPage) break
    page += 1
  } while (page <= 50)

  return records
}

function normalizeGoal(goal) {
  return {
    ...goal,
    id: Number(goal.id),
    image: goal.picture || goal.image || '',
    subtitle: goal.subTitle || goal.subtitle || '',
    targetAmount: Number(goal.targetAmount || 0),
    raisedAmount: Number(goal.completedAmount ?? goal.raisedAmount ?? 0),
    type: Number(goal.type),
    createdAt: goal.createTime || goal.createdAt || '',
    shopItemsIds: (goal.shopItemsIds || goal.shopItems || goal.shopItemsList?.map((item) => item.id) || []).map(Number),
  }
}

async function loadPage() {
  loading.value = true
  const results = await Promise.allSettled([
    getAllPages(getDonateTargetList),
    getAllPages(getShopItemsList),
  ])
  if (results[0].status === 'fulfilled') goals.value = results[0].value.map(normalizeGoal)
  else ElMessage.error(results[0].reason?.userMessage || results[0].reason?.message || '捐赠目标加载失败')
  if (results[1].status === 'fulfilled') shopItems.value = results[1].value
    .map((item) => ({ ...item, id: Number(item.id), price: Number(item.price || 0), status: Number(item.status) }))
  else ElMessage.error(results[1].reason?.userMessage || results[1].reason?.message || '捐赠物品加载失败')
  loading.value = false
}

function clearLocalPreview() {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
  selectedImageFile.value = null
}

function resetForm() {
  clearLocalPreview()
  form.title = ''
  form.subtitle = ''
  form.targetAmount = ''
  form.type = 1
  form.shopItemsIds = []
  form.image = ''
  tierFields.forEach((key) => { form[key] = '' })
  existingTierIds.value = []
}

function openAdd() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function fillForm(goal) {
  form.title = goal.title || ''
  form.subtitle = goal.subtitle || ''
  form.targetAmount = goal.targetAmount
  form.type = goal.type === 2 ? 2 : 1
  form.shopItemsIds = [...goal.shopItemsIds]
  form.image = goal.image
  fillTiers(goal.shopItemsList)
  existingTierIds.value = form.type === 1 ? [...goal.shopItemsIds] : []
}

async function openEdit(goal) {
  editingId.value = goal.id
  clearLocalPreview()
  fillForm(goal)
  dialogVisible.value = true
  try {
    const detail = normalizeGoal(await getDonateTargetById(goal.id))
    if (editingId.value === goal.id) fillForm(detail)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取捐赠目标详情失败，已使用列表数据')
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

function validateMoney(_rule, value, callback) {
  const amount = Number(value)
  if (value === '' || value === null || value === undefined) callback(new Error('请输入目标金额'))
  else if (!Number.isFinite(amount) || amount <= 0) callback(new Error('目标金额必须大于 0'))
  else if (!/^\d+(\.\d{1,2})?$/.test(String(value))) callback(new Error('金额最多保留 2 位小数'))
  else callback()
}

const rules = {
  title: [{ required: true, message: '请输入目标主标题', trigger: 'blur' }],
  targetAmount: [{ validator: validateMoney, trigger: ['blur', 'change'] }],
}

async function submitGoal() {
  if (saving.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const isDonation = Number(form.type) === 1
  // 捐钱：四档金额全部必填；捐物：保留原有“至少关联一件已上架物品”的校验。
  const tierError = isDonation ? validateTierPrices(tierFields.map((key) => form[key])) : null
  if (tierError) {
    ElMessage.warning(tierError)
    return
  }
  if (!isDonation && !form.shopItemsIds.length) {
    ElMessage.warning('请至少关联一件已上架物品')
    return
  }

  saving.value = true
  try {
    let picture = form.image
    if (selectedImageFile.value) {
      const uploadedFile = await uploadBusinessFile(selectedImageFile.value)
      picture = uploadedFile?.url
      if (!picture) throw new Error('图片上传成功但未返回图片地址')
    }
    const finalPicture = picture || ''
    let shopItemsIds = []

    if (isDonation) {
      // 四档金额先落成四条捐钱类商品（已有的改价格，缺的新建），再把商品 id 写入目标。
      shopItemsIds = await syncTierShopItems({
        existingIds: existingTierIds.value,
        prices: tierFields.map((key) => form[key]),
        namePrefix: `${form.title.trim()}·`,
        useType: '捐赠目标',
        picture: finalPicture,
      })
    } else {
      shopItemsIds = form.shopItemsIds.map(Number)
    }

    const payload = {
      picture: finalPicture,
      title: form.title.trim(),
      subTitle: form.subtitle.trim(),
      targetAmount: Number(form.targetAmount),
      type: Number(form.type),
      shopItemsIds,
    }
    if (editingId.value) await updateDonateTarget({ id: editingId.value, ...payload })
    else await saveDonateTarget(payload)

    dialogVisible.value = false
    clearLocalPreview()
    await loadPage()
    ElMessage.success(editingId.value ? '捐赠目标已更新' : '捐赠目标已新增')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存捐赠目标失败')
  } finally {
    saving.value = false
  }
}

async function removeGoal(goal) {
  try {
    await ElMessageBox.confirm(`确定删除「${goal.title}」吗？删除后不可恢复。`, '删除捐赠目标', { type: 'warning' })
    await deleteDonateTargetById(goal.id)
    await loadPage()
    ElMessage.success('捐赠目标已删除')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.userMessage || error.message || '删除捐赠目标失败')
    }
  }
}

onMounted(loadPage)
</script>

<template>
  <main class="goal-list-page">
    <header class="page-heading">
      <h1>捐赠内容</h1>
      <p>配置官网展示的捐赠内容、捐赠类型及关联物品</p>
    </header>

    <section class="table-card">
      <div class="table-toolbar">
        <span>共 {{ goals.length }} 个目标</span>
        <el-button class="add-button" @click="openAdd">+ 新增目标</el-button>
      </div>

      <DonationGoalTable
        v-loading="loading"
        :goals="goals"
        @edit="openEdit"
        @remove="removeGoal"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="520px">
      <el-form ref="formRef" class="goal-form" :model="form" :rules="rules" label-position="top">
        <el-form-item label="目标效果图">
          <label class="upload-box">
            <input type="file" accept="image/*" @change="onImageChange" />
            <img v-if="form.image" :src="form.image" class="upload-preview" alt="目标效果图预览" />
            <template v-else>
              <span class="upload-icon">⬆</span>
              <strong>点击上传目标效果图</strong>
              <span class="upload-tip">仅限 1 张 · 建议尺寸 800 × 800</span>
            </template>
          </label>
        </el-form-item>
        <el-form-item label="目标主标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入目标主标题" maxlength="30" />
        </el-form-item>
        <el-form-item label="目标副标题">
          <el-input v-model="form.subtitle" placeholder="请输入目标副标题" maxlength="30" />
        </el-form-item>
        <el-form-item label="目标金额($)" prop="targetAmount">
          <el-input v-model="form.targetAmount" type="number" placeholder="请输入目标金额" min="0" />
        </el-form-item>
        <el-form-item label="捐赠类型" required>
          <el-radio-group v-model="form.type">
            <el-radio :value="1">捐钱</el-radio>
            <el-radio :value="2">捐物</el-radio>
          </el-radio-group>
          <p class="type-tip">捐钱与捐物为两种捐赠方式，对应前台捐赠页交互。</p>
        </el-form-item>
        <el-form-item v-if="Number(form.type) === 1" label="档位金额($)(4档)" required>
          <div class="tier-grid">
            <el-input v-for="(key, index) in tierFields" :key="key" v-model="form[key]" type="number" min="0" step="0.01" :placeholder="`第 ${index + 1} 档`" />
          </div>
          <p class="type-tip">四个档位自动生成四条捐钱类商品，前台捐赠页按档位金额展示。</p>
        </el-form-item>
        <el-form-item v-if="Number(form.type) === 2" label="关联捐赠物品">
          <el-checkbox-group v-model="form.shopItemsIds" class="shop-item-options">
            <el-checkbox v-for="item in selectableShopItems" :key="item.id" :value="item.id">
              {{ item.name }} · ${{ item.price }} / {{ item.unit || '件' }}{{ Number(item.status) === 1 ? '' : '（已下架）' }}
            </el-checkbox>
          </el-checkbox-group>
          <p v-if="!selectableShopItems.length" class="type-tip">暂无可关联的已上架物品，请先在物品列表中配置。</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" @click="submitGoal">{{ editingId ? '保存修改' : '发布即开始筹款' }}</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.goal-list-page {
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

.status-card {
  margin-top: 12px;
  padding: 16px 20px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 12px;
    color: var(--admin-text-primary);
    font-size: 14px;
    font-weight: 600;

    &::before {
      width: 3px;
      height: 14px;
      content: '';
      background: var(--admin-primary);
      border-radius: var(--admin-radius-pill);
    }
  }
}

.status-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;

  p {
    margin: 0;
    color: var(--admin-text-secondary);
    font-size: 12px;
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

.goal-form {
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

.type-tip {
  margin: 6px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
}

// 四个金额档位：两列两行排列。
.tier-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.shop-item-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
}

.tier-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
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

.soft-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);

  &.running { color: var(--admin-success); background: var(--admin-success-light); }
  &.achieved { color: var(--admin-info); background: var(--admin-info-light); }
  &.stopped { color: var(--admin-danger); background: var(--admin-danger-light); }
}
</style>
