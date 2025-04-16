import React, { useState } from 'react';

import { useChat } from '@/app/contexts/ChatContext';
import ChatMessageItem from './ChatMessageItem';

import './chat.scss';
import { useEffect } from 'react';

interface ChatViewProps {
  background?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ background }) => {
  const { messageItems, inputText, addMessageItem, updateInputText, submitInputText } = useChat();
  const maxWidth = 450;
  const chatStyle = {
    maxWidth: `${maxWidth}px`,
    margin: '0px auto',
    background: background || '#173944',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 160, 255, 0.15)'
  };
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
            >
            </ChatMessageItem>
          ))}
        </div>
        <div className="chat-footer">
          <div
            className="input-box">
            <input
              type="text"
              placeholder="請在此輸入..."
              value={inputText}
              onChange={(e) => updateInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitInputText()}
            />
            <button className="send-button" onClick={() => submitInputText()}>➤</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatView;