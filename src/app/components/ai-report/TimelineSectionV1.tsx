import React, { useMemo, useRef, useState } from "react";
import TimelineContainer from "./TimelineContainer";
import type { TimelineItem } from '@/app/types/ai-report/common'
import { ReportV1 } from '@/app/types/ai-report'


import _ from '@/app/vendor/lodash'
import { FaPlay, FaStop } from "react-icons/fa";

type TimelineData = ReportV1.TimelineData

type ReportSectionProps = {
  items: TimelineData[];
}

const ReportSection: React.FC<ReportSectionProps> = (props) => {
  props = props || {}
  const timelineDatas = props.items || []
  console.log('[update]')


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
  const [update, setUpdate] = useState(0);
  const doUpdate = () => {
    setUpdate(prev => prev + 1);
  }
  const [playingAudiosCount, setPlayingAudiosCount] = useState(0);
  function updatePlayingAudiosCount() {
    setPlayingAudiosCount(() => {
      return playingAudios.current.length;
    })
  }

  const playingAudios = useRef<{ index: number, audio: HTMLAudioElement }[]>([])

  const playIconStyle = {
    bind: {
      size: 10,
    }

  }
  const timelineItems = useMemo<TimelineItem[]>(() => {
    return timelineDatas.map((item, index) => {

      const keyPoint = {
        sentences: item.keyPoint?.sentences || [],
        problems: item.keyPoint?.problems || [],
      }
      const aiAudio = handleAudioObj(item.aiAudio)
      const userAudio = handleAudioObj(item.userAudio)
      const needKeyPoint = (keyPoint.sentences.length > 0) ||
        (keyPoint.problems.length > 0)
      // const audios = [handleAudioObj(item.aiAudio)!, handleAudioObj(item.userAudio)!].filter(audio => audio && audio.url)
      // console.log({
      //   item,
      //   audios

      // })
      return {
        meta: {
          title: item.title,
          subtitle: item.subtitle,
          subtitleColor: item.subtitleColor,
          timelineColor: item.mainColor,
          aiAudio: aiAudio || undefined,
          userAudio: userAudio || undefined,
        },
        node: (
          <>
            <div className="content-row">

              {item.aiSay && (
                <div className="dialogue-box">
                  <p>{item.aiRole || 'AI'}說：
                    {aiAudio && aiAudio.url && (
                      <button
                        className="audio-btn"
                        onClick={() => clickAudioBtn(index, 'ai')}
                        style={{ backgroundColor: item.mainColor || '#ffd166' }}
                      >
                        {playingAudiosCount > 0 ? <FaStop {...playIconStyle.bind} /> : <FaPlay {...playIconStyle.bind} />}
                      </button>
                    )}</p>
                  <p>「{item.aiSay}」</p>
                </div>
              )}
              {item.userSay && (
                <div className="dialogue-box agent">
                  <p>{item.userRole || 'User'}說：
                    {userAudio && userAudio.url && (
                      <button
                        className="audio-btn"
                        onClick={() => clickAudioBtn(index, 'user')}
                        style={{ backgroundColor: item.mainColor || '#ffd166' }}
                      >
                        {playingAudiosCount > 0 ? <FaStop {...playIconStyle.bind} /> : <FaPlay {...playIconStyle.bind} />}
                      </button>
                    )}</p>
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

  }, [timelineDatas, playingAudiosCount])

  function trimText(text: string) {
    text = text || ''
    return _.trim(text, ' \n\r\t"\'-「」')
  }

  function handleAudioObj(item: ReportSectionProps['items'][number]['userAudio']) {
    if (!item) return null
    return {
      url: item?.url || '',
      startTime: item?.startTime || 0,
    }
  }



  function getAudios(index: number, role: 'user' | 'ai') {
    const item = timelineItems[index];
    const meta = item.meta || {};
    if (role === 'ai') {
      return meta.aiAudio;
    } else if (role === 'user') {
      return meta.userAudio;
    }
  }
  function stopAllAudios() {
    for (const item of playingAudios.current) {
      item.audio.pause()
      item.audio.currentTime = 0
    }
    playingAudios.current = []
    updatePlayingAudiosCount();
  }
  function playAudios(index: number, role: 'user' | 'ai') {
    const audio = getAudios(index, role);
    if (audio) {
      const audioElement = new Audio(audio.url)
      audioElement.currentTime = audio.startTime ?? 0
      if(role === 'user'){
        audioElement.currentTime -= 2 // 用戶的語音要抓早一點
      }
      audioElement.play()
      audioElement.loop = false;
      playingAudios.current.push({ index, audio: audioElement })
      audioElement.onerror = (e) => {
        playingAudios.current = playingAudios.current.filter(item => item.audio !== audioElement);
        doUpdate();
      }
      audioElement.onended = () => {
        playingAudios.current = playingAudios.current.filter(item => item.audio !== audioElement);
        doUpdate();
      }
      doUpdate();
      updatePlayingAudiosCount();
    }
  }

  function clickAudioBtn(index: number, role: 'user' | 'ai') {
    // console.log('playingAudiosCount', p)
    if (playingAudios.current.length > 0) {
      stopAllAudios()
    } else {
      playAudios(index, role)
    }
  }


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
