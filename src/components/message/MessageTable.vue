<script setup>
import { computed, ref } from 'vue'
import { Delete, Edit, Hide, VideoPlay, View } from '@element-plus/icons-vue'
import ActionLink from '../common/ActionLink.vue'

defineProps({
  messages: { type: Array, required: true },
  total: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
})

// 事件说明：edit 打开新增/编辑弹窗，toggle 隐藏/恢复展示，remove 删除，page-change 由父级切换分页。
const emit = defineEmits(['edit', 'toggle', 'remove', 'page-change'])

// 展示状态字典：shown 展示中 / hidden 隐藏中。
const statusText = {
  shown: '展示中',
  hidden: '隐藏中',
}

// 分类标签配色：知名人士 金 / 道内人士 蓝 / 其他重要人士 灰。
function categoryClass(category) {
  if (category === '知名人士') return 'cat-known'
  if (category === '道内人士') return 'cat-taoist'
  return 'cat-other'
}

// 解析 imgArrUrls：后端返回 JSON 字符串（如 '["http://..."]'），也可能是数组或空值。
function parseImgArrUrls(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [value]
  }
}

// 媒体类型判断：优先按后端 type（1=视频 2=图片），未返回 type 时回退到素材字段。
function isVideoMessage(row) {
  const type = Number(row.type)
  if (type === 1 || type === 2) return type === 1
  return Boolean(row.videoUrl)
}

function isImageMessage(row) {
  const type = Number(row.type)
  if (type === 1 || type === 2) return type === 2
  if (Array.isArray(row.images) && row.images.length) return true
  return parseImgArrUrls(row.imgArrUrls).length > 0
}

// 缩略图：取图片列表第一张（兼容已映射的 images 与原始 imgArrUrls）。
function getFirstImageUrl(row) {
  if (Array.isArray(row.images) && row.images.length) {
    return row.images.map((image) => image.remoteUrl || image.url).find(Boolean) || ''
  }
  return parseImgArrUrls(row.imgArrUrls)[0] || ''
}

// 媒体预览弹窗：点击媒体标签查看视频或图片。
const previewVisible = ref(false)
const previewRow = ref(null)

const previewIsVideo = computed(() => Boolean(previewRow.value) && isVideoMessage(previewRow.value))
const previewTitle = computed(() => (previewIsVideo.value ? '视频预览' : '图片预览'))

const previewImageUrls = computed(() => {
  const row = previewRow.value
  if (!row || previewIsVideo.value) return []
  if (Array.isArray(row.images) && row.images.length) {
    return row.images.map((image) => image.remoteUrl || image.url).filter(Boolean)
  }
  return parseImgArrUrls(row.imgArrUrls)
})

function openPreview(row) {
  previewRow.value = row
  previewVisible.value = true
}

// 关闭后清空行数据，销毁 video 元素以停止播放。
function closePreview() {
  previewVisible.value = false
  previewRow.value = null
}
</script>

