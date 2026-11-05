import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { staticMenuGroups } from '../mock/menus'

// 菜单配置中的 component 字段 → 页面组件的映射（懒加载）。
// 新增业务页面时在此登记，未登记或暂未实现的页面统一回退到 PlaceholderView。
const componentMap = {
  DashboardView: () => import('../views/DashboardView.vue'),
  UserListView: () => import('../views/UserListView.vue'),
  VolunteerApplyListView: () => import('../views/VolunteerApplyListView.vue'),
  VolunteerListView: () => import('../views/VolunteerListView.vue'),
  DonationRecordListView: () => import('../views/DonationRecordListView.vue'),
  DonationGoalListView: () => import('../views/DonationGoalListView.vue'),
  DonationItemListView: () => import('../views/DonationItemListView.vue'),
  OnlineLampListView: () => import('../views/OnlineLampListView.vue'),
  DeityOfferingListView: () => import('../views/DeityOfferingListView.vue'),
  LampOrderListView: () => import('../views/LampOrderListView.vue'),
  OfferingOrderListView: () => import('../views/OfferingOrderListView.vue'),
  ActivityListView: () => import('../views/ActivityListView.vue'),
  RegistrationListView: () => import('../views/RegistrationListView.vue'),
  BelieverRecordListView: () => import('../views/BelieverRecordListView.vue'),
  MessageListView: () => import('../views/MessageListView.vue'),
  NewsListView: () => import('../views/NewsListView.vue'),
  CloudSupervisionListView: () => import('../views/CloudSupervisionListView.vue'),
  OperationLogListView: () => import('../views/OperationLogListView.vue'),
  AccountManagementView: () => import('../views/AccountManagementView.vue'),
  RolePermissionsView: () => import('../views/RolePermissionsView.vue'),
  PlaceholderView: () => import('../views/PlaceholderView.vue'),
}

// 记录已动态注册的路由名，供 replaceMenuRoutes 精确移除。
const registeredMenuRouteNames = new Set()

// 详情类页面路由：不在菜单里，因此不参与 buildMenuRoutes / replaceMenuRoutes，
// meta.activeMenuPath 用于让侧边栏高亮它所属的列表菜单。
const detailRoutes = [
  {
    path: '/users/:id',
    name: 'UserDetail',
    component: () => import('../views/UserDetailView.vue'),
    meta: {
      menuId: 'user-list',
      title: '用户详情',
      groupTitle: '用户管理',
      cacheName: 'UserDetailView',
      activeMenuPath: '/users',
    },
  },
]

// 把「分组 → 菜单项」的两层菜单结构摊平成一维路由表，并写入面包屑所需的 meta。
export function buildMenuRoutes(menuGroups) {
  return menuGroups.flatMap((group) => (
    group.children.map((item) => ({
      path: item.path,
      name: item.name,
      component: componentMap[item.component] || componentMap.PlaceholderView,
      meta: {
        menuId: item.id,
        title: item.title,
        groupTitle: group.title,
        cacheName: componentMap[item.component] ? item.component : 'PlaceholderView',
      },
    }))
  ))
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/',
      name: 'AdminLayout',
      component: () => import('../components/layout/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [...buildMenuRoutes(staticMenuGroups), ...detailRoutes],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
})

// 未开放模块黑名单：名单内的菜单点击/地址栏直达才会提示暂未开发；
// 目前全部模块已开放，后续如需重新锁定某个模块，把对应 id 加进来即可（数据源见 mock/menus.js）。
const DISABLED_MENU_IDS = new Set([
  // 例：'user-list',
])

// 供侧边栏判断菜单是否已开放（未开放项置灰展示）。
export function isMenuEnabled(menuId) {
  return !DISABLED_MENU_IDS.has(menuId)
}

// "暂未开发"弹窗：防重复弹出。
let comingSoonVisible = false
function notifyComingSoon() {
  if (comingSoonVisible) return
  comingSoonVisible = true
  ElMessageBox.alert('该模块暂未开发，敬请期待', '提示', {
    confirmButtonText: '知道了',
    type: 'info',
    callback: () => { comingSoonVisible = false },
  })
}

buildMenuRoutes(staticMenuGroups).forEach((route) => registeredMenuRouteNames.add(route.name))

// 读取会话 token，判断当前是否已登录（与 stores/auth.js 使用同一份缓存）。
function getSessionToken() {
  try {
    const rawSession = localStorage.getItem('shifang-admin-session')
      || sessionStorage.getItem('shifang-admin-session')
    return rawSession ? JSON.parse(rawSession)?.token : null
  } catch {
    return null
  }
}

// 全局守卫：已登录访问登录页 → 回后台；未登录访问受保护页面 → 去登录并带上回跳地址；
// 黑名单内的模块（菜单点击或地址栏直达）提示暂未开发并取消导航。
router.beforeEach((to) => {
  const token = getSessionToken()
  if (to.meta.public && token) return { path: '/dashboard' }
  if (!to.meta.public && !token) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.meta.menuId && !isMenuEnabled(to.meta.menuId)) {
    notifyComingSoon()
    return false
  }
  return true
})

router.afterEach((to) => {
  document.title = `${to.meta.title || '管理后台'} - 十方殿管理端`
})

/**
 * 用后端返回的菜单完整替换当前业务路由，避免用户仍能访问已无权限的页面。
 * 只增删 buildMenuRoutes 产生的路由，不影响 /login 等静态路由。
 */
export function replaceMenuRoutes(menuGroups) {
  registeredMenuRouteNames.forEach((routeName) => {
    if (router.hasRoute(routeName)) router.removeRoute(routeName)
  })
  registeredMenuRouteNames.clear()

  buildMenuRoutes(menuGroups).forEach((route) => {
    router.addRoute('AdminLayout', route)
    registeredMenuRouteNames.add(route.name)
  })
}

export default router
