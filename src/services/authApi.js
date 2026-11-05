import http, { CLIENT_ID, GRANT_TYPE } from './http'

export function login(data) {
  return http.post('/auth/login', {
    ...data,
    clientId: CLIENT_ID,
    grantType: GRANT_TYPE,
  })
}
