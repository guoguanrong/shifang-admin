<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDataOptions } from '../../services/dataSource'
import { uploadBusinessFile } from '../../services/businessApi'

// 新增/编辑活动弹窗：基本信息（图片/标题/副标题/标签）、法会信息（类型/时间/地点/报名）、
// 内容详情（简介/仪轨/功德利益/适用人群）、上架状态。保存时向上抛出 save 事件。
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  activity: { type: Object, default: null },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save'])

const MAX_IMAGES = 6
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const activityLocationOptions = getDataOptions('activityLocations')

// 报名状态字典：与接口 Activity.status 一致（1.待报名 2.报名中 3.报名停止 4.已结束）。
// 选「待报名」的道会全部展示在官网「道会活动 · 未来规划」中。
const registerStatusOptions = [
  { label: '待报名', value: 'pending' },
  { label: '报名中', value: 'enrolling' },
  { label: '报名停止', value: 'registrationStopped' },
  { label: '已结束', value: 'ended' },
]

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 编辑时的报名截止可能为文本（如「每月十四前一天」），未改动时原样保留。
const originalDeadline = ref('')
const specificRange = ref([])

const form = reactive({
  title: '',
  subtitle: '',
  tags: [],
  images: [],
  type: 'group',
  timeType: 'fixed',
  timeMode: 'monthly',
  monthDay: 1,
  weekday: 0,
  aheadDays: '',
  startTime: '09:00',
  endTime: '11:00',
  location: '',
  joinWay: '线上登记',
  quota: '',
  unlimited: false,
  deadline: '',
  intro: '',
  rituals: [],
  benefits: [],
  audiences: [],
  status: 'pending',
  listed: 'on',
})

// 每次打开时以传入活动为基准回填（新增则使用默认值）。
watch(visible, (open) => {
  if (!open) return
  const source = props.activity
  originalDeadline.value = source?.deadline ?? ''
  // 特定时间的起止日期由列表模型 specificRange 带回（接口 startTime/endTime）。
  specificRange.value = Array.isArray(source?.specificRange) ? [...source.specificRange] : []
  Object.assign(form, {
    title: source?.title ?? '',
    subtitle: source?.subtitle ?? '',
    tags: [...(source?.tags ?? [])],
    images: (source?.images ?? []).map((item) => ({ ...item })),
    type: source?.type ?? 'group',
    timeType: source?.timeType ?? 'fixed',
    timeMode: source?.timeMode ?? 'monthly',
    monthDay: source?.monthDay ?? 1,
    aheadDays: source?.aheadDays ?? '',
    weekday: 0,
    startTime: source?.startTime ?? '09:00',
    endTime: source?.endTime ?? '11:00',
    location: source?.location ?? '',
    joinWay: source?.joinWay && source.joinWay !== '线上登记 / 线下亲临' ? source.joinWay : '线上登记',
    quota: source ? (source.quota ?? '') : '',
    unlimited: source ? source.quota === null : false,
    deadline: source && /^\d{4}-\d{2}-\d{2}/.test(source.deadline ?? '') ? source.deadline : '',
    intro: source?.intro ?? '',
    rituals: (source?.rituals ?? []).map((item) => ({ ...item })),
    benefits: (source?.benefits ?? []).map((item) => (typeof item === 'string' ? { name: item, desc: '' } : { ...item })),
    audiences: [...(source?.audiences ?? [])],
    status: source
      ? (registerStatusOptions.some((item) => item.value === source.status) ? source.status : null)
      : 'pending',
    listed: source?.listed === false ? 'off' : 'on',
  })
})

// 活动图片：本地多选追加，最多 6 张（重复选择会覆盖空位）。
function onImagesChange(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  for (const file of files) {
    if (form.images.length >= MAX_IMAGES) {
      ElMessage.warning(`最多上传 ${MAX_IMAGES} 张图片`)
      break
    }
    form.images.push({ url: URL.createObjectURL(file), file, label: '', caption: '' })
  }
}

