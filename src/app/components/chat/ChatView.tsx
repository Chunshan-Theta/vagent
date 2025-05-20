import React, { use, useMemo, useState } from 'react'

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
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div className="loading-icon">
              </div>
            </div>
          )}
          {/* if end => add end icon */}
          <div className="input-box">
            <input
              type="text"
              placeholder={!isMicActive ? "Not Started" : "Please enter here..."}
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
              End and Start Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default ChatView
