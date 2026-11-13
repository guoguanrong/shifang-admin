<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DonationGoalTable from '../components/donation/DonationGoalTable.vue'
import {
  deleteDonateTargetById,
  getDonateShopItems,
  getDonateTargetById,
  getDonateTargetList,
  getShopItemsList,
  saveDonateTarget,
  updateDonateTarget,
} from '../services/businessApi'
import { useImmediateUpload } from '../utils/immediateUpload'
import { syncTierShopItems, tierPricesFromShopItems, validateTierPrices } from '../utils/shopItemTiers'

const MAX_GOODS = 6

const goals = ref([])
const shopItems = ref([])
const loading = ref(false)
const { saving, allowSubmit, endSubmit } = useSubmitGuard()
const dialogVisible = ref(false)
const formRef = ref()
const editingId = ref(null)
const localPreviewUrl = ref('')
const { uploading, uploadFile, runUpload } = useImmediateUpload()
let uploadToken = 0
// 捐钱档位与捐物商品可以并存：两者最终都写进 donateTarget.shopItemsIds（混合商品 id）。
const form = reactive({
  title: '',
  subtitle: '',
  targetAmount: '',
  shopItemsIds: [],
  goodsIds: [],
  image: '',
  tier1: '',
  tier2: '',
  tier3: '',
  tier4: '',
})

// 捐钱类型下的四个金额档位：接口无价格字段，提交时落成四条捐钱类商品并回写 shopItemsIds。
const tierFields = ['tier1', 'tier2', 'tier3', 'tier4']
// 编辑时优先复用已关联的钱档位商品 id，避免每次保存都新建一批商品。
const existingTierIds = ref([])
// 「+ 添加物品」弹窗的临时勾选状态。
const goodsPickerVisible = ref(false)
const goodsPickerSelection = ref([])

// 从关联商品列表按 seq 回填四个档位金额。
function fillTiers(shopItemsList) {
  const prices = tierPricesFromShopItems(shopItemsList, tierFields.length)
  tierFields.forEach((key, index) => {
    form[key] = prices[index]
  })
}

// 可关联的捐物商品：type=1 是钱档位，其余为实物；已关联的下架物品仍保持可见。
const selectableShopItems = computed(() => shopItems.value.filter((item) => (
  Number(item.type) !== 1
  && (Number(item.status) === 1 || form.goodsIds.includes(Number(item.id)))
)))
const selectedGoods = computed(() => form.goodsIds
  .map((id) => shopItems.value.find((item) => Number(item.id) === Number(id)))
  .filter(Boolean))

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
  // 列表的捐赠类型按目标实际关联的商品类型展示（接口 type 只有单值，无法表达二者并存）。
  const byId = new Map(shopItems.value.map((item) => [Number(item.id), item]))
  goals.value = goals.value.map((goal) => ({
    ...goal,
    linkedTypes: [...new Set((goal.shopItemsIds || [])
      .map((id) => Number(byId.get(Number(id))?.type))
      .filter((type) => type === 1 || type === 2))],
  }))
  loading.value = false
}

function clearLocalPreview() {
  uploadToken += 1
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
}

function resetForm() {
  clearLocalPreview()
  form.title = ''
  form.subtitle = ''
  form.targetAmount = ''
  form.shopItemsIds = []
  form.goodsIds = []
  form.image = ''
  tierFields.forEach((key) => { form[key] = '' })
  existingTierIds.value = []
  goodsPickerSelection.value = []
}

function openAdd() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