function removeImage(index) {
  const [removed] = form.images.splice(index, 1)
  if (removed?.url) URL.revokeObjectURL(removed.url)
}

// 标签/适用人群：通过弹窗输入追加，去重。
async function appendChip(list, title) {
  try {
    const result = await ElMessageBox.prompt('请输入名称', title, {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValidator: (value) => (value && value.trim() ? true : '请输入名称'),
    })
    const text = result.value.trim()
    if (!list.includes(text)) list.push(text)
  } catch {
    // 用户取消输入时无需提示。
  }
}

const addTag = () => appendChip(form.tags, '新增标签')
const addAudience = () => appendChip(form.audiences, '新增人群')

function removeTag(index) {
  form.tags.splice(index, 1)
}

function removeAudience(index) {
  form.audiences.splice(index, 1)
}

// 法会仪轨：编号自动生成（按顺序），可增删。
function addRitual() {
  form.rituals.push({ title: '', subtitle: '' })
}

function removeRitual(index) {
  form.rituals.splice(index, 1)
}

// 功德利益：标题 + 说明，说明会展示在官网详情页，可增删。
function addBenefit() {
  form.benefits.push({ name: '', desc: '' })
}

function removeBenefit(index) {
  form.benefits.splice(index, 1)
}

// 本地新选的图先上传到文件服务，返回可提交的图片列表（已有 URL 的图原样保留）。
async function uploadPendingImages(images) {
  const result = []
  for (const image of images) {
    if (image.file) {
      const uploaded = await uploadBusinessFile(image.file)
      const url = uploaded?.url
      if (!url) throw new Error('图片上传成功但未返回图片地址')
      result.push({ ...image, url, file: undefined })
      continue
    }
    if (image.url) result.push({ ...image })
  }
  return result
}

// 依据表单生成列表展示的「活动时间」文本。
function buildTimeText() {
  if (form.type === 'appointment') {
    const aheadDays = Number(form.aheadDays)
    return Number.isFinite(aheadDays) && aheadDays > 0 ? `预约制 · 提前 ${aheadDays} 日` : '预约制'
  }
  if (form.timeType === 'specific') {
    const [start, end] = specificRange.value ?? []
    return start && end ? `${start} - ${end}` : '时间另行通知'
  }
  if (form.timeMode === 'monthly') {
    return `每月 ${form.monthDay} 日 ${form.startTime} - ${form.endTime}`
  }
  return `每周${WEEKDAYS[form.weekday]} ${form.startTime} - ${form.endTime}`
}

// 提交：标题必填，图片先上传，再组装 payload 交由父级写入接口。
async function submitActivity() {
  if (props.saving) return
  if (!form.title.trim()) {
    ElMessage.warning('请输入活动标题')
    return
  }

  if (form.type !== 'appointment' && form.timeType === 'specific' && specificRange.value.length !== 2) {
    ElMessage.warning('请选择完整的活动时间')
    return
  }

  if (form.type !== 'appointment' && form.timeType === 'fixed' && (!form.startTime || !form.endTime || form.startTime >= form.endTime)) {
    ElMessage.warning('结束时间必须晚于开始时间')
    return
  }

  const quota = Number(form.quota)
  if (!form.unlimited && (!Number.isInteger(quota) || quota <= 0)) {
    ElMessage.warning('报名人数必须是大于 0 的整数')
    return
  }

  // 本地新选的图先上传，拿到正式 URL 后再提交（接口 pictureUrls 只保存逗号串）。
  let images
  try {
    images = await uploadPendingImages(form.images)
  } catch (error) {
    ElMessage.error(error.userMessage || error.message || '活动图片上传失败')
    return
  }

  emit('save', {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    tags: [...form.tags],
    images,
    aheadDays: form.aheadDays === '' ? null : Number(form.aheadDays),
    specificRange: [...specificRange.value],
    type: form.type,
    timeType: form.timeType,
    timeMode: form.timeMode,
    monthDay: form.monthDay,
    startTime: form.startTime,
    endTime: form.endTime,
    timeText: buildTimeText(),
    location: form.location,
    joinWay: form.joinWay,
    quota: form.unlimited ? null : quota,
    deadline: form.deadline || originalDeadline.value,
    intro: form.intro.trim(),
    rituals: form.rituals.map((item) => ({ ...item })),
    benefits: form.benefits
      .map((item) => ({ name: item.name.trim(), desc: item.desc.trim() }))
      .filter((item) => item.name || item.desc),
    audiences: [...form.audiences],
    status: form.status,
    listed: form.listed === 'on',
  })
  // 弹窗由父级在保存成功后关闭，失败时保留已填内容。
}
</script>

