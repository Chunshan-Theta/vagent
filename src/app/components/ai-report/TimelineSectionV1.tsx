import React, { useMemo } from "react";
import TimelineContainer from "./TimelineContainer";
import { ReportV1, Timeline } from '@/app/types/ai-report'
import _ from '@/app/vendor/lodash'

type TimelineData = ReportV1.TimelineData

type ReportSectionProps = {
  items: TimelineData[];
}

const ReportSection: React.FC<ReportSectionProps> = (props) => {
  props = props || {}
  const timelineDatas = props.items || []


  const styles = {
    analysis: {
      background: "rgba(30, 30, 30, 0.5)",
      borderRadius: "10px",
      padding: "15px",
      marginBottom: "15px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      color: "white",
    }
  }

  const trimText = (text:string)=>{
    text = text || ''
    return _.trim(text, ' \n\r\t"\'-「」')
  }

  const timelineItems = useMemo<Timeline.TimelineItem[]>(() => {
    return timelineDatas.map((item, index) => {
      const keyPoint = {
        sentences: item.keyPoint?.sentences || [],
        problems: item.keyPoint?.problems || [],
      }
      const needKeyPoint = (keyPoint.sentences.length > 0) ||
        (keyPoint.problems.length > 0)
      return {
        meta: {
          title: item.title,
          subtitle: item.subtitle,
          subtitleColor: item.subtitleColor,
          timelineColor: item.mainColor,
        },
        node: (
          <>
            <div className="content-row">
              {item.aiSay && (
                <div className="dialogue-box">
                  <p>{item.aiRole || 'AI'}說：</p>
                  <p>「{item.aiSay}」</p>
                </div>
              )}
              {item.userSay && (
                <div className="dialogue-box agent">
                  <p>{item.userRole || 'User'}說：</p>
                  <p>「{item.userSay}」</p>
                </div>
              )}
            </div>
            <div className="content-row analysis">
              <div>
                <p style={{ marginBottom: "10px", fontWeight: 600 }}>分析：</p>
                <ul style={{ listStyleType: "disc", paddingLeft: "20px", marginBottom: "10px" }}>
                  {item.analysis?.map((text, index) => (
                    <li key={index}>{trimText(text)}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="content-row">
              {
                needKeyPoint ?
                  (<>
                    {keyPoint.sentences.length > 0 &&
                      <div className="key-point">
                        <p style={{ fontWeight: 600, marginBottom: "5px" }}>❌ 關鍵句整理</p>
                        {keyPoint.sentences.map((text, index) => (
                          <li key={index}>{trimText(text)}</li>
                        ))}
                      </div>
                    }
                    {keyPoint.problems.length > 0 &&
                      <div className="key-point">
                        <p style={{ fontWeight: 600, marginBottom: "5px" }}>📉 問題</p>
                        {keyPoint.problems.map((text, index) => (
                          <li key={index}>{trimText(text)}</li>
                        ))}
                      </div>
                    }
                  </>) : ''
              }
            </div>
          </>
        ),
      }
    })

  }, [timelineDatas])

  return (
    <div className="report-section">
      <div className="analytics-card" style={styles.analysis}>
        <TimelineContainer
          items={timelineItems}
        ></TimelineContainer>
      </div>
    </div>
  );
}

export default ReportSection;
