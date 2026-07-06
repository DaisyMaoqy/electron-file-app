<template>
  <div class="base-table">
    <!-- 操作按钮区域 -->
    <template v-if="!isReadOnly">
      <slot name="actions">
        <el-button v-if="showAdd" type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
        <slot name="extra-actions"></slot>
        <el-button v-if="showDelete" type="primary" :icon="Minus" @click="confirmDelete">批量删除</el-button>
      </slot>
      <span v-if="tipText" style="color: red; margin-left: 10px;">{{ tipText }}</span>
    </template>

    <el-form ref="formRef" :model="formModel">
      <el-table
        :key="tableKey"
        v-loading="loading"
        :data="currentPageData"
        tooltip-effect="dark"
        stripe
        border
        :style="{ width: tableWidth }"
        style="margin-top: 20px;"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column v-if="!isReadOnly && showSelection" type="selection" width="50" :resizable="false" />
        <el-table-column v-if="showIndex" align="center" label="序号" width="50" :resizable="false">
          <template #default="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>

        <!-- 动态列渲染 -->
        <el-table-column
          v-for="column in tableColumns"
          :key="column.prop"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :resizable="false"
          :show-overflow-tooltip="isReadOnly"
        >
          <template #default="scope">
            <el-form
              :ref="(el: any) => setFormRef(`tableData.${scope.$index}${column.prop}`, el)"
              :model="scope.row"
              :rules="getRulesForColumn(column.prop, scope.row)"
              inline
              :width="column.width"
              class="info-form"
            >
              <el-form-item
                :prop="column.prop"
                :style="{
                  'margin-bottom': isReadOnly ? '0' : '',
                  'width': '100%'
                }"
              >
                <!-- 只读模式展示 -->
                <template v-if="isReadOnly">
                  <el-tooltip v-if="scope.row[column.prop]" :content="arrayToString(scope.row[column.prop])" placement="top">
                    <div
                      v-if="column.type === 'input' || column.type === 'textarea'"
                      :style="{
                        'overflow': 'hidden',
                        'text-overflow': 'ellipsis',
                        'white-space': 'nowrap'
                      }"
                    >{{ scope.row[column.prop] }}</div>
                    <div v-else>{{ scope.row[column.prop] }}</div>
                  </el-tooltip>
                </template>

                <!-- 编辑模式 -->
                <template v-else>
                  <!-- Select 类型 -->
                  <div v-if="column.type === 'select'">
                    <el-select
                      v-model="scope.row[column.prop]"
                      style="width: 100%"
                      :placeholder="`请选择${column.label}`"
                      clearable
                      filterable
                      :multiple="column.multiple"
                      @change="(val: any) => handleSelectChange(`tableData.${scope.$index}${column.prop}`, column.prop, scope, val, column.change)"
                    >
                      <el-option
                        v-for="(item, index) in getOptionsForProp(column.prop, scope)"
                        :key="index"
                        :label="item[column.optionLabel || 'value']"
                        :value="item[column.optionValue || 'value']"
                      />
                    </el-select>
                  </div>

                  <!-- Textarea 类型 -->
                  <div v-if="column.type === 'textarea'">
                    <el-input
                      v-model="scope.row[column.prop]"
                      style="width: 100%"
                      :placeholder="`请输入${column.label}`"
                      :type="column.type"
                      :autosize="{ minRows: 1, maxRows: 4 }"
                      :maxlength="column.maxlength"
                      clearable
                      @input="handleInputChange(column.prop, scope)"
                    />
                  </div>

                  <!-- Input 类型 -->
                  <div v-if="column.type === 'input'">
                    <el-input
                      v-model="scope.row[column.prop]"
                      style="width: 100%"
                      :maxlength="column.maxlength"
                      :placeholder="`请输入${column.label}`"
                      @input="(val: any) => { scope.row[column.prop] = typeof val === 'string' ? val.trim() : val; handleInputChange(column.prop, scope) }"
                    />
                  </div>

                  <!-- InputNumber 类型 -->
                  <div v-if="column.type === 'inputNumber'">
                    <el-input-number
                      v-model="scope.row[column.prop]"
                      style="width: 100%"
                      :controls="false"
                      :min="column.min || 0"
                      :max="column.max"
                      :placeholder="`请输入${column.label}`"
                      @change="() => handleInputNumChange(column.prop, scope)"
                    />
                  </div>

                  <!-- DatePicker 类型 -->
                  <div v-if="column.type === 'datePicker'">
                    <el-date-picker
                      v-model="scope.row[column.prop]"
                      style="width: 100%"
                      :type="column.dateType || 'datetime'"
                      :placeholder="`请选择${column.label}`"
                      clearable
                      :format="column.format || 'YYYY-MM-DD HH:mm'"
                      :value-format="column.valueFormat || 'YYYY-MM-DD HH:mm'"
                      @change="() => handleSelectChange(`tableData.${scope.$index}${column.prop}`, column.prop, scope)"
                    />
                  </div>
                </template>
              </el-form-item>
            </el-form>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="formModel.tableData.length > pageSize"
        background
        style="text-align: right; margin: 15px;"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="formModel.tableData.length"
        :current-page="currentPage"
        @current-change="handlePageChange"
      />
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { cloneDeep, isArray } from 'lodash'
import AsyncValidator from 'async-validator'
import { Plus, Minus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// ============================================================
// Props
// ============================================================

const props = withDefaults(defineProps<{
  modelValue?: any[]
  tableColumns?: any[]
  options?: Record<string, any[]>
  isReadOnly?: boolean
  initRow?: Record<string, any>
  rulesField?: Record<string, any[]>
  checkFields?: string[]
  pageSize?: number
  tableWidth?: string
  operationWidth?: string
  showAdd?: boolean
  showDelete?: boolean
  showSelection?: boolean
  showIndex?: boolean
  showOperation?: boolean
  tipText?: string
  wsid?: string
}>(), {
  modelValue: () => [],
  tableColumns: () => [],
  options: () => ({}),
  isReadOnly: false,
  initRow: () => ({}),
  rulesField: () => ({}),
  checkFields: () => [],
  pageSize: 10,
  tableWidth: 'fit-content',
  operationWidth: '100',
  showAdd: true,
  showDelete: true,
  showSelection: true,
  showIndex: true,
  showOperation: true,
  tipText: '',
  wsid: '',
})

// ============================================================
// Emits
// ============================================================

const emit = defineEmits<{
  'update:modelValue': [value: any[]]
  'custom-change': [payload: { methodName: string; scope: any; value: any }]
}>()

// ============================================================
// 内部状态
// ============================================================

const tableKey = ref(Math.random())
const loading = ref(false)
const multipleSelection = ref<any[]>([])
const currentPage = ref(1)
const isDuplicates = ref(false)
const duplicatesMsg = ref('')
const optionsCache = ref<Record<string, any[]>>({})

// 表单引用缓存（key -> formInstance）
const formRefs = ref<Record<string, any>>({})

const setFormRef = (key: string, el: any) => {
  if (el) {
    formRefs.value[key] = el
  }
}

const formModel = reactive<{ tableData: any[] }>({
  tableData: [],
})

// ============================================================
// 计算属性
// ============================================================

const mergedOptionsCache = computed(() => {
  return { ...optionsCache.value, ...props.options }
})

const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return formModel.tableData.slice(start, end)
})

