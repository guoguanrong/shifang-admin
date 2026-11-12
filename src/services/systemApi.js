import http from './http'

// system 模块接口（Apifox：system-用户 / system-角色）。
// 成功时 http 拦截器已剥掉外层包装，直接返回 data 部分。

// ---------- system-用户 ----------

// 用户列表：SysUserDTO { searchKey, status(0禁用/1正常), page, pageSize, ... }，服务端分页。
export function getSysUserList(params) {
  return http.post('/user/list', params)
}

export function getSysUserById(id) {
  return http.get(`/user/get/${id}`)
}

// 新增/修改用户：SysUser（required: nickname, username），角色走 roleIdList。
export function saveSysUser(data) {
  return http.post('/user/save', data)
}

export function updateSysUser(data) {
  return http.post('/user/update', data)
}

// 修改状态：{ id, status }，0.禁用 / 1.正常。
export function updateSysUserStatus(data) {
  return http.post('/user/updateStatus', data)
}

// 管理员重置密码：接口为 query 参数（id, newPwd）。
export function adminUpdateUserPwd(id, newPwd) {
  return http.post('/user/admin/updatePwd', null, { params: { id, newPwd } })
}

// 批量删除：body 为用户 id 数组。
export function deleteSysUsers(ids) {
  return http.post('/user/delete', ids)
}

// 用户设置角色：UserRoleDTO { userIdList, roleIdList }。
export function setSysUserRole(data) {
  return http.post('/user/setRole', data)
}

// ---------- system-角色 ----------

// 角色列表：BaseQuery 分页，用于账号的角色下拉。
export function getSysRoleList(params) {
  return http.post('/role/list', params)
}

export function getSysRoleById(id) {
  return http.get(`/role/get/${id}`)
}

// 新增/修改角色：SysRole（required: name, key 权限字符），角色无父子层级。
export function saveSysRole(data) {
  return http.post('/role/save', data)
}

export function updateSysRole(data) {
  return http.post('/role/update', data)
}

// 修改角色状态：{ id, status }，0.停用 / 1.正常。
export function updateSysRoleStatus(data) {
  return http.post('/role/updateStatus', data)
}

// 批量删除角色：body 为角色 id 数组。
export function deleteSysRoles(ids) {
  return http.post('/role/delete', ids)
}

// 角色设置菜单按钮权限：RoleMenuDTO { roleId, menuIdList }（menuIdList 含目录/菜单/按钮节点）。
export function setSysRoleMenu(data) {
  return http.post('/role/setMenu', data)
}

// ---------- system-菜单 ----------

// 当前登录用户的路由树：GET 无入参，返回 RouterVo[]（name/path/component/meta{title,icon...}/children）。
// 用于登录后生成本人可见的菜单与路由；不含菜单 id/type/perms，不用于菜单管理或角色授权。
export function getSysMenuRoutes() {
  return http.get('/menu/routes')
}

// 菜单列表：BaseQuery 分页，返回 SysMenuVo[]（含 children 子级）。
export function getSysMenuList(params) {
  return http.post('/menu/list', params)
}

// 菜单详情：编辑时按 id 取完整字段。
export function getSysMenuById(id) {
  return http.get(`/menu/get/${id}`)
}

// 新增/修改菜单：SysMenu（required: title、type），修改时带 id。
// type 1.目录 2.菜单 3.按钮；status 0.停用 1.正常；hidden true.隐藏。
export function saveSysMenu(data) {
  return http.post('/menu/save', data)
}

export function updateSysMenu(data) {
  return http.post('/menu/update', data)
}

// 批量/级联删除：body 为菜单 id 数组。
export function deleteSysMenu(ids) {
  return http.post('/menu/delete', ids)
}
