<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import CloudCameraFilterBar from '../components/fund/CloudCameraFilterBar.vue'
import CloudCameraTable from '../components/fund/CloudCameraTable.vue'
import { getInitialData } from '../services/dataSource'
import { createCloudCameraFilters } from '../constants/listFilters'

// 复制一份 mock 数据，新增/编辑只作用于内存副本。
const cameras = ref(getInitialData('cloudCameras'))
const filters = ref(createCloudCameraFilters())
const currentPage = ref(1)

const PAGE_SIZE = 10

// 前端筛选：编号模糊匹配，位置/在线状态精确匹配。
const filteredCameras = computed(() => {
  const { code, location, online } = filters.value
  return cameras.value.filter((item) => (
    (!code || item.code.toLowerCase().includes(code.toLowerCase()))
    && (!location || item.location === location)
    && (!online || (online === 'on') === item.online)
  ))
})

// 客户端分页：每页固定 10 条，切换筛选条件时由 search/reset 重置回第 1 页。
const pagedCameras = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredCameras.value.slice(start, start + PAGE_SIZE)
})

function search(form) {
  filters.value = form
  currentPage.value = 1
  ElMessage.success(`查询完成，共找到 ${filteredCameras.value.length} 台摄像头`)
}

function reset(form) {
  filters.value = form
  currentPage.value = 1
}

function changePage(page) {
  currentPage.value = page
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
// 物联网配置三态：待配置（去配置按钮）→ 配置中（SN 输入 + 确认配置按钮）→ 已配置。
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  code: '',
  location: '',
})
const configStatus = ref('pending')
const configuring = ref(false)
const sn = ref('')

function openAdd() {
  editingId.value = null
  form.code = ''
  form.location = ''
  configStatus.value = 'pending'
  configuring.value = false
  sn.value = ''
  dialogVisible.value = true
}

function openEdit(camera) {
  editingId.value = camera.id
  form.code = camera.code
  form.location = camera.location
  configStatus.value = camera.configStatus
  configuring.value = false
  sn.value = camera.sn
  dialogVisible.value = true
}

// 去配置：展开设备序列号输入框。
function startConfig() {
  configuring.value = true
}

// 确认配置：SN 必填，通过后置为已配置。
function confirmConfig() {
  if (!sn.value.trim()) {
    ElMessage.warning('请输入摄像头设备序列号(SN)')
    return
  }
  configStatus.value = 'configured'
  configuring.value = false
  ElMessage.success('摄像头配置成功')
}

// 提交：校验通过后新增（置顶）或更新摄像头。
function submitCamera() {
  if (!form.code.trim()) {
    ElMessage.warning('请输入摄像头编号')
    return
  }
  if (!form.location.trim()) {
    ElMessage.warning('请输入摄像头位置')
    return
  }

  const payload = {
    code: form.code.trim(),
    location: form.location.trim(),
    configStatus: configStatus.value,
    sn: configStatus.value === 'configured' ? sn.value.trim() : '',
  }

  if (editingId.value) {
    const target = cameras.value.find((item) => item.id === editingId.value)
    Object.assign(target, payload)
    ElMessage.success('摄像头已更新')
  } else {
    cameras.value.unshift({
      id: payload.code,
      ...payload,
      online: false,
    })
    ElMessage.success('摄像头已新增')
  }

  dialogVisible.value = false
}
</script>

<template>
  <main class="camera-list-page">
    <header class="page-heading">
      <h1>云监工</h1>
      <p>前台"资金公示-云监工"的摄像头管理 · 新增/编辑摄像头,物联网云直播实时对现场画面直播监测</p>
    </header>

    <CloudCameraFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <el-button class="add-button" @click="openAdd">+ 新增摄像头</el-button>
      </div>

      <CloudCameraTable
        :cameras="pagedCameras"
        :total="filteredCameras.length"
        :current-page="currentPage"
        @edit="openEdit"
        @page-change="changePage"
      />
    </section>

    <el-dialog v-model="dialogVisible" title="新增/编辑" width="560px">
      <el-form class="camera-form" label-position="top" @submit.prevent>
        <div class="form-row">
          <el-form-item label="摄像头编号" required>
            <el-input v-model="form.code" placeholder="如:CAM-01" maxlength="20" />
          </el-form-item>
          <el-form-item label="摄像头位置" required>
            <el-input v-model="form.location" placeholder="如:斗姆元君大殿 · 正门" maxlength="30" />
          </el-form-item>
        </div>

        <el-form-item label="物联网配置">
          <div class="iot-box">
            <div class="iot-head">
              <span class="iot-status">配置状态:
                <span :class="['soft-tag', configStatus]">{{ configStatus === 'configured' ? '已配置' : '待配置' }}</span>
              </span>
              <el-button
                v-if="configStatus !== 'configured'"
                class="config-button"
                @click="configuring ? confirmConfig() : startConfig()"
              >{{ configuring ? '确认配置' : '去配置' }}</el-button>
            </div>
            <el-input
              v-if="configuring"
              v-model="sn"
              class="sn-input"
              placeholder="输入摄像头设备序列号(SN)"
              maxlength="50"
            />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button class="save-button" @click="submitCamera">提交</el-button>
      </template>
    </el-dialog>
  </main>
</template>

<style scoped lang="less">
.camera-list-page {
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

.camera-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.iot-box {
  width: 100%;
  padding: 14px 16px;
  background: var(--admin-warning-light);
  border: 1px dashed var(--admin-primary-light-5);
  border-radius: var(--admin-radius-md);
}

.iot-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  .iot-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--admin-text-regular);
    font-size: 13px;
  }
}

.config-button {
  height: 26px;
  margin: 0;
  padding: 0 14px;
  color: var(--admin-text-inverse);
  background: var(--admin-warning);
  border-color: var(--admin-warning);
  border-radius: var(--admin-radius-sm);

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-warning);
    border-color: var(--admin-warning);
    opacity: 0.85;
  }
}

.sn-input {
  margin-top: 12px;
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

  &.configured { color: var(--admin-success); background: var(--admin-success-light); }
  &.pending { color: var(--admin-warning); background: var(--admin-warning-light); }
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
