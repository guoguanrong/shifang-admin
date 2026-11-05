import { initialActivities, activityLocationOptions } from '../mock/activities'
import { initialAdminAccounts } from '../mock/adminAccounts'
import { initialRoles, permissionGroups } from '../mock/rolePermissions'
import { initialRegistrations } from '../mock/activityRegistrations'
import { initialBelieverRecords } from '../mock/believerRecords'
import { initialClassics } from '../mock/classics'
import { initialCloudCameras, cameraLocationOptions } from '../mock/cloudCameras'
import { initialDeityOfferings } from '../mock/deityOfferings'
import { initialDonationGoals } from '../mock/donationGoals'
import { initialDonationItems } from '../mock/donationItems'
import { initialDonationRecords } from '../mock/donationRecords'
import { initialFundExpenses } from '../mock/fundExpenses'
import { initialLampOrders } from '../mock/lampOrders'
import { initialMessages, messageCategoryOptions } from '../mock/messages'
import { initialNews } from '../mock/news'
import { initialOfferingOrders } from '../mock/offeringOrders'
import { initialOnlineLamps, initialLampMaterials } from '../mock/onlineLamps'
import { initialOperationLogs, logModuleOptions } from '../mock/operationLogs'
import { initialPracticeVideos } from '../mock/practiceVideos'
import { initialUsers } from '../mock/users'
import { initialApplications } from '../mock/volunteerApplications'
import { initialVolunteers } from '../mock/volunteers'

// 页面只通过此适配层读取初始化数据。当前适配器使用本地演示数据；接入后端时，
// 可在 services 下新增 API repository，而无需让视图重新依赖 mock 文件。
const resources = {
  activities: initialActivities,
  adminAccounts: initialAdminAccounts,
  roles: initialRoles,
  activityRegistrations: initialRegistrations,
  believerRecords: initialBelieverRecords,
  classics: initialClassics,
  cloudCameras: initialCloudCameras,
  deityOfferings: initialDeityOfferings,
  donationGoals: initialDonationGoals,
  donationItems: initialDonationItems,
  donationRecords: initialDonationRecords,
  fundExpenses: initialFundExpenses,
  lampOrders: initialLampOrders,
  messages: initialMessages,
  news: initialNews,
  offeringOrders: initialOfferingOrders,
  onlineLamps: initialOnlineLamps,
  lampMaterials: initialLampMaterials,
  operationLogs: initialOperationLogs,
  practiceVideos: initialPracticeVideos,
  users: initialUsers,
  volunteerApplications: initialApplications,
  volunteers: initialVolunteers,
}

const options = {
  permissionGroups,
  activityLocations: activityLocationOptions,
  cameraLocations: cameraLocationOptions,
  logModules: logModuleOptions,
  messageCategories: messageCategoryOptions,
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}

export function getInitialData(resourceName) {
  if (!(resourceName in resources)) throw new Error(`未知的数据资源: ${resourceName}`)
  return clone(resources[resourceName])
}

export function getDataOptions(optionName) {
  if (!(optionName in options)) throw new Error(`未知的数据选项: ${optionName}`)
  return clone(options[optionName])
}