<template>
  <el-dialog v-model="visible" title="新增/编辑" width="680px" top="4vh" class="activity-dialog">
    <el-form class="activity-form" label-position="top" @submit.prevent>
      <p class="section-label">基本信息</p>

      <el-form-item label="活动图片 (最多 6 张)">
        <div class="image-grid">
          <div v-for="(image, index) in form.images" :key="index" class="image-tile">
            <img v-if="image.url" :src="image.url" alt="活动图片" />
            <template v-else>
              <strong>{{ image.label }}</strong>
              <span>{{ image.caption }}</span>
            </template>
            <i class="tile-remove" role="button" tabindex="0" @click="removeImage(index)" @keydown.enter.prevent="removeImage(index)">×</i>
          </div>
          <label v-if="form.images.length < MAX_IMAGES" class="image-add">
            <input type="file" accept="image/*" multiple @change="onImagesChange" />
            <span class="add-body">
              <span class="add-icon">＋</span>
              <span class="add-text">上传图片</span>
              <em>{{ form.images.length }}/{{ MAX_IMAGES }}</em>
            </span>
          </label>
        </div>
        <p class="field-tip">上传后展示于用户端活动详情轮播图，最多 6 张</p>
      </el-form-item>

      <el-form-item label="活动标题" required>
        <el-input v-model="form.title" placeholder="请输入活动标题" maxlength="40" />
      </el-form-item>
      <el-form-item label="活动副标题">
        <el-input v-model="form.subtitle" placeholder="请输入活动副标题" maxlength="40" />
      </el-form-item>
      <el-form-item label="活动标签">
        <div class="chip-row">
          <span v-for="tag in form.tags" :key="tag" class="chip">
            {{ tag }}
            <i role="button" tabindex="0" @click="removeTag(form.tags.indexOf(tag))" @keydown.enter.prevent="removeTag(form.tags.indexOf(tag))">×</i>
          </span>
          <el-button class="chip-add" @click="addTag">+ 新增标签</el-button>
        </div>
      </el-form-item>

      <p class="section-label">法会信息</p>

      <el-form-item label="法会类型">
        <el-radio-group v-model="form.type">
          <el-radio value="group">集体活动</el-radio>
          <el-radio value="appointment">专场预约</el-radio>
        </el-radio-group>
        <p class="field-tip">集体活动按法会时间参加;专场预约需用户提前预约</p>
      </el-form-item>

      <el-form-item label="时间类型">
        <el-radio-group v-model="form.timeType">
          <el-radio value="fixed">固定时间</el-radio>
          <el-radio value="specific">特定时间</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.type === 'appointment'" label="提前预约天数">
        <el-input v-model="form.aheadDays" type="number" min="0" placeholder="请输入提前天数" class="ahead-input" />
        <p class="field-tip">专场预约需用户提前若干天预约，对应接口字段 aheadDays。</p>
      </el-form-item>

      <template v-if="form.timeType === 'fixed'">
        <el-form-item label="固定方式">
          <el-radio-group v-model="form.timeMode">
            <el-radio value="monthly">每月单日</el-radio>
            <el-radio value="daily">每日时段</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.timeMode === 'monthly'" label="每月单日">
          <div class="inline-row">
            <span>每月</span>
            <el-select v-model="form.monthDay" class="day-select">
              <el-option v-for="day in 31" :key="day" :label="String(day)" :value="day" />
            </el-select>
            <span>日 · 时段</span>
            <el-time-picker v-model="form.startTime" value-format="HH:mm" format="HH:mm" placeholder="开始" />
            <span>至</span>
            <el-time-picker v-model="form.endTime" value-format="HH:mm" format="HH:mm" placeholder="结束" />
          </div>
        </el-form-item>
        <el-form-item v-else label="每日时段">
          <div class="inline-row">
            <span>每周</span>
            <el-select v-model="form.weekday" class="day-select">
              <el-option v-for="(day, index) in WEEKDAYS" :key="day" :label="`周${day}`" :value="index" />
            </el-select>
            <span>· 时段</span>
            <el-time-picker v-model="form.startTime" value-format="HH:mm" format="HH:mm" placeholder="开始" />
            <span>至</span>
            <el-time-picker v-model="form.endTime" value-format="HH:mm" format="HH:mm" placeholder="结束" />
          </div>
        </el-form-item>
      </template>
      <el-form-item v-else label="特定时间">
        <el-date-picker
          v-model="specificRange"
          type="datetimerange"
          value-format="YYYY-MM-DD HH:mm:ss"
          format="YYYY/MM/DD HH:mm:ss"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
        />
      </el-form-item>

      <div class="form-row">
        <el-form-item label="法会地点">
          <el-select v-model="form.location" placeholder="请选择">
            <el-option v-for="item in activityLocationOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="参加方式">
          <el-select v-model="form.joinWay">
            <el-option label="线上登记" value="线上登记" />
            <el-option label="线下亲临" value="线下亲临" />
          </el-select>
        </el-form-item>
      </div>

      <div class="form-row">
        <el-form-item label="限定报名人数">
          <div class="quota-row">
            <el-input v-model="form.quota" type="number" placeholder="请输入人数" min="0" :disabled="form.unlimited" />
            <el-checkbox v-model="form.unlimited">不限</el-checkbox>
          </div>
        </el-form-item>
        <el-form-item label="报名截止时间">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY/MM/DD HH:mm:ss"
            placeholder="请选择时间"
          />
          <p class="field-tip">截止后停止登记,用户端展示</p>
        </el-form-item>
      </div>

      <p class="section-label">内容详情</p>

      <el-form-item label="法会简介">
        <el-input v-model="form.intro" type="textarea" :rows="4" placeholder="请输入法会简介" maxlength="500" show-word-limit />
      </el-form-item>

      <el-form-item label="法会仪轨">
        <div class="ritual-list">
          <div v-for="(ritual, index) in form.rituals" :key="index" class="ritual-item">
            <span class="ritual-index">{{ index + 1 }}</span>
            <div class="ritual-fields">
              <div class="ritual-line">
                <el-input v-model="ritual.title" placeholder="请输入仪轨名称" maxlength="30" />
                <el-button class="mini-remove" @click="removeRitual(index)">删除</el-button>
              </div>
              <el-input v-model="ritual.subtitle" placeholder="请输入仪轨说明" maxlength="60" />
            </div>
          </div>
          <el-button class="chip-add" @click="addRitual">+ 新增仪轨</el-button>
          <p class="field-tip">依古制行科演教,编号自动生成</p>
        </div>
      </el-form-item>

      <el-form-item label="参加法会的功德利益">
        <div class="benefit-list">
          <div v-for="(benefit, index) in form.benefits" :key="index" class="benefit-line">
            <el-input v-model="benefit.name" class="benefit-name" placeholder="请输入功德利益" maxlength="50" />
            <el-input v-model="benefit.desc" placeholder="请输入说明" maxlength="120" />
            <el-button class="mini-remove" @click="removeBenefit(index)">删除</el-button>
          </div>
          <el-button class="chip-add" @click="addBenefit">+ 新增功德利益</el-button>
        </div>
      </el-form-item>

      <el-form-item label="适用人群">
        <div class="chip-row">
          <span v-for="audience in form.audiences" :key="audience" class="chip">
            {{ audience }}
            <i role="button" tabindex="0" @click="removeAudience(form.audiences.indexOf(audience))" @keydown.enter.prevent="removeAudience(form.audiences.indexOf(audience))">×</i>
          </span>
          <el-button class="chip-add" @click="addAudience">+ 新增人群</el-button>
        </div>
      </el-form-item>

      <el-form-item label="报名状态" required>
        <el-select v-model="form.status" placeholder="请选择报名状态">
          <el-option v-for="item in registerStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <p class="field-tip">待报名的道会会全部列在官网「道会活动 · 未来规划」中展示。</p>
      </el-form-item>

      <el-form-item label="上架状态">
        <el-radio-group v-model="form.listed">
          <el-radio value="on">上架</el-radio>
          <el-radio value="off">暂不上架</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button class="save-button" :loading="saving" @click="submitActivity">提交</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="less">
