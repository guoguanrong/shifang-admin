<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 物料包物品选择弹窗：网格展示可选物品，最多选 6 项，保存后回传选中 id。
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  materials: { type: Array, required: true },
  selectedIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

// 与原型一致：最多可选 6 个物品。
const MAX_COUNT = 6

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 每次打开时以外部选中状态为基准，避免上次操作的残留。
const selected = ref([])

watch(visible, (open) => {
  if (open) selected.value = [...props.selectedIds]
})

function isSelected(material) {
  return selected.value.includes(material.id)
}

// 点击卡片整体切换选中态；超出上限时阻断并提示。
function toggle(material) {
  const index = selected.value.indexOf(material.id)
  if (index >= 0) {
    selected.value.splice(index, 1)
    return
  }
  if (selected.value.length >= MAX_COUNT) {
    ElMessage.warning(`最多可选 ${MAX_COUNT} 个物品`)
    return
  }
  selected.value.push(material.id)
}

function save() {
  emit('save', [...selected.value])
  visible.value = false
}
</script>

<template>
  <el-dialog v-model="visible" title="选择物料包物品" width="680px">
    <div class="material-grid">
      <button
        v-for="material in materials"
        :key="material.id"
        type="button"
        :class="['material-card', { selected: isSelected(material) }]"
        @click="toggle(material)"
      >
        <i class="check-box" :class="{ checked: isSelected(material) }">✓</i>
        <img v-if="material.picture" class="material-thumb" :src="material.picture" :alt="material.name" />
        <span v-else class="material-thumb">图</span>
        <strong>{{ material.name }}</strong>
        <em>${{ material.price }} / {{ material.unit }}</em>
        <p>{{ material.useType || '未填写用途' }}</p>
      </button>
    </div>

    <footer class="dialog-footer">
      <span class="limit-tip">最多可选 {{ MAX_COUNT }} 个物品</span>
      <div class="footer-actions">
        <el-button @click="visible = false">取消</el-button>
        <el-button class="save-button" @click="save">保存</el-button>
      </div>
    </footer>
  </el-dialog>
</template>

<style scoped lang="less">
.material-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-height: 420px;
  overflow-y: auto;
}

.material-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  font-family: inherit;
  text-align: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-md);
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover {
    border-color: var(--admin-primary-light-5);
  }

  &.selected {
    background: var(--admin-primary-lighter);
    border-color: var(--admin-primary);
  }

  .check-box {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 16px;
    display: grid;
    place-items: center;
    color: transparent;
    font-size: 11px;
    font-style: normal;
    border: 1px solid var(--admin-border-strong);
    border-radius: var(--admin-radius-xs);
  }

  &.selected .check-box {
    color: var(--admin-text-inverse);
    background: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}

.material-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  display: grid;
  place-items: center;
  color: var(--admin-text-muted);
  background: var(--admin-surface-muted);
  border: 1px solid var(--admin-border);
  border-radius: var(--admin-radius-sm);
}

.material-card strong {
  margin-top: 4px;
  color: var(--admin-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.material-card em {
  color: var(--admin-text-regular);
  font-size: 12px;
  font-style: normal;
}

.material-card p {
  margin: 0;
  color: var(--admin-text-muted);
  font-size: 11px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;

  .limit-tip {
    color: var(--admin-text-secondary);
    font-size: 12px;
  }
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.save-button {
  color: var(--admin-text-inverse);
  background: var(--admin-primary);
  border-color: var(--admin-primary);

  &:hover,
  &:focus {
    color: var(--admin-text-inverse);
    background: var(--admin-primary-hover);
    border-color: var(--admin-primary-hover);
  }
}
</style>
