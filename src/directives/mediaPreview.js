import { openMediaPreview } from '../utils/mediaPreview'

function hasMedia(value, el) {
  if (Array.isArray(value)) return value.some((item) => hasMedia(item))
  if (value && typeof value === 'object') return hasMedia(value.url ?? value.src ?? value.list)
  if (typeof value === 'string') return Boolean(value.trim())
  if (typeof value === 'number') return true
  return Boolean(el?.getAttribute('src'))
}

function syncState(el, value) {
  const enabled = hasMedia(value, el)
  el.classList.toggle('media-preview-trigger', enabled)
  if (!enabled) return
  if (!el.hasAttribute('tabindex')) el.tabIndex = 0
  if (!el.hasAttribute('role')) el.setAttribute('role', 'button')
  if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', '点击查看大图')
}

export default {
  mounted(el, binding) {
    el.__mediaPreviewValue = binding.value
    syncState(el, binding.value)

    el.__mediaPreviewClick = (event) => {
      const value = el.__mediaPreviewValue
      if (!hasMedia(value, el)) return
      // 卡片整体往往还有选中/编辑事件，预览时不让点击继续冒泡。
      event.stopPropagation()
      openMediaPreview(value ?? el.getAttribute('src'))
    }
    el.__mediaPreviewKeydown = (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      el.__mediaPreviewClick(event)
    }

    el.addEventListener('click', el.__mediaPreviewClick)
    el.addEventListener('keydown', el.__mediaPreviewKeydown)
  },
  updated(el, binding) {
    el.__mediaPreviewValue = binding.value
    syncState(el, binding.value)
  },
  unmounted(el) {
    el.removeEventListener('click', el.__mediaPreviewClick)
    el.removeEventListener('keydown', el.__mediaPreviewKeydown)
  },
}
