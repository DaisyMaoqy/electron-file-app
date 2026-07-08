<script setup lang="ts">
import { ref } from 'vue'
import BaseTable from '../components/baseTable.vue'
import { ElMessage } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'

// ============================================================
// 配置：复用 affectedBusinessInfo 的配置
// ============================================================

// 下拉选项
const options = {
  affectedBusinessType: [
    { value: '无', label: '无' },
    { value: '语音业务', label: '语音业务' },
    { value: '短信业务', label: '短信业务' },
    { value: '数据业务', label: '数据业务' },
    { value: '物联网业务', label: '物联网业务' },
    { value: '专线业务', label: '专线业务' },
    { value: '云计算业务', label: '云计算业务' },
    { value: '其他', label: '其他' },
  ],
}

// 列配置
const tableColumns = [
  {
    prop: 'affectedBusinessType',
    label: '影响业务种类',
    type: 'select',
    width: '180',
  },
  {
    prop: 'affectedBusinessTime',
    label: '影响业务时间',
    type: 'datePicker',
    dateType: 'datetime',
    format: 'MM月DD日HH:mm',
    valueFormat: 'YYYY-MM-DD HH:mm',
    width: '200',
  },
  {
    prop: 'businessRecoveryTime',
    label: '业务恢复时间',
    type: 'datePicker',
    dateType: 'datetime',
    format: 'MM月DD日HH:mm',
    valueFormat: 'YYYY-MM-DD HH:mm',
    width: '200',
  },
  {
    prop: 'affectedBusinessDuration',
    label: '影响业务时长',
    type: 'input',
    maxlength: 50,
    width: '160',
  },
  {
    prop: 'affectedBusinessScope',
    label: '影响业务范围',
    type: 'input',
    maxlength: 100,
    width: '200',
  },
  {
    prop: 'affectedUsersCount',
    label: '影响用户数',
    type: 'inputNumber',
    min: 0,
    width: '140',
  },
  {
    prop: 'customerComplaintsCount',
    label: '引发客户投诉量',
    type: 'inputNumber',
    min: 0,
    width: '160',
  },
]

// 校验规则
const rulesField = {
  affectedBusinessType: [
    { required: true, message: '请选择影响业务种类', trigger: 'change' },
  ],
  affectedBusinessTime: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        const row = (_rule as any).row
        if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
          callback(new Error('影响业务时间必填'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  businessRecoveryTime: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        const row = (_rule as any).row
        if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
          callback(new Error('业务恢复时间必填'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  affectedBusinessDuration: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        const row = (_rule as any).row
        if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
          callback(new Error('影响业务时长必填'))
          return
        }
        if (value) {
          const match = value.match(/^(\d+)小时(\d+)分钟$/)
          if (!match) {
            callback(new Error('格式：XX小时XX分钟'))
            return
          }
          const minutes = parseInt(match[2], 10)
          if (minutes > 60) {
            callback(new Error('分钟不能超过60'))
            return
          }
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  affectedBusinessScope: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        const row = (_rule as any).row
        if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
          callback(new Error('影响业务范围必填'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  affectedUsersCount: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入影响用户数'))
          return
        }
        if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
          callback(new Error('必须为≥0的整数'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  customerComplaintsCount: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (value === null || value === undefined || value === '') {
          callback(new Error('请输入引发客户投诉量'))
          return
        }
        if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
          callback(new Error('必须为≥0的整数'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
}

// 新行默认值
const initRow = {
  affectedBusinessType: '',
  affectedBusinessTime: '',
  businessRecoveryTime: '',
  affectedBusinessDuration: '',
  affectedBusinessScope: '',
  affectedUsersCount: null,
  customerComplaintsCount: null,
}

// ============================================================
// 组件引用和数据
// ============================================================

const baseTableRef = ref<InstanceType<typeof BaseTable> | null>(null)
const tableData = ref<any[]>([])

// ============================================================
// 导入导出
// ============================================================

// CSV 转义
const escapeCSV = (val: any): string => {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

// 导出 CSV
const handleExport = () => {
  const data = tableData.value
  if (!data || data.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  const headers = tableColumns.map(col => col.label)
  const props = tableColumns.map(col => col.prop)

  const csvRows = [headers.map(escapeCSV).join(',')]
  data.forEach(row => {
    const values = props.map(prop => escapeCSV(row[prop]))
    csvRows.push(values.join(','))
  })

  // 添加 BOM 以支持 Excel 中文识别
  const BOM = '\uFEFF'
  const csvContent = BOM + csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `表格数据_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('导出成功')
}

// 解析 CSV 行
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        result.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  result.push(current)
  return result
}

// 导入 CSV
const handleImport = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv'

  input.onchange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      try {
        const text = ev.target?.result as string
        // 移除 BOM
        const cleanText = text.replace(/^\uFEFF/, '')
        const lines = cleanText.split(/\r?\n/).filter(line => line.trim())

        if (lines.length < 2) {
          ElMessage.warning('CSV 文件数据不足')
          return
        }

        const headers = parseCSVLine(lines[0])

        // 匹配列
        const headerMap: Record<string, string> = {}
        headers.forEach((header, idx) => {
          const col = tableColumns.find(c => c.label === header.trim())
          if (col) {
            headerMap[idx] = col.prop
          }
        })

        const importedData: any[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i])
          const row: any = { ...initRow }

          values.forEach((val, idx) => {
            const prop = headerMap[idx]
            if (prop) {
              const col = tableColumns.find(c => c.prop === prop)
              if (col?.type === 'inputNumber') {
                const num = Number(val)
                row[prop] = isNaN(num) ? null : num
              } else {
                row[prop] = val
              }
            }
          })
          importedData.push(row)
        }

        tableData.value = [...tableData.value, ...importedData]
        ElMessage.success(`成功导入 ${importedData.length} 条数据`)
      } catch (err) {
        ElMessage.error('CSV 解析失败')
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  input.click()
}

// 清空数据
const handleClear = () => {
  tableData.value = []
  ElMessage.success('已清空')
}

// 获取校验后的数据
const handleGetValidData = async () => {
  if (baseTableRef.value) {
    try {
      const validData = await baseTableRef.value.getTableData()
      console.log('校验数据：', validData)
      const validWholeData = await baseTableRef.value.validateTableData() // 校验全量数据
      console.log('校验全量数据结果：', validWholeData)
      if (!validWholeData) {
        ElMessage.error('表格数据校验失败, 请检查字段是否填写正确')
        return
      }
      ElMessage.success('校验通过')
    } catch (e: any) {
      ElMessage.error(e?.message || '校验失败')
    }
  }
}
</script>

<template>
  <div class="table-view">
    <div class="table-header">
      <h2>影响业务信息表格</h2>
      <div class="table-actions">
        <el-button type="primary" :icon="Upload" @click="handleImport">导入CSV</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">导出CSV</el-button>
        <el-button type="warning" @click="handleClear">清空</el-button>
        <el-button type="info" @click="handleGetValidData">校验数据</el-button>
      </div>
    </div>

    <div class="table-content">
      <BaseTable
        ref="baseTableRef"
        v-model="tableData"
        :table-columns="tableColumns"
        :options="options"
        :rules-field="rulesField"
        :init-row="initRow"
        :page-size="10"
        :show-add="true"
        :show-delete="true"
        :show-selection="true"
        :show-index="true"
      />
    </div>
  </div>
</template>

<style scoped>
.table-view {
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-content {
  flex: 1;
  overflow: auto;
}
</style>
