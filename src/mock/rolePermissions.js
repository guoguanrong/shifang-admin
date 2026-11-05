import { staticMenuGroups } from './menus'

// 权限配置围绕项目实际菜单生成；每个页面再细分可勾选的操作。
const actionLabels = {
  dashboard: ['数据看板', '捐赠目标进度', '待办事项', '用户评测互动数据', '用户行为数据'],
  'user-list': ['冻结/解冻', '用户详情'],
  'volunteer-applications': ['通过', '拒绝'],
  'volunteer-list': ['新增/编辑', '删除'],
  'donation-records': ['查看详情', '导出'],
  'donation-goals': ['新增/编辑', '上架', '删除'],
  'donation-items': ['新增/编辑', '上架', '删除'],
  'online-lamps': ['新增/编辑', '上架', '删除'],
  'deity-offerings': ['新增/编辑', '上架', '删除'],
  'lamp-orders': ['上传点灯视频', '查看视频'],
  'offering-orders': ['上传供奉图片', '查看图片'],
  'activity-list': ['新增/编辑', '上架', '删除'],
  'activity-registrations': ['查看详情', '导出'],
  'record-list': ['审核', '删除'],
  'message-list': ['审核', '删除'],
  'news-list': ['新增/编辑', '上架', '删除'],
  'cloud-supervision': ['新增/编辑', '启用/停用'],
  'account-management': ['新增/编辑', '重置密码', '启用/禁用', '删除'],
  'role-permissions': ['新增/编辑', '查看权限', '删除'],
  'operation-logs': ['查看', '导出'],
}

export const permissionGroups = staticMenuGroups.map((group) => ({
  id: group.id,
  name: group.id === 'overview' ? '首页' : group.title,
  items: group.children.map((item) => ({
    id: item.id,
    name: item.id === 'dashboard' ? '首页概览' : item.title,
    actions: actionLabels[item.id] || ['查看'],
  })),
}))

export const allPermissionKeys = permissionGroups.flatMap((group) => group.items.flatMap((item) => (
  item.actions.map((_action, index) => `${item.id}:${index}`)
)))

function keysForGroups(groupIds) {
  return permissionGroups.filter((group) => groupIds.includes(group.id))
    .flatMap((group) => group.items.flatMap((item) => item.actions.map((_action, index) => `${item.id}:${index}`)))
}

export const initialRoles = [
  { id: 'super-admin', number: 1, name: '超级管理员', parentId: null, permissions: [...allPermissionKeys] },
  { id: 'content-admin', number: 2, name: '内容管理员', parentId: 'super-admin', permissions: keysForGroups(['overview', 'news', 'messages']) },
  { id: 'activity-operator', number: 3, name: '活动运营', parentId: 'super-admin', permissions: keysForGroups(['overview', 'activities', 'volunteers', 'orders']) },
  { id: 'finance', number: 4, name: '财务专员', parentId: 'super-admin', permissions: keysForGroups(['overview', 'donations', 'funds', 'orders']) },
  { id: 'customer-service', number: 5, name: '客服专员', parentId: 'activity-operator', permissions: keysForGroups(['overview', 'users', 'activities']) },
  { id: 'volunteer-admin', number: 6, name: '义工管理员', parentId: 'activity-operator', permissions: keysForGroups(['overview', 'volunteers']) },
  { id: 'language', number: 7, name: '多语言专员', parentId: 'super-admin', permissions: keysForGroups(['overview', 'messages', 'news']) },
]
