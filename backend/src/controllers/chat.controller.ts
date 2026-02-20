import { Response } from 'express';
import { AuthRequest } from '../types';
import chatService from '../services/chat.service';
import path from 'path';

class ChatController {
  /**
   * GET /api/chat/:orderId/messages
   * Получить историю сообщений
   */
  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const messages = await chatService.getMessages(orderId, req.user.id, limit, offset);

      res.json({ messages });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/chat/:orderId/messages
   * Отправить сообщение
   */
  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId } = req.params;
      const { content, fileUrl } = req.body;

      if (!content || content.trim().length === 0) {
        res.status(400).json({ error: 'Сообщение не может быть пустым' });
        return;
      }

      const message = await chatService.createMessage(orderId, req.user.id, content, fileUrl);

      // Отправляем через Socket.io (будет реализовано в socket.ts)
      const io = req.app.get('io');
      if (io) {
        io.to(`order-${orderId}`).emit('new-message', message);
      }

      res.status(201).json({ message });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/chat/:orderId/mark-read
   * Отметить сообщения как прочитанные
   */
  async markAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId } = req.params;

      await chatService.markAsRead(orderId, req.user.id);

      res.json({ message: 'Сообщения отмечены как прочитанные' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/chat/unread-count
   * Получить количество непрочитанных сообщений
   */
  async getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const count = await chatService.getUnreadCount(req.user.id);

      res.json({ count });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/chat/:orderId/upload-file
   * Загрузить файл в чат
   */
  async uploadFile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Файл не предоставлен' });
        return;
      }

      const { orderId } = req.params;
      const fileUrl = `/uploads/${req.file.filename}`;

      // Create a message with the file
      const message = await chatService.createMessage(
        orderId,
        req.user.id,
        req.body.content || `📎 ${req.file.originalname}`,
        fileUrl
      );

      // Broadcast via Socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`order-${orderId}`).emit('new-message', message);
      }

      res.status(201).json({ message, fileUrl });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/chat/:orderId/unread-count
   * Получить количество непрочитанных сообщений по заказу
   */
  async getUnreadCountByOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { orderId } = req.params;

      const count = await chatService.getUnreadCountByOrder(orderId, req.user.id);

      res.json({ count });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new ChatController();

