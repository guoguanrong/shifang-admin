<script setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useTabsStore } from '../../stores/tabs'
import { logout as logoutApi } from '../../services/authApi'
import AppSidebar from './AppSidebar.vue'

const authStore = useAuthStore()
const tabsStore = useTabsStore()
const route = useRoute()
const router = useRouter()
const { openedTabs } = storeToRefs(tabsStore)
const SIDEBAR_STORAGE_KEY = 'shifang-admin-sidebar-collapsed'
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true')
// 面包屑取当前路由 meta：分组名 / 页面名。
const activeTitle = computed(() => route.meta.title || '首页')
const groupTitle = computed(() => route.meta.groupTitle || '总览')
const activeTabIndex = computed(() => (
  openedTabs.value.findIndex((tab) => tab.name === route.name)
))
const canCloseCurrent = computed(() => (
  openedTabs.value[activeTabIndex.value]?.closable === true
))
const canCloseLeft = computed(() => (
  openedTabs.value.slice(0, activeTabIndex.value).some((tab) => tab.closable)
))
const canCloseRight = computed(() => (
  openedTabs.value.slice(activeTabIndex.value + 1).some((tab) => tab.closable)
))
const canCloseOthers = computed(() => (
  openedTabs.value.some((tab) => tab.closable && tab.name !== route.name)
))
const canCloseAll = computed(() => openedTabs.value.some((tab) => tab.closable))
const cachedViewNames = computed(() => (
  [...new Set(openedTabs.value.map((tab) => tab.cacheName).filter(Boolean))]
))

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed.value))
}

// 路由变化即同步页签（含首次进入），页签列表由 tabs store 负责持久化。
watch(
  () => route.fullPath,
  () => tabsStore.openTab(route),
  { immediate: true },
)

// 关闭页签：store 返回需要跳转的路径时再跳转，避免关闭非当前页时产生多余导航。
async function closeTab(tab) {
  const targetPath = tabsStore.closeTab(tab.name)
  if (targetPath) await router.push(targetPath)
}

// 标签栏右侧批量操作菜单。
async function handleTabCommand(command) {
  let targetPath = null

  if (command === 'current') targetPath = tabsStore.closeTab(String(route.name))
  if (command === 'left') tabsStore.closeTabsToLeft(String(route.name))
  if (command === 'right') tabsStore.closeTabsToRight(String(route.name))
  if (command === 'others') tabsStore.closeOtherTabs(String(route.name))
  if (command === 'all') targetPath = tabsStore.closeAllTabs()

  if (targetPath && targetPath !== route.fullPath) await router.push(targetPath)
}

// 退出登录：先让服务端 token 失效（失败不阻塞），再清会话 → 清页签 → 回登录页。
async function logout() {
  try {
    await logoutApi()
  } catch {
    // 服务端注销失败（如网络异常）时仍继续本地登出。
  }
  authStore.logout()
  tabsStore.resetTabs()
  await router.replace('/login')
}
</script>

