<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  account: { type: Object, default: null },
  roles: { type: Array, required: true },
  accountNames: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'save'])
const formRef = ref(null)
const form = reactive({ username: '', name: '', roleId: '', status: 'enabled' })

const rules = {
  username: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/, message: '4-32 位字母、数字或下划线，且以字母开头', trigger: 'blur' },
    { validator: (_rule, value, callback) => {
      if (props.accountNames.some((name) => name.toLowerCase() === value.toLowerCase() && value !== props.account?.username)) callback(new Error('登录账号已存在'))
      else callback()
    }, trigger: 'blur' },
  ],
  name: [
    { required: true, whitespace: true, message: '请输入账号姓名', trigger: 'blur' },
    { max: 30, message: '账号姓名不能超过 30 个字符', trigger: 'blur' },
  ],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

watch(() => props.modelValue, (visible) => {
  if (!visible) return
  Object.assign(form, {
    username: props.account?.username || '',
    name: props.account?.name || '',
    roleId: props.account?.roleId || '',
    status: props.account?.status || 'enabled',
  })
  formRef.value?.clearValidate()
})

async function submit() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('save', { username: form.username.trim(), name: form.name.trim(), roleId: form.roleId, status: form.status })
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="account ? '编辑账号' : '新增账号'"
    width="540px"
    class="account-dialog"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
      <div v-if="!account" class="form-grid">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" maxlength="32" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="登录密码">
          <el-input model-value="默认登录密码 123456" disabled />
        </el-form-item>
      </div>
      <el-form-item label="账号姓名" prop="name" class="name-field">
        <el-input v-model="form.name" maxlength="30" placeholder="真实姓名" />
      </el-form-item>
      <el-form-item label="配置角色" prop="roleId">
        <el-tree-select v-model="form.roleId" :data="roles" node-key="id" check-strictly placeholder="请选择角色" />
        <div class="form-hint">按角色树逐层选择账号所属的角色</div>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status">
          <el-option label="启用" value="enabled" />
          <el-option label="禁用" value="disabled" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="submit">提交</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less">
.account-dialog {
  width: min(600px, calc(100vw - 28px)) !important;
  overflow: hidden;
  border: 1px solid var(--admin-border-light);
  border-radius: 16px;
  box-shadow: 0 24px 72px rgba(29, 54, 58, 0.18);

  .el-dialog__header {
    margin: 0;
    padding: 23px 28px;
    border-bottom: 1px solid var(--admin-border-light);
    background: linear-gradient(110deg, var(--admin-surface), var(--admin-primary-lighter));
  }
  .el-dialog__title { color: var(--admin-text-primary); font-size: 17px; font-weight: 650; }
  .el-dialog__body { padding: 24px 28px 12px; }
  .el-dialog__footer {
    padding: 16px 28px;
    border-top: 1px solid var(--admin-border-light);
    background: var(--admin-surface-muted);
  }
  .el-dialog__footer .el-button { min-width: 72px; height: 36px; border-radius: 8px; }
  .el-form-item { margin-bottom: 22px; }
  .el-form-item__label { padding-bottom: 8px; color: var(--admin-text-regular); font-size: 13px; font-weight: 600; }
  .el-select { width: 100%; }
  .el-input__wrapper, .el-select__wrapper { min-height: 40px; border-radius: 8px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .name-field { max-width: calc(50% - 10px); }
  .form-hint { color: var(--admin-text-secondary); font-size: 12px; line-height: 1.5; margin-top: 7px; }

  @media (max-width: 580px) {
    .el-dialog__header { padding: 20px 22px; }
    .el-dialog__body { padding: 20px 22px 8px; }
    .el-dialog__footer { padding: 14px 22px; }
    .form-grid { grid-template-columns: 1fr; gap: 0; }
    .name-field { max-width: none; }
  }
}
</style>
