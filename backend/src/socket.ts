import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/env';
import chatService from './services/chat.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

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
        socket.emit('joined-order', { orderId });
        
        console.log(`👤 User ${socket.userId} joined order room: ${orderId}`);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    // Пользователь покидает комнату заказа
    socket.on('leave-order', (orderId: string) => {
      socket.leave(`order-${orderId}`);
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
    });
  });

  return io;
}

