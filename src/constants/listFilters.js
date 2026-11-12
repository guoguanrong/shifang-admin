// 各列表页筛选表单的初始值工厂，集中在此维护，避免同一份字段散落在各个视图里。
// 用户列表筛选：phone / email / city / status / 注册时间 / 捐款、点灯、供奉次数均走服务端（MemberDTO 已支持）。
export function createUserListFilters() {
  return {
    phone: '',
    email: '',
    status: '',
    startDate: '',
    endDate: '',
    donateCount: '',
    lightCount: '',
    worshipCount: '',
    city: '',
  }
}

export function createAccountFilters() {
  return { name: '', roleId: '', status: '' }
}

export function createVolunteerApplicationFilters() {
  return {
    phone: '',
    status: '',
    post: '',
    startDate: '',
    endDate: '',
  }
}

// 捐赠记录筛选：联络手机与捐赠时间走服务端；捐赠类型（donateType）不是接口查询参数，只对当前页筛选。
export function createDonationRecordFilters() {
  return {
    phone: '',
    type: '',
    startDate: '',
    endDate: '',
  }
}

export function createLampOrderFilters() {
  return {
    orderId: '',
    userPhone: '',
    lamp: '',
    cycle: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

// 供奉订单筛选：接口 OrderDTO 没有供奉名称参数，因此不提供「供奉项目」筛选。
export function createOfferingOrderFilters() {
  return {
    orderId: '',
    userPhone: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createActivityFilters() {
  return {
    title: '',
    type: '',
    status: '',
    listed: '',
    startDate: '',
    endDate: '',
  }
}

// 与 ActivityRegisterDTO 对齐：searchKey 关键词、mobile 善信手机号（右模糊）、
// startTime/endTime 报名时间区间。
export function createRegistrationFilters() {
  return {
    searchKey: '',
    mobile: '',
    startDate: '',
    endDate: '',
  }
}

export function createBelieverRecordFilters() {
  return {
    name: '',
    blessingType: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createMessageFilters() {
  return {
    title: '',
    category: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createNewsFilters() {
  return {
    title: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createPracticeVideoFilters() {
  return {
    title: '',
    difficulty: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createClassicFilters() {
  return {
    title: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createCloudCameraFilters() {
  return {
    code: '',
    location: '',
    online: '',
  }
}

export function createFundExpenseFilters() {
  return {
    title: '',
    category: '',
    status: '',
    startDate: '',
    endDate: '',
  }
}

export function createOperationLogFilters() {
  return {
    name: '',
    module: '',
    startDate: '',
    endDate: '',
  }
}

export function createMenuFilters() {
  return {
    title: '',
    status: '',
  }
}
