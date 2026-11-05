// 临时菜单数据（接入接口后由后端返回相同结构即可直接替换）。
// 字段说明：
//   id        分组/菜单唯一标识
//   title     展示名称
//   path      路由路径
//   name      路由名（需唯一，同时作为页签缓存的 key）
//   component 对应 router/index.js 中 componentMap 的键名
//   icon      图标名，需在 AppSidebar 的 iconMap 中登记（未登记时回退为默认图标）
//   activePaths（可选）需要高亮该菜单的其他路径
export const staticMenuGroups = [
  { id: 'overview', title: '总览', children: [
    { id: 'dashboard', title: '首页', path: '/dashboard', name: 'Dashboard', component: 'DashboardView', icon: 'DataBoard' },
  ] },
  { id: 'users', title: '用户管理', children: [
    { id: 'user-list', title: '用户列表', path: '/users', name: 'UserList', component: 'UserListView', icon: 'User' },
  ] },
  { id: 'volunteers', title: '义工管理', children: [
    { id: 'volunteer-applications', title: '申请列表', path: '/volunteers/applications', name: 'VolunteerApplications', component: 'VolunteerApplyListView', icon: 'Tickets' },
    { id: 'volunteer-list', title: '义工列表', path: '/volunteers', name: 'VolunteerList', component: 'VolunteerListView', icon: 'Avatar' },
  ] },
  { id: 'donations', title: '捐赠管理', children: [
    { id: 'donation-records', title: '捐赠记录', path: '/donations/records', name: 'DonationRecords', component: 'DonationRecordListView', icon: 'Wallet' },
    { id: 'donation-goals', title: '捐赠目标', path: '/donations/goals', name: 'DonationGoals', component: 'DonationGoalListView', icon: 'Flag' },
    { id: 'donation-items', title: '物品列表', path: '/donations/items', name: 'DonationItems', component: 'DonationItemListView', icon: 'Goods' },
  ] },
  { id: 'business', title: '祈福管理', children: [
    { id: 'online-lamps', title: '祈愿点灯', path: '/business/lamps', name: 'OnlineLamps', component: 'OnlineLampListView', icon: 'Sunny' },
    { id: 'deity-offerings', title: '神像供奉', path: '/business/deity-offerings', name: 'DeityOfferings', component: 'DeityOfferingListView', icon: 'MagicStick' },
  ] },
  { id: 'orders', title: '订单管理', children: [
    { id: 'lamp-orders', title: '点灯订单', path: '/orders/lamps', name: 'LampOrders', component: 'LampOrderListView', icon: 'Ticket' },
    { id: 'offering-orders', title: '供奉订单', path: '/orders/offerings', name: 'OfferingOrders', component: 'OfferingOrderListView', icon: 'Present' },
  ] },
  { id: 'activities', title: '道会管理', children: [
    { id: 'activity-list', title: '道会列表', path: '/activities', name: 'ActivityList', component: 'ActivityListView', icon: 'Calendar' },
    { id: 'activity-registrations', title: '报名记录', path: '/activities/registrations', name: 'ActivityRegistrations', component: 'RegistrationListView', icon: 'EditPen' },
  ] },
  { id: 'believer-records', title: '信众实录', children: [
    { id: 'record-list', title: '实录列表', path: '/believer-records', name: 'BelieverRecords', component: 'BelieverRecordListView', icon: 'Document' },
  ] },
  { id: 'messages', title: '各界寄语', children: [
    { id: 'message-list', title: '寄语列表', path: '/messages', name: 'MessageList', component: 'MessageListView', icon: 'Postcard' },
  ] },
  { id: 'news', title: '动态管理', children: [
    { id: 'news-list', title: '动态列表', path: '/news', name: 'NewsList', component: 'NewsListView', icon: 'Notification' },
  ] },
  { id: 'funds', title: '云监控', children: [
    { id: 'cloud-supervision', title: '云监工', path: '/funds/supervision', name: 'CloudSupervision', component: 'CloudSupervisionListView', icon: 'Monitor' },
  ] },
  { id: 'permissions', title: '权限管理', children: [
    { id: 'account-management', title: '账号管理', path: '/permissions/accounts', name: 'AccountManagement', component: 'AccountManagementView', icon: 'UserFilled' },
    { id: 'role-permissions', title: '角色权限', path: '/permissions/roles', name: 'RolePermissions', component: 'RolePermissionsView', icon: 'Key' },
  ] },
  { id: 'system', title: '系统管理', children: [
    { id: 'operation-logs', title: '操作日志', path: '/system/logs', name: 'OperationLogs', component: 'OperationLogListView', icon: 'Clock' },
  ] },
]
