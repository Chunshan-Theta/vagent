import React, { useMemo, useState } from 'react'

import { useChat } from '@/app/contexts/ChatContext'
import { useAppContext } from '@/app/contexts/AppContext'
import ChatMessageItem from './ChatMessageItem'

import { FaMicrophone } from 'react-icons/fa'

import './chat.scss'

interface ChatViewProps {
  background?: string

  isEnd?: boolean
  isLoading?: boolean

  onSubmit?: (text: string) => void
  onClickEnd?: () => void
}

const ChatView: React.FC<ChatViewProps> = (props: ChatViewProps) => {
  const { background, onSubmit, onClickEnd } = props
  const { messageItems, inputText, addMessageItem, updateInputText } = useChat()

  const disableInteraction = useMemo(() => {
    return props.isEnd || props.isLoading
  }, [props.isEnd, props.isLoading])

  const { dataChannel } = useAppContext()
  const maxWidth = 450
  const chatStyle = {
    maxWidth: `${maxWidth}px`,
    margin: '0px auto',
    background: background || '#173944',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 160, 255, 0.15)',
  }
  const msgOpts = {}

  return (
    <div className="chat" style={chatStyle}>
      <div className="chat-view">
        <div className="chat-header"></div>
        <div className="chat-content">
          {messageItems.map((message, index) => (
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
              placeholder="請在此輸入..."
              value={inputText}
              disabled={disableInteraction}
              onChange={(e) => updateInputText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !disableInteraction && onSubmit && onSubmit(inputText)
              }
            />
            <button className={dataChannel ? 'mic-icon active' : 'mic-icon'} disabled={disableInteraction}>
              <FaMicrophone />
            </button>
            <button
              className="send-button"
              disabled={disableInteraction}
              onClick={() => !disableInteraction && onSubmit && onSubmit(inputText)}
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
