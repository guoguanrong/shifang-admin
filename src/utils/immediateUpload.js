import { computed, ref } from 'vue'
import { uploadBusinessFile } from '../services/businessApi'

// 所有表单统一使用「选中文件立即上传」：上传中状态与 URL 校验收在一处，
// 避免把本地 blob: 预览地址写进接口，也避免攒到点击保存时才批量上传。
export function useImmediateUpload() {
  // 用计数而不是布尔值，避免连续选择文件时前一次上传结束把状态提前清掉。
  const pending = ref(0)
  const uploading = computed(() => pending.value > 0)

  async function uploadFile(file, label = '文件') {
    const uploaded = await uploadBusinessFile(file)
    const url = uploaded?.url
    if (!url) throw new Error(`${label}上传成功但未返回文件地址`)
    return url
  }

  // 一次或连续多次上传共用一个「上传中」状态，用于禁用文件选择与提交按钮。
  async function runUpload(task) {
    pending.value += 1
    try {
      return await task()
    } finally {
      pending.value -= 1
    }
  }

  return { uploading, uploadFile, runUpload }
}
