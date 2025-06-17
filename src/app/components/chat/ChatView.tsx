import React, { use, useMemo, useRef, useState } from 'react'

import { useChat } from '@/app/contexts/ChatContext'
import { useAppContext } from '@/app/contexts/AppContext'
import ChatMessageItem from './ChatMessageItem'

import { FaMicrophone, FaMicrophoneSlash, FaStop } from 'react-icons/fa'

import { useEffect } from 'react'

import './chat.scss'
import { getTranslation, Language } from '@/app/i18n/translations'

import { useAiChat } from '@/app/lib/ai-chat/aiChat'


interface ChatViewProps {
  boxShadow?: string
  background?: string
  classNames?: string[]
  lang?: Language

  isEnd?: boolean
  isLoading?: boolean
  isRecording?: boolean

  /** 預設會直接同步 chat context 的 analyze progress，可透過設置為 true 來取消 */
  noSyncProgress?: boolean
  /** 0 ~ 100，只在 noSyncProgress = true 時生效 */
  progress?: number


  onSubmit?: (text: string) => void
  onClickEnd?: () => void
  onMicrophoneClick?: () => void
}

const ChatView: React.FC<ChatViewProps> = (props: ChatViewProps) => {

  const chatCtx = useChat()

  const classNames = props.classNames || []
  const { background, onSubmit, onClickEnd, onMicrophoneClick } = props
  const { messageItems, inputText, updateInputText } = useChat()
  const loadingUpdateInterval = useRef<any>(null)
  const [loadingText, setLoadingText] = useState('')

  useEffect(() => {
    // 清除 loadingUpdateInterval
    if (loadingUpdateInterval.current) {
      clearInterval(loadingUpdateInterval.current)
      loadingUpdateInterval.current = null
    }

    // 如果有 isLoading，則開始更新 loadingText
    if (props.isLoading) {
      let count = 0
      loadingUpdateInterval.current = setInterval(() => {
        count = (count + 1) % 3
        setLoadingText('處理中' + '.'.repeat(count + 1))
      }, 500)
    } else {
      setLoadingText('')
    }

    return () => {
      if (loadingUpdateInterval.current) {
        clearInterval(loadingUpdateInterval.current)
        loadingUpdateInterval.current = null
      }
    }
  }, [props.isLoading])

  const doSyncProgress = useMemo(() => {
    return !props.noSyncProgress
  }, [props.noSyncProgress])

  const currentProgress = useMemo(() => {
    if (props.noSyncProgress) {
      return props.progress ?? 0
    }
    return chatCtx.analysisProgress
  }, [chatCtx.analysisProgress, props.progress, props.noSyncProgress])

  const isLoading = useMemo(() => {
    return props.isLoading || false
  }, [props.isLoading])

  /**
   * 決定 mic 的 icon 是否顯示為"開啟狀態"
   */
  const isMicActive = useMemo(() => {
    return props.isRecording || false
  }, [props.isRecording])

  const mClassNames = useMemo(() => {
    return ['chat', ...classNames]
  }, [classNames])
  const disableInteraction = useMemo(() => {
    return props.isEnd || props.isLoading
  }, [props.isEnd, props.isLoading])

  const { dataChannel } = useAppContext()
  const maxWidth = 450
  const chatStyle = {
    maxWidth: `${maxWidth}px`,
    margin: '0px auto',
    background: background ?? '#173944',
    borderRadius: '20px',
  }
  const msgOpts = {}

  const handleMicClick = () => {
    if (!disableInteraction && onMicrophoneClick) {
      onMicrophoneClick()
    }
  }

  // Determine if input and submit button should be disabled
  const isInputDisabled = disableInteraction || !isMicActive

  const micState = useMemo(() => {
    const state = {
      className: '',
      disabled: false,
    }
    if (isLoading) {
      state.disabled = true
    }
    if (isMicActive) {
      state.className = 'active'
    }
    if (disableInteraction) {
      state.className = 'disabled'
    }
    return state
  }, [isLoading, isMicActive, disableInteraction])


  const activeSendButton = useMemo(() => {
    return isMicActive && !isLoading
  }, [isMicActive, isLoading])
  const NoStart = getTranslation(props.lang || 'en', 'chat_view.not_started')
  const PleaseEnter = getTranslation(props.lang || 'en', 'chat_view.enter_message')
  const EndAndStartAnalysis = getTranslation(props.lang || 'en', 'chat_view.end_and_analyze')

  return (
    <div className={mClassNames.join(' ')} style={chatStyle}>
      <div className="chat-view">
        <div className="chat-header"></div>
        <div className="chat-content">
          {messageItems.filter((m) => !m.hide).map((message, index) => (
            <ChatMessageItem
              messages={messageItems}
              message={message}
              index={index}
              msgOpts={msgOpts}
              key={message.id}
            ></ChatMessageItem>
          ))}
        </div>
        <div className="chat-footer">
          {/* if loading => add loading icon */}
          {isLoading && (
            <div className="progress-bar-container" style={{ width: '100%', marginBottom: 8 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${currentProgress}%`,
                  height: 4,
                  background: '#00a3e0',
                  borderRadius: 3,
                  transition: 'width 0.3s',
                }}
              />
            </div>
          )}
          {isLoading && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              {/* <div className="loading-icon"></div> */}
              <span style={{ color: '#fff5' }}>{loadingText}</span>
            </div>
          )}
          {/* if end => add end icon */}
          <div className="input-box">
            <input
              type="text"
              placeholder={!isMicActive ? NoStart : PleaseEnter}
              value={inputText}
              disabled={isInputDisabled}
              onChange={(e) => updateInputText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && isMicActive && onSubmit && onSubmit(inputText)
              }
              style={{
                opacity: isInputDisabled ? 0.6 : 1,
                cursor: isInputDisabled ? 'not-allowed' : 'text'
              }}
            />
            <button
              className={`mic-icon ${micState.className}`}
              disabled={micState.disabled}
              onClick={handleMicClick}
              style={{
                color: 'white'
              }}
            >
              {isMicActive ? <FaStop /> : <FaMicrophone />}
            </button>
            <button
              className="send-button"
              disabled={!activeSendButton}
              onClick={() => onSubmit && onSubmit(inputText)}
              style={{
                backgroundColor: !activeSendButton ? '#9e9e9e' : '#00a3e0',
                color: 'white',
                opacity: !activeSendButton ? 0.6 : 1,
                cursor: !activeSendButton ? 'not-allowed' : 'pointer'
              }}
            >
              ➤
            </button>
          </div>
          <div style={{ width: '100%' }}>
            <button
              className="end-button"
              disabled={disableInteraction}
              onClick={() => !disableInteraction && onClickEnd && onClickEnd()}
            >
              {EndAndStartAnalysis}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ChatView
