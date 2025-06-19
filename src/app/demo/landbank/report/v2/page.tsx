'use client'

import ReportView from '@/app/components/ai-report/ReportViewV1'
import OReportView from '@/app/components/ai-report/OReportView'
import { ReportV1 } from '@/app/types/ai-report'
import { useEffect, useMemo, useRef, useState } from 'react'
import LoadingIcon from '@/app/components/LoadingIcon'
import ReportViewV2 from '@/app/components/ai-report/ReportViewV2';
import { AnalysisResponse, ReportDatas } from '@/app/types/ai-report/common';


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
} | {
  user: { name: string }
  rubric: any[]
  adviceItems: { content: string }[]
  history: string
}

function LandbankReportV2() {
  const reportData = useRef<ReportV1.ReportDatas | null>(null)
  const oreportData = useRef<OReportDatas | null>(null)
  const analysisData = useRef<any>(null)
  const messagesData = useRef<any[]>([])


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
  const [activeTab, setActiveTab] = useState<'report' | 'oreport' | 'analysis'>('report')

  const loading = useMemo(() => localLoading, [localLoading])

  // 舊版要多做一層轉換
  const adviceItems = useMemo(() => {
    const oData = oreportData.current
    if (!oData) return []
    const tips: string[] = []
    if ('scores' in oData) {
      const scores = oData?.scores || []
      for (const score of scores) {
        const { criterion, score: scoreValue, improvementTips } = score
        if (improvementTips && improvementTips.length > 0) {
          tips.push(improvementTips[0])
        }
      }
      return tips.map((tip) => ({ content: tip }))
    }
  }, [oreportData.current])

  const oReportDatas = useMemo(() => {
    const data = oreportData.current
    if (data) {
      if ('scores' in data) {
        // 相容舊版資料
        return {
          user: data.user,
          rubric: data.scores || [],
          adviceItems: adviceItems,
          playLogText: data.history
        }
      } else {
        return {
          user: data.user,
          rubric: data.rubric || [],
          adviceItems: data.adviceItems || [],
          playLogText: data.history
        }
      }
    }
    return null
  }, [oreportData.current, adviceItems])

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
    const { timeline, meta } = reportData

    const timelineDatas: ReportV1.TimelineData[] = timeline
    return {
      timeline: timelineDatas,
      meta
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


  async function fetchAnalysisData() {
    const analysisStr = localStorage.getItem('landbank/v2/analysis');
    if (!analysisStr) {
      return null
    }
    const analysisData = JSON.parse(analysisStr) as AnalysisResponse;
    return analysisData;
  }

  async function fetchMessagesData(): Promise<any[]> {
    const messagesStr = localStorage.getItem('landbank/v2/messages')
    if (!messagesStr) {
      return []
    }
    const messagesData = JSON.parse(messagesStr) as any[]
    return messagesData
  }

  async function init() {
    const data = await fetchReportData()
    reportData.current = data
    const oreport = await fetchOReportData()
    oreportData.current = oreport
    const analysis = await fetchAnalysisData()
    analysisData.current = analysis
    const messages = await fetchMessagesData()
    messagesData.current = messages
    console.log('[report_page]', {
      report: reportData.current,
      oreport: oreportData.current,
      analysis: analysisData.current,
      messages: messagesData.current
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
        const data = oReportDatas
        return (
          <>
            {data &&
              <OReportView
                user={data.user}
                rubric={data.rubric || []}
                adviceItems={data.adviceItems}
                playLogText={data.playLogText || ''}
              />
            }
          </>
        )
      }
      if (activeTab === 'analysis') {
        return (
          <>
            <ReportViewV2
              data={analysisData.current}
              message={messagesData.current || []}
            />
          </>
        )
      }
    }
    return null
  }

  const getTabStatus = (tab: 'report' | 'oreport' | 'analysis') => {
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
        { analysisData.current &&
          <button style={getTabStatus('analysis').style} onClick={() => setActiveTab('analysis')}>總體分析</button>
        }
        {/* <button
          className={`px-4 py-2 rounded ${activeTab === 'analysis' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('analysis')}
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