import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/hash';

describe('Notifications', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    // Создать тестового пользователя
    const hashedPassword = await hashPassword('test123');
    const user = await prisma.user.create({
      data: {
        phone: '+79001112233',
        password: hashedPassword,
        fullName: 'Test User',
        city: 'Moscow',
        role: 'EXECUTOR',
        email: 'test@notification.com',
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });

    userId = user.id;

    // Получить токен
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '+79001112233',
        password: 'test123',
      });

    userToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Очистить тестовые данные
    await prisma.notification.deleteMany();
    await prisma.notificationSettings.deleteMany();
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('GET /api/notifications', () => {
    it('should get user notifications', async () => {
      // Создать тестовое уведомление
      await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'Test Notification',
          message: 'This is a test notification',
          sent: true,
          sentAt: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.notifications).toBeDefined();
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.notifications.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBeDefined();
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should get unread count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      // Создать непрочитанное уведомление
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'Unread Notification',
          message: 'Test',
          sent: true,
          sentAt: new Date(),
          read: false,
        },
      });

      const response = await request(app)
        .patch(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Проверить обновление
      const updated = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(updated?.read).toBe(true);
      expect(updated?.readAt).not.toBeNull();
    });

    it('should not allow marking other user notification', async () => {
      // Создать другого пользователя
      const hashedPassword = await hashPassword('test123');
      const otherUser = await prisma.user.create({
        data: {
          phone: '+79001112234',
          password: hashedPassword,
          fullName: 'Other User',
          city: 'Moscow',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          isPhoneVerified: true,
        },
      });

      const otherNotification = await prisma.notification.create({
        data: {
          userId: otherUser.id,
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'Other Notification',
          message: 'Test',
          sent: true,
          sentAt: new Date(),
        },
      });

      const response = await request(app)
        .patch(`/api/notifications/${otherNotification.id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);

      // Очистка
      await prisma.notification.delete({ where: { id: otherNotification.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('POST /api/notifications/mark-all-read', () => {
    it('should mark all notifications as read', async () => {
      // Создать несколько непрочитанных уведомлений
      await prisma.notification.createMany({
        data: [
          {
            userId,
            type: 'SYSTEM',
            channel: 'IN_APP',
            title: 'Notification 1',
            message: 'Test 1',
            sent: true,
            sentAt: new Date(),
            read: false,
          },
          {
            userId,
            type: 'SYSTEM',
            channel: 'IN_APP',
            title: 'Notification 2',
            message: 'Test 2',
            sent: true,
            sentAt: new Date(),
            read: false,
          },
        ],
      });

      const response = await request(app)
        .post('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Проверить, что все уведомления прочитаны
      const unreadCount = await prisma.notification.count({
        where: { userId, read: false },
      });
      expect(unreadCount).toBe(0);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'SYSTEM',
          channel: 'IN_APP',
          title: 'To Delete',
          message: 'Test',
          sent: true,
          sentAt: new Date(),
        },
      });

      const response = await request(app)
        .delete(`/api/notifications/${notification.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Проверить удаление
      const deleted = await prisma.notification.findUnique({
        where: { id: notification.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('Notification Settings', () => {
    it('should get notification settings', async () => {
      const response = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings).toBeDefined();
      expect(response.body.settings.userId).toBe(userId);
    });

    it('should update notification settings', async () => {
      const response = await request(app)
        .put('/api/notifications/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          emailEnabled: false,
          smsEnabled: true,
          emailOrderNew: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.settings.emailEnabled).toBe(false);
      expect(response.body.settings.smsEnabled).toBe(true);
      expect(response.body.settings.emailOrderNew).toBe(false);
    });

    it('should create settings if not exist', async () => {
      // Удалить существующие настройки
      await prisma.notificationSettings.deleteMany({
        where: { userId },
      });

      const response = await request(app)
        .get('/api/notifications/settings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.settings).toBeDefined();
      expect(response.body.settings.userId).toBe(userId);
    });
  });

  describe('Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/notifications');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
});

