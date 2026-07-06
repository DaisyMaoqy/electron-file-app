<template>
  <base-table
    :key="isRo"
    v-model="formModel.tableData"
    ref="baseTable"
    :is-read-only="isReadOnlySync"
    :table-columns="tableColumns"
    :options="options"
    :rules-field="rulesField"
    :init-row="initRow"
    :show-add="!isRo"
    :show-delete="!isRo"
    :show-operation="!isRo"
    :page-size="10"
    :wsid="wsid"
    @change="handleChange"
  />
</template>

<script>
import BaseTable from '../baseTable.vue'

export default {
  name: 'AffectedBusinessInfo',
  inject: ['__form__', '__initData__'],
  model: {
    prop: 'value',
    event: 'change'
  },
  components: {
    BaseTable
  },
  props: {
    value: {
      type: Array,
      default: () => ([])
    },
    isRo: {
      type: Boolean,
      default: false
    },
    models: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      wsid: '',
      formModel: {
        tableData: []
      },
      // 下拉选项配置
      options: {
        affectedBusinessType: [
          { value: '无', label: '无' },
          { value: '语音业务', label: '语音业务' },
          { value: '短信业务', label: '短信业务' },
          { value: '数据业务', label: '数据业务' },
          { value: '物联网业务', label: '物联网业务' },
          { value: '专线业务', label: '专线业务' },
          { value: '云计算业务', label: '云计算业务' },
          { value: '其他', label: '其他' }
        ]
      },
      // 表格列配置
      tableColumns: [
        {
          prop: 'affectedBusinessType',
          label: '影响业务种类',
          type: 'select',
          width: '180'
        },
        {
          prop: 'affectedBusinessTime',
          label: '影响业务时间',
          type: 'datePicker',
          dateType: 'datetime',
          format: 'MM月DD日HH:mm',
          valueFormat: 'yyyy-MM-dd HH:mm',
          width: '200'
        },
        {
          prop: 'businessRecoveryTime',
          label: '业务恢复时间',
          type: 'datePicker',
          dateType: 'datetime',
          format: 'MM月DD日HH:mm',
          valueFormat: 'yyyy-MM-dd HH:mm',
          width: '200'
        },
        {
          prop: 'affectedBusinessDuration',
          label: '影响业务时长',
          type: 'input',
          maxlength: 50,
          width: '160'
        },
        {
          prop: 'affectedBusinessScope',
          label: '影响业务范围',
          type: 'input',
          maxlength: 100,
          width: '200'
        },
        {
          prop: 'affectedUsersCount',
          label: '影响用户数',
          type: 'inputNumber',
          min: 0,
          width: '140'
        },
        {
          prop: 'customerComplaintsCount',
          label: '引发客户投诉量',
          type: 'inputNumber',
          min: 0,
          width: '160'
        }
      ],
      // 校验规则
      rulesField: {
        affectedBusinessType: [
          { required: true, message: '请选择影响业务种类', trigger: 'change' }
        ],
        affectedBusinessTime: [
          {
            validator: (rule, value, callback) => {
              const row = rule.row
              if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
                callback(new Error('影响业务时间必填'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        businessRecoveryTime: [
          {
            validator: (rule, value, callback) => {
              const row = rule.row
              if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
                callback(new Error('业务恢复时间必填'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        affectedBusinessDuration: [
          {
            validator: (rule, value, callback) => {
              const row = rule.row
              if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
                callback(new Error('影响业务时长必填'))
                return
              }
              // 格式校验：XX小时XX分钟，分钟不超过60
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
            trigger: 'blur'
          }
        ],
        affectedBusinessScope: [
          {
            validator: (rule, value, callback) => {
              const row = rule.row
              if (row.affectedBusinessType && row.affectedBusinessType !== '无' && !value) {
                callback(new Error('影响业务范围必填'))
              } else {
                callback()
              }
            },
            trigger: 'blur'
          }
        ],
        affectedUsersCount: [
          {
            validator: (rule, value, callback) => {
              // 必填检查
              if (value === null || value === undefined || value === '') {
                callback(new Error('请输入影响用户数'))
                return
              }
              // 类型和范围检查
              if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
                callback(new Error('必须为≥0的整数'))
                return
              }
              callback()
            },
            trigger: 'blur'
          }
        ],
        customerComplaintsCount: [
          {
            validator: (rule, value, callback) => {
              // 必填检查
              if (value === null || value === undefined || value === '') {
                callback(new Error('请输入引发客户投诉量'))
                return
              }
              // 类型和范围检查
              if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
                callback(new Error('必须为≥0的整数'))
                return
              }
              callback()
            },
            trigger: 'blur'
          }
        ]
      },
      // 新行默认值
      // 注意：inputNumber 类型字段使用 null 作为初始值，因为 el-input-number 的值是数字类型
      initRow: {
        affectedBusinessType: '',
        affectedBusinessTime: '',
        businessRecoveryTime: '',
        affectedBusinessDuration: '',
        affectedBusinessScope: '',
        affectedUsersCount: null,
        customerComplaintsCount: null
      }
    }
  },
  computed: {
    isReadOnlySync() {
      return this.isRo
    }
  },
  watch: {
    value: {
      handler(val) {
        if (val !== this.formModel.tableData) {
          this.formModel.tableData = val || []
        }
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    this.wsid = this.__initData__?.['wsInfo[wsid]']
      || this.__initData__?.['route.query.wsid']
      || this.$route?.query?.wsid
      || '1'
  },
  methods: {
    handleChange(val) {
      console.log('影响业务信息数据变化:', val)
      this.$emit('change', val)
    },
    getTableData() {
      return this.formModel.tableData
    },
    async getValidData() {
      return this.$refs.baseTable.getValidData()
    },
    validateTable() {
      return new Promise((resolve, reject) => {
        this.$eventbus.$emit('validateBaseTable', resolve, reject)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.affected-business-table {
  // 自定义样式
}
</style>