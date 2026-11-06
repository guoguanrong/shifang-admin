<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { closeMediaPreview, mediaPreview, selectMediaPreview, stepMediaPreview } from '../../utils/mediaPreview'

const current = computed(() => mediaPreview.items[mediaPreview.index] ?? null)
const multiple = computed(() => mediaPreview.items.length > 1)
const isVideo = computed(() => current.value?.type === 'video')
const imageFailed = ref(false)

watch(current, () => { imageFailed.value = false })

function onKeydown(event) {
  if (!mediaPreview.visible) return
  // 视频控件与输入框自身要响应左右键，不能抢走切换。
  const target = event.target
  if (['VIDEO', 'INPUT', 'TEXTAREA'].includes(target?.tagName) || target?.isContentEditable) return
  if (event.key === 'ArrowLeft') stepMediaPreview(-1)
  if (event.key === 'ArrowRight') stepMediaPreview(1)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <el-dialog
    v-model="mediaPreview.visible"
    :title="mediaPreview.title || (isVideo ? '视频预览' : '图片预览')"
    width="min(880px, 92vw)"
    align-center
    append-to-body
    destroy-on-close
    @closed="closeMediaPreview"
  >
    <div class="media-preview-stage">
      <button v-if="multiple" type="button" class="media-nav prev" aria-label="上一个" @click="stepMediaPreview(-1)">‹</button>

      <video
        v-if="isVideo"
        :key="current.url"
        :src="current.url"
        class="media-preview-content"
        controls
        autoplay
      />
      <img
        v-else-if="current && !imageFailed"
        :key="current.url"
        :src="current.url"
        class="media-preview-content"
        alt="预览图片"
        @error="imageFailed = true"
      />
      <p v-else-if="current" class="media-preview-empty">媒体加载失败，请检查地址是否可访问</p>

      <button v-if="multiple" type="button" class="media-nav next" aria-label="下一个" @click="stepMediaPreview(1)">›</button>
    </div>

    <div v-if="multiple" class="media-preview-bar">
      <span class="media-preview-count">{{ mediaPreview.index + 1 }} / {{ mediaPreview.items.length }}</span>
      <div class="media-preview-thumbs">
        <button
          v-for="(item, index) in mediaPreview.items"
          :key="`${item.url}-${index}`"
          type="button"
          :class="['media-preview-thumb', { active: index === mediaPreview.index }]"
          :aria-label="`查看第 ${index + 1} 个`"
          @click="selectMediaPreview(index)"
        >
          <img v-if="item.type !== 'video'" :src="item.url" :alt="`第 ${index + 1} 张`" />
          <span v-else>▶</span>
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="less">
.media-preview-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 12px 46px;
  background: #1b2026;
  border-radius: var(--admin-radius-md);
  overflow: hidden;
}

.media-preview-content {
  display: block;
  max-width: 100%;
  max-height: 66vh;
  object-fit: contain;
  background: #11151a;
}

.media-preview-empty {
  margin: 0;
  color: #c9d0d8;
  font-size: 13px;
}

.media-nav {
  position: absolute;
  top: 50%;
  z-index: 1;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  transform: translateY(-50%);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  background: rgba(0, 0, 0, 0.45);
  border: 0;
  border-radius: 50%;
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.72);
  }

  &.prev { left: 8px; }
  &.next { right: 8px; }
}

.media-preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.media-preview-count {
  color: var(--admin-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.media-preview-thumbs {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.media-preview-thumb {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  overflow: hidden;
  color: #fff;
  font-size: 14px;
  background: var(--admin-surface-muted);
  border: 2px solid transparent;
  border-radius: var(--admin-radius-sm);
  cursor: pointer;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.active {
    border-color: var(--admin-primary);
  }
}
</style>
