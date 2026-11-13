<script setup>
import { useSubmitGuard } from '../utils/submitGuard'
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { saving: loading, allowSubmit, endSubmit } = useSubmitGuard()
const form = reactive({
  username: '',
  password: '',
  remember: true,
})

/**
 * 提交登录：成功后优先回跳守卫记录的 redirect，没有则进后台首页。
 */
async function submitLogin() {
  if (!form.username.trim() || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  if (!allowSubmit()) return
  loading.value = true
  try {
    await authStore.login({ ...form, username: form.username.trim() })
    ElMessage.success('登录成功')
    // 只信任字符串类型的 redirect，避免数组或对象形式的查询参数造成跳转异常。
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    endSubmit()
  }
}

// 重置：清空账号密码并取消「记住账号」。
function resetLogin() {
  form.username = ''
  form.password = ''
  form.remember = false
}
</script>

<template>
  <main class="login-page">
    <div class="login-orb orb-green" />
    <div class="login-orb orb-blue" />
    <div class="login-panel">
      <section class="login-visual" aria-hidden="true">
        <div class="visual-circle" />
        <svg class="dashboard-illustration" viewBox="0 0 720 520" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="160" y="78" width="408" height="300" rx="14" fill="#EEF5FF" stroke="#27477C" stroke-width="15" />
          <rect x="224" y="135" width="128" height="76" rx="10" fill="white" />
          <circle cx="254" cy="173" r="18" stroke="#FFD34D" stroke-width="10" />
          <path d="M292 158H335M292 176H335M292 194H323" stroke="#7768E5" stroke-width="10" />
          <rect x="390" y="128" width="108" height="70" rx="8" stroke="#BCD3F8" stroke-width="4" stroke-dasharray="12 10" />
          <rect x="375" y="225" width="124" height="102" rx="12" fill="white" />
          <circle cx="437" cy="269" r="31" stroke="#6C5DD3" stroke-width="8" />
          <path d="M420 308H454" stroke="#6C5DD3" stroke-width="8" stroke-linecap="round" />
          <circle cx="547" cy="92" r="31" fill="#D9F8E8" stroke="#A6EDC7" stroke-width="8" />
          <path d="M533 91L543 101L561 82" stroke="#43C68B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
          <g>
            <circle cx="164" cy="318" r="31" fill="#FFB775" />
            <path d="M134 309C138 272 183 271 194 303L187 320H140L134 309Z" fill="#102D61" />
            <path d="M127 351C132 330 151 321 167 321C188 321 205 336 210 365L194 433H124L127 351Z" fill="#3E8FEF" />
            <path d="M124 430L150 429L140 499H112L124 430ZM176 430L198 429L218 499H190L176 430Z" fill="#15346A" />
            <rect x="68" y="354" width="94" height="54" rx="8" fill="#756DE4" />
            <path d="M112 350L122 365M189 343L216 374" stroke="#FFB775" stroke-width="16" stroke-linecap="round" />
          </g>
          <g>
            <circle cx="365" cy="278" r="29" fill="#FFB775" />
            <path d="M333 276C338 242 379 237 393 270L389 288H338L333 276Z" fill="#102D61" />
            <path d="M332 310C343 294 378 293 388 314L407 398H320L332 310Z" fill="#2F9C8F" />
            <path d="M344 397L367 397L361 498H333L344 397ZM377 397H400L424 498H396L377 397Z" fill="#173A70" />
            <path d="M379 315L403 281V216" stroke="#FFB775" stroke-width="14" stroke-linecap="round" />
          </g>
          <path d="M106 274L54 247L128 224L106 274Z" fill="#75DDB4" />
          <path d="M104 273L128 224L83 253" stroke="#4FC895" stroke-width="5" />
          <path d="M552 385C580 353 584 320 571 286M571 348C596 342 606 328 607 310M571 323C550 316 544 302 546 284" stroke="#DCEBFF" stroke-width="8" stroke-linecap="round" />
        </svg>
        <div class="visual-copy">
          <strong>简洁 · 高效 · 清晰</strong>
          <span>统一管理十方殿平台内容与用户数据</span>
        </div>
      </section>

      <section class="login-card" aria-labelledby="login-title">
        <div class="login-brand">
          <span class="brand-mark" aria-hidden="true">十</span>
          <h1 id="login-title">十方殿管理端</h1>
        </div>
        <p class="login-subtitle">欢迎回来，请登录您的管理账号</p>

        <el-form class="login-form" :model="form" @submit.prevent="submitLogin">
          <el-form-item>
            <el-input v-model="form.username" size="large" placeholder="请输入账号" autocomplete="username" @keyup.enter="submitLogin">
              <template #prefix><span class="input-icon">♙</span></template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="form.password" type="password" size="large" placeholder="请输入密码" autocomplete="current-password" show-password @keyup.enter="submitLogin">
              <template #prefix><span class="input-icon">▢</span></template>
            </el-input>
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="form.remember">记住账号</el-checkbox>
            <button type="button" class="text-button" @click="ElMessage.info('请联系系统管理员重置密码')">忘记密码？</button>
          </div>

          <div class="login-actions">
            <el-button class="reset-button" @click="resetLogin">重置</el-button>
            <el-button class="login-button" native-type="submit" :loading="loading">登录</el-button>
          </div>
        </el-form>
      </section>
    </div>
  </main>
</template>

<style scoped lang="less">
.login-page {
  position: relative;
  min-height: 100vh;
  padding: 28px 34px;
  overflow: hidden;
  color: var(--admin-text-primary);
  background: radial-gradient(circle at 9% 12%, rgba(183, 224, 219, 0.45), transparent 34%),
    radial-gradient(circle at 92% 86%, rgba(210, 236, 233, 0.42), transparent 30%),
    var(--admin-login-bg);
}

.login-panel {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 56px);
  display: grid;
  grid-template-columns: minmax(520px, 1fr) 540px;
  align-items: center;
  gap: 64px;
  padding: 40px 8%;
  overflow: hidden;
  background: var(--admin-login-panel);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 22px;
  box-shadow: 0 20px 60px rgba(43, 53, 67, 0.07);
}