.activity-form {
  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__content) {
    display: block;
  }

  :deep(.el-select),
  :deep(.el-date-editor.el-input),
  :deep(.el-date-editor.el-input__wrapper) {
    width: 100%;
  }
}

.section-label {
  margin: 0 0 12px;
  padding-bottom: 8px;
  color: var(--admin-text-secondary);
  font-size: 13px;
  border-bottom: 1px dashed var(--admin-border);
}

.image-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px;
  text-align: center;
  background: linear-gradient(145deg, #2c3a33, #4a4438);

  strong {
    color: #e8d9ae;
    font-size: 12px;
    font-weight: 600;
  }

  span {
    color: rgba(255, 255, 255, 0.65);
    font-size: 10px;
    transform: scale(0.9);
  }
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    color: var(--admin-warning);
    background: var(--admin-warning-light);
    font-size: 12px;
    border-radius: var(--admin-radius-sm);

    i {
      color: var(--admin-text-secondary);
      font-size: 13px;
      font-style: normal;
      cursor: pointer;

      &:hover {
        color: var(--admin-danger);
      }
    }
  }
}

.chip-add {
  height: 24px;
  margin: 0;
  padding: 0 10px;
  color: var(--admin-text-regular);
  border-color: var(--admin-border-strong);
  border-radius: var(--admin-radius-sm);

  &:hover,
  &:focus {
    color: var(--admin-primary);
    border-color: var(--admin-primary);
  }
}

