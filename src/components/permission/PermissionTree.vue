<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  groups: { type: Array, required: true },
  modelValue: { type: Array, required: true },
  readonly: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const expandedGroups = ref(new Set())
const collapsedItems = ref(new Set())
const selected = computed(() => new Set(props.modelValue))
const allKeys = computed(() => props.groups.flatMap((group) => group.items.flatMap(itemKeys)))

function itemKeys(item) {
  return item.actions.map((_action, index) => `${item.id}:${index}`)
}

function groupKeys(group) {
  return group.items.flatMap(itemKeys)
}

function checked(keys) {
  return keys.length > 0 && keys.every((key) => selected.value.has(key))
}

function indeterminate(keys) {
  return keys.some((key) => selected.value.has(key)) && !checked(keys)
}

function updateKeys(keys, value) {
  const next = new Set(selected.value)
  keys.forEach((key) => value ? next.add(key) : next.delete(key))
  emit('update:modelValue', allKeys.value.filter((key) => next.has(key)))
}

function toggleExpanded(groupId) {
  const next = new Set(expandedGroups.value)
  if (next.has(groupId)) next.delete(groupId)
  else next.add(groupId)
  expandedGroups.value = next
}

function toggleItem(itemId) {
  const next = new Set(collapsedItems.value)
  if (next.has(itemId)) next.delete(itemId)
  else next.add(itemId)
  collapsedItems.value = next
}

function visibleItems(group) {
  return props.readonly ? group.items.filter((item) => itemKeys(item).some((key) => selected.value.has(key))) : group.items
}
</script>

<template>
  <div class="permission-tree" :class="{ 'is-readonly': readonly }">
    <div v-if="!readonly" class="select-all">
      <el-checkbox
        :model-value="checked(allKeys)"
        :indeterminate="indeterminate(allKeys)"
        @change="updateKeys(allKeys, $event)"
      >全选</el-checkbox>
      <span>勾选全部菜单及功能按钮</span>
    </div>

    <template v-for="group in groups" :key="group.id">
      <section v-if="!readonly || visibleItems(group).length" class="permission-group">
        <div class="group-heading">
          <span v-if="readonly" class="readonly-check">✓</span>
          <el-checkbox
            v-else
            :model-value="checked(groupKeys(group))"
            :indeterminate="indeterminate(groupKeys(group))"
            :aria-label="`选择${group.name}全部权限`"
            @change="updateKeys(groupKeys(group), $event)"
          />
          <button type="button" class="expand-button" :disabled="readonly" @click="toggleExpanded(group.id)">
            <strong>{{ group.name }}</strong>
            <span class="item-count">{{ group.items.length }} 项</span>
            <span v-if="!readonly" class="caret">{{ expandedGroups.has(group.id) ? '⌃' : '⌄' }}</span>
          </button>
        </div>

        <div v-if="readonly || expandedGroups.has(group.id)" class="group-content">
          <div v-for="item in visibleItems(group)" :key="item.id" class="permission-item">
            <div class="item-heading">
              <span v-if="readonly" class="readonly-check">✓</span>
              <el-checkbox
                v-else
                :model-value="checked(itemKeys(item))"
                :indeterminate="indeterminate(itemKeys(item))"
                :aria-label="`选择${item.name}全部操作`"
                @change="updateKeys(itemKeys(item), $event)"
              />
              <button type="button" :disabled="readonly" @click="toggleItem(item.id)">
                {{ item.name }}<span v-if="!readonly" class="item-caret">{{ collapsedItems.has(item.id) ? '⌄' : '⌃' }}</span>
              </button>
            </div>
            <div v-if="readonly || !collapsedItems.has(item.id)" class="actions">
              <template v-for="(action, index) in item.actions" :key="`${item.id}:${index}`">
                <button
                  v-if="!readonly || selected.has(`${item.id}:${index}`)"
                  type="button"
                  class="action-chip"
                  :class="{ selected: selected.has(`${item.id}:${index}`) }"
                  :disabled="readonly"
                  :aria-pressed="selected.has(`${item.id}:${index}`)"
                  @click="updateKeys([`${item.id}:${index}`], !selected.has(`${item.id}:${index}`))"
                >{{ action }}</button>
              </template>
            </div>
          </div>
        </div>
      </section>
    </template>
    <el-empty v-if="readonly && !modelValue.length" description="暂无权限" :image-size="72" />
  </div>
