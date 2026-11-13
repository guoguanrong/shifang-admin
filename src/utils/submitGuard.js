import { ref } from 'vue'

// 所有表单「保存 / 提交」共用的防抖（防重复提交）。
// allowSubmit() 必须在提交函数第一行同步调用：既挡请求进行中的重复提交，也挡接口
// 响应极快时紧接着的下一次点击。它只记录时间戳、不上锁，所以表单校验不通过时的
// 提前 return 不会把状态卡住；saving 仍是各页按钮的 loading 状态。
const DEFAULT_COOLDOWN = 800

export function useSubmitGuard({ cooldown = DEFAULT_COOLDOWN } = {}) {
  const saving = ref(false)
  let lastSubmitAt = 0

  function allowSubmit() {
    if (saving.value) return false
    const now = Date.now()
    if (now - lastSubmitAt < cooldown) return false
    lastSubmitAt = now
    return true
  }

  // 请求结束后复位并重新起算冷却时间，避免保存刚完成就被再次点击。
  function endSubmit() {
    saving.value = false
    lastSubmitAt = Date.now()
  }

  return { saving, allowSubmit, endSubmit }
}
