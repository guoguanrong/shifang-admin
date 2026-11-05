import { ref } from 'vue'
import { defineStore } from 'pinia'

// 已打开标签缓存在 sessionStorage：刷新页面可恢复，关闭浏览器即清空。
const STORAGE_KEY = 'shifang-admin-opened-tabs'
// 首页标签常驻且不可关闭。
const HOME_TAB = Object.freeze({
  name: 'Dashboard',
  title: '首页',
  path: '/dashboard',
  cacheName: 'DashboardView',
  closable: false,
})

// 恢复缓存标签：剔除结构不完整的脏数据，并排除首页（首页由 HOME_TAB 统一提供）。
function getStoredTabs() {
  try {
    const storedTabs = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    if (!Array.isArray(storedTabs)) return []

    return storedTabs.filter((tab) => (
      tab?.name
      && tab?.title
      && tab?.path
      && tab.name !== HOME_TAB.name
    ))
  } catch {
    return []
  }
}

export const useTabsStore = defineStore('tabs', () => {
  const openedTabs = ref([{ ...HOME_TAB }, ...getStoredTabs()])
  const activeName = ref(HOME_TAB.name)

  // 只持久化可关闭的标签，首页每次进入都重新生成。
  function saveTabs() {
    const closableTabs = openedTabs.value.filter((tab) => tab.closable)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(closableTabs))
  }

  /**
   * 记录路由到标签页；已存在则更新（如路径带不同查询参数）。
   * @returns {void} 登录页等公共路由、匿名路由与布局路由不生成标签。
   */
  function openTab(route) {
    if (route.meta.public || !route.name || route.name === 'AdminLayout') return

    const routeName = String(route.name)
    const tab = {
      name: routeName,
      title: route.meta.title || routeName,
      path: route.fullPath,
      cacheName: route.meta.cacheName || '',
      closable: routeName !== HOME_TAB.name,
    }
    const existingTab = openedTabs.value.find((item) => item.name === routeName)

    if (existingTab) Object.assign(existingTab, tab)
    else openedTabs.value.push(tab)

    activeName.value = routeName
    saveTabs()
  }

  /**
   * 关闭标签。
   * @returns {string|null} 关闭的是当前页时返回需要跳转的路径，否则返回 null。
   */
  function closeTab(routeName) {
    const index = openedTabs.value.findIndex((tab) => tab.name === routeName)
    if (index < 0 || !openedTabs.value[index].closable) return null

    const wasActive = activeName.value === routeName
    openedTabs.value.splice(index, 1)
    saveTabs()

    if (!wasActive) return null

    // 优先激活右侧相邻标签；关闭的是最后一个则退回前一个，列表为空时回到首页。
    const targetTab = openedTabs.value[Math.min(index, openedTabs.value.length - 1)] || HOME_TAB
    activeName.value = targetTab.name
    return targetTab.path
  }

  // 关闭当前标签左侧的所有可关闭标签，首页始终保留。
  function closeTabsToLeft(routeName = activeName.value) {
    const activeIndex = openedTabs.value.findIndex((tab) => tab.name === routeName)
    if (activeIndex <= 0) return

    openedTabs.value = openedTabs.value.filter((tab, index) => (
      !tab.closable || index >= activeIndex
    ))
    saveTabs()
  }

  // 关闭当前标签右侧的所有可关闭标签。
  function closeTabsToRight(routeName = activeName.value) {
    const activeIndex = openedTabs.value.findIndex((tab) => tab.name === routeName)
    if (activeIndex < 0) return

    openedTabs.value = openedTabs.value.filter((tab, index) => (
      !tab.closable || index <= activeIndex
    ))
    saveTabs()
  }

  // 只保留首页和当前标签。
  function closeOtherTabs(routeName = activeName.value) {
    openedTabs.value = openedTabs.value.filter((tab) => (
      !tab.closable || tab.name === routeName
    ))
    saveTabs()
  }

  // 关闭全部可关闭标签；当前页不是首页时通知调用方跳转首页。
  function closeAllTabs() {
    const shouldGoHome = activeName.value !== HOME_TAB.name
    resetTabs()
    return shouldGoHome ? HOME_TAB.path : null
  }

  function resetTabs() {
    openedTabs.value = [{ ...HOME_TAB }]
    activeName.value = HOME_TAB.name
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return {
    openedTabs,
    activeName,
    openTab,
    closeTab,
    closeTabsToLeft,
    closeTabsToRight,
    closeOtherTabs,
    closeAllTabs,
    resetTabs,
  }
})
