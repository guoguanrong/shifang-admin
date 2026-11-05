import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getInitialData } from '../services/dataSource'

// 账号与角色共用一份页面内 mock 状态；后续接口接入时在此替换读写逻辑。
export const usePermissionsStore = defineStore('permissions', () => {
  const accounts = ref(getInitialData('adminAccounts'))
  const roles = ref(getInitialData('roles'))
  return { accounts, roles }
})
