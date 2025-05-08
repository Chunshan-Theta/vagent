import React, { useMemo, useState } from 'react'

import { useChat } from '@/app/contexts/ChatContext'
import { useAppContext } from '@/app/contexts/AppContext'
import ChatMessageItem from './ChatMessageItem'

import { FaMicrophone, FaMicrophoneSlash, FaStop } from 'react-icons/fa'

import { useEffect } from 'react'

import './chat.scss'

interface ChatViewProps {
  boxShadow?: string
  background?: string
  classNames?: string[]

  isEnd?: boolean
  isLoading?: boolean
  isRecording?: boolean

  onSubmit?: (text: string) => void
  onClickEnd?: () => void
  onMicrophoneClick?: () => void
}

const ChatView: React.FC<ChatViewProps> = (props: ChatViewProps) => {
  const classNames = props.classNames || []
  const { background, onSubmit, onClickEnd, onMicrophoneClick } = props
  const { messageItems, inputText, updateInputText } = useChat()

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
  const isInputDisabled = disableInteraction || !dataChannel || isMicActive

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
          {props.isLoading && (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div className="loading-icon">
              </div>
            </div>
          )}
          {/* if end => add end icon */}
          <div className="input-box">
            <input
              type="text"
              placeholder={!isMicActive ? "通話未開始" : "請在此輸入..."}
              value={inputText}
              disabled={isInputDisabled}
              onChange={(e) => updateInputText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && isMicActive && onSubmit && onSubmit(inputText)
              }
              style={{
                opacity: isInputDisabled ? 0.6 : 1,
                cursor: isInputDisabled ? 'text' : 'not-allowed'
              }}
            />
            <button
              className={`mic-icon ${isMicActive ? 'active' : 'disabled'}`}
              disabled={disableInteraction}
              onClick={handleMicClick}
              style={{
                color: 'white',
                opacity: dataChannel ? 1 : 0.8
              }}
            >
              {isMicActive ? <FaStop /> : <FaMicrophone /> }
            </button>
            <button
              className="send-button"
              disabled={!isMicActive}
              onClick={() => onSubmit && onSubmit(inputText)}
              style={{
                backgroundColor: !isMicActive ? '#9e9e9e' : '#00a3e0',
                color: 'white',
                opacity: !isMicActive ? 0.6 : 1,
                cursor: !isMicActive ? 'not-allowed' : 'pointer'
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
              結束並開始分析
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ChatView
