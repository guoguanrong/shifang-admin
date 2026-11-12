// 服务端导出接口返回文件流时，把 Blob 保存为本地文件。
export function saveBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.hidden = true
  document.body.appendChild(link)
  link.click()
  link.remove()

  // 等浏览器接管下载后再释放 URL，避免部分浏览器出现空文件。
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// 绝对地址通常是 OSS/CDN，交给浏览器直接下载（跨域时 download 属性会被忽略，但文件仍可取回）。
export function openRemoteFile(url, filename) {
  const link = document.createElement('a')

  link.href = url
  if (filename) link.download = filename
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.hidden = true
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Content-Disposition 支持 filename 与 RFC 5987 的 filename*=UTF-8''xxx。
export function parseContentDisposition(disposition) {
  if (!disposition) return ''

  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1].trim().replace(/^"|"$/g, ''))
    } catch {
      // 编码异常时回退到普通 filename 字段。
    }
  }

  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition)
  return plain ? plain[1].trim() : ''
}

const EXTENSION_BY_TYPE = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'application/octet-stream': '.xlsx',
  'text/csv': '.csv',
  'application/zip': '.zip',
}

export function extensionFromContentType(contentType = '') {
  const type = String(contentType).split(';')[0].trim().toLowerCase()
  return EXTENSION_BY_TYPE[type] || '.xlsx'
}

export function timestampSuffix() {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
}
