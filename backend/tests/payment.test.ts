import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';
import { hashPassword } from '../src/utils/hash';

describe('Payment and Subscription System', () => {
  let authToken: string;
  let executorId: string;

  beforeAll(async () => {
    // Создать тестового исполнителя
    const hashedPassword = await hashPassword('password123');

    const user = await prisma.user.create({
      data: {
        phone: '+79999999999',
        password: hashedPassword,
        fullName: 'Test Executor',
        city: 'Moscow',
        role: 'EXECUTOR',
        email: 'executor@test.com',
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });

    executorId = user.id;

    // Создать баланс
    await prisma.balance.create({
      data: {
        userId: executorId,
        amount: 500,
        bonusAmount: 1000,
      },
    });

    // Получить токен
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        phone: '+79999999999',
        password: 'password123',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Очистить тестовые данные
    await prisma.payment.deleteMany({ where: { userId: executorId } });
    await prisma.transaction.deleteMany({ where: { userId: executorId } });
    await prisma.subscription.deleteMany({ where: { userId: executorId } });
    await prisma.balance.deleteMany({ where: { userId: executorId } });
    await prisma.user.deleteMany({ where: { id: executorId } });
    await prisma.$disconnect();
  });

  describe('Balance Management', () => {
    it('should get user balance', async () => {
      const response = await request(app)
        .get('/api/users/balance')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.balance).toBeDefined();
      expect(parseFloat(response.body.balance.amount)).toBe(500);
      expect(parseFloat(response.body.balance.bonusAmount)).toBe(1000);
    });
  });

  describe('Top-Up Payments', () => {
    it('should create top-up payment', async () => {
      const response = await request(app)
        .post('/api/payments/top-up')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.confirmationUrl).toBeDefined();
      expect(parseFloat(response.body.payment.amount)).toBe(1000);
    });

    it('should reject top-up below minimum', async () => {
      const response = await request(app)
        .post('/api/payments/top-up')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should get payment history', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payments).toBeDefined();
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
  });

  describe('Subscription Management', () => {
    it('should get tariff info', async () => {
      const response = await request(app)
        .get('/api/subscriptions/tariffs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tariffs).toBeDefined();
      expect(response.body.tariffs.STANDARD).toBeDefined();
      expect(response.body.tariffs.COMFORT).toBeDefined();
      expect(response.body.tariffs.PREMIUM).toBeDefined();
    });

    it('should get current tariff', async () => {
      const response = await request(app)
        .get('/api/subscriptions/tariff')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tariff).toBeDefined();
    });

    it('should check if can respond to order', async () => {
      const response = await request(app)
        .get('/api/subscriptions/can-respond')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.canRespond).toBeDefined();
    });

    it('should change tariff to COMFORT', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-tariff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tariffType: 'COMFORT',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.tariffType).toBe('COMFORT');
    });

    it('should not allow changing to PREMIUM without payment', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-tariff')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tariffType: 'PREMIUM',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should create premium subscription payment', async () => {
      const response = await request(app)
        .post('/api/payments/subscription/premium')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.confirmationUrl).toBeDefined();
      expect(parseFloat(response.body.payment.amount)).toBe(5000);
    });
  });

  describe('Payment Processing', () => {
    let testPaymentId: string;

    it('should create a test payment', async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: executorId,
          amount: 500,
          currency: 'RUB',
          status: 'PENDING',
          purpose: 'top_up',
          description: 'Test payment',
          yookassaPaymentId: 'test_payment_123',
        },
      });

      testPaymentId = payment.id;
      expect(payment).toBeDefined();
    });

    it('should get payment by id', async () => {
      const response = await request(app)
        .get(`/api/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.payment.id).toBe(testPaymentId);
    });
  });

  describe('Transaction History', () => {
    it('should create a transaction', async () => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: executorId,
          type: 'TOP_UP',
          amount: 1000,
          description: 'Test top up',
        },
      });

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('TOP_UP');
    });
  });

  describe('Authorization', () => {
    it('should reject unauthorized payment creation', async () => {
      const response = await request(app)
        .post('/api/payments/top-up')
        .send({
          amount: 1000,
        });

      expect(response.status).toBe(401);
    });

    it('should reject unauthorized subscription access', async () => {
      const response = await request(app)
        .get('/api/subscriptions/my');

      expect(response.status).toBe(401);
    });
  });
});