// ============================================================
// Watchers
// ============================================================

watch(
  () => props.modelValue,
  (val) => {
    let data: any[] = isArray(val) ? val : (typeof val === 'string' ? JSON.parse(val) : [])
    data.forEach(row => {
      if (!Object.prototype.hasOwnProperty.call(row, 'id')) {
        row.id = generateRowId()
      }
    })
    formModel.tableData = data
  },
  { immediate: true, deep: true }
)

watch(
  () => formModel.tableData,
  (val) => {
    emit('update:modelValue', val)
  },
  { immediate: true, deep: true }
)

// ============================================================
// ID 生成
// ============================================================

const generateRowId = () => {
  return Date.now().toString(36) + Math.random().toString(36)
}

// ============================================================
// 分页
// ============================================================

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const getCurrentPageData = () => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return formModel.tableData.slice(start, end)
}

// ============================================================
// 行操作
// ============================================================

const handleAdd = () => {
  addRow(props.initRow, props.wsid)
}

const addRow = async (initRowData: Record<string, any> = {}, wsid = '') => {
  // 1. 校验当前页所有字段
  const pageResult = await validateAllFields()
  if (!pageResult.valid) {
    return false
  }

  // 2. 整表校验
  const tableValid = await validateTableData()
  if (!tableValid) {
    ElMessage.error('表格数据校验失败, 请检查字段是否填写正确')
    return false
  }

  // 3. 新增行
  const newItem = {
    id: generateRowId(),
    ...(wsid ? { wsid } : {}),
    ...cloneDeep(initRowData),
  }
  formModel.tableData = [...formModel.tableData, newItem]

  // 自动跳转到最后一页
  const totalPages = Math.ceil(formModel.tableData.length / props.pageSize)
  if (currentPage.value !== totalPages) {
    currentPage.value = totalPages
  }

  return true
}

