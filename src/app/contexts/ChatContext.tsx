"use client";

import React, { createContext, useContext, useState, FC, PropsWithChildren } from "react";

export type BaseMessage = {
  id: string;
  // type: string;
  role: 'user' | 'assistant' | 'system';
  /** 顯示的頭像 */
  avatar?: string;
  /** 顯示的名字 */
  sender?: string;
  createdAtMs: number;
  data?: any;

  hide?: boolean;
}

export type TextMessage = BaseMessage & {
  type: 'text';
  data: {
    content: string
  }
}

export type PopupMessage = BaseMessage & {
  type: 'popup';
  data: {
    title: string;
    content: string;
  }
}

export type MessageItem = TextMessage | PopupMessage
export type MessagesContextValue = {
  messageItems: MessageItem[];
  inputText: string;
  addMessageItem: (msg: MessageItem) => void;
  insertMessageItem: (msgId: string, place: 'before' | 'after', msg: MessageItem) => void;
  updateMessageContent: (msgId: string, newContent: string) => void;
  /** 更新輸入框的文字 */
  updateInputText: (text: string) => void;
  submitInputText: (input?: string) => void;
};

const ChatContext = createContext<MessagesContextValue | undefined>(undefined);

export const ChatProvider: FC<PropsWithChildren> = ({ children }) => {
  const [inputText, setInputText] = useState<string>("");
  const [messageItems, setMessages] = useState<MessageItem[]>([]);

  const addMessageItem = (msgItem: MessageItem) => {
    setMessages((messages) => {
      const { id, role, type } = msgItem;
      if (messages.some((log) => log.id === id && log.type === type)) {
        console.warn(`[addMessage] skipping; message already exists for id=${id}, role=${role}, type=${type}`);
        return messages;
      }
      const { data, avatar, sender, hide } = msgItem
      const newItem: MessageItem = {
        id,
        type,
        role,
        data,
        avatar,
        sender,
        hide,
        createdAtMs: Date.now(),
      };

      return [...messages, newItem];
    });
  };
  const insertMessageItem = (msgId: string, place: 'before' | 'after', msg: MessageItem) => {
    setMessages((messages) => {
      const index = messages.findIndex((message) => message.id === msgId);
      if (index === -1) {
        console.warn(`[insertMessageItem] Message with id=${msgId} not found.`);
        return messages;
      }

      const newMessages = [...messages];
      const insertIndex = place === 'before' ? index : index + 1;
      newMessages.splice(insertIndex, 0, { ...msg, createdAtMs: Date.now() });

      return newMessages;
    });
  };

  const updateMessageContent = (msgId: string, newContent: string) => {
    setMessages((messages) => {
      const index = messages.findIndex((message) => message.id === msgId);
      if (index === -1) {
        console.warn(`[updateMessageContent] Message with id=${msgId} not found.`);
        return messages;
      }

      const newMessages = [...messages];
      newMessages[index] = { ...newMessages[index], data: { ...newMessages[index].data, content: newContent } };

      return newMessages;
    });
  }
  const updateInputText = (text: string) => {
    setInputText(text);
  };

  const submitInputText = (input?: string) => {
    if (input == null) [
      input = inputText
    ]
    console.log('submitInputText', input)
  }

  return (
    <ChatContext.Provider
      value={{
        inputText,
        messageItems,
        addMessageItem,
        insertMessageItem,
        updateMessageContent,
        updateInputText,
        submitInputText,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}