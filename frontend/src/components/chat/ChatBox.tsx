'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { chatApi, Message } from '@/lib/api/chat';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Loader2, CheckCheck, Check, Paperclip } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Максимальный размер файла — 10 МБ');
      return;
    }

    try {
      setSending(true);
      await chatApi.uploadFile(orderId, file);
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    <Card className="flex flex-col h-[70vh] sm:h-[600px]">
      {/* Заголовок */}
      <div className="p-3 sm:p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="font-semibold text-base sm:text-lg">Чат по заказу</h3>
          <div className="flex items-center gap-2 sm:gap-3">
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
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
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
              <div className={`max-w-[85%] sm:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
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
                  {message.fileUrl && (() => {
                    const fileUrl = message.fileUrl.startsWith('/') 
                      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${message.fileUrl}` 
                      : message.fileUrl;
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(message.fileUrl);
                    return isImage ? (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                        <img src={fileUrl} alt="Фото" className="max-w-[180px] max-h-[150px] sm:max-w-[250px] sm:max-h-[200px] rounded-md" />
                      </a>
                    ) : (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline mt-1 flex items-center gap-1"
                      >
                        📎 Скачать файл
                      </a>
                    );
                  })()}
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
      <div className="p-3 sm:p-4 border-t">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.dwg"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            title="Прикрепить файл"
            className="h-9 w-9 sm:h-10 sm:w-10"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            disabled={sending}
            className="flex-1 text-sm"
          />
          <Button
            onClick={handleSend}
            disabled={sending || !inputValue.trim()}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10"
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

