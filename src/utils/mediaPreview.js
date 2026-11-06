import { reactive } from 'vue'

// 列表缩略图点击后的全局预览状态，由 App.vue 挂载的 MediaPreviewDialog 消费。
export const mediaPreview = reactive({
  visible: false,
  items: [],
  index: 0,
  title: '',
})

const VIDEO_URL = /\.(mp4|webm|ogg|ogv|mov|m4v|avi|mkv)(\?|#|$)/i

function guessType(url) {
  return VIDEO_URL.test(url) || /^data:video\//i.test(url) ? 'video' : 'image'
}

function toItem(entry) {
  if (typeof entry === 'string' || typeof entry === 'number') {
    const url = String(entry).trim()
    return url ? { url, type: guessType(url), title: '' } : null
  }
  if (!entry || typeof entry !== 'object') return null
  const url = String(entry.url ?? entry.src ?? '').trim()
  if (!url) return null
  const type = entry.type === 'video' || entry.type === 'image' ? entry.type : guessType(url)
  return { url, type, title: String(entry.title ?? '') }
}

function normalize(value, options = {}) {
  let list = value
  let index = options.index ?? 0
  let title = options.title ?? ''

  // 支持 { list, index, title } 形式，便于一个缩略图打开整组媒体。
  if (value && !Array.isArray(value) && typeof value === 'object' && 'list' in value) {
    list = value.list
    index = value.index ?? index
    title = value.title ?? title
  }

  const items = (Array.isArray(list) ? list : [list]).map(toItem).filter(Boolean)
  return { items, index, title }
}

export function openMediaPreview(value, options = {}) {
  const { items, index, title } = normalize(value, options)
  if (!items.length) return
  mediaPreview.items = items
  mediaPreview.index = Math.min(Math.max(index, 0), items.length - 1)
  mediaPreview.title = title
  mediaPreview.visible = true
}

export function closeMediaPreview() {
  mediaPreview.visible = false
  mediaPreview.items = []
  mediaPreview.index = 0
  mediaPreview.title = ''
}

export function stepMediaPreview(delta) {
  const count = mediaPreview.items.length
  if (count < 2) return
  mediaPreview.index = (mediaPreview.index + delta + count) % count
}

export function selectMediaPreview(index) {
  if (index >= 0 && index < mediaPreview.items.length) mediaPreview.index = index
}
