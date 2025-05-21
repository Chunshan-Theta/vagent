'use client'

import ReportView from '@/app/components/ai-report/ReportViewV1'
import { ReportV1 } from '@/app/types/ai-report'
import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingIcon from '@/app/components/LoadingIcon'


const settingsMap = {
  default: {
    naturalColor: '#fff',
    angryColor: '#EF8354',
    frustratedColor: '#FFD166',
    openColor: '#06D6A0',
  }
}

function AiReportPage() {
  const reportData = useRef<ReportV1.ReportDatas | null>(null)

  const [localLoading, setLocalLoading] = useState(true)

  const loading = useMemo(() => localLoading, [localLoading])

  useEffect(() => {
    changeRootCssVar('--background', '#173944')
  })

  /** 修改 :root 內的 css var */
  function changeRootCssVar(key: string, value: string){
    const root = document.documentElement
    root.style.setProperty(key, value)
  }

  async function fetchReportData(): Promise<ReportV1.ReportDatas> {

    const settings = settingsMap.default


    const timelineDatas: ReportV1.TimelineData[] = [
      {
        mainColor: settings.frustratedColor,
        title: '🕒 0:30',
        subtitleColor: settings.naturalColor,
        subtitle: '客戶情緒：Neutral（中性）',
        aiRole: 'AI 客人',
        userRole: '業務員使用者',
        aiSay: '我不需要再多一筆貸款！你們業務員是不是只會推銷產品，根本不管客戶的實際情況？',
        userSay: '房貸壽險其實就是像一般壽險一樣…保費比傳統壽險還要便宜…萬一全殘或死亡，保險會幫您還房貸。',
        analysis: [
          '客戶進入爆發情緒狀態，直指不被理解。',
          '業務仍以產品說明回應，完全未正面回應情緒。'
        ],
        keyPoint: {
          sentences: [
            '不需要貸款',
            '每天為錢煩惱',
            '根本不管我的實際情況',
          ],
          problems: [
            '缺乏「我懂你」的同理語句，失去情緒接觸點。'
          ]
        }
      },
      {
        mainColor: settings.openColor,
        title: '🕒 0:30',
        subtitleColor: settings.openColor,
        subtitle: '客戶情緒：Open（接受）',
        aiRole: 'AI 客人',
        userRole: '業務員使用者',
        aiSay: '我不需要再多一筆貸款！你們業務員是不是只會推銷產品，根本不管客戶的實際情況？',
        userSay: '房貸壽險其實就是像一般壽險一樣…保費比傳統壽險還要便宜…萬一全殘或死亡，保險會幫您還房貸。',
        analysis: [
          '客戶進入爆發情緒狀態，直指不被理解。',
          '業務仍以產品說明回應，完全未正面回應情緒。'
        ],
        keyPoint: {
          sentences: [
            '不需要貸款',
            '每天為錢煩惱',
            '根本不管我的實際情況',
          ],
          problems: [
            '缺乏「我懂你」的同理語句，失去情緒接觸點。'
          ]
        }
      },
    ]

    return {
      timeline: timelineDatas
    }
  }

  async function init() {
    const data = await fetchReportData()
    reportData.current = data
  }


  useEffect(() => {
    setLocalLoading(true)
    init()
      .catch((e) => {
        console.error(e)
      })
      .finally(() => {
        setLocalLoading(false)
      })
  })


  return (
    <div className="ai-report-page flex justify-center items-center min-h-screen">
      {loading && <LoadingIcon />}
      {reportData.current &&
        <div className="max-w-3xl w-full">
          <ReportView data={reportData.current} />
        </div>
      }
    </div>
  )

}

export default AiReportPage