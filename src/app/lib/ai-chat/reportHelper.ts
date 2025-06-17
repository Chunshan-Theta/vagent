import * as agentApi from './agentApi'
import _ from '@/app/vendor/lodash'

export type EditField = {
  type: 'text' | 'textarea' | 'json'
  key: string
  title: string
  description?: string
  placeholder?: string

  parser?: string
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
    title: '分析報告 - 分析目標',
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
  {
    type: 'textarea',
    key: 'reportAnalyze.contextPrompt',
    title: '分析報告 - context prompt',
    placeholder: [
      '請參考分析標準，然後依據對話紀錄，給出對於 __role__ 的相關建議。',
      '輸出結果請嚴格依照回應格式，給出 3 到 5 條建議，然後轉換成 json 格式。',
      '回應格式：',
      '- <建議內容>',
      '- <建議內容>',
      '- <建議內容>'
    ].join('\n'),
    description: ''
  },
  {
    type: 'textarea',
    key: 'reportAnalyze.keyPointsPrompt',
    title: '分析報告 - key_points prompt (暫時停用)',
    placeholder: [
      '請參考分析規則，然後依據底下的對話，分別找出：',
      '- __role2__ 說話中具有情緒或資訊意涵的關鍵句（請列出實際原句）',
      '- __role__ 回應中可能存在的溝通問題或不足之處'
    ].join('\n'),
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.keyPointTitle1',
    title: '分析報告 - key_points 標題 1',
    placeholder: '優點',
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.keyPointAnalysis1',
    title: '分析報告 - key_points 分析描述 1',
    placeholder: '分析 __role__ 表現良好的部分，並列出具體的例子或關鍵句（請列出實際原句）',
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.keyPointIcon1',
    title: '分析報告 - key_points Icon 1',
    placeholder: '⭕',
    description: '可直接填入 emoji 或 icon 名稱，如 "fa-star"\n，更多可至 https://react-icons.github.io/react-icons/icons/fa/ 查找',
  },
  {
    type: 'text',
    key: 'reportAnalyze.keyPointTitle2',
    title: '分析報告 - key_points 標題 2',
    placeholder: '缺點',
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.keyPointAnalysis2',
    title: '分析報告 - key_points 分析描述 2',
    placeholder: '分析 __role__ 表現不佳的部分，並列出可能存在的溝通問題或不足之處（請列出實際原句）',
    description: ''
  },
  {
    type: 'text',
    key: 'reportAnalyze.keyPointIcon2',
    title: '分析報告 - key_points Icon 2',
    placeholder: '❌',
    description: '可直接填入 emoji 或 icon 名稱，如 "fa-star"\n，更多可至 https://react-icons.github.io/react-icons/icons/fa/ 查找',
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
