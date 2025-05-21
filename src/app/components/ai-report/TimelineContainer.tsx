

// 該元件的功能：
// 1. 左側顯示類似時間軸的UI，時間線最上方有預留一個圓圈顯示數字
// 2. 右側 content 由 childrens 決定
// 3. childrens 可能有多組，每組 child 的上方都會有個固定標題
// 4. 須確保 childrens size 與 timelineItems size 一致，否則會報錯

import { useMemo } from "react"
import type { Timeline } from '@/app/types/ai-report'


function TimelineContainer(props: Timeline.TimelineContainerProps) {
  const { items, className } = props
  const defaultColor = '#ffd166'

  function createTitleSection(item: typeof items[number]) {
    const meta = item.meta || {}
    const subtitleColor = meta.subtitleColor ?? meta.timelineColor ?? defaultColor

    return (
      <div className="timeline-title">
        {meta?.title ?? ''}
        {meta?.title && meta?.subtitle ? '｜' : ''}
        {meta?.subtitle && <span style={{ color: subtitleColor }}>{meta.subtitle}</span>}
      </div>
    )
  }

  const getItemStyle = (item: Timeline.TimelineItem) => {
    return {
      borderLeftColor: item.meta?.timelineColor ?? defaultColor,
    } as React.CSSProperties
  }

  const getMarkerStyle = (item: Timeline.TimelineItem) => {
    return {
      backgroundColor: item.meta?.timelineColor ?? defaultColor,
    } as React.CSSProperties
  }
  return (
    <div className={`timeline-container ${className}`}>
      {items.map((item, index) => {
        return (
          // timeline-item 是每一個時間軸的項目，最左邊會有一條固定的線，最上方會有一個圓圈顯示數字
          <div key={index} className="timeline-item" style={getItemStyle(item)}>
            <div className="marker" style={getMarkerStyle(item)}>{index + 1}</div>
            {createTitleSection(item)}
            <div className="timeline-body">
              {item.node}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TimelineContainer