<template>
  <div :class="['admin-shell', { 'sidebar-collapsed': sidebarCollapsed }]">
    <AppSidebar :collapsed="sidebarCollapsed" />

    <section class="admin-main">
      <header class="topbar">
        <div class="header-left">
          <button
            type="button"
            class="collapse-button"
            :aria-label="sidebarCollapsed ? '展开菜单' : '折叠菜单'"
            :aria-expanded="!sidebarCollapsed"
            :title="sidebarCollapsed ? '展开菜单' : '折叠菜单'"
            @click="toggleSidebar"
          >☰</button>
          <div class="breadcrumb"><span>⌂&nbsp; {{ groupTitle }}</span><i>›</i><strong>{{ activeTitle }}</strong></div>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <button type="button" class="user-entry">
              <span>{{ authStore.userName }}</span>
              <span class="user-seal">十</span>
            </button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="page-tabs">
        <div class="tabs-scroll">
          <RouterLink
            v-for="tab in openedTabs"
            :key="tab.name"
            :to="tab.path"
            :class="['page-tab', { active: route.name === tab.name }]"
          >
            <b>{{ tab.closable ? '▦' : '⌂' }}</b>
            <span>{{ tab.title }}</span>
            <i
              v-if="tab.closable"
              role="button"
              tabindex="0"
              :aria-label="`关闭${tab.title}`"
              @click.prevent.stop="closeTab(tab)"
              @keydown.enter.prevent.stop="closeTab(tab)"
            >×</i>
          </RouterLink>
        </div>

        <el-dropdown
          class="tabs-actions"
          trigger="click"
          placement="bottom-end"
          popper-class="tabs-action-dropdown"
          @command="handleTabCommand"
        >
          <button type="button" class="tabs-more" aria-label="标签操作">
            <span class="tabs-chevron" />
          </button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="current" :disabled="!canCloseCurrent">
                <span class="tab-action-icon">⊖</span>关闭当前
              </el-dropdown-item>
              <el-dropdown-item command="left" :disabled="!canCloseLeft">
                <span class="tab-action-icon">≪</span>关闭左侧
              </el-dropdown-item>
              <el-dropdown-item command="right" :disabled="!canCloseRight">
                <span class="tab-action-icon">≫</span>关闭右侧
              </el-dropdown-item>
              <el-dropdown-item command="others" :disabled="!canCloseOthers" divided>
                <span class="tab-action-icon">⊗</span>关闭其他
              </el-dropdown-item>
              <el-dropdown-item command="all" :disabled="!canCloseAll">
                <span class="tab-action-icon">▣</span>关闭所有
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- 二级路由出口：业务页面在此渲染。
           KeepAlive 缓存已打开页面（配合页签保持滚动位置与表单状态），
           以 fullPath 作为 key，保证同页面不同查询参数会独立缓存。
           不叠加 out-in 过渡，避免缓存页面离场后路由出口停留在空占位节点。 -->
      <RouterView v-slot="{ Component, route: childRoute }">
        <KeepAlive :include="cachedViewNames">
          <component :is="Component" :key="childRoute.fullPath" />
        </KeepAlive>
      </RouterView>
    </section>
  </div>
</template>

<style scoped lang="less">
.admin-shell {
  min-width: 1180px;
  min-height: 100vh;
}

.admin-main {
  min-height: 100vh;
  margin-left: var(--admin-sidebar-width);
  background: var(--admin-page-bg);
  transition: margin-left 0.2s ease;
}

.sidebar-collapsed .admin-main {
  margin-left: 64px;
}

