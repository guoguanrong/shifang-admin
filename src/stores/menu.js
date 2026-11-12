import { ref } from 'vue'
import { defineStore } from 'pinia'
import { staticMenuGroups } from '../mock/menus'
import { replaceMenuRoutes } from '../router'
import { getSysMenuRoutes } from '../services/systemApi'

// 深拷贝一级：分组与菜单项各自复制，避免业务代码直接改到 mock 数据源。
function cloneMenus(menus) {
  return menus.map((group) => ({
    ...group,
    children: group.children.map((item) => ({ ...item })),
  }))
}

function normalizePath(path) {
  const text = String(path ?? '').trim()
  if (!text) return ''
  const withSlash = text.startsWith('/') ? text : `/${text}`
  return withSlash.replace(/\/+$/, '') || '/'
}

// /menu/routes 是 RuoYi RouterVo 树：component 是 Layout / system/user/index 这类路径，
// icon 是 svg 路径，都和本项目的 componentMap / Element Plus 图标名对不上。
// 因此只把它当「白名单」：收集各级 path、meta.title、name，反查本地 staticMenuGroups，
// 保留本地的 id/component/icon 来重建菜单与路由。
function collectRouteKeys(nodes) {
  const paths = new Set()
  const titles = new Set()
  const names = new Set()

  const walk = (list) => {
    ;(list || []).forEach((node) => {
      if (!node || typeof node !== 'object') return
      const path = normalizePath(node.path)
      if (path) paths.add(path)
      const title = String(node.meta?.title ?? '').trim()
      if (title) titles.add(title)
      if (node.name) names.add(String(node.name))
      walk(node.children)
    })
  }
  walk(nodes)
  return { paths, titles, names }
}

function matchesLocalMenu(item, keys) {
  const title = String(item.title ?? '').trim()
  return keys.paths.has(normalizePath(item.path))
    || Boolean(title && keys.titles.has(title))
    || keys.names.has(String(item.name))
    || keys.names.has(String(item.id))
}

// 菜单路由接口挂起时不能让菜单加载一直悬着，超时后按降级处理。
const MENU_ROUTES_TIMEOUT = 2500

function fetchMenuRoutes() {
  let timer
  return Promise.race([
    getSysMenuRoutes(),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('获取菜单路由超时')), MENU_ROUTES_TIMEOUT)
    }),
  ]).finally(() => clearTimeout(timer))
}

export const useMenuStore = defineStore('menu', () => {
  const menuGroups = ref(cloneMenus(staticMenuGroups))
  const loaded = ref(false)
  // 仅当成功应用了后端路由树时才启用访问拦截；接口异常时降级为静态全量菜单。
  const dynamic = ref(false)
  let pending = null

  // 用后端菜单整体替换本地菜单，并同步重建对应路由。
  function setMenuGroups(menus, fromBackend = false) {
    menuGroups.value = cloneMenus(Array.isArray(menus) ? menus : [])
    replaceMenuRoutes(menuGroups.value)
    dynamic.value = Boolean(fromBackend)
    loaded.value = true
  }

  // 加载当前用户可见菜单。已加载过则复用；并发调用共用同一个请求。
  async function loadMenuGroups() {
    if (loaded.value) return menuGroups.value
    if (pending) return pending

    pending = (async () => {
      try {
        const payload = await fetchMenuRoutes()
        const routes = Array.isArray(payload) ? payload : payload?.list || payload?.data || []
        const keys = collectRouteKeys(routes)
        const localMenus = staticMenuGroups.flatMap((group) => group.children)
        // 后端菜单表若完全是另一套 path（如 RuoYi 的 system/user），仅凭同名 title
        // 会碰巧匹配一两个、却把其余菜单全删掉。此时判定为口径不一致并降级，
        // 不启用动态过滤，避免出现「只剩一个菜单」。
        const pathHits = localMenus.filter((item) => keys.paths.has(normalizePath(item.path))).length
        if (pathHits === 0) {
          console.warn('[menu] /menu/routes 与本地菜单 path 无交集，已降级为静态全量菜单。后端 path 示例：', [...keys.paths].slice(0, 8))
          throw new Error('menu routes path mismatch')
        }
        const filtered = staticMenuGroups
          .map((group) => ({
            ...group,
            children: group.children.filter((item) => matchesLocalMenu(item, keys)),
          }))
          .filter((group) => group.children.length)
        if (!filtered.length) throw new Error('no matched menu')
        const matchedCount = filtered.reduce((count, group) => count + group.children.length, 0)
        if (matchedCount < localMenus.length / 2) {
          console.warn(`[menu] 仅匹配到 ${matchedCount}/${localMenus.length} 个菜单，请检查后端菜单表是否与本项目一致。`)
        }
        setMenuGroups(filtered, true)
      } catch {
        // 接口失败/数据不可用时保持静态全量菜单，且不重建路由、不启用拦截。
        menuGroups.value = cloneMenus(staticMenuGroups)
        dynamic.value = false
        loaded.value = true
      } finally {
        pending = null
      }
      return menuGroups.value
    })()

    return pending
  }

  // 退出登录或切换账号时还原内置菜单，下一个账号会重新拉自己的路由树。
  function resetMenuGroups() {
    menuGroups.value = cloneMenus(staticMenuGroups)
    replaceMenuRoutes(menuGroups.value)
    dynamic.value = false
    loaded.value = false
  }

  return { menuGroups, loaded, dynamic, setMenuGroups, loadMenuGroups, resetMenuGroups }
})
