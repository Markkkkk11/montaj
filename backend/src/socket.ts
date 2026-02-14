import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';
import chatService from './services/chat.service';
import notificationService from './services/notification.service';
import prisma from './config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

// Хранилище онлайн пользователей: userId -> Set<socketId>
const onlineUsers = new Map<string, Set<string>>();

// Хранилище комнат пользователей: orderId -> Set<userId>
const orderRooms = new Map<string, Set<string>>();

/**
 * Инициализация Socket.io для real-time чата
 */
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
    path: '/socket.io/',
  });

  // Middleware для аутентификации
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token as string, config.jwtSecret) as { userId: string };
      socket.userId = decoded.userId;

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Обработка подключений
  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Добавляем пользователя в список онлайн
    if (socket.userId) {
      if (!onlineUsers.has(socket.userId)) {
        onlineUsers.set(socket.userId, new Set());
      }
      onlineUsers.get(socket.userId)!.add(socket.id);

      // Уведомляем всех о новом онлайн пользователе
      io.emit('user-online', { userId: socket.userId });
      console.log(`🟢 User ${socket.userId} is now online`);
    }

    // Пользователь присоединяется к комнате заказа
    socket.on('join-order', async (orderId: string) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Проверяем доступ к заказу
        const messages = await chatService.getMessages(orderId, socket.userId, 1);
        
        // Если нет ошибки, значит доступ есть
        socket.join(`order-${orderId}`);
        
        // Добавляем в список пользователей комнаты
        if (!orderRooms.has(orderId)) {
          orderRooms.set(orderId, new Set());
        }
        orderRooms.get(orderId)!.add(socket.userId);

        // Уведомляем всех в комнате об активных пользователях
        const activeUsers = Array.from(orderRooms.get(orderId) || []);
        io.to(`order-${orderId}`).emit('room-users', { orderId, users: activeUsers });

        socket.emit('joined-order', { orderId });
        
        console.log(`👤 User ${socket.userId} joined order room: ${orderId}`);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Пользователь покидает комнату заказа
    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order-${orderId}`);
      
      // Убираем из списка пользователей комнаты
      if (socket.userId && orderRooms.has(orderId)) {
        orderRooms.get(orderId)!.delete(socket.userId);
        
        // Уведомляем оставшихся об обновлении списка
        const activeUsers = Array.from(orderRooms.get(orderId) || []);
        io.to(`order-${orderId}`).emit('room-users', { orderId, users: activeUsers });
      }

      socket.emit('left-order', { orderId });
      
      console.log(`👋 User ${socket.userId} left order room: ${orderId}`);
    });

    // Отправка сообщения
    socket.on('send-message', async (data: { orderId: string; content: string; fileUrl?: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { orderId, content, fileUrl } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Создаём сообщение
        const message = await chatService.createMessage(orderId, socket.userId, content, fileUrl);

        // Отправляем всем в комнате (включая отправителя)
        io.to(`order-${orderId}`).emit('new-message', message);

        // Отправляем уведомление получателю (если он не в чате)
        try {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
              title: true,
              customerId: true,
              executorId: true,
            },
          });

          if (order) {
            const recipientId = socket.userId === order.customerId ? order.executorId : order.customerId;
            
            // Проверяем, онлайн ли получатель в этой комнате
            const recipientOnlineInRoom = orderRooms.get(orderId)?.has(recipientId || '');
            
            // Если получатель не в комнате, отправляем уведомление
            if (recipientId && !recipientOnlineInRoom) {
              const sender = await prisma.user.findUnique({
                where: { id: socket.userId },
                select: { fullName: true },
              });

              if (sender) {
                await notificationService.notifyNewMessage(
                  recipientId,
                  sender.fullName,
                  orderId,
                  order.title,
                  content
                );
              }
            }
          }
        } catch (notifError) {
          console.error('Failed to send message notification:', notifError);
          // Не прерываем отправку сообщения из-за ошибки уведомления
        }

        console.log(`💬 New message in order ${orderId} from user ${socket.userId}`);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Пользователь начинает печатать
    socket.on('typing', (data: { orderId: string }) => {
      socket.to(`order-${data.orderId}`).emit('user-typing', {
        userId: socket.userId,
        orderId: data.orderId,
      });
    });

    // Пользователь закончил печатать
    socket.on('stop-typing', (data: { orderId: string }) => {
      socket.to(`order-${data.orderId}`).emit('user-stop-typing', {
        userId: socket.userId,
        orderId: data.orderId,
      });
    });

    // Отметить сообщения как прочитанные
    socket.on('mark-read', async (data: { orderId: string }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        await chatService.markAsRead(data.orderId, socket.userId);

        // Уведомляем других пользователей в комнате
        socket.to(`order-${data.orderId}`).emit('messages-read', {
          userId: socket.userId,
          orderId: data.orderId,
        });

        console.log(`✓ User ${socket.userId} marked messages as read in order ${data.orderId}`);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);

      // Убираем сокет пользователя из онлайн-списка
      if (socket.userId && onlineUsers.has(socket.userId)) {
        onlineUsers.get(socket.userId)!.delete(socket.id);
        
        // Если у пользователя больше нет активных сокетов - он офлайн
        if (onlineUsers.get(socket.userId)!.size === 0) {
          onlineUsers.delete(socket.userId);
          
          // Уведомляем всех об офлайн статусе
          io.emit('user-offline', { userId: socket.userId });
          console.log(`🔴 User ${socket.userId} is now offline`);
        }

        // Убираем пользователя из всех комнат заказов
        orderRooms.forEach((users, orderId) => {
          if (users.has(socket.userId!)) {
            users.delete(socket.userId!);
            const activeUsers = Array.from(users);
            io.to(`order-${orderId}`).emit('room-users', { orderId, users: activeUsers });
          }
        });
      }
    });
  });

  return io;
}

/**
 * Получить список онлайн пользователей
 */
export function getOnlineUsers(): string[] {
  return Array.from(onlineUsers.keys());
}

/**
 * Проверить, онлайн ли пользователь
 */
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

