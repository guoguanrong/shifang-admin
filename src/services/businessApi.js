import http from './http'

export function getWorshipList(params) {
  return http.post('/worship/list', params)
}

export function getWorshipById(id) {
  return http.get(`/worship/get/${id}`)
}

export function saveWorship(data) {
  return http.post('/worship/save', data)
}

export function updateWorship(data) {
  return http.post('/worship/update', data)
}

export function deleteWorshipById(id) {
  return http.post(`/worship/delete/${id}`)
}

export function uploadBusinessFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post('/sys/file/upload', formData, { timeout: 180000 })
}

export function getDaodianList(params) {
  return http.post('/daodian/list', params)
}

export function getDaodianById(id) {
  return http.get(`/daodian/get/${id}`)
}

export function saveDaodian(data) {
  return http.post('/daodian/save', data)
}

export function updateDaodian(data) {
  return http.post('/daodian/update', data)
}

export function deleteDaodianById(id) {
  return http.post(`/daodian/delete/${id}`)
}

export function getSportWellnessList(params) {
  return http.post('/sportWellness/list', params)
}

export function getSportWellnessById(id) {
  return http.get(`/sportWellness/get/${id}`)
}

export function saveSportWellness(data) {
  return http.post('/sportWellness/save', data)
}

export function updateSportWellness(data) {
  return http.post('/sportWellness/update', data)
}

export function deleteSportWellnessById(id) {
  return http.post(`/sportWellness/delete/${id}`)
}

export function getSystemLogList(params) {
  return http.post('/log/list', params)
}

export function getWishesList(params) {
  return http.post('/wishes/list', params)
}

export function getWishesById(id) {
  return http.get(`/wishes/get/${id}`)
}

export function saveWishes(data) {
  return http.post('/wishes/save', data)
}

export function updateWishes(data) {
  return http.post('/wishes/update', data)
}

export function deleteWishesById(id) {
  return http.post(`/wishes/delete/${id}`)
}

export function getMemoirList(params) {
  return http.post('/memoir/list', params)
}

export function getDynamicList(params) {
  return http.post('/dynamic/list', params)
}

export function getDynamicById(id) {
  return http.get(`/dynamic/get/${id}`)
}

export function saveDynamic(data) {
  return http.post('/dynamic/save', data)
}

export function updateDynamic(data) {
  return http.post('/dynamic/update', data)
}

export function deleteDynamicById(id) {
  return http.post(`/dynamic/delete/${id}`)
}

export function getMemoirById(id) {
  return http.get(`/memoir/get/${id}`)
}

export function saveMemoir(data) {
  return http.post('/memoir/save', data)
}

export function updateMemoir(data) {
  return http.post('/memoir/update', data)
}

export function deleteMemoirById(id) {
  return http.post(`/memoir/delete/${id}`)
}

export function getMemberList(params) {
  return http.post('/member/list', params)
}

export function getMemberById(id) {
  return http.get(`/member/get/${id}`)
}

export function updateMember(data) {
  return http.post('/member/update', data)
}

export function deleteMemberById(id) {
  return http.post(`/member/delete/${id}`)
}

export function getVolunteerList(params) {
  return http.post('/volunteer/list', params)
}

export function getVolunteerById(id) {
  return http.get(`/volunteer/get/${id}`)
}

export function saveVolunteer(data) {
  return http.post('/volunteer/save', data)
}

export function updateVolunteer(data) {
  return http.post('/volunteer/update', data)
}

export function deleteVolunteerById(id) {
  return http.post(`/volunteer/delete/${id}`)
}

export function getLightList(params) {
  return http.post('/light/list', params)
}

export function getLightById(id) {
  return http.get(`/light/get/${id}`)
}

export function saveLight(data) {
  return http.post('/light/save', data)
}

export function updateLight(data) {
  return http.post('/light/update', data)
}

export function deleteLightById(id) {
  return http.post(`/light/delete/${id}`)
}

export function getShopItemsList(params) {
  return http.post('/shopItems/list', params)
}

export function getShopItemsById(id) {
  return http.get(`/shopItems/get/${id}`)
}

export function saveShopItems(data) {
  return http.post('/shopItems/save', data)
}

export function updateShopItems(data) {
  return http.post('/shopItems/update', data)
}

export function deleteShopItemsById(id) {
  return http.post(`/shopItems/delete/${id}`)
}

export function getDonateTargetList(params) {
  return http.post('/donateTarget/list', params)
}

export function getDonateTargetById(id) {
  return http.get(`/donateTarget/get/${id}`)
}

export function saveDonateTarget(data) {
  return http.post('/donateTarget/save', data)
}

export function updateDonateTarget(data) {
  return http.post('/donateTarget/update', data)
}

export function deleteDonateTargetById(id) {
  return http.post(`/donateTarget/delete/${id}`)
}

export function getOrderList(params) {
  return http.post('/order/list', params)
}

export function getOrderById(id) {
  return http.get(`/order/get/${id}`)
}

export function getActivityList(params) {
  return http.post('/activity/list', params)
}

export function getActivityById(id) {
  return http.get(`/activity/get/${id}`)
}

export function saveActivity(data) {
  return http.post('/activity/save', data)
}

export function updateActivity(data) {
  return http.post('/activity/update', data)
}

export function deleteActivityById(id) {
  return http.post(`/activity/delete/${id}`)
}

// 活动报名记录：/activityRegister/list 入参 {searchKey, status, startTime, endTime, page, pageSize, mobile}，
// 返回 {list, currentPage, totalPage, totalRow}，每条记录内嵌 activity（ActivityVo）。
export function getActivityRegisterList(params) {
  return http.post('/activityRegister/list', params)
}

export function getActivityRegisterById(id) {
  return http.get(`/activityRegister/get/${id}`)
}

export function saveActivityRegister(data) {
  return http.post('/activityRegister/save', data)
}

export function updateActivityRegister(data) {
  return http.post('/activityRegister/update', data)
}

export function deleteActivityRegisterById(id) {
  return http.post(`/activityRegister/delete/${id}`)
}

export function getSelfActivityRegisterList(params) {
  return http.post('/activityRegister/selfActivityList', params)
}
