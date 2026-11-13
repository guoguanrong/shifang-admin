<script setup>
import { useSubmitGuard } from '../../utils/submitGuard'
import { computed, reactive, ref, watch } from 'vue'

// 菜单新增/编辑弹窗：字段按 SysMenu 定义（required: title、type），
// 目录/菜单/按钮三种类型展示不同字段，与 RuoYi 菜单管理一致。
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  menu: { type: Object, default: null },
  parentId: { type: Number, default: 0 },
  // 新增子项时按父级推荐的类型：目录下挂菜单、菜单下挂按钮。
  defaultType: { type: Number, default: 1 },
  // 上级菜单树：[{ id: 0, title: '主类目', children: [...] }]
  parentOptions: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save'])
// 弹窗层再挡一次连点，父级 saving 通过 prop 异步回传前也不会重复 emit。
const { allowSubmit } = useSubmitGuard({ cooldown: 300 })

const TYPE_OPTIONS = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
]
// 图标沿用项目侧边栏的 Element Plus 图标名，允许手填。
const ICON_OPTIONS = [
  'Menu', 'Grid', 'List', 'Document', 'Folder', 'Setting', 'Tools', 'DataBoard',
  'User', 'UserFilled', 'Avatar', 'Key', 'Clock', 'Calendar', 'EditPen', 'View',
  'Search', 'Plus', 'Delete', 'Tickets', 'Ticket', 'Wallet', 'Goods', 'Flag',
  'Monitor', 'Notification', 'Postcard', 'Present', 'Sunny', 'MagicStick',
]

const formRef = ref(null)
const form = reactive({
  title: '',
  pid: 0,
  type: 1,
  seq: 1,
  path: '',
  component: '',
  perms: '',
  icon: '',
  external: false,
  keepAlive: false,
  queryParams: '',
  visible: true,
  status: 1,
  remark: '',
})

const rules = computed(() => ({
  title: [{ required: true, whitespace: true, message: '请输入菜单名称', trigger: 'blur' }],
  seq: [{ required: true, message: '请输入显示排序', trigger: 'blur' }],
  path: form.type === 3
    ? []
    : [{ required: true, whitespace: true, message: '请输入路由地址', trigger: 'blur' }],
}))

watch(() => props.modelValue, (visible) => {
  if (!visible) return
  const source = props.menu
  form.title = source?.title || ''
  form.pid = source ? Number(source.pid ?? 0) : Number(props.parentId || 0)
  form.type = Number(source?.type ?? props.defaultType ?? 1)
  form.seq = Number(source?.seq ?? 1)
  form.path = source?.path || ''
  form.component = source?.component || ''
  form.perms = source?.perms || ''
  form.icon = source?.icon || ''
  form.external = Number(source?.linkType ?? 1) === 2
  form.keepAlive = Boolean(source?.keepAlive)
  form.queryParams = source?.queryParams || ''
  form.visible = !Boolean(source?.hidden)
  form.status = Number(source?.status ?? 1)
  form.remark = source?.remark || ''
  formRef.value?.clearValidate()
})

// 完整提交 SysMenu 字段，避免编辑时切换类型后旧值残留在后端。
function buildPayload() {
  const type = Number(form.type)
  const isButton = type === 3
  const isMenu = type === 2
  return {
    title: form.title.trim(),
    pid: Number(form.pid) || 0,
    type,
    seq: Number(form.seq) || 0,
    status: Number(form.status),
    remark: form.remark.trim(),
    path: isButton ? '' : form.path.trim(),
    component: isMenu ? form.component.trim() : '',
    perms: type === 1 ? '' : form.perms.trim(),
    icon: isButton ? '' : form.icon.trim(),
    linkType: form.external ? 2 : 1,
    keepAlive: isMenu ? form.keepAlive : false,
    queryParams: isMenu ? form.queryParams.trim() : '',
    hidden: isButton ? false : !form.visible,
  }
}

function submit() {
  if (props.saving || !allowSubmit()) return
  formRef.value.validate(async (valid) => {
    if (!valid) return
    emit('save', buildPayload())
    emit('update:modelValue', false)
  })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="menu ? '修改菜单' : '添加菜单'"
    width="720px"
    class="menu-dialog"
    destroy-on-close
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" @submit.prevent="submit">
      <el-form-item label="上级菜单">
        <el-tree-select
          v-model="form.pid"
          :data="parentOptions"
          :props="{ label: 'title', children: 'children' }"
          node-key="id"
          check-strictly
          placeholder="主类目"
        />
      </el-form-item>

      <el-form-item label="菜单类型">
        <el-radio-group v-model="form.type">
          <el-radio v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</el-radio>
        </el-radio-group>
      </el-form-item>

      <div class="form-grid">
        <el-form-item v-if="form.type !== 3" label="菜单图标">
          <el-select v-model="form.icon" filterable allow-create default-first-option clearable placeholder="点击选择图标">
            <el-option v-for="name in ICON_OPTIONS" :key="name" :label="name" :value="name" />
          </el-select>
        </el-form-item>

        <el-form-item label="菜单名称" prop="title">
          <el-input v-model="form.title" maxlength="30" placeholder="请输入菜单名称" />
        </el-form-item>

        <el-form-item label="显示排序" prop="seq">
          <el-input-number v-model="form.seq" :min="0" :max="9999" controls-position="right" />
        </el-form-item>

        <template v-if="form.type !== 3">
          <el-form-item label="路由地址" prop="path">
            <el-input v-model="form.path" placeholder="请输入路由地址" />
          </el-form-item>

          <el-form-item label="是否外链">
            <el-radio-group v-model="form.external">
              <el-radio :value="false">否</el-radio>
              <el-radio :value="true">是</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <template v-if="form.type === 2">
          <el-form-item label="组件路径">
            <el-input v-model="form.component" placeholder="如 system/user/index" />
          </el-form-item>

          <el-form-item label="权限字符">
            <el-input v-model="form.perms" placeholder="如 system:user:list" />
          </el-form-item>

          <el-form-item label="路由参数">
            <el-input v-model="form.queryParams" placeholder="访问路由的默认传递参数" />
          </el-form-item>

          <el-form-item label="是否缓存">
            <el-radio-group v-model="form.keepAlive">
              <el-radio :value="true">缓存</el-radio>
              <el-radio :value="false">不缓存</el-radio>
            </el-radio-group>
          </el-form-item>
        </template>

        <el-form-item v-if="form.type === 3" label="权限字符">
          <el-input v-model="form.perms" placeholder="如 system:user:query" />
        </el-form-item>

        <el-form-item v-if="form.type !== 3" label="显示状态">
          <el-radio-group v-model="form.visible">
            <el-radio :value="true">显示</el-radio>
            <el-radio :value="false">隐藏</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="菜单状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="saving" @click="submit">确定</el-button>
    </template>
  </el-dialog>
</template>

<style lang="less">
/* el-dialog 使用 append-to-body，样式按项目惯例写成带 .menu-dialog 前缀的全局规则。 */
.menu-dialog {
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 16px;

    .el-form-item { min-width: 0; }
    .el-input-number { width: 100%; }
  }

  .el-dialog__body { padding: 20px 24px 8px; }
  .el-form-item__label { color: var(--admin-text-regular); font-size: 13px; font-weight: 600; }
  .el-radio-group { flex-wrap: wrap; }
}

@media (max-width: 700px) {
  .menu-dialog .form-grid { grid-template-columns: 1fr; }
}
</style>
