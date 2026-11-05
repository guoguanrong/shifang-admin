<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ActivityFilterBar from '../components/activity/ActivityFilterBar.vue'
import ActivityTable from '../components/activity/ActivityTable.vue'
import ActivityFormDialog from '../components/activity/ActivityFormDialog.vue'
import { createActivityFilters } from '../constants/listFilters'
import { deleteActivityById, getActivityList, saveActivity, updateActivity } from '../services/businessApi'
import { activityListedValue, activityStatusValue, activityTypeValue, buildActivityPayload, mapActivity } from '../utils/activityDisplay'

const PAGE_SIZE = 10

const activities = ref([])
const filters = ref(createActivityFilters())
const currentPage = ref(1)
const total = ref(0)
const loading = ref(false)
const saving = ref(false)

function getList(payload) {
  const result = payload?.data ?? payload
  if (Array.isArray(result)) return result
  return result?.list || result?.records || []
}

// 拉取道会列表：标题模糊、道会类型/报名状态/上架状态与道会时间区间均由服务端筛选。
async function loadActivities() {
  loading.value = true
  const { title, type, status, listed, startDate, endDate } = filters.value
  const params = {
    page: currentPage.value,
    pageSize: PAGE_SIZE,
    title: title.trim() || undefined,
    activityType: type ? activityTypeValue[type] : undefined,
    status: status ? activityStatusValue[status] : undefined,
    type: listed ? activityListedValue[listed] : undefined,
    startTime: startDate ? `${startDate} 00:00:00` : undefined,
    endTime: endDate ? `${endDate} 23:59:59` : undefined,
  }

  try {
    const payload = await getActivityList(params)
    const result = payload?.data ?? payload
    activities.value = getList(payload).map(mapActivity)
    const responseTotal = Number(result?.totalRow)
    total.value = Number.isFinite(responseTotal) ? responseTotal : activities.value.length
    const responsePage = Number(result?.currentPage)
    if (Number.isFinite(responsePage) && responsePage > 0) currentPage.value = responsePage
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取道会列表失败')
  } finally {
    loading.value = false
  }
}

function search(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadActivities()
}

function reset(form) {
  filters.value = { ...form }
  currentPage.value = 1
  loadActivities()
}

function changePage(page) {
  currentPage.value = page
  loadActivities()
}

onMounted(loadActivities)

// 上架 / 下架：接口修改只提交 id 与上架状态（type 1/2），上架仍保留原型提示文案。
async function toggleStatus(activity) {
  const listing = !activity.listed
  try {
    if (listing) {
      await ElMessageBox.confirm(
        `<p style="margin:0 0 6px">确定上架该活动吗?</p>`
          + `<p style="margin:0;color:var(--admin-warning);font-size:12px">上架后前台将展示该活动,用户可报名参加。</p>`,
        '操作确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          dangerouslyUseHTMLString: true,
        },
      )
    } else {
      await ElMessageBox.confirm('确定下架该活动吗?', '操作确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
    }
  } catch {
    return
  }

  try {
    await updateActivity({
      id: activity.id,
      type: listing ? activityListedValue.on : activityListedValue.off,
    })
    ElMessage.success(listing ? '活动已上架' : '活动已下架')
    await loadActivities()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '更新上架状态失败')
  }
}

// 删除：仅暂不上架的活动开放（操作列已控制），删除时二次确认。
async function removeActivity(activity) {
  try {
    await ElMessageBox.confirm(
      `<p style="margin:0 0 6px">确定删除该活动吗?</p>`
        + `<p style="margin:0;color:var(--admin-danger);font-size:12px">删除后不可恢复，请谨慎操作。</p>`,
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
    await deleteActivityById(activity.id)
    ElMessage.success('活动已删除')
    await loadActivities()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '删除活动失败')
  }
}

// 新增/编辑弹窗（原型中新增与编辑共用同一表单）。
const dialogVisible = ref(false)
const editingId = ref(null)
const currentActivity = ref(null)

function openAdd() {
  editingId.value = null
  currentActivity.value = null
  dialogVisible.value = true
}

function openEdit(activity) {
  editingId.value = activity.id
  currentActivity.value = activity
  dialogVisible.value = true
}

// 弹窗保存：页面模型转成接口入参后提交（新增 /activity/save，编辑 /activity/update），
// 成功后刷新列表；报名状态与上架状态均由弹窗带入。
async function handleSave(payload) {
  if (saving.value) return
  saving.value = true
  const isEdit = Boolean(editingId.value)
  const body = buildActivityPayload(payload)

  try {
    if (isEdit) await updateActivity({ id: editingId.value, ...body })
    else await saveActivity(body)
    ElMessage.success(isEdit ? '道会已更新' : '道会已发布')
    currentPage.value = 1
    await loadActivities()
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '保存道会失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="activity-list-page">
    <header class="page-heading">
      <h1>道会列表</h1>
      <p>前台"道会活动"的日程管理 · 创建/发布/下架，发布后前台"道会日程"同步展示</p>
    </header>

    <ActivityFilterBar @search="search" @reset="reset" />

    <section class="table-card">
      <div class="table-toolbar">
        <span class="calendar-tip">定期活动发布后自动同步"活动日历"日常展示</span>
        <el-button class="add-button" :disabled="loading" @click="openAdd">+ 新增活动</el-button>
      </div>

      <ActivityTable
        v-loading="loading"
        :activities="activities"
        :total="total"
        :current-page="currentPage"
        @edit="openEdit"
        @toggle="toggleStatus"
        @remove="removeActivity"
        @page-change="changePage"
      />
    </section>

    <ActivityFormDialog
      v-model="dialogVisible"
      :activity="currentActivity"
      @save="handleSave"
    />
  </main>
</template>

<style scoped lang="less">
.activity-list-page {
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
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid var(--admin-border-light);

  .calendar-tip {
    padding: 3px 10px;
    color: var(--admin-warning);
    background: var(--admin-warning-light);
    font-size: 12px;
    border-radius: var(--admin-radius-sm);
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
</style>
