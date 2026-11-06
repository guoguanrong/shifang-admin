<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RefreshRight, CircleClose } from '@element-plus/icons-vue'
import VolunteerFilterBar from '../components/volunteer/VolunteerFilterBar.vue'
import VolunteerTable from '../components/volunteer/VolunteerTable.vue'
import { getVolunteerList, saveVolunteer, updateVolunteer } from '../services/businessApi'
import { downloadCsv } from '../utils/csv'

const PAGE_SIZE = 10
// 义工状态字典：接口 1.待审核 / 2.审核通过(正常) / 3.拒绝 / 4.禁止参加；本页只呈现 2 与 4。
const statusValue = { normal: 2, banned: 4 }
const statusKey = { 2: 'normal', 4: 'banned' }
const statusText = { normal: '正常', banned: '禁止参加' }
// 加入类型：1.自主申请（官网报名）/ 2.后台添加。
const typeText = { 1: '自主申请', 2: '人工新增' }
const postOptions = ['道场护持', '道会协助', '文宣服务', '线上服务']
const availableTimeOptions = ['均可', '周末', '节假日']

const volunteers = ref([])
const filters = ref({})
const selection = ref([])
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const togglingId = ref(null)

// VolunteerVo → 表格行：姓名 username、岗位 applyPost、可服务时间 serviceTime、加入时间 createTime、留言 remark。
// 非 2/4 的状态（待审核/已拒绝）映射为 null，由 loadVolunteers 过滤。
function mapVolunteer(item) {
  return {
    id: item.id,
    name: item.username || '—',
    phone: item.phone || '—',
    post: item.applyPost || '—',
    availableTime: item.serviceTime || '—',
    joinType: typeText[Number(item.type)] || '—',
    joinedAt: item.createTime || '—',
    declaration: item.remark || '',
    status: statusKey[Number(item.status)] || null,
    banReason: item.banReason || '',
  }
}

// 拉取义工名单：正常 + 禁止参加；姓名走 searchKey，手机号右模糊，岗位精确匹配。
// 接口 status 暂不支持多值：选中状态时走服务端单值查询，「全部」时拉全量后前端过滤（分页计数以接口为准）。
async function loadVolunteers() {
  loading.value = true
  const { name, phone, post, status } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    status: status ? statusValue[status] : undefined,
    searchKey: (name || '').trim() || undefined,
    phone: (phone || '').trim() || undefined,
    applyPost: post || undefined,
  }

  try {
    const payload = await getVolunteerList(params)
    const result = payload?.data ?? payload
    const list = Array.isArray(result) ? result : result?.list
    let rows = Array.isArray(list) ? list.map(mapVolunteer) : []
    if (!status) rows = rows.filter((row) => row.status === 'normal' || row.status === 'banned')
    volunteers.value = rows
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : rows.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
    selection.value = []
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取义工名单失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadVolunteers()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadVolunteers()
}

function changePage(page) {
  currentPage.value = page
  loadVolunteers()
}

onMounted(loadVolunteers)

const detailVisible = ref(false)
const currentVolunteer = ref(null)

function openDetail(volunteer) {
  currentVolunteer.value = volunteer
  detailVisible.value = true
}

// 新增义工弹窗：formRef 用于调用 Element Plus 的表单校验。
const addVisible = ref(false)
const formRef = ref()
const addForm = reactive({
  name: '',
  phone: '',
  post: '',
  availableTime: '均可',
  declaration: '',
})
const addRules = {
  name: [{ required: true, message: '请输入善信姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的 11 位手机号', trigger: 'blur' },
  ],
  post: [{ required: true, message: '请选择申请岗位', trigger: 'change' }],
}

function openAdd() {
  addForm.name = ''
  addForm.phone = ''
  addForm.post = ''
  addForm.availableTime = '均可'
  addForm.declaration = ''
  addVisible.value = true
}

// 保存并录入：调用新增义工接口，直接以正常状态入册（本页语义就是已通过审核的义工），后台添加 type=2。
async function submitAdd() {
  if (saving.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  saving.value = true
  try {
    await saveVolunteer({
      username: addForm.name.trim(),
      phone: addForm.phone.trim(),
      applyPost: addForm.post,
      serviceTime: addForm.availableTime,
      remark: addForm.declaration.trim(),
      status: statusValue.normal,
      type: 2,
    })
    addVisible.value = false
    ElMessage.success('义工信息已录入')
    currentPage.value = 1
    await loadVolunteers()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '义工录入失败')
  } finally {
    saving.value = false
  }
}

