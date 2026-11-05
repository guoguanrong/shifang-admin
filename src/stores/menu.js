import { ref } from 'vue'
import { defineStore } from 'pinia'
import { staticMenuGroups } from '../mock/menus'
import { replaceMenuRoutes } from '../router'

// 深拷贝一级：分组与菜单项各自复制，避免业务代码直接改到 mock 数据源。
function cloneMenus(menus) {
  return menus.map((group) => ({
    ...group,
    children: group.children.map((item) => ({ ...item })),
  }))
}

export const useMenuStore = defineStore('menu', () => {
  const menuGroups = ref(cloneMenus(staticMenuGroups))
  const loaded = ref(false)

  // 用后端返回的菜单整体替换本地菜单，并同步重建对应路由。
  function setMenuGroups(menus) {
    menuGroups.value = cloneMenus(Array.isArray(menus) ? menus : [])
    replaceMenuRoutes(menuGroups.value)
    loaded.value = true
  }

  // 加载菜单。已加载过则直接复用，避免重复请求与重复建路由。
  async function loadMenuGroups() {
    if (loaded.value) return menuGroups.value

    // 后续接入接口：
    // const menus = await http.get('/admin/menus')
    // setMenuGroups(menus)
    // return menuGroups.value
    menuGroups.value = cloneMenus(staticMenuGroups)
    loaded.value = true
    return menuGroups.value
  }

  // 还原为内置菜单（目前用于重置/退出登录场景）。
  function resetMenuGroups() {
    menuGroups.value = cloneMenus(staticMenuGroups)
    replaceMenuRoutes(menuGroups.value)
    loaded.value = false
  }

  return { menuGroups, loaded, setMenuGroups, loadMenuGroups, resetMenuGroups }
})
