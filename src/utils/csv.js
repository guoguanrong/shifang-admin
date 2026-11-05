const DANGEROUS_FORMULA_PREFIX = /^\s*[=+\-@]/

function escapeCsvCell(value) {
  let text = value == null ? '' : String(value)

  // 用户输入以公式标记开头时，Excel/WPS 可能将其作为公式执行。
  if (typeof value === 'string' && DANGEROUS_FORMULA_PREFIX.test(text)) {
    text = `'${text}`
  }

  // 所有单元格统一加双引号，同时按 CSV 规范将内部双引号写成两个双引号。
  return `"${text.replaceAll('"', '""')}"`
}

export function serializeCsv(headers, rows) {
  return `\uFEFF${[headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n')}`
}

export function downloadCsv(filename, headers, rows) {
  const csv = serializeCsv(headers, rows)
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
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
