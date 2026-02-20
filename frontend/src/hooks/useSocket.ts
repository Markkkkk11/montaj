'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { Message } from '@/lib/api/chat';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function useSocket(orderId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]); // Онлайн пользователи глобально
  const [roomUsers, setRoomUsers] = useState<string[]>([]); // Активные пользователи в комнате
  const { token } = useAuthStore();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Инициализация Socket.io
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('✅ Connected to Socket.io');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io');
      setConnected(false);
    });

    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Слушаем события онлайн/офлайн пользователей
    socketInstance.on('user-online', (data: { userId: string }) => {
      console.log(`🟢 User ${data.userId} is online`);
      setOnlineUsers((prev) => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
    });

    socketInstance.on('user-offline', (data: { userId: string }) => {
      console.log(`🔴 User ${data.userId} is offline`);
      setOnlineUsers((prev) => prev.filter((id) => id !== data.userId));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token]);

  // Присоединение к комнате заказа
  useEffect(() => {
    if (!socket || !orderId || !connected) return;

    socket.emit('join-order', orderId);

    socket.on('joined-order', (data: { orderId: string }) => {
      console.log(`👤 Joined order room: ${data.orderId}`);
    });

    // Слушаем обновления списка активных пользователей в комнате
    socket.on('room-users', (data: { orderId: string; users: string[] }) => {
      if (data.orderId === orderId) {
        console.log(`👥 Room users updated:`, data.users);
        setRoomUsers(data.users);
      }
    });

    return () => {
      socket.emit('leave-order', orderId);
      socket.off('joined-order');
      socket.off('room-users');
    };
  }, [socket, orderId, connected]);

  // Обработка новых сообщений
  useEffect(() => {
    if (!socket) return;

    socket.on('new-message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-typing', () => {
      setIsTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    });

    socket.on('user-stop-typing', () => {
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [socket]);

  // Отправить сообщение
  const sendMessage = useCallback(
    (content: string, fileUrl?: string) => {
      if (!socket || !orderId) return;

      socket.emit('send-message', {
        orderId,
        content,
        fileUrl,
      });
    },
    [socket, orderId]
  );

  // Индикатор печати
  const emitTyping = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit('typing', { orderId });
  }, [socket, orderId]);

  const emitStopTyping = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit('stop-typing', { orderId });
  }, [socket, orderId]);

  // Отметить как прочитанное
  const markAsRead = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit('mark-read', { orderId });
  }, [socket, orderId]);

  return {
    socket,
    connected,
    messages,
    setMessages,
    isTyping,
    onlineUsers,
    roomUsers,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markAsRead,
  };
}