// 关联商品接口可能返回数组，也可能返回分页对象。
function linkedItemsFrom(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

function orderBySeq(items) {
  return [...(items || [])].sort((a, b) => (
    Number(a.seq ?? Number.MAX_SAFE_INTEGER) - Number(b.seq ?? Number.MAX_SAFE_INTEGER)
  ))
}

// 按商品 type 分组回填：type=1 是钱档位（价格 + 可复用的商品 id），其余为捐物商品。
// 只在对应分组有数据时覆盖，避免关联接口某一类返回空就清掉已回填的内容。
function applyLinkedShopItems(items) {
  const moneyItems = orderBySeq((items || []).filter((item) => Number(item.type) === 1))
  const goodsItems = (items || []).filter((item) => Number(item.type) !== 1)
  if (moneyItems.length) {
    fillTiers(moneyItems)
    existingTierIds.value = moneyItems.slice(0, tierFields.length)
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id) && id > 0)
  }
  if (goodsItems.length) {
    form.goodsIds = goodsItems
      .map((item) => Number(item.id))
      .filter((id) => Number.isFinite(id) && id > 0)
      .slice(0, MAX_GOODS)
  }
}

// /donateTarget/get/{id} 只返回商品 id 列表，用全量商品按 id 反查即可拿到四档价格。
function itemsByIds(ids) {
  return (ids || [])
    .map((id) => shopItems.value.find((item) => Number(item.id) === Number(id)))
    .filter(Boolean)
}

// 老目标可能没有关联表记录，退回按「标题·档位N」在全量商品里匹配（与 syncTierShopItems 命名一致）。
// 接口返回的 seq 可能为 null，因此不把 seq 1..4 当作硬性条件。
function fallbackTierItems(title) {
  const prefix = `${String(title || '').trim()}·档位`
  if (prefix === '·档位') return []
  return shopItems.value
    .filter((item) => Number(item.type) === 1 && String(item.name || '').startsWith(prefix))
    .sort((a, b) => Number(a.seq ?? Number.MAX_SAFE_INTEGER) - Number(b.seq ?? Number.MAX_SAFE_INTEGER))
    .slice(0, tierFields.length)
}

// 后端确认：商品（ShopItems）自带 type 区分 1.钱 2.物品，目标侧只需传 shopItemsIds。
// 截图里的 type 是 /shopItems/getDonateShopItems 的必填「查询条件」，不是「目标只能有一种类型」，
// 所以编辑回填要分别用 1/2 查一次再合并，按返回商品自身的 type 分到钱档位或实物卡片。
async function loadLinkedShopItems(targetId) {
  const results = await Promise.allSettled([1, 2].map((type) => (
    getDonateShopItems({ donateTargetId: Number(targetId), type })
  )))
  if (editingId.value !== targetId) return

  const byId = new Map()
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return
    linkedItemsFrom(result.value).forEach((item) => byId.set(Number(item.id), item))
  })
  // 详情的 shopItemsIds 作为兜底：某一类关联查不到时仍能按 id 反查到商品。
  itemsByIds(form.shopItemsIds).forEach((item) => {
    if (!byId.has(Number(item.id))) byId.set(Number(item.id), item)
  })

  let source = [...byId.values()]
  // 仅在一条关联商品都拿不到时，才按「标题·档位N」补回老目标的钱档位；
  // 只配置捐物的目标不应被名称兜底误填出四档金额。
  if (!source.length) source = fallbackTierItems(form.title)
  if (source.length) applyLinkedShopItems(source)
  if (results.every((result) => result.status === 'rejected') && !form.shopItemsIds.length) {
    ElMessage.error(results[0].reason?.userMessage || results[0].reason?.message || '读取关联捐赠物品失败')
  }
}

function fillForm(goal) {
  form.title = goal.title || ''
  form.subtitle = goal.subtitle || ''
  form.targetAmount = goal.targetAmount
  form.shopItemsIds = [...goal.shopItemsIds]
  form.image = goal.image
  // 先清空再按商品类型回填，避免上一次编辑的钱档位/物品残留。
  fillTiers([])
  form.goodsIds = []
  existingTierIds.value = []
  // /donateTarget/get/{id} 常只返回 shopItemsIds 而不返回 shopItemsList，
  // 必须按 id 反查商品才能把钱档位与物品分别回填到表单。
  const linkedItems = goal.shopItemsList?.length ? goal.shopItemsList : itemsByIds(goal.shopItemsIds)
  if (linkedItems.length) applyLinkedShopItems(linkedItems)
}