const confirmDelete = () => {
  if (multipleSelection.value.length <= 0) {
    ElMessage.error('请选择需要删除的行数据')
    return
  }
  ElMessageBox.confirm('请确认是否删除已勾选的行数据！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    deleteSelectedRows()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const deleteSelectedRows = () => {
  formModel.tableData = formModel.tableData.filter(row => {
    return !multipleSelection.value.some(item => item.id === row.id)
  })
  if (currentPageData.value.length === 0 && currentPage.value > 1) {
    currentPage.value--
  }
}

const handleSelectionChange = (val: any[]) => {
  formModel.tableData.forEach(row => {
    if (!Object.prototype.hasOwnProperty.call(row, 'id')) {
      row.id = generateRowId()
    }
  })
  multipleSelection.value = val
}

// ============================================================
// 校验
// ============================================================

const validateRow = (row: any): Promise<{ row: any; isError: boolean; errors?: any[] }> => {
  try {
    const descriptor: Record<string, any[]> = {}
    Object.keys(props.rulesField).forEach(field => {
      const rules = props.rulesField[field]
      if (Array.isArray(rules)) {
        descriptor[field] = rules.map(r => ({ ...r, row }))
      }
    })
    const validator = new AsyncValidator(descriptor)
    return new Promise((resolve) => {
      validator.validate(row, (errors: any[] | null) => {
        if (errors) {
          resolve({ row, errors, isError: true })
        } else {
          resolve({ row, isError: false })
        }
      })
    })
  } catch (e) {
    console.error('validateRow 异常:', e)
    return Promise.resolve({ row, isError: false })
  }
}

const validateTableData = async (): Promise<boolean> => {
  const validationPromises = formModel.tableData.map((row) => {
    return validateRow(row).then(result => result).catch(err => {
      return { ...err, err }
    })
  })
  try {
    const results = await Promise.all(validationPromises)
    const failedResults = results.filter(r => r.isError || r.err)
    if (failedResults.length > 0) {
      console.error('整表校验失败:', failedResults)
    }
    return failedResults.length === 0
  } catch (error) {
    console.error('validateTableData 异常:', error)
    return false
  }
}

const getRulesForColumn = (prop: string, row: any) => {
  const rules: Record<string, any[]> = {}
  if (props.rulesField[prop]) {
    rules[prop] = props.rulesField[prop].map(r => ({ ...r, row }))
  }
  return rules
}

const batchValidateAllFields = async () => {
  const results: any[] = []
  const pageData = getCurrentPageData()
  const fieldsToValidate = props.tableColumns.map(col => col.prop)

  for (let i = 0; i < pageData.length; i++) {
    for (const field of fieldsToValidate) {
      const formRefKey = `tableData.${i}${field}`
      const formInstance = formRefs.value[formRefKey]
      if (!formInstance) continue

      try {
        const error = await new Promise((resolve) => {
          formInstance.validateField(field, (err: any) => resolve(err))
        })
        results.push({ rowIndex: i, field, error })
      } catch (e) {
        results.push({ rowIndex: i, field, error: e })
      }
    }
  }
  return results
}

const validateAllFields = async () => {
  try {
    const results = await batchValidateAllFields()
    const hasError = results.some(r => r.error)
    return { valid: !hasError, errors: results.filter(r => r.error) }
  } catch (error) {
    return { valid: false, errors: [] }
  }
}

// ============================================================
// 输入处理
// ============================================================

const handleInputNumChange = (prop: string, scope: any) => {
  const formRefKey = `tableData.${scope.$index}${prop}`
  const formInstance = formRefs.value[formRefKey]
  if (formInstance) {
    formInstance.validateField(prop)
  }
}

const handleInputChange = (prop: string, scope: any) => {
  const formRefKey = `tableData.${scope.$index}${prop}`
  const formInstance = formRefs.value[formRefKey]
  if (formInstance) {
    formInstance.validateField(prop)
  }
  checkDuplicates()
}

const handleSelectChange = (formRefKey: string, field: string, scope: any, value?: any, customChange?: string) => {
  const formInstance = formRefs.value[formRefKey]
  if (formInstance) {
    formInstance.validateField(field)
  }
  if (customChange) {
    emit('custom-change', { methodName: customChange, scope, value })
  }
  checkDuplicates()
}

// ============================================================
// 查重
// ============================================================

const checkDuplicates = () => {
  if (!props.checkFields || props.checkFields.length === 0) return

  isDuplicates.value = false
  duplicatesMsg.value = ''

  const data = formModel.tableData
  const seenKeys = new Map<string, { originalIndex: number }>()
  const duplicates: any[] = []

  data.forEach((row, index) => {
    const keyword = props.checkFields
      .map(field => (row[field] || '').toString().replace(/\s/g, ''))
      .join('-')

    if (seenKeys.has(keyword)) {
      const prevIndex = seenKeys.get(keyword)!.originalIndex
      const p1 = Math.floor(prevIndex / props.pageSize) + 1
      const p2 = Math.floor(index / props.pageSize) + 1
      const r1 = prevIndex % props.pageSize + 1
      const r2 = index % props.pageSize + 1

      duplicates.push({ page1: p1, row1: r1, page2: p2, row2: r2 })
    } else {
      seenKeys.set(keyword, { originalIndex: index })
    }
  })

  ElMessage.closeAll()

  if (duplicates.length > 0) {
    let message = ''
    duplicates.forEach(dup => {
      message += ` 第 ${dup.page1} 页的第 ${dup.row1} 行 和 第 ${dup.page2} 页的第 ${dup.row2} 行 <br>`
    })

    const fieldNames = props.checkFields.join('+')
    duplicatesMsg.value = message + fieldNames + '数据重复，请修改！'

    ElMessage.error({ message: duplicatesMsg.value, dangerouslyUseHTMLString: true })
    isDuplicates.value = true
  }
}

// ============================================================
// 下拉选项
// ============================================================

const getOptionsForProp = (prop: string, scope: any) => {
  if (scope.row[`${prop}Options`]) {
    return scope.row[`${prop}Options`]
  }
  if (mergedOptionsCache.value[prop]) {
    return mergedOptionsCache.value[prop]
  }
  return []
}

const setOptionsCache = (prop: string, opts: any[]) => {
  optionsCache.value[prop] = opts
}

// ============================================================
// 工具方法
// ============================================================

const arrayToString = (data: any) => {
  if (Array.isArray(data)) {
    return data.join(',')
  }
  return data
}

// ============================================================
// 外部调用方法（通过 defineExpose 暴露）
// ============================================================

const validateWholeInfo = async () => {
  const pageValid = await validateAllFields()
  if (!pageValid.valid) {
    ElMessage.error('表格数据校验失败, 请检查字段是否填写正确')
    return false
  }

  checkDuplicates()
  if (isDuplicates.value) {
    return false
  }

  const tableValid = await validateTableData()
  if (!tableValid) {
    ElMessage.error('表格数据校验失败, 请检查字段是否填写正确')
    return false
  }

  return true
}

const getTableData = () => {
  return formModel.tableData
}

const setTableData = (data: any[]) => {
  formModel.tableData = data
}

const clearTableData = () => {
  formModel.tableData = []
  multipleSelection.value = []
  currentPage.value = 1
}

const getSelection = () => {
  return multipleSelection.value
}

const getValidData = async () => {
  const pageValid = await validateAllFields()
  if (!pageValid.valid) {
    throw new Error('表单校验失败')
  }

  const tableValid = await validateTableData()
  if (!tableValid) {
    throw new Error('表格数据校验失败')
  }

  return formModel.tableData
}

// ============================================================
// 生命周期
// ============================================================

onMounted(() => {
  // 组件已挂载
})

onBeforeUnmount(() => {
  // 清理
})

// ============================================================
// Expose
// ============================================================

defineExpose({
  addRow,
  getTableData,
  setTableData,
  clearTableData,
  getSelection,
  getValidData,
  validateWholeInfo,
  validateAllFields,
  validateTableData,
  setOptionsCache,
  checkDuplicates,
})
</script>

<style scoped>
.base-table .info-form :deep(.el-form-item__content) {
  width: 100%;
}
</style>