<template>
  <!-- 单根容器：视图层的 v-loading 依赖根元素继承，多根结构会导致指令失效。 -->
  <div class="table-block">
    <el-table class="message-table" border :data="messages" row-key="id">
      <el-table-column label="寄语媒体" min-width="90">
        <template #default="{ row }">
          <span
            v-if="isVideoMessage(row)"
            class="media-thumb video-thumb"
            title="点击预览视频"
            @click="openPreview(row)"
          >
            <el-icon :size="20"><VideoPlay /></el-icon>
          </span>
          <el-image
            v-else-if="isImageMessage(row)"
            :src="getFirstImageUrl(row)"
            fit="cover"
            class="media-thumb"
            title="点击预览图片"
            @click="openPreview(row)"
          >
            <template #error>
              <span class="media-thumb-fallback">图</span>
            </template>
          </el-image>
          <span v-else class="media-thumb empty-thumb">—</span>
        </template>
      </el-table-column>
      <el-table-column label="分类" min-width="110">
        <template #default="{ row }">
          <span :class="['soft-tag', categoryClass(row.category)]">{{ row.category }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="寄语标题" min-width="130" show-overflow-tooltip />
      <el-table-column prop="content" label="寄语内容" min-width="220" show-overflow-tooltip />
      <el-table-column prop="detail" label="详细内容" min-width="280" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="新增时间" min-width="165" />
      <el-table-column label="展示状态" min-width="90">
        <template #default="{ row }">
          <span :class="['soft-tag', row.status]">{{ statusText[row.status] }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <ActionLink :icon="Edit" text="编辑" @click="emit('edit', row)" />
          <ActionLink
            v-if="row.status === 'shown'"
            :icon="Hide"
            text="隐藏"
            @click="emit('toggle', row)"
          />
          <template v-else>
            <ActionLink :icon="View" text="恢复展示" @click="emit('toggle', row)" />
            <ActionLink :icon="Delete" text="删除" danger @click="emit('remove', row)" />
          </template>
        </template>
      </el-table-column>
    </el-table>

    <footer class="table-footer">
      <span>共 {{ total }} 条&nbsp; · &nbsp;每页 10 条</span>
      <el-pagination
        :current-page="currentPage"
        background
        layout="prev, pager, next"
        :page-size="10"
        :pager-count="5"
        :total="total"
        @current-change="emit('page-change', $event)"
      />
    </footer>

    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="680px"
      align-center
      destroy-on-close
      @closed="closePreview"
    >
      <video
        v-if="previewIsVideo"
        :key="previewRow?.videoUrl"
        :src="previewRow?.videoUrl"
        controls
        class="preview-video"
      />
      <div v-else class="preview-images">
        <el-image
          v-for="(url, index) in previewImageUrls"
          :key="`${url}-${index}`"
          :src="url"
          :preview-src-list="previewImageUrls"
          :initial-index="index"
          fit="cover"
          preview-teleported
          class="preview-image"
        />
      </div>
    </el-dialog>

  </div>
</template>

<style scoped lang="less">
.message-table {
  --el-table-border-color: var(--admin-border);
  --el-table-header-bg-color: var(--admin-surface-muted);
  --el-table-header-text-color: var(--admin-text-primary);
  --el-table-text-color: var(--admin-text-regular);
  --el-table-row-hover-bg-color: var(--admin-row-hover);
  width: 100%;
  font-family: inherit;
  font-size: 13px;

  :deep(th.el-table__cell) {
    height: 48px;
    font-weight: 600;
  }

  :deep(td.el-table__cell) {
    height: 56px;
    padding: 4px 0;
  }
}

.media-thumb {
  width: 64px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--admin-radius-sm);
  overflow: hidden;
  color: var(--admin-text-secondary);
  font-size: 12px;

  &.video-thumb {
    color: var(--admin-text-inverse);
    background: #2f3238;
  }

  &.empty-thumb {
    background: var(--admin-surface-muted);
    border: 1px solid var(--admin-border);
  }
}

.preview-video {
  display: block;
  width: 100%;
  max-height: 70vh;
  border-radius: var(--admin-radius-sm);
  background: #000;
}

.preview-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  .preview-image {
    width: 200px;
    height: 130px;
    border-radius: var(--admin-radius-sm);
  }
}

.soft-tag {
  display: inline-flex;
  min-width: 44px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--admin-radius-sm);

  &.cat-known { color: var(--admin-warning); background: var(--admin-warning-light); }
  &.cat-taoist { color: var(--admin-info); background: var(--admin-info-light); }
  &.cat-other { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
  &.shown { color: var(--admin-success); background: var(--admin-success-light); }
  &.hidden { color: var(--admin-text-secondary); background: var(--admin-neutral-light); }
}

.table-footer {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: var(--admin-text-secondary);
  font-size: 12px;

  :deep(.el-pagination.is-background .btn-prev),
  :deep(.el-pagination.is-background .btn-next),
  :deep(.el-pagination.is-background .el-pager li) {
    background: var(--admin-surface);
    border: 1px solid var(--admin-border);
    border-radius: var(--admin-radius-xs);
  }

  :deep(.el-pagination.is-background .el-pager li.is-active) {
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}
</style>
