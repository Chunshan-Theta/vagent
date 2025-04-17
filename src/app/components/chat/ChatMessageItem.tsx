import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { MessageItem } from '@/app/contexts/ChatContext'
import ChatTextMessage from './ChatTextMessage'

interface ChatMessageItemProps {
  messages?: MessageItem[]
  message?: MessageItem
  index?: number
  msgOpts?: Record<string, any>
  // onTypeUpdate?: (ev: any) => void
  // onChatEvent?: (ev: any) => void
  // onNext?: () => void
}

const components = {
  text: ChatTextMessage,
  popup: ChatTextMessage,
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = (props) => {
  const { messages = [], message = null, index = 0, msgOpts = {} } = props
  const type = (message?.type || 'text') as MessageItem['type']
  const Component = components[type] || components['text']

  const hide = useMemo(() => {
    if (message) {
      return message.hide
    }
    return false
  }, [message])


  const bindProps = useMemo(
    () => {
      const props = {
        messages,
        message,
        index,
        msgOpts,
      }
      return props
    },
    [messages, message, index, msgOpts]
  )

  return !hide ? (
    <div className="message-item">
      <Component {...bindProps} />
    </div>
  ) : null
}

export default ChatMessageItem
