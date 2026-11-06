<script setup>
import { Delete, Edit } from '@element-plus/icons-vue'

defineProps({
  deities: { type: Array, required: true },
  deletingId: { type: [Number, String], default: null },
})

// 事件说明：edit 打开编辑弹窗。
const emit = defineEmits(['edit', 'delete'])

// 神像分类字典（接口 category：1.财运 2.健康 3.事业 4.平安 5.学业）。
const categoryText = { 1: '财运', 2: '健康', 3: '事业', 4: '平安', 5: '学业' }

// 接口 tag 为逗号分割字符串，展示时换为顿号。
function tagText(tag) {
  return String(tag || '').split(/[,，]/).map((item) => item.trim()).filter(Boolean).join('、')
}
</script>

<template>
  <div class="deity-grid">
    <article v-for="deity in deities" :key="deity.id" class="deity-card">
      <header class="deity-head">
        <img v-if="deity.image" v-media-preview="deity.image" :src="deity.image" class="deity-thumb-img" alt="供奉样式图" />
        <span v-else class="deity-thumb">{{ deity.name.slice(0, 1) }}</span>
        <div class="deity-head-text">
          <strong>{{ deity.name }}</strong>
          <p>{{ deity.description }}</p>
        </div>
      </header>

      <div class="deity-meta">
        <span>{{ categoryText[deity.category] || '未分类' }}</span>
        <span v-if="tagText(deity.tag)">标签：{{ tagText(deity.tag) }}</span>
      </div>

      <div class="card-actions">
        <el-button class="edit-button" @click="emit('edit', deity)">
          <el-icon><Edit /></el-icon>
          <span>编辑</span>
        </el-button>
        <el-button class="delete-button" :loading="deletingId === deity.id" :disabled="deletingId !== null" @click="emit('delete', deity)">
          <el-icon><Delete /></el-icon>
          <span>删除</span>
        </el-button>
      </div>
    </article>
  </div>
</template>

<style scoped lang="less">
.deity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 14px;
  padding: 16px 20px 20px;
}

.deity-card {
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: var(--admin-primary);
    box-shadow: var(--admin-shadow-card);
  }
}

.deity-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.deity-thumb {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--admin-text-secondary);
  font-size: 16px;
  background: var(--admin-primary-lighter);
  border: 1px solid var(--admin-border);
  border-radius: 9px;
}

.deity-thumb-img {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  display: block;
  object-fit: cover;
  border: 1px solid var(--admin-border);
  border-radius: 9px;
}

.deity-head-text {
  min-width: 0;

  strong {
    display: block;
    color: var(--admin-text-primary);
    font-size: 14px;
    font-weight: 600;
  }

  p {
    margin: 4px 0 0;
    color: var(--admin-text-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.deity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;

  span {
    padding: 1px 8px;
    color: var(--admin-primary);
    font-size: 12px;
    border: 1px solid var(--admin-primary-light-5);
    border-radius: var(--admin-radius-xs);
  }
}

.card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.edit-button,
.delete-button {
  height: 32px;
  margin: 0;
  padding: 0 14px;
  align-self: flex-start;
  color: var(--admin-text-inverse);
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  border-radius: 7px;

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-primary-hover);
    border-color: var(--admin-primary-hover);
  }
}

.delete-button {
  color: var(--admin-danger);
  background: var(--admin-surface);
  border-color: var(--admin-danger);

  &:hover,
  &:focus {
    color: var(--admin-danger);
    background: var(--admin-danger-light, #fff1f0);
    border-color: var(--admin-danger);
  }
}
</style>
