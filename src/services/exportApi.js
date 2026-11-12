import http, { SESSION_EXPIRED_CODE, handleSessionExpired } from './http'
import {
  extensionFromContentType,
  openRemoteFile,
  parseContentDisposition,
  saveBlobAsFile,
  timestampSuffix,
} from '../utils/fileDownload'

const EXPORT_TIMEOUT = 120000

// 响应头在 axios v1 中是 AxiosHeaders 实例，兼容普通对象取值。
function header(response, name) {
  return response.headers?.get?.(name) || response.headers?.[name] || ''
}

function createExportError(message) {
  const error = new Error(message)
  error.userMessage = message
  return error
}

function buildFilename(name, contentType, disposition) {
  const fromHeader = parseContentDisposition(disposition)
  const filename = fromHeader || `${name}_${timestampSuffix()}${extensionFromContentType(contentType)}`
  // 服务端给的文件名可能带路径分隔符，避免写出非法文件名。
  return filename.replace(/[/\\]/g, '_')
}

// 若后端不直接返回文件流，而是把文件地址/文件ID放在 data 里，则取出来继续下载。
function pickFileUrl(data) {
  if (typeof data === 'string') return data.trim()
  if (!data || typeof data !== 'object') return ''
  if (data.fileId != null) return `/sys/file/download/${data.fileId}`
  return String(data.url || data.fileUrl || data.downloadUrl || data.filePath || data.path || '').trim()
}

async function readJsonBody(blob) {
  const text = blob instanceof Blob ? await blob.text() : String(blob ?? '')
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

// Blob 响应下 axios 的错误体也是 Blob，统一拦截器取不到 msg，这里补解析出后端真实报错。
async function normalizeExportError(error) {
  const raw = error?.response?.data
  if (raw instanceof Blob) {
    const body = await readJsonBody(raw)
    if (body && typeof body === 'object') {
      const code = body.code ?? body.resCode
      if (Number(code) === SESSION_EXPIRED_CODE) handleSessionExpired()
      error.userMessage = body.msg || body.message || error.userMessage
    }
  }
  return error
}

async function downloadFileUrl(fileUrl, filename, fallbackName) {
  // 绝对地址直接交给浏览器；站内相对地址走统一实例，确保带上 clientId / Authorization。
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith('//')) {
    openRemoteFile(fileUrl, filename)
    return
  }

  let response
  try {
    response = await http.get(fileUrl, {
      responseType: 'blob',
      rawResponse: true,
      timeout: EXPORT_TIMEOUT,
    })
  } catch (error) {
    throw await normalizeExportError(error)
  }
  const contentType = header(response, 'content-type') || response.data?.type || ''
  const targetName = buildFilename(fallbackName, contentType, header(response, 'content-disposition'))

  if (!(response.data instanceof Blob) || response.data.size === 0) {
    throw createExportError('导出失败：文件内容为空')
  }
  saveBlobAsFile(response.data, targetName)
}

/**
 * 调用导出接口并落盘。文档中的导出接口声明为 application/json 空对象，
 * 实际上通常是 Excel 文件流，因此按 Blob 接收；同时兼容返回 JSON 错误码或文件地址的情况。
 */
export async function requestExport(path, params = {}, fallbackName = '导出数据') {
  let response
  try {
    response = await http.post(path, params, {
      responseType: 'blob',
      rawResponse: true,
      timeout: EXPORT_TIMEOUT,
    })
  } catch (error) {
    throw await normalizeExportError(error)
  }

  const contentType = header(response, 'content-type') || response.data?.type || ''
  const filename = buildFilename(fallbackName, contentType, header(response, 'content-disposition'))

  // 无 Content-Type 或返回 JSON 时，先尝试解析业务体（失败码 / 文件地址）。
  if (!contentType || contentType.includes('json')) {
    const body = await readJsonBody(response.data)
    if (body && typeof body === 'object') {
      const code = body.code ?? body.resCode
      if (code != null && Number(code) !== 1000 && code !== 'OK') {
        // Blob 响应跳过了统一拦截器的会话过期处理，这里补上。
        if (Number(code) === SESSION_EXPIRED_CODE) handleSessionExpired()
        throw createExportError(body.msg || body.message || '导出失败')
      }

      const fileUrl = pickFileUrl(body.data ?? body)
      if (!fileUrl) {
        throw createExportError(`导出失败：接口未返回文件${body.msg ? `（${body.msg}）` : ''}`)
      }
      await downloadFileUrl(fileUrl, filename, fallbackName)
      return
    }
  }

  if (!(response.data instanceof Blob) || response.data.size === 0) {
    throw createExportError('导出失败：接口未返回文件')
  }
  saveBlobAsFile(response.data, filename)
}

// POST /member/export，入参为 MemberDTO 的筛选字段，不传 page/pageSize，按条件导出全量。
export function exportMembers(params, filename = '会员列表') {
  return requestExport('/member/export', params, filename)
}

// POST /volunteer/export，入参 VolunteerDTO。
export function exportVolunteers(params, filename = '义工名单') {
  return requestExport('/volunteer/export', params, filename)
}

// POST /order/export，入参 OrderDTO（type 区分点灯/供奉/捐赠订单）。
export function exportOrders(params, filename = '订单列表') {
  return requestExport('/order/export', params, filename)
}

// POST /activityRegister/export，入参 ActivityRegisterDTO。
export function exportActivityRegistrations(params, filename = '报名记录') {
  return requestExport('/activityRegister/export', params, filename)
}
