import axios from 'axios'

// 统一请求实例：baseURL 可用 VITE_API_BASE_URL 覆盖，默认走 /api 代理。
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

export const CLIENT_ID = 'e5cd7e4891bf95d1d19206ce24a7b32e'
export const GRANT_TYPE = 'password'

const SESSION_KEY = 'shifang-admin-session'

function clearStoredSession() {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
}

function getSessionToken() {
  const rawSession = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
  if (!rawSession) return null

  try {
    return JSON.parse(rawSession)?.token || null
  } catch {
    clearStoredSession()
    return null
  }
}

function redirectToLogin() {
  if (window.location.pathname.endsWith('/login')) return
  const redirect = `${window.location.pathname}${window.location.search}${window.location.hash}`
  const loginPath = `${import.meta.env.BASE_URL}login?redirect=${encodeURIComponent(redirect)}`
  window.location.replace(loginPath)
}

// 请求拦截：写入固定客户端信息，并把会话 token 以 Bearer 方式写入请求头。
http.interceptors.request.use((config) => {
  config.headers.clientId = CLIENT_ID
  config.headers.grantType = GRANT_TYPE

  const token = getSessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  return config
})

// 登录过期业务码：后端返回 {"code":1005,"msg":"登录已过期, 请重新登录"} 时会话已失效。
export const SESSION_EXPIRED_CODE = 1005

// 供以 Blob 接收响应的导出等场景复用，保持会话失效处理一致。
export function handleSessionExpired() {
  clearStoredSession()
  redirectToLogin()
}

// 响应拦截：成功时直接返回业务体；401 或业务码 1005 清理失效会话并回登录页。
http.interceptors.response.use(
  (response) => {
    // 文件导出等场景需要读取响应头与原始 Blob，配置 rawResponse 时跳过业务体解包。
    if (response.config?.rawResponse) return response

    const body = response.data
    if (body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'code')) {
      if (Number(body.code) !== 1000) {
        // 业务码 1005（可能伴随 HTTP 200 返回）：会话过期，清理后回登录页。
        if (Number(body.code) === SESSION_EXPIRED_CODE && !response.config?.skipAuthRedirect) {
          clearStoredSession()
          redirectToLogin()
        }
        const error = new Error(body.msg || '接口请求失败')
        error.code = body.code
        error.userMessage = body.msg || '接口请求失败'
        return Promise.reject(error)
      }
      return body.data
    }
    return body
  },
  (error) => {
    const status = error.response?.status
    const bodyCode = Number(error.response?.data?.code)
    // 401 或业务码 1005 均视为会话过期。
    if ((status === 401 || bodyCode === SESSION_EXPIRED_CODE) && !error.config?.skipAuthRedirect) {
      clearStoredSession()
      redirectToLogin()
    }

    error.userMessage = error.response?.data?.msg
      || error.response?.data?.message
      || (status ? `请求失败（${status}）` : '网络异常，请稍后重试')
    return Promise.reject(error)
  },
)

export default http