.login-orb {
  position: fixed;
  z-index: 0;
  border-radius: 50%;
  filter: blur(0.2px);
}

.orb-green {
  top: -115px;
  left: 10px;
  width: 500px;
  height: 500px;
  background: var(--admin-login-orb-green);
}

.orb-blue {
  top: -160px;
  right: 17%;
  width: 400px;
  height: 400px;
  background: var(--admin-login-orb-blue);
}

.login-visual {
  position: relative;
  width: min(720px, 100%);
  justify-self: center;
}

.visual-circle {
  position: absolute;
  top: 15%;
  left: 15%;
  width: 54%;
  aspect-ratio: 1;
  background: var(--admin-primary-light);
  border-radius: 50%;
}

.dashboard-illustration {
  position: relative;
  z-index: 1;
  display: block;
  width: 100%;
}

.visual-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin-top: -16px;

  strong {
    color: var(--admin-brand-deep);
    font-size: 19px;
    letter-spacing: 4px;
  }

  span {
    color: var(--admin-text-secondary);
    font-size: 13px;
  }
}

.login-card {
  width: 500px;
  padding: 50px 40px 42px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border-light);
  border-radius: 18px;
  box-shadow: 0 20px 50px rgba(43, 53, 67, 0.11);
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.brand-mark {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  color: var(--admin-text-inverse);
  font-size: 24px;
  font-weight: 700;
  background: var(--admin-brand-gradient);
  border-radius: var(--admin-radius-xl) var(--admin-radius-xl) var(--admin-radius-xl) var(--admin-radius-xs);
}

h1 {
  margin: 0;
  color: var(--admin-brand);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 1px;
}

.login-subtitle {
  margin: 13px 0 35px;
  color: var(--admin-text-placeholder);
  font-size: 13px;
  text-align: center;
}

.login-form {

  :deep(.el-form-item) {
    margin-bottom: 22px;
  }

  :deep(.el-input__wrapper) {
    height: 46px;
    padding: 0 14px;
    border-radius: 9px;
    box-shadow: 0 0 0 1px var(--admin-border-strong) inset;

    &.is-focus {
      box-shadow: 0 0 0 1px var(--admin-primary) inset, 0 0 0 3px var(--admin-focus-ring);
    }
  }
}

.input-icon {
  color: var(--admin-text-muted);
  font-size: 15px;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -8px;

  :deep(.el-checkbox__label) {
    padding-left: 6px;
    color: var(--admin-text-secondary);
    font-size: 12px;
  }
}

.text-button {
  padding: 0;
  color: var(--admin-primary);
  font-size: 12px;
  background: none;
  border: 0;
  cursor: pointer;
}

.login-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 30px;

  .el-button {
    width: 100%;
    height: 44px;
    margin: 0;
    border-radius: 9px;
  }
}

.reset-button {
  color: var(--admin-text-regular);
  border-color: var(--admin-border-strong);
}

.login-button {
  color: var(--admin-text-inverse);
  font-size: 15px;
  font-weight: 600;
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  box-shadow: 0 6px 16px rgba(47, 156, 143, 0.19);

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-primary-hover);
    border-color: var(--admin-primary-hover);
  }
}

@media (max-width: 1100px) {
  .login-panel {
    grid-template-columns: 1fr;
    padding-inline: 28px;
  }

  .login-visual {
    display: none;
  }

  .login-card {
    width: min(500px, 100%);
    justify-self: center;
  }
}

@media (max-width: 560px) {
  .login-page { padding: 14px; }
  .login-panel { min-height: calc(100vh - 28px); }
  .login-card { padding: 38px 24px; }
  .login-actions { gap: 14px; }
  h1 { font-size: 24px; }
}
</style>
