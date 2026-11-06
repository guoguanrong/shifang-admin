<script setup>
import { Delete, Edit } from '@element-plus/icons-vue'

defineProps({
  lamps: { type: Array, required: true },
})

// 事件说明：edit 打开新增/编辑弹窗。
const emit = defineEmits(['edit', 'delete'])

function getMaterialSummary(lamp) {
  const names = (lamp.shopItemsList || []).map((item) => item.name).filter(Boolean)
  if (names.length) return names.join('、')
  return `${(lamp.shopItemsIds || lamp.shopItems || []).length} 项`
}
</script>

<template>
  <div class="lamp-grid">
    <article v-for="lamp in lamps" :key="lamp.id" class="lamp-card">
      <header class="lamp-head">
        <img v-if="lamp.image || lamp.picture" v-media-preview="lamp.image || lamp.picture" :src="lamp.image || lamp.picture" class="lamp-thumb-img" alt="灯图片" />
        <span v-else class="lamp-thumb">灯</span>
        <div class="lamp-head-text">
          <strong>{{ lamp.name }}</strong>
          <p>匹配神像：{{ lamp.matchGod || '未配置' }}</p>
        </div>
      </header>

      <p class="lamp-applicable">物料：{{ getMaterialSummary(lamp) }}</p>

      <div class="lamp-meta">
        <span class="lamp-price">日供 ${{ lamp.dayPrice }}</span>
        <span class="lamp-price">月供 ${{ lamp.monthPrice }}</span>
        <span class="lamp-price">年供 ${{ lamp.yearPrice }}</span>
      </div>

      <div class="lamp-actions">
        <el-button class="edit-button" @click="emit('edit', lamp)">
          <el-icon><Edit /></el-icon>
          <span>编辑</span>
        </el-button>
        <el-button class="delete-button" @click="emit('delete', lamp)">
          <el-icon><Delete /></el-icon>
          <span>删除</span>
        </el-button>
      </div>
    </article>
  </div>
</template>

<style scoped lang="less">
.lamp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(196px, 1fr));
  gap: 14px;
  padding: 16px 20px 20px;
}

.lamp-card {
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

.lamp-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.lamp-thumb {
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

.lamp-thumb-img {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  display: block;
  object-fit: cover;
  border: 1px solid var(--admin-border);
  border-radius: 9px;
}

.lamp-head-text {
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

.lamp-applicable {
  margin: 10px 0 0;
  color: var(--admin-text-secondary);
  font-size: 12px;
}

.lamp-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
  margin-top: 10px;
}

.lamp-actions {
  display: flex;
  gap: 8px;
}

.lamp-price {
  flex: 0 0 auto;
  color: var(--admin-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.edit-button {
  height: 32px;
  margin: 12px 0 0;
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
  height: 32px;
  margin: 12px 0 0;
  padding: 0 12px;
  color: var(--admin-danger);
  border-color: var(--admin-danger-light);

  &:hover,
  &:focus {
    color: var(--admin-danger);
    background: var(--admin-danger-light);
    border-color: var(--admin-danger);
  }
}
</style>