// 禁止参加：填写原因后置为 status=4；恢复参加：置回 status=2 并清空原因。
async function toggleBan(volunteer) {
  const banning = volunteer.status === 'normal'
  try {
    if (banning) {
      const { value } = await ElMessageBox.prompt(
        `确定禁止义工 ${volunteer.name} 参加活动吗？禁止后将无法报名道会。`,
        '禁止参加',
        {
          confirmButtonText: '确定禁止',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入禁止参加的原因',
          inputPattern: /\S+/,
          inputErrorMessage: '禁止原因不能为空',
          type: 'warning',
        },
      )
      togglingId.value = volunteer.id
      await updateVolunteer({ id: volunteer.id, status: statusValue.banned, banReason: (value || '').trim() })
      ElMessage.success(`已禁止 ${volunteer.name} 参加活动`)
    } else {
      await ElMessageBox.confirm(
        `确定恢复义工 ${volunteer.name} 参加活动吗？恢复后可正常报名道会。`,
        '恢复参加',
        { confirmButtonText: '确定恢复', cancelButtonText: '取消', type: 'warning' },
      )
      togglingId.value = volunteer.id
      await updateVolunteer({ id: volunteer.id, status: statusValue.normal, banReason: '' })
      ElMessage.success(`已恢复 ${volunteer.name} 参加活动`)
    }
    await loadVolunteers()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    ElMessage.error(error.userMessage || error.message || `${banning ? '禁止' : '恢复'}操作失败`)
  } finally {
    togglingId.value = null
  }
}

// 导出名单：有勾选导勾选，否则导出当前页数据；加 BOM 防止 Excel 打开中文乱码。
function exportVolunteers() {
  const exportRows = selection.value.length ? selection.value : volunteers.value
  const headers = ['善信姓名', '联络手机', '申请岗位', '可服务时间', '加入类型', '加入时间', '状态', '禁止原因', '申请留言']
  const lines = exportRows.map((item) => [
    item.name,
    item.phone,
    item.post,
    item.availableTime,
    item.joinType,
    item.joinedAt,
    statusText[item.status],
    item.banReason || '—',
    item.declaration || '—',
  ])
  downloadCsv('义工名单.csv', headers, lines)
}
</script>

<template>
  <main class="volunteer-list-page">
    <header class="page-heading">
      <h1>义工列表</h1>
      <p>已通过审核的义工名单，可新增录入义工</p>
    </header>

    <VolunteerFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span><b>✓</b> 已选 {{ selection.length }} 项</span>
        <el-button class="add-button" :disabled="loading" @click="openAdd">+ 新增义工</el-button>
        <el-button class="export-button" :disabled="loading" @click="exportVolunteers">导出名单</el-button>
      </div>

      <VolunteerTable
        v-loading="loading"
        :volunteers="volunteers"
        :total="total"
        :current-page="currentPage"
        :toggling-id="togglingId"
        @selection-change="selection = $event"
        @detail="openDetail"
        @toggle-ban="toggleBan"
        @page-change="changePage"
      />
    </section>

    <el-dialog v-model="detailVisible" title="义工详情" width="560px">
      <el-descriptions v-if="currentVolunteer" class="detail-descriptions" :column="1" border size="small">
        <el-descriptions-item label="义工ID">{{ currentVolunteer.id }}</el-descriptions-item>
        <el-descriptions-item label="善信姓名">{{ currentVolunteer.name }}</el-descriptions-item>
        <el-descriptions-item label="联络手机">{{ currentVolunteer.phone }}</el-descriptions-item>
        <el-descriptions-item label="申请岗位">{{ currentVolunteer.post }}</el-descriptions-item>
        <el-descriptions-item label="可服务时间">{{ currentVolunteer.availableTime }}</el-descriptions-item>
        <el-descriptions-item label="加入类型">{{ currentVolunteer.joinType }}</el-descriptions-item>
        <el-descriptions-item label="加入时间">{{ currentVolunteer.joinedAt }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ statusText[currentVolunteer.status] }}<template v-if="currentVolunteer.banReason">（{{ currentVolunteer.banReason }}）</template></el-descriptions-item>
        <el-descriptions-item label="申请留言">{{ currentVolunteer.declaration || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="addVisible" title="新增义工" width="520px">
      <el-form ref="formRef" class="add-form" :model="addForm" :rules="addRules" label-position="top">
        <el-form-item label="善信姓名" prop="name">
          <el-input v-model="addForm.name" placeholder="请输入善信姓名" maxlength="20" />
        </el-form-item>
        <el-form-item label="联络手机" prop="phone">
          <el-input v-model="addForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="申请岗位" prop="post">
          <el-select v-model="addForm.post" placeholder="请选择岗位">
            <el-option v-for="post in postOptions" :key="post" :label="post" :value="post" />
          </el-select>
        </el-form-item>
        <el-form-item label="可服务时间">
          <el-select v-model="addForm.availableTime">
            <el-option v-for="time in availableTimeOptions" :key="time" :label="time" :value="time" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请留言（选填）">
          <el-input
            v-model="addForm.declaration"
            type="textarea"
            :rows="4"
            maxlength="100"
            show-word-limit
            placeholder="请填写申请留言"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button class="save-button" :disabled="saving" @click="submitAdd">保存并录入</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.volunteer-list-page {
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
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  span {
    color: var(--admin-text-secondary);
    font-size: 13px;
  }

  b {
    color: var(--admin-primary);
    font-weight: 500;
  }

  .el-button {
    height: 29px;
    margin: 0;
    padding: 0 12px;
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary);
    border-radius: var(--admin-radius-sm);
  }

  .add-button {
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}

.add-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-select) {
    width: 100%;
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
