import React, { useMemo, useRef, useState } from "react";
import TimelineContainer from "./TimelineContainer";
import type { TimelineItem } from '@/app/types/ai-report/common'
import { ReportV1 } from '@/app/types/ai-report'

import PIcon from "@/app/vendor/icon/PIcon";
import { iconExists } from "@/app/vendor/icon/tool";

import _ from '@/app/vendor/lodash'
import { FaPlay, FaStop } from "react-icons/fa";
import { useSyncState } from "@/app/hooks/useSyncState";

type TimelineData = ReportV1.TimelineData

type ReportSectionProps = {
  items: TimelineData[];
  meta?: {
    keyPointTitle1?: string;
    keyPointTitle2?: string;
    keyPointIcon1?: string;
    keyPointIcon2?: string;
  }
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
  const keyPointTitle1 = props.meta?.keyPointTitle1 || '關鍵句整理';
  const keyPointIcon1 = props.meta?.keyPointIcon1 || '❌';
  const keyPointTitle2 = props.meta?.keyPointTitle2 || '問題';
  const keyPointIcon2 = props.meta?.keyPointIcon2 || '📉';
  const [update, setUpdate] = useState(0);
  const doUpdate = () => {
    setUpdate(prev => prev + 1);
  }
  const playingAudioUrl = useSyncState<string | null>(null)
  const playingAudiosCount = useSyncState(0);
  const playingTarget = useSyncState<{ index: number, role: 'user' | 'ai' } | null>(null);
  // const [playingAudiosCount, setPlayingAudiosCount] = useState(0);
  function updatePlayingAudiosCount() {
    playingAudiosCount.set(playingAudios.current.length);
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
                        {playingTarget.state?.role === 'ai' && playingTarget.state?.index === index ? <FaStop {...playIconStyle.bind} /> : <FaPlay {...playIconStyle.bind} />}
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
                        {playingTarget.state?.role === 'user' && playingTarget.state?.index === index ? <FaStop {...playIconStyle.bind} /> : <FaPlay {...playIconStyle.bind} />}
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
                        <p style={{ fontWeight: 600, marginBottom: "5px" }}>{emojiOrIcon(keyPointIcon1)} {keyPointTitle1}</p>
                        {keyPoint.sentences.map((text, index) => (
                          <li key={index}>{trimText(text)}</li>
                        ))}
                      </div>
                    }
                    {keyPoint.problems.length > 0 &&
                      <div className="key-point">
                        <p style={{ fontWeight: 600, marginBottom: "5px" }}>{emojiOrIcon(keyPointIcon2)} {keyPointTitle2}</p>
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

  }, [timelineDatas, playingAudiosCount.state, playingAudioUrl.state, playingTarget.state])

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

  function getContentText(index: number, role: 'user' | 'ai') {
    const item = timelineDatas[index];
    if (role === 'ai') {
      return item.aiSay || '';
    } else if (role === 'user') {
      return item.userSay || '';
    }
    return '';
  }
  function stopAllAudios() {
    for (const item of playingAudios.current) {
      item.audio.pause()
      item.audio.currentTime = 0
      document.body.removeChild(item.audio);
    }
    playingAudios.current = []
    playingAudioUrl.current = null;
    playingTarget.current = null;
    updatePlayingAudiosCount();
  }
  function playAudios(index: number, role: 'user' | 'ai') {
    const audio = getAudios(index, role);
    if (audio?.url) {
      const audioElement = new Audio(audio.url)
      audioElement.className = 'report-timeline-audio';
      audioElement.style.display = 'none';
      audioElement.currentTime = audio.startTime ?? 0
      if (role === 'user') {
        // 用戶的語音要抓早一點，因為完整講完話之後，AI還會延遲一下才回傳 user message 的轉錄結果
        // 所以這裡最少要提前 3 秒開始播放
        // 註1：還要根據內容長度來調整，如果內容很長，則提前的時間要更長
        // 註2：另外也要避免 currentTime 小於 0 的情況
        const base = 3; // 基本提前時間
        const content = getContentText(index, 'user');
        const predictionTime = 0.3 * content.length; // 假設每個字平均需要 0.3 秒來講
        audioElement.currentTime = Math.max(0, audioElement.currentTime - predictionTime - base);
      }
      playingAudioUrl.current = audio.url;
      audioElement.play()
      audioElement.loop = false;
      playingAudios.current.push({ index, audio: audioElement })
      playingTarget.current = { index, role };
      audioElement.onerror = (e) => {
        playingAudios.current = playingAudios.current.filter(item => item.audio !== audioElement);
        playingAudioUrl.current = null;
        playingTarget.current = null;
        doUpdate();
      }
      audioElement.onended = () => {
        playingAudios.current = playingAudios.current.filter(item => item.audio !== audioElement);
        playingAudioUrl.current = null;
        playingTarget.current = null;
        doUpdate();
      }
      document.body.appendChild(audioElement);
      doUpdate();
      updatePlayingAudiosCount();
    }
  }

  function clickAudioBtn(index: number, role: 'user' | 'ai') {
    if (playingAudios.current.length > 0) {
      // const currentAudio = getAudios(index, role)?.url;
      if (playingTarget.state?.role === role && playingTarget.state?.index === index) {
        // 如果點擊的音訊是正在播放的，則停止它
        stopAllAudios()
      } else {
        // 如果點擊的音訊不是正在播放的，則停止所有音訊並播放新的
        stopAllAudios()
        playAudios(index, role)
      }
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


function emojiOrIcon(icon: string) {
  if (iconExists(icon)) {
    return <PIcon name={icon as any} size={14} />
  }
  return <span>{icon}</span>
}


export default ReportSection;
