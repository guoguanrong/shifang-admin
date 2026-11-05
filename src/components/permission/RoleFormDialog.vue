<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PermissionTree from './PermissionTree.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  role: { type: Object, default: null },
  roles: { type: Array, required: true },
  groups: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref(null)
const form = reactive({ name: '', parentId: '', permissions: [] })

const rules = {
  name: [
    { required: true, whitespace: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 30, message: '角色名称不能超过 30 个字符', trigger: 'blur' },
    { validator: (_rule, value, callback) => {
      if (props.roles.some((role) => role.id !== props.role?.id && role.name.trim().toLowerCase() === value.trim().toLowerCase())) callback(new Error('角色名称已存在'))
      else callback()
    }, trigger: 'blur' },
  ],
}

const parentOptions = computed(() => {
  const excluded = new Set(props.role ? [props.role.id] : [])
  let changed = true
  while (changed) {
    changed = false
    props.roles.forEach((role) => {
      if (role.parentId && excluded.has(role.parentId) && !excluded.has(role.id)) {
        excluded.add(role.id)
        changed = true
      }
    })
  }
  const available = props.roles.filter((role) => !excluded.has(role.id))
  const byId = Object.fromEntries(available.map((role) => [role.id, { id: role.id, label: role.name, children: [] }]))
  const roots = []
  available.forEach((role) => {
    if (role.parentId && byId[role.parentId]) byId[role.parentId].children.push(byId[role.id])
    else roots.push(byId[role.id])
  })
  return roots
})

watch(() => props.modelValue, (visible) => {
  if (!visible) return
  Object.assign(form, {
    name: props.role?.name || '',
    parentId: props.role?.parentId || '',
    permissions: [...(props.role?.permissions || [])],
  })
  formRef.value?.clearValidate()
})

async function submit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  if (!form.permissions.length) {
    ElMessage.warning('请至少选择一项权限')
    return
  }
  emit('save', { name: form.name.trim(), parentId: form.parentId || null, permissions: [...form.permissions] })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="role ? '编辑角色' : '新增角色'"
    width="560px"
    class="role-dialog"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <el-form-item label="角色名称" prop="name">
        <el-input v-model="form.name" maxlength="30" placeholder="请输入角色名称" />
      </el-form-item>
      <el-form-item label="上级角色">
        <el-tree-select
          v-model="form.parentId"
          :data="parentOptions"
          node-key="id"
          check-strictly
          clearable
          placeholder="无上级角色"
        />
      </el-form-item>
      <el-form-item label="权限配置" class="permission-field">
        <PermissionTree v-model="form.permissions" :groups="groups" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less">
.role-dialog {
  width: min(640px, calc(100vw - 28px)) !important;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  margin-top: 5vh !important;
  overflow: hidden;
  border: 1px solid var(--admin-border-light);
  border-radius: 16px;
  box-shadow: 0 24px 72px rgba(29, 54, 58, 0.18);

  .el-dialog__header {
    margin: 0;
    padding: 22px 28px;
    border-bottom: 1px solid var(--admin-border-light);
    background: linear-gradient(110deg, var(--admin-surface), var(--admin-primary-lighter));
  }
  .el-dialog__title { color: var(--admin-text-primary); font-size: 17px; font-weight: 650; }
  .el-dialog__body { min-height: 0; overflow-y: auto; padding: 22px 28px 9px; }
  .el-dialog__footer { padding: 16px 28px; border-top: 1px solid var(--admin-border-light); background: var(--admin-surface-muted); }
  .el-dialog__footer .el-button { min-width: 72px; height: 36px; border-radius: 8px; }
  .el-form-item { margin-bottom: 19px; }
  .el-form-item__label { padding-bottom: 8px; color: var(--admin-text-regular); font-size: 13px; font-weight: 600; }
  .el-input__wrapper, .el-select__wrapper { min-height: 40px; border-radius: 8px; }
  .el-select { width: 100%; }
  .permission-field .el-form-item__content { display: block; }
  .permission-tree { width: 100%; }

  @media (max-width: 580px) {
    .el-dialog__header { padding: 20px 22px; }
    .el-dialog__body { padding: 20px 22px 8px; }
    .el-dialog__footer { padding: 14px 22px; }
  }
}
</style>
