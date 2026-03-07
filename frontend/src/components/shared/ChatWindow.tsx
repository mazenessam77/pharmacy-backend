'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket';
import { Message } from '@/types';
import { formatTime } from '@/lib/helpers';
import { Send } from 'lucide-react';
import type { Socket } from 'socket.io-client';

interface ChatWindowProps {
  orderId: string;
  recipientId: string;
}

export default function ChatWindow({ orderId, recipientId }: ChatWindowProps) {
  const { user } = useAuthStore();
  const { messages, fetchMessages, addMessage, markAllRead, setTyping, typingUsers, clearMessages } = useChatStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchMessages(orderId, recipientId);
    markAllRead(orderId);

    let cleanup = false;

    const setup = async () => {
      const socket = await getSocket();
      if (cleanup) return;
      socketRef.current = socket;
      socket.emit('order:join', { orderId });

      socket.on('chat:new-message', (data: { message: Message }) => {
        addMessage(data.message);
      });

      socket.on('chat:typing', (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== user?._id) {
          setTyping(data.userId, data.isTyping);
        }
      });
    };
    setup();

    return () => {
      cleanup = true;
      if (socketRef.current) {
        socketRef.current.emit('order:leave', { orderId });
        socketRef.current.off('chat:new-message');
        socketRef.current.off('chat:typing');
      }
      clearMessages();
    };
  }, [orderId, recipientId, fetchMessages, addMessage, markAllRead, setTyping, clearMessages, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);

    const socket = await getSocket();
    socket.emit('chat:send-message', {
      orderId,
      receiverId: recipientId,
      content: text.trim(),
    });
    socket.emit('chat:stop-typing', { orderId, userId: user?._id });

    setText('');
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingInput = async () => {
    const socket = await getSocket();
    socket.emit('chat:start-typing', { orderId, userId: user?._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      const s = await getSocket();
      s.emit('chat:stop-typing', { orderId, userId: user?._id });
    }, 2000);
  };

  return (
    <div className="border border-neutral-200 flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-neutral-400">No messages yet</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = (typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id) === user?._id;
          return (
            <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] px-4 py-2.5 ${isMine ? 'bg-black text-white' : 'bg-neutral-100 text-black'}`}>
                {msg.messageType === 'alternative' && msg.alternativeData ? (
                  <div className="text-[12px]">
                    <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Alternative Suggestion</p>
                    <p>{msg.alternativeData.originalMedicine} → {msg.alternativeData.suggestedMedicine}</p>
                    <p className="mt-1">Price: ${msg.alternativeData.suggestedPrice}</p>
                  </div>
                ) : (
                  <p className="text-[13px] leading-relaxed">{msg.content}</p>
                )}
                <p className="text-[10px] mt-1 text-neutral-400">
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 px-4 py-2 text-[12px] text-neutral-400">
              typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-200 p-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); handleTypingInput(); }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-[13px] bg-transparent border-0 focus:outline-none placeholder-neutral-300"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="px-4 py-2 bg-black text-white disabled:opacity-30 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
