'use client'

import React, { CSSProperties, useState, useMemo, useEffect } from 'react'
import TimelineSection from './TimelineSectionV1'

import { ReportV1 } from '@/app/types/ai-report'

// 自定義樣式
import './report.scss'


type ReportPageProps = {
  data?: ReportV1.ReportDatas
}

const ReportPage: React.FC<ReportPageProps> = (props) => {

  const timelineItems = useMemo(() => {
    return props.data?.timeline || []
  }, [props.data?.timeline])

  return (
    <div className="report-view v1 default">
      {timelineItems.length > 0 && (
        <TimelineSection items={timelineItems} />
      )}
    </div>
  )
}

export default ReportPage