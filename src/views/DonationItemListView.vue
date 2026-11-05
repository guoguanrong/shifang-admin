<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DonationItemFilterBar from '../components/donation/DonationItemFilterBar.vue'
import DonationItemTable from '../components/donation/DonationItemTable.vue'
import {
  deleteShopItemsById,
  getShopItemsById,
  getShopItemsList,
  saveShopItems,
  updateShopItems,
  uploadBusinessFile,
} from '../services/businessApi'

const items = ref([])
const filters = ref({ name: '', status: '' })
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const editingId = ref(null)
const selectedImageFile = ref(null)
const localPreviewUrl = ref('')
const form = reactive({
  name: '',
  usage: '',
  type: 2,
  unit: '个',
  price: '',
  seq: 0,
  status: 1,
  image: '',
})

const filteredItems = computed(() => {
  const { name, status } = filters.value
  const statusValue = status === 'on' ? 1 : status === 'off' ? 2 : null
  return items.value.filter((item) => (
    (!name || item.name.includes(name))
    && (statusValue === null || item.status === statusValue)
  ))
})

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

async function getAllPages(fetchPage) {
  const records = []
  let page = 1
  let totalPage = 1
  do {
    const payload = await fetchPage({ page, pageSize: 200 })
    const result = payload?.data ?? payload
    const pageRecords = getList(result)
    records.push(...pageRecords)
    totalPage = Number(result?.totalPage) || 1
    if (!pageRecords.length || page >= totalPage) break
    page += 1
  } while (page <= 50)
  return records
}

function normalizeItem(item) {
  return {
    ...item,
    id: Number(item.id),
    image: item.picture || item.image || '',
    usage: item.useType || item.usage || '',
    type: Number(item.type ?? 2),
    price: Number(item.price || 0),
    seq: Number(item.seq || 0),
    status: Number(item.status),
    createdAt: item.createTime || item.createdAt || '',
  }
}

async function loadItems() {
  loading.value = true
  try {
    items.value = (await getAllPages(getShopItemsList)).map(normalizeItem)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '捐赠物品加载失败')
  } finally {
    loading.value = false
  }
}

function search(formValue) {
  filters.value = formValue
  ElMessage.success(`查询完成，共找到 ${filteredItems.value.length} 条物品记录`)
}

function reset(formValue) {
  filters.value = formValue
}

function clearLocalPreview() {
  if (localPreviewUrl.value) URL.revokeObjectURL(localPreviewUrl.value)
  localPreviewUrl.value = ''
  selectedImageFile.value = null
}

function resetForm() {
  clearLocalPreview()
  form.name = ''
  form.usage = ''
  form.type = 2
  form.unit = '个'
  form.price = ''
  form.seq = 0
  form.status = 1
  form.image = ''
}

