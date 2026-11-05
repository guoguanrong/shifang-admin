import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { login as loginApi } from '../services/authApi'

// 会话缓存 key，与 services/http.js 中读取 token 的 key 必须保持一致。
const STORAGE_KEY = 'shifang-admin-session'

// 读取已缓存的会话，解析失败（数据损坏）时按未登录处理。
function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
      || JSON.parse(sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref(getStoredSession())
  const isLoggedIn = computed(() => Boolean(session.value?.token))
  const userName = computed(() => session.value?.userName || 'admin')

  /**
   * @param {string} username 登录账号
   * @param {string} password 密码
   * @param {boolean} remember 是否记住登录（true 写 localStorage，false 写 sessionStorage）
   */
  async function login({ username, password, remember }) {
    const result = await loginApi({ username, password })
    const token = result?.accessToken

    if (!token) throw new Error('登录接口未返回 accessToken')

    session.value = {
      token,
      userName: result.username || username,
    }

    // 只保留一份会话，避免两个 storage 同时存在时读取到过期 token。
    const targetStorage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage
    targetStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
    otherStorage.removeItem(STORAGE_KEY)
  }

  // 退出登录：清空内存会话并同时清理两个 storage，退出后由路由守卫跳转登录页。
  function logout() {
    session.value = null
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { session, isLoggedIn, userName, login, logout }
})
