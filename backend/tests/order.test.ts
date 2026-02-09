import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

describe('Order Management', () => {
  let customerToken: string;
  let executorToken: string;
  let customerId: string;
  let executorId: string;
  let orderId: string;

  beforeAll(async () => {
    // Очистить тестовые данные
    await prisma.response.deleteMany();
    await prisma.order.deleteMany();
    await prisma.sMSVerification.deleteMany();
    await prisma.user.deleteMany({
      where: {
        phone: {
          in: ['79001112233', '79001112244'],
        },
      },
    });

    // Создать тестового заказчика
    const customerRes = await request(app).post('/api/auth/register').send({
      phone: '79001112233',
      password: 'Password123!',
      fullName: 'Test Customer',
      role: 'CUSTOMER',
      agreeToTerms: true,
      city: 'Москва',
    });

    customerId = customerRes.body.user.id;

    // Подтвердить телефон заказчика
    const verifyCustomer = await prisma.sMSVerification.findFirst({
      where: { phone: '79001112233' },
      orderBy: { createdAt: 'desc' },
    });

    await request(app).post('/api/auth/verify-sms').send({
      phone: '79001112233',
      code: verifyCustomer?.code,
    });

    // Активировать заказчика
    await prisma.user.update({
      where: { id: customerId },
      data: { status: 'ACTIVE' },
    });

    // Логин заказчика
    const loginCustomer = await request(app).post('/api/auth/login').send({
      phone: '79001112233',
      password: 'Password123!',
    });

    customerToken = loginCustomer.body.token;

    // Создать тестового исполнителя
    const executorRes = await request(app).post('/api/auth/register').send({
      phone: '79001112244',
      password: 'Password123!',
      fullName: 'Test Executor',
      role: 'EXECUTOR',
      agreeToTerms: true,
      city: 'Москва',
    });

    executorId = executorRes.body.user.id;

    // Подтвердить телефон исполнителя
    const verifyExecutor = await prisma.sMSVerification.findFirst({
      where: { phone: '79001112244' },
      orderBy: { createdAt: 'desc' },
    });

    await request(app).post('/api/auth/verify-sms').send({
      phone: '79001112244',
      code: verifyExecutor?.code,
    });

    // Активировать исполнителя и заполнить профиль
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

    // Логин исполнителя
    const loginExecutor = await request(app).post('/api/auth/login').send({
      phone: '79001112244',
      password: 'Password123!',
    });

    executorToken = loginExecutor.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          category: 'WINDOWS',
          title: 'Установка пластиковых окон',
          description: 'Требуется установить 2 окна в квартире. Материалы предоставлены.',
          region: 'Москва',
          address: 'ул. Тестовая, д. 1',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          budget: 10000,
          budgetType: 'fixed',
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(201);
      expect(res.body.order).toHaveProperty('id');
      expect(res.body.order.status).toBe('PUBLISHED');
      expect(res.body.order.title).toBe('Установка пластиковых окон');

      orderId = res.body.order.id;
    });

    it('should reject order with budget below 5000', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          category: 'WINDOWS',
          title: 'Тестовый заказ',
          description: 'Описание',
          region: 'Москва',
          address: 'ул. Тестовая',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          budget: 3000,
          paymentMethod: 'CASH',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should get list of orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toBeInstanceOf(Array);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should filter orders by category', async () => {
      const res = await request(app)
        .get('/api/orders?category=WINDOWS')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders.every((o: any) => o.category === 'WINDOWS')).toBe(true);
    });
  });

  describe('POST /api/responses', () => {
    it('should create response to order', async () => {
      const res = await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          orderId: orderId,
        });

      expect(res.status).toBe(201);
      expect(res.body.response).toHaveProperty('id');
      expect(res.body.response.status).toBe('PENDING');
    });

    it('should reject duplicate response', async () => {
      const res = await request(app)
        .post('/api/responses')
        .set('Authorization', `Bearer ${executorToken}`)
        .send({
          orderId: orderId,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/orders/:id/select-executor', () => {
    it('should select executor for order', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/select-executor`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          executorId: executorId,
        });

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('IN_PROGRESS');
      expect(res.body.order.executorId).toBe(executorId);
    });
  });

  describe('POST /api/orders/:id/complete', () => {
    it('should complete order', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/complete`)
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.order.status).toBe('COMPLETED');
    });
  });

  describe('GET /api/orders/my/list', () => {
    it('should get customer orders', async () => {
      const res = await request(app)
        .get('/api/orders/my/list')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toBeInstanceOf(Array);
      expect(res.body.orders.some((o: any) => o.id === orderId)).toBe(true);
    });

    it('should get executor orders', async () => {
      const res = await request(app)
        .get('/api/orders/my/list')
        .set('Authorization', `Bearer ${executorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.orders).toBeInstanceOf(Array);
    });
  });
});

