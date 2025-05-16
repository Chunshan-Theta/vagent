import React, { CSSProperties, useMemo } from 'react'
import type { MessageItem, TextMessage } from '@/app/contexts/ChatContext'
import Image from 'next/image'


interface ChatTextMessageProps {
  messages: MessageItem[]
  message: MessageItem | null
  index: number
  msgOpts?: Record<string, any>
}

const styleSet = {
  default: {
    userMessageBackground: '#FFBD1F',
    userMessageColor: '#222',
    assistantMessageBackground: '#2E5C68',
    assistantMessageColor: '#FFF',
    systemMessageBackground: '#194A54',
    systemMessageColor: '#FFF',
  },
}

const ChatTextMessage: React.FC<ChatTextMessageProps> = ({
  messages,
  message,
  index,
  msgOpts = {},
}) => {
  const msg = message as TextMessage
  const colorSet = styleSet.default

  const role = useMemo(() => message?.role, [message])
  const content = useMemo(() => {
    if (message) {
      return message.data?.content
    }
    return ''
  }, [message])
  

  const classNames = useMemo(() => {
    return ['simple-message', `msg-${role}`]
  }, [message])

  const textColor = useMemo(() => {
    if (role === 'user') {
      return colorSet.userMessageColor
    } else if (role === 'assistant') {
      return colorSet.assistantMessageColor
    } else if (role === 'system') {
      return colorSet.systemMessageColor
    }
    return '#000'
  }, [message])

  const background = useMemo(() => {
    if (role === 'user') {
      return colorSet.userMessageBackground
    }
    if (role === 'assistant') {
      return colorSet.assistantMessageBackground
    }
    if (role === 'system') {
      return colorSet.systemMessageBackground
    }
    return '#fff'
  }, [message])

  const borderRadius = useMemo(() => {
    if (role === 'user') {
      return ' 20px 4px 20px 20px'
    }
    return '16px'
  }, [message])

  const align = useMemo(() => {
    if (role === 'user') {
      return 'right'
    } else if (role === 'assistant') {
      return 'left'
    } else if (role === 'system') {
      return 'center'
    }
    return 'left'
  }, [message])

  const avatar = useMemo(() => {
    const src = msg.avatar
    if (!src) {
      return { show: false }
    }

    return {
      show: true,
      type: 'image',
      src: src,
    }
  }, [message])

  const msgStyle = useMemo(() => {
    return {
      padding: '14px 16px',
      // background: background,
      // borderRadius: borderRadius,
      boxShadow: '0 2px 10px rgba(0, 255, 255, 0.1)',
      fontSize: '14px',
      lineHeight: '1.6',
      color: textColor,
    }
  }, [message])

  const avatarRef = <div className="avatar">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={avatar.src!}
      alt=""
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        marginRight: '8px',
      }}
    />
  </div>

  return ( content !== '' &&
    <div className={classNames.join(' ')} style={{ textAlign: align }}>
      {avatar.show && avatar.type === 'image' && role === 'assistant' && avatarRef}
      <div className="content-wrap">
        <div className="message-text" style={msgStyle}>
          {content}
        </div>
      </div>
      {avatar.show && avatar.type === 'image' && role === 'user' && avatarRef}
    </div>
  )
}

export default ChatTextMessage
