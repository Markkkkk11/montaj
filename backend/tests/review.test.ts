import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

describe('Review Management', () => {
  let customerToken: string;
  let executorToken: string;
  let customerId: string;
  let executorId: string;
  let orderId: string;

  beforeAll(async () => {
    // Очистить тестовые данные
    await prisma.review.deleteMany();
    await prisma.response.deleteMany();
    await prisma.order.deleteMany();
    await prisma.sMSVerification.deleteMany();
    await prisma.user.deleteMany({
      where: {
        phone: {
          in: ['79991112233', '79991112244'],
        },
      },
    });

    // Создать и активировать заказчика
    const customerRes = await request(app).post('/api/auth/register').send({
      phone: '79991112233',
      password: 'Password123!',
      fullName: 'Review Customer',
      role: 'CUSTOMER',
      agreeToTerms: true,
      city: 'Москва',
    });

    customerId = customerRes.body.user.id;

    const verifyCustomer = await prisma.sMSVerification.findFirst({
      where: { phone: '79991112233' },
      orderBy: { createdAt: 'desc' },
    });

    await request(app).post('/api/auth/verify-sms').send({
      phone: '79991112233',
      code: verifyCustomer?.code,
    });

    await prisma.user.update({
      where: { id: customerId },
      data: { status: 'ACTIVE' },
    });

    const loginCustomer = await request(app).post('/api/auth/login').send({
      phone: '79991112233',
      password: 'Password123!',
    });

    customerToken = loginCustomer.body.token;

    // Создать и активировать исполнителя
    const executorRes = await request(app).post('/api/auth/register').send({
      phone: '79991112244',
      password: 'Password123!',
      fullName: 'Review Executor',
      role: 'EXECUTOR',
      agreeToTerms: true,
      city: 'Москва',
    });

    executorId = executorRes.body.user.id;

    const verifyExecutor = await prisma.sMSVerification.findFirst({
      where: { phone: '79991112244' },
      orderBy: { createdAt: 'desc' },
    });

    await request(app).post('/api/auth/verify-sms').send({
      phone: '79991112244',
      code: verifyExecutor?.code,
    });

    await prisma.user.update({
      where: { id: executorId },
      data: { status: 'ACTIVE' },
    });

    await prisma.executorProfile.create({
      data: {
        userId: executorId,
        region: 'Москва',
        specializations: ['WINDOWS'],
        bio: 'Опытный монтажник',
        tariffType: 'PREMIUM',
      },
    });

    const loginExecutor = await request(app).post('/api/auth/login').send({
      phone: '79991112244',
      password: 'Password123!',
    });

    executorToken = loginExecutor.body.token;

    // Создать заказ
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        category: 'WINDOWS',
        title: 'Установка окон',
        description: 'Требуется установить 2 окна',
        region: 'Москва',
        address: 'ул. Тестовая, д. 1',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 10000,
        paymentMethod: 'CASH',
      });

    orderId = orderRes.body.order.id;

    // Откликнуться
    await request(app)
      .post('/api/responses')
      .set('Authorization', `Bearer ${executorToken}`)
      .send({ orderId });

    // Выбрать исполнителя
    await request(app)
      .post(`/api/orders/${orderId}/select-executor`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ executorId });

    // Завершить заказ
    await request(app)
      .post(`/api/orders/${orderId}/complete`)
      .set('Authorization', `Bearer ${executorToken}`);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/reviews', () => {
    it('should create review from customer', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          rating: 5,
          comment: 'Отличная работа! Всё сделано качественно и в срок.',
        });

      expect(res.status).toBe(201);
      expect(res.body.review).toHaveProperty('id');
      expect(res.body.review.rating).toBe(5);
      expect(res.body.review.status).toBe('PENDING');
    });

    it('should reject review with low rating without comment', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          orderId,
          rating: 5,
          comment: 'Отл',
        });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate review', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          orderId,
          rating: 4,
          comment: 'Повторный отзыв не должен пройти.',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/user/:userId', () => {
    it('should get user reviews', async () => {
      // Одобрить отзыв
      const reviews = await prisma.review.findMany({ where: { revieweeId: executorId } });
      if (reviews.length > 0) {
        await prisma.review.update({
          where: { id: reviews[0].id },
          data: { status: 'APPROVED' },
        });
      }

      const res = await request(app).get(`/api/reviews/user/${executorId}`);

      expect(res.status).toBe(200);
      expect(res.body.reviews).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/reviews/user/:userId/stats', () => {
    it('should get review stats', async () => {
      const res = await request(app).get(`/api/reviews/user/${executorId}/stats`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('total');
      expect(res.body.stats).toHaveProperty('averageRating');
      expect(res.body.stats).toHaveProperty('distribution');
    });
  });

  describe('GET /api/reviews/order/:orderId/can-leave', () => {
    it('should check if user can leave review', async () => {
      const res = await request(app)
        .get(`/api/reviews/order/${orderId}/can-leave`)
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('canLeave');
    });
  });

  describe('GET /api/reviews/my', () => {
    it('should get my reviews', async () => {
      const res = await request(app)
        .get('/api/reviews/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reviews).toBeInstanceOf(Array);
    });
  });
});

