'use client'

import ReportView from '@/app/components/ai-report/ReportViewV1'
import OReportView from '@/app/components/ai-report/OReportView'
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

type OReportDatas = {
  user: { name: string }
  scores: any[]
  history: string
}

function LandbankReportV2() {
  const reportData = useRef<ReportV1.ReportDatas | null>(null)
  const oreportData = useRef<OReportDatas | null>(null)

  useEffect(() => {
    // function handleResize() {
    //   // 這裡可以根據需要處理 resize 事件
    //   // console.log('Window resized');
    // }

    // window.addEventListener('resize', handleResize);

    // return () => {
    //   window.removeEventListener('resize', handleResize);
    // };
  }, [])

  const [localLoading, setLocalLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'report' | 'oreport'>('report')

  const loading = useMemo(() => localLoading, [localLoading])

  const advanceItems = useMemo(() => {
    const tips: string[] = []
    const scores = oreportData.current?.scores || []
    for (const score of scores) {
      const { criterion, score: scoreValue, improvementTips } = score
      if (improvementTips && improvementTips.length > 0) {
        tips.push(improvementTips[0])
      }
    }
    return tips.map((tip) => ({ content: tip }))
  }, [oreportData.current])

  useEffect(() => {
    changeRootCssVar('--background', '#173944')
  })

  /** 修改 :root 內的 css var */
  function changeRootCssVar(key: string, value: string) {
    const root = document.documentElement
    root.style.setProperty(key, value)
  }

  async function fetchReportData(): Promise<ReportV1.ReportDatas> {

    const settings = settingsMap.default
    const reportDataStr = localStorage.getItem('landbank/v2/report')
    if (!reportDataStr) {
      throw new Error('No report data found in local storage')
    }
    const reportData = JSON.parse(reportDataStr) as ReportV1.ReportDatas
    const { timeline } = reportData

    const timelineDatas: ReportV1.TimelineData[] = timeline
    return {
      timeline: timelineDatas
    }
  }

  async function fetchOReportData(): Promise<OReportDatas> {

    const settings = settingsMap.default
    const reportDataStr = localStorage.getItem('landbank/v2/oreport')
    if (!reportDataStr) {
      throw new Error('No oreport data found in local storage')
    }
    const reportData = JSON.parse(reportDataStr) as OReportDatas
    return reportData
  }

  async function init() {
    const data = await fetchReportData()
    reportData.current = data
    const oreport = await fetchOReportData()
    oreportData.current = oreport
    console.log('[report_page]', {
      report: reportData.current,
      oreport: oreportData.current
    })
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
  }, [])

  function createReportView() {
    if (reportData.current) {
      if (activeTab === 'report') {
        // 限制寬度
        return (
          <div className="max-w-4xl w-full">
            <ReportView data={reportData.current} />
          </div>
        )
      }
      if (activeTab === 'oreport') {
        const data = oreportData.current
        return (
          <>
            {data &&
              <OReportView
                user={data.user}
                rubric={data.scores}
                adviceItems={advanceItems}
                playLogText={data.history}

              />
            }
          </>
        )
      }
    }
    return null
  }

  const getTabStatus = (tab: 'report' | 'oreport') => {
    const style = {
      background: 'linear-gradient(135deg, rgba(23, 99, 84, 0.2), rgba(13, 62, 52, 0.15))',
      padding: '8px 18px',
      borderRadius: '20px',
      fontSize: '1rem',
      fontWeight: 500,
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      color: '#b3c9c9'
    }

    const activeStyle = {
      background: 'linear-gradient(135deg, rgba(23, 99, 84, 0.8), rgba(13, 62, 52, 0.9))',
      color: '#fff'
    }

    const nowStyle = activeTab === tab ? { ...style, ...activeStyle } : style

    return {
      style: nowStyle
    }
  }

  return (
    <div className="ai-report-page flex flex-col items-center min-h-screen">
      {/* Tab 選單 */}
      <div className="flex mt-8 mb-4 space-x-4">
        {/* <button
          className={`px-4 py-2 rounded ${activeTab === 'report' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('report')}
        >
          對話分析
        </button> */}
        <button style={getTabStatus('report').style} onClick={() => setActiveTab('report')}>對話分析</button>
        <button style={getTabStatus('oreport').style} onClick={() => setActiveTab('oreport')}>分析統計</button>
        {/* <button
          className={`px-4 py-2 rounded ${activeTab === 'oreport' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('oreport')}
        >
          分析統計
        </button> */}
      </div>
      {/* 內容區 */}
      <div className="flex justify-center items-center flex-1 w-full">
        {loading && <LoadingIcon />}
        {reportData.current && createReportView()}
      </div>
    </div>
  )

}

export default LandbankReportV2