.field-tip {
  margin: 6px 0 0;
  color: var(--admin-text-muted);
  font-size: 12px;
}

.ahead-input {
  width: 180px;
}

.inline-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--admin-text-regular);
  font-size: 13px;
  white-space: nowrap;

  .day-select {
    width: 90px;
  }

  :deep(.el-time-picker) {
    width: 110px;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.quota-row {
  display: flex;
  align-items: center;
  gap: 10px;

  .el-input {
    flex: 1;
  }
}

.ritual-list,
.benefit-list {
  width: 100%;
  min-width: 0;
}

.ritual-item {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
  margin-bottom: 10px;
}

.ritual-index {
  width: 22px;
  height: 22px;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 5px;
  color: var(--admin-text-secondary);
  font-size: 12px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  background: var(--admin-surface-muted);
  border: 1px solid var(--admin-border);
  border-radius: 50%;
}

.ritual-fields {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ritual-line,
.benefit-line {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;

  .el-input {
    flex: 1;
    min-width: 0;
  }

  .mini-remove {
    flex: 0 0 auto;
  }

  .benefit-name {
    flex: 0 0 160px;
  }
}

.mini-remove {
  height: 26px;
  margin: 0;
  padding: 0 12px;
  color: var(--admin-text-regular);
  border-color: var(--admin-border-strong);
  border-radius: var(--admin-radius-sm);

  &:hover,
  &:focus {
    color: var(--admin-danger);
    border-color: var(--admin-danger);
  }
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
