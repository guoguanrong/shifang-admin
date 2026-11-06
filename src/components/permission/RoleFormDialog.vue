<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // role: SysRoleVo 映射行 { id, name, key, menuIdList }
  role: { type: Object, default: null },
  // menus: 后端菜单树（SysMenuVo，label 取 title），按钮节点为 type=3 的叶子
  menus: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref(null)
const treeRef = ref(null)
const form = reactive({ name: '', key: '' })

const rules = {
  name: [
    { required: true, whitespace: true, message: '请输入角色名称', trigger: 'blur' },
    { max: 30, message: '角色名称不能超过 30 个字符', trigger: 'blur' },
  ],
  key: [
    { required: true, whitespace: true, message: '请输入权限字符', trigger: 'blur' },
    { max: 50, message: '权限字符不能超过 50 个字符', trigger: 'blur' },
  ],
}

const treeProps = { label: 'title', children: 'children' }

// 回显只勾叶子节点：父节点交给 el-tree 父子联动推导，
// 否则 default-checked-keys 里的父节点会强制全选其子级。
const checkedKeysOnOpen = computed(() => {
  const leafIds = new Set()
  const walk = (nodes) => {
    nodes.forEach((node) => {
      if (node.children?.length) walk(node.children)
      else leafIds.add(node.id)
    })
  }
  walk(props.menus)
  return (props.role?.menuIdList || []).filter((id) => leafIds.has(id))
})

watch(() => props.modelValue, (visible) => {
  if (!visible) return
  form.name = props.role?.name || ''
  form.key = props.role?.key || ''
  formRef.value?.clearValidate()
})

function submit() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const checked = treeRef.value?.getCheckedKeys() || []
    const halfChecked = treeRef.value?.getHalfCheckedKeys() || []
    const menuIdList = [...checked, ...halfChecked]
    if (!checked.length) {
      ElMessage.warning('请至少选择一项权限')
      return
    }
    emit('save', { name: form.name.trim(), key: form.key.trim(), menuIdList })
    emit('update:modelValue', false)
  })
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
      <el-form-item label="权限字符" prop="key">
        <el-input v-model="form.key" maxlength="50" placeholder="如 admin、operator，用于前端权限标识" />
      </el-form-item>
      <el-form-item label="权限配置" class="permission-field">
        <el-tree
          ref="treeRef"
          :data="menus"
          node-key="id"
          :props="treeProps"
          show-checkbox
          default-expand-all
          :default-checked-keys="checkedKeysOnOpen"
        />
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
  .el-input__wrapper { min-height: 40px; border-radius: 8px; }
  .permission-field .el-form-item__content { display: block; }
  .permission-field .el-tree {
    width: 100%;
    max-height: 320px;
    padding: 8px 4px;
    overflow-y: auto;
    background: var(--admin-surface-muted);
    border: 1px solid var(--admin-border-light);
    border-radius: 8px;
  }

  @media (max-width: 580px) {
    .el-dialog__header { padding: 20px 22px; }
    .el-dialog__body { padding: 20px 22px 8px; }
    .el-dialog__footer { padding: 14px 22px; }
  }
}
</style>