// 「+ 添加物品」：从可关联的实物商品里最多选 MAX_GOODS 个，已选项可删除后重新添加。
function openGoodsPicker() {
  goodsPickerSelection.value = [...form.goodsIds]
  goodsPickerVisible.value = true
}

function confirmGoodsPicker() {
  if (goodsPickerSelection.value.length > MAX_GOODS) {
    ElMessage.warning(`最多选择 ${MAX_GOODS} 个捐赠物品`)
    return
  }
  form.goodsIds = goodsPickerSelection.value.map(Number)
  goodsPickerVisible.value = false
}

function removeGoods(id) {
  form.goodsIds = form.goodsIds.filter((item) => Number(item) !== Number(id))
}

async function openEdit(goal) {
  editingId.value = goal.id
  clearLocalPreview()
  fillForm(goal)
  dialogVisible.value = true
  const targetId = goal.id

  try {
    const detail = normalizeGoal(await getDonateTargetById(targetId))
    if (editingId.value === targetId) fillForm(detail)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取捐赠目标详情失败，已使用列表数据')
  }

  // /donateTarget/get/{id} 的 shopItems / shopItemsList 可能为 null，钱/物关联商品需分别查。
  if (editingId.value === targetId) await loadLinkedShopItems(targetId)
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
  if (uploading.value || !allowSubmit()) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  // 两种捐赠方式可同时配置，但各自配置时都要完整：钱档位四档齐全，物品最多 6 个。
  const tierPrices = tierFields.map((key) => form[key])
  const hasTiers = tierPrices.some((value) => value !== '' && value !== null && value !== undefined)
  const goodsIds = form.goodsIds.map(Number)
  if (!hasTiers && !goodsIds.length) {
    ElMessage.warning('请至少配置捐钱档位金额或捐赠物品')
    return
  }
  if (goodsIds.length > MAX_GOODS) {
    ElMessage.warning(`最多配置 ${MAX_GOODS} 个捐赠物品`)
    return
  }
  const tierError = hasTiers ? validateTierPrices(tierPrices) : null
  if (tierError) {
    ElMessage.warning(tierError)
    return
  }

  saving.value = true
  try {
    const finalPicture = form.image || ''
    let tierIds = []

    if (hasTiers) {
      // 四档金额落成四条 type=1 的商品（已有的改价格，缺的新建）。
      tierIds = await syncTierShopItems({
        existingIds: existingTierIds.value,
        prices: tierPrices,
        namePrefix: `${form.title.trim()}·`,
        useType: '捐赠目标',
        picture: finalPicture,
      })
      if (tierIds.length !== tierFields.length) {
        throw new Error('四档商品同步失败，请重试')
      }
    }
    // 钱档位与实物商品写进同一个 shopItemsIds，接口按商品自身 type 区分。
    const shopItemsIds = [...new Set([...tierIds, ...goodsIds])]

    const payload = {
      picture: finalPicture,
      title: form.title.trim(),
      subTitle: form.subtitle.trim(),
      targetAmount: Number(form.targetAmount),
      // 后端确认：钱/物由 ShopItems.type 区分，目标侧只传商品 id 列表即可。
      // DonateTarget.type 仍按文档传 1/2 合法值，仅用于列表展示与前台目标筛选，不决定商品类型。
      type: hasTiers ? 1 : 2,
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
    endSubmit()
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

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="640px" @closed="clearLocalPreview">
      <el-form ref="formRef" class="goal-form" :model="form" :rules="rules" label-position="top">
        <el-form-item label="目标效果图">
          <label class="upload-box">
            <input type="file" accept="image/*" :disabled="uploading || saving" @change="onImageChange" />
            <img v-if="localPreviewUrl || form.image" :src="localPreviewUrl || form.image" class="upload-preview" alt="目标效果图预览" />
            <template v-else>
              <span class="upload-icon">⬆</span>
              <strong>点击上传目标效果图</strong>
              <span class="upload-tip">仅限 1 张 · 建议尺寸 800 × 800</span>
            </template>
            <span v-if="uploading" class="upload-mask">上传中…</span>
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
        <el-form-item label="捐赠类型">
          <p class="type-tip section-tip">捐钱与捐物为两种捐赠方式，二者并存，对应前台捐赠页</p>
          <div class="donation-type-cards">
            <section class="donation-type-card">
              <span class="type-badge">捐钱</span>
              <div class="type-card-body">
                <p class="type-card-title">档位金额(4档)</p>
                <div class="tier-grid">
                  <el-input v-for="(key, index) in tierFields" :key="key" v-model="form[key]" type="number" min="0" step="0.01" :placeholder="`第 ${index + 1} 档`" />
                </div>
                <p class="type-tip">捐钱档位金额，对应前台捐赠页档位选择</p>
              </div>
            </section>
            <section class="donation-type-card">
              <span class="type-badge">捐物</span>
              <div class="type-card-body">
                <p class="type-card-title">捐赠物品(最多{{ MAX_GOODS }}个)</p>
                <div v-if="selectedGoods.length" class="goods-tags">
                  <el-tag
                    v-for="item in selectedGoods"
                    :key="item.id"
                    closable
                    disable-transitions
                    @close="removeGoods(item.id)"
                  >{{ item.name }} · ${{ item.price }} / {{ item.unit || '件' }}</el-tag>
                </div>
                <el-button class="add-goods-button" :disabled="form.goodsIds.length >= MAX_GOODS" @click="openGoodsPicker">+ 添加物品</el-button>
                <p class="type-tip">捐物为以善款购置供物捐赠，可删除后重新添加</p>
              </div>
            </section>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="uploading || saving" @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" :disabled="uploading" @click="submitGoal">{{ editingId ? '保存修改' : '发布即开始筹款' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="goodsPickerVisible" title="添加捐赠物品" width="480px" append-to-body>
      <p class="type-tip picker-tip">最多选择 {{ MAX_GOODS }} 个，仅展示已上架的物品</p>
      <el-checkbox-group v-if="selectableShopItems.length" v-model="goodsPickerSelection" class="goods-picker-list">
        <el-checkbox
          v-for="item in selectableShopItems"
          :key="item.id"
          :value="item.id"
          :disabled="goodsPickerSelection.length >= MAX_GOODS && !goodsPickerSelection.includes(item.id)"
        >{{ item.name }} · ${{ item.price }} / {{ item.unit || '件' }}</el-checkbox>
      </el-checkbox-group>
      <p v-else class="type-tip">暂无可关联的已上架物品，请先在物品列表中配置。</p>
      <template #footer>
        <el-button @click="goodsPickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmGoodsPicker">确定</el-button>
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

.section-tip {
  margin: 0 0 12px;
  font-size: 13px;
}

// 捐钱 / 捐物两张并存卡片。
.donation-type-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.donation-type-card {
  padding: 16px 18px 18px;
  background: #fffdf7;
  border: 1px solid #e7d6b0;
  border-radius: 12px;
}

.type-badge {
  display: inline-flex;
  min-width: 58px;
  height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: #8b5a12;
  font-size: 14px;
  font-weight: 600;
  background: #f7ead0;
  border: 1px solid #e7d6b0;
  border-radius: 8px;
}

.type-card-body { margin-top: 12px; }

.type-card-title {
  margin: 0 0 10px;
  color: var(--admin-text-primary);
  font-size: 14px;
  font-weight: 600;
}

// 四个金额档位：两列两行排列。
.tier-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;

  :deep(.el-input__wrapper) { min-height: 44px; }
}

.goods-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.add-goods-button {
  height: 34px;
  margin: 0;
  padding: 0 14px;
  color: var(--admin-text-regular);
  background: #fff;
  border-color: var(--admin-border-strong);
  border-radius: 8px;
}

.goods-picker-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.picker-tip { margin: 0 0 12px; }

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
