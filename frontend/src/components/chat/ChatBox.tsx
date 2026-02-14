'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { chatApi, Message } from '@/lib/api/chat';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Loader2, CheckCheck, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ChatBoxProps {
  orderId: string;
  otherUserId?: string; // ID собеседника (заказчика или исполнителя)
}

export function ChatBox({ orderId, otherUserId }: ChatBoxProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    connected,
    messages: socketMessages,
    setMessages,
    isTyping,
    onlineUsers,
    roomUsers,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markAsRead,
  } = useSocket(orderId);

  // Проверяем, онлайн ли собеседник
  const isOtherUserOnline = otherUserId ? roomUsers.includes(otherUserId) : false;

  // Загрузка истории сообщений
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const history = await chatApi.getMessages(orderId);
        setMessages(history);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [orderId, setMessages]);

  // Автопрокрутка к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [socketMessages]);

  // Отметить как прочитанное при открытии
  useEffect(() => {
    if (!loading && socketMessages.length > 0) {
      markAsRead();
      chatApi.markAsRead(orderId).catch(console.error);
    }
  }, [orderId, loading, socketMessages.length, markAsRead]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    setSending(true);
    const content = inputValue.trim();
    setInputValue('');

    try {
      if (connected) {
        // Отправка через Socket.io
        sendMessage(content);
      } else {
        // Fallback на REST API
        await chatApi.sendMessage(orderId, content);
      }
      emitStopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputValue(content); // Вернуть текст при ошибке
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length > 0) {
      emitTyping();
    } else {
      emitStopTyping();
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Заголовок */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Чат по заказу</h3>
          <div className="flex items-center gap-3">
            {!connected && (
              <span className="text-xs text-muted-foreground">Переподключение...</span>
            )}
            {connected && otherUserId && (
              <span className={`text-xs flex items-center gap-1 ${isOtherUserOnline ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isOtherUserOnline ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`} />
                {isOtherUserOnline ? 'Собеседник онлайн' : 'Офлайн'}
              </span>
            )}
            {connected && !otherUserId && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Подключено
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {socketMessages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Пока нет сообщений. Начните общение!
          </div>
        )}

        {socketMessages.map((message) => {
          const isOwn = message.senderId === user?.id;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwn && (
                  <span className="text-xs text-muted-foreground mb-1">
                    {message.sender.fullName}
                  </span>
                )}
                <div
                  className={`rounded-lg px-4 py-2 ${
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  {message.fileUrl && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline mt-1 block"
                    >
                      Файл
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                  {isOwn && (
                    <span className="text-xs text-muted-foreground">
                      {message.read ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !inputValue.trim()}
            size="icon"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

