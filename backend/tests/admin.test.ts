import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/hash';

describe('Admin Panel', () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  let testOrderId: string;
  let testReviewId: string;

  beforeAll(async () => {
    // Создать администратора
    const hashedPassword = await hashPassword('admin123');
    const admin = await prisma.user.create({
      data: {
        phone: '+71111111111',
        password: hashedPassword,
        fullName: 'Test Admin',
        city: 'Moscow',
        role: 'ADMIN',
        email: 'admin@test.com',
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });

    adminId = admin.id;

    // Создать обычного пользователя
    const user = await prisma.user.create({
      data: {
        phone: '+72222222222',
        password: hashedPassword,
        fullName: 'Test User',
        city: 'Moscow',
        role: 'EXECUTOR',
        email: 'user@test.com',
        status: 'PENDING',
        isPhoneVerified: true,
      },
    });

    userId = user.id;

    // Получить токены
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '+71111111111',
        password: 'admin123',
      });

    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '+72222222222',
        password: 'admin123',
      });

    userToken = userLogin.body.token;

    // Создать тестовый заказ
    const customer = await prisma.user.create({
      data: {
        phone: '+73333333333',
        password: hashedPassword,
        fullName: 'Test Customer',
        city: 'Moscow',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        specialization: 'WINDOWS',
        region: 'Moscow',
        address: 'Test Address',
        title: 'Test Order',
        description: 'Test Description',
        startDate: new Date(),
        budget: 10000,
        paymentMethod: 'CASH',
        status: 'PUBLISHED',
      },
    });

    testOrderId = order.id;

    // Создать тестовый отзыв
    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        reviewerId: customer.id,
        revieweeId: userId,
        rating: 5,
        comment: 'Test Review',
        status: 'PENDING',
      },
    });

    testReviewId = review.id;
  });

  afterAll(async () => {
    // Очистить тестовые данные
    await prisma.review.deleteMany();
    await prisma.order.deleteMany();
    await prisma.adminLog.deleteMany();
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminId, userId] },
      },
    });
    await prisma.$disconnect();
  });

  describe('Access Control', () => {
    it('should deny access to non-admins', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('администратора');
    });

    it('should deny access without auth', async () => {
      const response = await request(app).get('/api/admin/statistics');

      expect(response.status).toBe(401);
    });

    it('should allow access to admins', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should get platform statistics', async () => {
      const response = await request(app)
        .get('/api/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics).toBeDefined();
      expect(response.body.statistics.users).toBeDefined();
      expect(response.body.statistics.orders).toBeDefined();
      expect(response.body.statistics.reviews).toBeDefined();
      expect(response.body.statistics.revenue).toBeDefined();
    });
  });

  describe('User Moderation', () => {
    it('should get users for moderation', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toBeDefined();
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should approve user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Проверить обновление статуса
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.status).toBe('ACTIVE');
    });

    it('should block user', async () => {
      const response = await request(app)
        .post(`/api/admin/users/${userId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'BLOCK',
          reason: 'Test block',
        });

      expect(response.status).toBe(200);

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(user?.status).toBe('BLOCKED');
    });
  });

  describe('Review Moderation', () => {
    it('should get reviews for moderation', async () => {
      const response = await request(app)
        .get('/api/admin/reviews')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.reviews).toBeDefined();
    });

    it('should approve review', async () => {
      const response = await request(app)
        .post(`/api/admin/reviews/${testReviewId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
        });

      expect(response.status).toBe(200);

      const review = await prisma.review.findUnique({
        where: { id: testReviewId },
      });
      expect(review?.status).toBe('APPROVED');
    });

    it('should reject review with note', async () => {
      // Создать новый отзыв
      const newReview = await prisma.review.create({
        data: {
          orderId: testOrderId,
          reviewerId: userId,
          revieweeId: adminId,
          rating: 1,
          comment: 'Bad review',
          status: 'PENDING',
        },
      });

      const response = await request(app)
        .post(`/api/admin/reviews/${newReview.id}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REJECT',
          note: 'Inappropriate content',
        });

      expect(response.status).toBe(200);

      const review = await prisma.review.findUnique({
        where: { id: newReview.id },
      });
      expect(review?.status).toBe('REJECTED');
      expect(review?.moderationNote).toBe('Inappropriate content');
    });
  });

  describe('Admin Logs', () => {
    it('should record admin actions', async () => {
      const response = await request(app)
        .get('/api/admin/logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.logs).toBeDefined();
      expect(Array.isArray(response.body.logs)).toBe(true);
      expect(response.body.logs.length).toBeGreaterThan(0);
    });
  });

  describe('Financial Analytics', () => {
    it('should get financial analytics', async () => {
      const response = await request(app)
        .get('/api/admin/analytics/financial')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.totalRevenue).toBeDefined();
      expect(response.body.analytics.totalCommissions).toBeDefined();
    });

    it('should get analytics with date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date();

      const response = await request(app)
        .get('/api/admin/analytics/financial')
        .query({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});

