import * as agentApi from './agentApi'
import _ from '@/app/vendor/lodash'

export type EditField = {
  type: 'text' | 'textarea' | 'json'
  key: string
  title: string
  description?: string
  placeholder?: string
}

const fields:EditField[] = [
  {
    type: 'textarea',
    key: 'reportAnalyze.context',
    title: '分析報告 - 情境描述',
    placeholder: '例: 我是小陳的主管，在對話中我希望能夠幫助小陳釐清目標、現況、選項和行動計畫，並給予他適當的建議和支持。',
    description: ''
  },
  {
    type: 'textarea',
    key: 'reportAnalyze.analysis',
    title: '分析報告 - 分析方向',
    placeholder: '例: 請詳細分析對話紀錄，並根據分析方向和規則給我建議。',
    description: ''
  },
  {
    type: 'textarea',
    key: 'reportAnalyze.criteria',
    title: '分析報告 - 分析標準',
    placeholder: '請在此貼上完整的評分規則或分析的方向描述，用於判斷 user 的表現。',
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.roleSelf',
    title: '分析報告 - 用戶角色',
    placeholder: '例: 我, 主管, 員工...',
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.roleTarget',
    title: '分析報告 - 對方角色',
    placeholder: '例: AI客戶, 對方, ...',
    description: ''
  },
]

const fieldsMap = _.keyBy(fields, 'key')

export function getFieldsMap() {
  return {...fieldsMap}
}


export async function fetchAllAgentSettings(agentId: string) {
  const keys = fields.map(s => s.key);
  const res = await agentApi.getAgentSettings(agentId, keys)
  return res
}