</template>

<style scoped lang="less">
.permission-tree {
  max-height: 315px;
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--admin-border-light);
  border-radius: 12px;
  background: var(--admin-surface-muted);
  scrollbar-width: thin;
  scrollbar-color: var(--admin-border-strong) transparent;
}
.permission-tree.is-readonly { max-height: 500px; }
.select-all,
.permission-group {
  border: 1px solid var(--admin-border-light);
  border-radius: 10px;
  background: var(--admin-surface);
}
.select-all {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 50px;
  margin-bottom: 11px;
  padding: 0 14px;
  background: var(--admin-surface);
  color: var(--admin-text-secondary);
  font-size: 12px;
  border-color: var(--admin-primary-light-7);
  box-shadow: inset 3px 0 0 var(--admin-primary);

  :deep(.el-checkbox) { margin-right: 0; }
  :deep(.el-checkbox__label) { color: var(--admin-text-primary); font-weight: 600; }
}
.permission-group {
  margin-bottom: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(38, 68, 75, 0.025);
}
.permission-group:last-child { margin-bottom: 0; }
.group-heading {
  display: flex;
  align-items: center;
  min-height: 51px;
  gap: 10px;
  padding: 0 14px;
  background: var(--admin-surface);
  transition: background 0.18s ease;

  :deep(.el-checkbox) { margin: 0; }
}
.permission-group:has(.group-content) .group-heading { background: var(--admin-primary-lighter); }
.expand-button,
.item-heading button {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 0;
  border: 0;
  color: var(--admin-text-primary);
  background: transparent;
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.expand-button strong { font-size: 13px; font-weight: 600; }
.expand-button:disabled { cursor: default; }
.item-count {
  margin-left: auto;
  padding: 3px 9px;
  border-radius: var(--admin-radius-pill);
  background: var(--admin-surface-muted);
  color: var(--admin-text-secondary);
  font-size: 11px;
  white-space: nowrap;
}
.caret { margin-left: 5px; color: var(--admin-primary); }
.group-content { padding: 6px 16px 14px 32px; border-top: 1px solid var(--admin-border-light); }
.permission-item { padding-top: 10px; }
.permission-item + .permission-item { margin-top: 9px; border-top: 1px dashed var(--admin-border-light); }
.item-heading { display: flex; align-items: center; gap: 9px; min-height: 28px; }
.item-heading button { font-size: 12px; font-weight: 500; }
.item-heading button:disabled { cursor: default; }
.item-caret { margin-left: auto; color: var(--admin-primary); }
.actions { display: flex; flex-wrap: wrap; gap: 7px; margin: 7px 0 4px 24px; }
.action-chip {
  min-height: 29px;
  padding: 4px 11px;
  border: 1px solid var(--admin-border-strong);
  border-radius: 7px;
  background: var(--admin-surface);
  color: var(--admin-text-regular);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}
.action-chip:hover:not(:disabled) { border-color: var(--admin-primary-light-5); color: var(--admin-primary-dark); }
.action-chip.selected { border-color: var(--admin-primary-light-7); color: var(--admin-primary-dark); background: var(--admin-primary-light); }
.action-chip.selected::before { margin-right: 5px; content: '✓'; font-size: 11px; }
.action-chip:disabled { cursor: default; }
.readonly-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  border-radius: 5px;
  background: var(--admin-primary);
  color: var(--admin-text-inverse);
  font-size: 11px;
}
.is-readonly .group-content { padding-left: 32px; }
</style>
