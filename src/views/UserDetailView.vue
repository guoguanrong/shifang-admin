<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getMemberById } from '../services/businessApi'
import { extractCity, formatCount, formatMoney, memberStatusValue } from '../utils/memberDisplay'

const route = useRoute()
const router = useRouter()

const member = ref(null)
const loading = ref(false)

const userId = computed(() => route.params.id)

// 详情页平铺展示：列表已展示的字段 + 用户ID/昵称/手机号/首次访问时间等档案信息。
const detailItems = computed(() => {
  const memberData = member.value
  if (!memberData) return []

  const text = (value) => (value === null || value === undefined || value === '' ? '—' : String(value))
  const money = (value) => (value === null || value === undefined ? '—' : formatMoney(value))
  const count = (value) => {
    const number = formatCount(value)
    return number === null ? '—' : number
  }

  return [
    { label: '用户ID', value: text(memberData.id) },
    { label: '用户昵称', value: text(memberData.nickname) },
    { label: '手机号', value: text(memberData.phone) },
    { label: '邮箱', value: text(memberData.email) },
    { label: '首次访问时间', value: text(memberData.firstVisitTime || memberData.createTime) },
    { label: '注册时间', value: text(memberData.registerTime) },
    { label: '城市', value: extractCity(memberData.registerAddress) },
    { label: '注册地址', value: text(memberData.registerAddress) },
    { label: '注册IP', value: text(memberData.registerIp) },
    { label: '游客ID', value: text(memberData.uvid) },
    { label: '来源渠道', value: text(memberData.source) },
    { label: 'APP版本', value: text(memberData.appVersion) },
    { label: '账号实名', value: memberData.realNameAuth === true ? '已实名' : '未实名' },
    { label: '捐款金额', value: money(memberData.totalDonate) },
    { label: '捐款次数', value: count(memberData.donateCount) },
    // 捐物次数：接口暂未返回该字段（捐款与捐物目前合并计入 donateCount）。
    { label: '捐物次数', value: count(memberData.donateItemCount) },
    { label: '共建十方次数', value: count(memberData.donateCount) },
    { label: '点灯次数', value: count(memberData.lightCount) },
    { label: '神像供奉次数', value: count(memberData.worshipCount) },
    { label: '点灯金额', value: money(memberData.totalLight) },
    { label: '供奉金额', value: money(memberData.totalWorship) },
    { label: '状态', value: Number(memberData.status) === memberStatusValue.normal ? '正常' : '冻结中' },
  ]
})

async function loadDetail() {
  loading.value = true
  try {
    const payload = await getMemberById(userId.value)
    member.value = payload?.data ?? payload
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '获取用户详情失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadDetail)

function goBack() {
  router.push('/users')
}
</script>

<template>
  <main class="user-detail-page">
    <header class="page-heading">
      <div>
        <h1>用户详情</h1>
        <p>用户 {{ userId }} 的注册信息与捐赠、点灯、供奉统计</p>
      </div>
      <el-button class="back-button" :disabled="loading" @click="goBack">返回用户列表</el-button>
    </header>

    <section class="detail-card">
      <p v-if="loading" class="loading-text">正在加载…</p>
      <el-descriptions v-else-if="member" :column="3" border size="small">
        <el-descriptions-item v-for="item in detailItems" :key="item.label" :label="item.label">
          {{ item.value }}
        </el-descriptions-item>
      </el-descriptions>

      <el-empty v-else-if="!loading" description="未获取到该用户的信息" />
    </section>
  </main>
</template>

<style scoped lang="less">
.user-detail-page {
  padding: 20px 14px 12px;
}

.page-heading {
  display: flex;
  align-items: flex-end;
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
    margin: 6px 0 0;
    color: var(--admin-text-placeholder);
    font-size: 13px;
  }
}

.back-button {
  height: 30px;
  margin: 0;
  padding: 0 14px;
  color: var(--admin-primary);
  background: var(--admin-primary-lighter);
  border-color: var(--admin-primary);
  border-radius: var(--admin-radius-sm);
}

.detail-card {
  padding: 18px 20px 22px;
  min-height: 160px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  box-shadow: var(--admin-shadow-card);

  .loading-text {
    margin: 40px 0;
    color: var(--admin-text-secondary);
    font-size: 13px;
    text-align: center;
  }

  :deep(.el-descriptions__label) {
    width: 120px;
    color: var(--admin-text-secondary);
    font-weight: 500;
  }

  :deep(.el-descriptions__content) {
    color: var(--admin-text-primary);
    word-break: break-all;
  }
}
</style>