function openAdd() {
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function fillForm(item) {
  form.name = item.name || ''
  form.usage = item.usage || ''
  form.type = item.type || 2
  form.unit = item.unit || '个'
  form.price = item.price
  form.seq = item.seq || 0
  form.status = item.status || 1
  form.image = item.image || ''
}

async function openEdit(item) {
  editingId.value = item.id
  clearLocalPreview()
  fillForm(item)
  dialogVisible.value = true
  try {
    const detail = normalizeItem(await getShopItemsById(item.id))
    if (editingId.value === item.id) fillForm(detail)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '读取物品详情失败，已使用列表数据')
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

function validatePrice(_rule, value, callback) {
  if (value === '' || value === null || value === undefined) {
    callback()
    return
  }
  const price = Number(value)
  if (!Number.isFinite(price) || price < 0) callback(new Error('价格不能为负数'))
  else if (!/^\d+(\.\d{1,2})?$/.test(String(value))) callback(new Error('价格最多保留 2 位小数'))
  else callback()
}

const rules = {
  name: [{ required: true, message: '请输入物品名称', trigger: 'blur' }],
  price: [{ validator: validatePrice, trigger: ['blur', 'change'] }],
}
const unitOptions = ['个', '幅', '张', '册', '本']

function makePayload(picture) {
  return {
    picture: picture || '',
    name: form.name.trim(),
    useType: form.usage.trim(),
    type: Number(form.type),
    unit: form.unit,
    price: Number(form.price) || 0,
    seq: Number(form.seq) || 0,
    status: Number(form.status),
  }
}

async function submitItem() {
  if (saving.value) return
  try {
    await formRef.value.validate()
  } catch {
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
    const payload = makePayload(picture)
    if (editingId.value) await updateShopItems({ id: editingId.value, ...payload })
    else await saveShopItems(payload)
    dialogVisible.value = false
    clearLocalPreview()
    await loadItems()
    ElMessage.success(editingId.value ? '物品已更新' : '物品已新增')
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存捐赠物品失败')
  } finally {
    saving.value = false
  }
}

async function toggleStatus(item) {
  const status = item.status === 1 ? 2 : 1
  try {
    await ElMessageBox.confirm(status === 2 ? '下架后，捐赠目标将不能再选择此物品。确定继续吗？' : '确定上架该物品吗？', '操作确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: status === 2 ? 'warning' : 'info',
    })
    await updateShopItems({
      id: item.id,
      ...makePayload(item.picture || item.image),
      name: item.name,
      useType: item.useType || item.usage || '',
      type: Number(item.type),
      unit: item.unit || '',
      price: Number(item.price || 0),
      seq: Number(item.seq || 0),
      status,
    })
    await loadItems()
    ElMessage.success(status === 1 ? '物品已上架' : '物品已下架')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.userMessage || error.message || '更新物品状态失败')
    }
  }
}

async function removeItem(item) {
  try {
    await ElMessageBox.confirm(`确定删除「${item.name}」吗？`, '删除物品', { type: 'warning' })
    await deleteShopItemsById(item.id)
    await loadItems()
    ElMessage.success('物品已删除')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error(error.userMessage || error.message || '删除物品失败')
    }
  }
}

onMounted(loadItems)
</script>

<template>
  <main class="item-list-page">
    <header class="page-heading">
      <h1>物品列表</h1>
      <p>物品可支持捐赠物品列表进行新增/编辑/上下架</p>
    </header>

    <DonationItemFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增物品</el-button>
      </div>

      <DonationItemTable
        v-loading="loading"
        :items="filteredItems"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeItem"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="520px">
      <el-form ref="formRef" class="item-form" :model="form" :rules="rules" label-position="top">
        <!-- 物品图片：单张本地预览 -->
        <el-form-item label="物品图片">
          <label class="upload-box">
            <input type="file" accept="image/*" @change="onImageChange" />
            <img v-if="form.image" :src="form.image" class="upload-preview" alt="物品图片预览" />
            <template v-else>
              <span class="upload-icon">⬆</span>
              <strong>点击上传物品图片</strong>
              <span class="upload-tip">仅限 1 张 · 建议尺寸 400 × 400</span>
            </template>
          </label>
        </el-form-item>
        <el-form-item label="物品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入物品名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="物品用途">
          <el-input v-model="form.usage" placeholder="请输入物品用途" maxlength="30" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio :value="1">捐钱</el-radio>
            <el-radio :value="2">捐物</el-radio>
          </el-radio-group>
        </el-form-item>
        <div class="form-row">
          <el-form-item label="单位">
            <el-select v-model="form.unit">
              <el-option v-for="unit in unitOptions" :key="unit" :label="unit" :value="unit" />
            </el-select>
          </el-form-item>
          <el-form-item label="价格($)" prop="price">
            <el-input v-model="form.price" type="number" placeholder="请输入价格" min="0" />
          </el-form-item>
        </div>
        <el-form-item label="排序值">
          <el-input v-model="form.seq" type="number" placeholder="数值越小越靠前" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="2">暂不上架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" :loading="saving" @click="submitItem">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.item-list-page {
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

.item-form {
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

.soft-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);

  &.on { color: var(--admin-success); background: var(--admin-success-light); }
  &.off { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
}
</style>
