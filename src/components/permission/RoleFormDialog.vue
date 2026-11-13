<script setup>
import { useSubmitGuard } from '../../utils/submitGuard'
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import RolePermissionTree from './RolePermissionTree.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // role: SysRoleVo 映射行 { id, name, key, menuIdList }
  role: { type: Object, default: null },
  // menus: POST /menu/list 的 SysMenuVo 树（type 1.目录 2.菜单 3.按钮）
  menus: { type: Array, required: true },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save'])
// 弹窗层再挡一次连点，父级 saving 通过 prop 异步回传前也不会重复 emit。
const { allowSubmit } = useSubmitGuard({ cooldown: 300 })
const formRef = ref(null)
const form = reactive({ name: '', key: '' })
// 提交给 POST /role/setMenu 的 RoleMenuDTO.menuIdList，含目录/菜单/按钮各层节点 id。
const menuIdList = ref([])

// /role/save 与 /role/update 的 required 都是 name + key，权限字符是接口必填项。
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

watch(() => props.modelValue, (visible) => {
  if (!visible) return
  form.name = props.role?.name || ''
  form.key = props.role?.key && props.role.key !== '—' ? props.role.key : ''
  menuIdList.value = [...(props.role?.menuIdList || [])]
  formRef.value?.clearValidate()
})

function submit() {
  if (props.saving || !allowSubmit()) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    if (!menuIdList.value.length) {
      ElMessage.warning('请至少勾选一项权限')
      return
    }
    emit('save', {
      name: form.name.trim(),
      key: form.key.trim(),
      menuIdList: [...menuIdList.value],
    })
    emit('update:modelValue', false)
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="新增/编辑"
    width="660px"
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
        <el-input v-model="form.key" maxlength="50" placeholder="如 admin、operator，接口必填" />
      </el-form-item>
      <el-form-item label="权限配置" class="permission-field">
        <RolePermissionTree v-model="menuIdList" :menus="menus" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="saving" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less">
.role-dialog {
  width: min(720px, calc(100vw - 28px)) !important;
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
  .permission-field .perm-box { width: 100%; max-height: 360px; }

  @media (max-width: 580px) {
    .el-dialog__header { padding: 20px 22px; }
    .el-dialog__body { padding: 20px 22px 8px; }
    .el-dialog__footer { padding: 14px 22px; }
  }
}
</style>
