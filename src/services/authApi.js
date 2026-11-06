import http, { CLIENT_ID, GRANT_TYPE } from './http'

export function login(data) {
  return http.post('/auth/login', {
    ...data,
    clientId: CLIENT_ID,
    grantType: GRANT_TYPE,
  })
}

// 注销登录：让服务端使 token 失效；失败由调用方忽略，本地会话照常清理。
export function logout() {
  return http.post('/auth/logout')
}