.topbar {
  /* 页面滚动时顶栏固定；层级低于侧栏（z-index 20），横向滚动时仍被侧栏遮住。 */
  position: sticky;
  z-index: 15;
  top: 0;
  height: var(--admin-topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 15px;
  background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border-light);
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left { gap: 17px; }
.header-right { gap: 8px; }

.collapse-button,
.utility-button {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  padding: 0;
  color: var(--admin-text-regular);
  font-size: 18px;
  background: transparent;
  border: 0;
  border-radius: var(--admin-radius-md);
  cursor: pointer;

  &:hover { color: var(--admin-primary); background: var(--admin-primary-lighter); }
}

.notification {
  position: relative;

  b {
    position: absolute;
    top: -2px;
    right: -2px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    color: var(--admin-text-inverse);
    font-size: 10px;
    line-height: 18px;
    background: var(--admin-danger);
    border-radius: var(--admin-radius-pill);
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;
  color: var(--admin-text-secondary);
  font-size: 14px;

  strong {
    color: var(--admin-text-primary);
    font-weight: 600;
  }

  i { color: var(--admin-text-muted); font-size: 20px; font-style: normal; }
}

.user-entry {
  display: flex;
  align-items: center;
  gap: 11px;
  color: var(--admin-text-primary);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.user-seal {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  color: var(--admin-text-inverse);
  font-weight: 700;
  background: var(--admin-avatar-gradient);
  border-radius: 50%;
}

.page-tabs {
  /* 页签栏紧随顶栏固定，top 取顶栏高度，两者叠加后始终吸顶。 */
  position: sticky;
  z-index: 14;
  top: var(--admin-topbar-height);
  height: var(--admin-tabbar-height);
  display: flex;
  overflow: hidden;
  color: var(--admin-text-secondary);
  font-size: 13px;
  background: var(--admin-surface);
  border-bottom: 1px solid var(--admin-border-light);
}

.tabs-scroll {
  min-width: 0;
  height: 100%;
  display: flex;
  flex: 1;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--admin-border-strong) transparent;
}

.tabs-actions {
  height: 100%;
  flex: 0 0 46px;
}

.tabs-more {
  width: 46px;
  height: 100%;
  display: grid;
  padding: 0;
  place-items: center;
  background: var(--admin-surface);
  border: 0;
  border-left: 1px solid var(--admin-border-light);
  cursor: pointer;

  &:hover {
    background: var(--admin-primary-lighter);
  }
}

.tabs-chevron {
  width: 10px;
  height: 10px;
  border-right: 2px solid var(--admin-text-regular);
  border-bottom: 2px solid var(--admin-text-regular);
  transform: translateY(-3px) rotate(45deg);
}

:global(.tabs-action-dropdown .el-dropdown-menu) {
  min-width: 124px;
  padding: 6px 0;
}

:global(.tabs-action-dropdown .el-dropdown-menu__item) {
  height: 34px;
  gap: 7px;
  padding: 0 15px;
  color: var(--admin-text-regular);
  font-size: 13px;
}

:global(.tabs-action-dropdown .el-dropdown-menu__item:not(.is-disabled):hover) {
  color: var(--admin-primary);
  background: var(--admin-primary-lighter);
}

.tab-action-icon {
  width: 15px;
  display: inline-flex;
  justify-content: center;
  color: currentColor;
  font-size: 14px;
}

.page-tab {
  position: relative;
  height: var(--admin-tabbar-height);
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  color: var(--admin-text-secondary);
  text-decoration: none;
  white-space: nowrap;
  background: var(--admin-surface);
  border-right: 1px solid var(--admin-border-light);
  transition: color 0.18s ease, background 0.18s ease;

  &:hover {
    color: var(--admin-primary);
    background: var(--admin-primary-lighter);
  }

  &.active {
    color: var(--admin-primary);
    font-weight: 600;
    background: var(--admin-primary-lighter);

    &::after {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 2px;
      content: '';
      background: var(--admin-primary);
    }
  }

  b {
    font-weight: 400;
  }

  i {
    width: 18px;
    height: 18px;
    display: grid;
    margin-left: 3px;
    place-items: center;
    color: var(--admin-text-muted);
    font-size: 15px;
    font-style: normal;
    font-weight: 400;
    border-radius: 50%;

    &:hover {
      color: var(--admin-danger);
      background: var(--admin-danger-light);
    }
  }
}

.topbar {
  padding-right: 26px;
  border-bottom-color: var(--admin-border-light);
  box-shadow: 0 2px 12px rgba(38, 68, 75, 0.025);
}

.collapse-button { border-radius: 8px; }

.user-entry {
  padding: 4px 5px 4px 12px;
  border: 1px solid transparent;
  border-radius: 25px;
  transition: background 0.18s ease, border-color 0.18s ease;

  &:hover {
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary-light-8);
  }
}

.page-tabs { background: #fbfcfd; }

.page-tab {
  margin: 4px 2px 0;
  height: calc(var(--admin-tabbar-height) - 4px);
  padding: 0 13px;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: 0;
  border-radius: 8px 8px 0 0;

  &.active {
    background: var(--admin-surface);
    border-color: var(--admin-border-light);

    &::after { height: 2px; }
  }
}
</style>
