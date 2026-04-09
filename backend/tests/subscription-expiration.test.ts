import prisma from '../src/config/database';
import authService from '../src/services/auth.service';
import orderService from '../src/services/order.service';
import paymentService from '../src/services/payment.service';
import responseService from '../src/services/response.service';
import settingsService from '../src/services/settings.service';
import subscriptionService from '../src/services/subscription.service';
import userService from '../src/services/user.service';

describe('Subscription expiration handling', () => {
  let executorId: string;
  let customerId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        phone: '+78888888881',
        password: 'test-password',
        fullName: 'Expired Premium Executor',
        city: 'Moscow',
        role: 'EXECUTOR',
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });

    executorId = user.id;

    await prisma.balance.create({
      data: {
        userId: executorId,
        amount: 1000,
        bonusAmount: 0,
      },
    });

    await prisma.executorProfile.create({
      data: {
        userId: executorId,
        region: 'Moscow',
        specializations: ['WINDOWS', 'DOORS', 'CEILINGS'],
        workPhotos: [],
      },
    });

    await prisma.subscription.create({
      data: {
        userId: executorId,
        tariffType: 'PREMIUM',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        specializationCount: 3,
      },
    });

    const customer = await prisma.user.create({
      data: {
        phone: '+78888888882',
        password: 'test-password',
        fullName: 'Customer For Responses',
        city: 'Moscow',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        isPhoneVerified: true,
      },
    });

    customerId = customer.id;
  });

  afterAll(async () => {
    await prisma.response.deleteMany({
      where: {
        executorId,
      },
    });
    await prisma.order.deleteMany({
      where: {
        customerId,
      },
    });
    await prisma.payment.deleteMany({ where: { userId: executorId } });
    await prisma.transaction.deleteMany({ where: { userId: executorId } });
    await prisma.subscription.deleteMany({ where: { userId: executorId } });
    await prisma.balance.deleteMany({ where: { userId: executorId } });
    await prisma.user.deleteMany({ where: { id: customerId } });
    await prisma.user.deleteMany({ where: { id: executorId } });
    await prisma.$disconnect();
  });

  it('returns STANDARD as the effective tariff for an expired paid subscription', async () => {
    const tariff = await subscriptionService.getCurrentTariff(executorId);

    expect(tariff.tariffType).toBe('STANDARD');
    expect(tariff.expiresAt).toBeNull();
    expect(tariff.isActive).toBe(true);
  });

  it('returns STANDARD and one specialization in the user profile for expired premium', async () => {
    const profile = await userService.getProfile(executorId);

    expect(profile?.subscription.tariffType).toBe('STANDARD');
    expect(profile?.subscription.expiresAt).toBeNull();
    expect(profile?.subscription.specializationCount).toBe(1);
  });

  it('migrates expired premium to STANDARD and trims executor specializations to one on auth refresh', async () => {
    const user = await authService.getCurrentUser(executorId);
    const executorProfile = await prisma.executorProfile.findUnique({
      where: { userId: executorId },
    });

    expect(user?.subscription.tariffType).toBe('STANDARD');
    expect(user?.subscription.specializationCount).toBe(1);
    expect(executorProfile?.specializations).toHaveLength(1);
    expect(executorProfile?.specializations).toEqual(['WINDOWS']);
  });

  it('charges the standard response price after paid subscription expires', async () => {
    const tariffs = await subscriptionService.getTariffInfo();
    const responseRule = await subscriptionService.canRespondToOrder(executorId);
    const responseCost = await subscriptionService.getResponseCost(executorId);

    expect(responseRule.canRespond).toBe(true);
    expect(responseRule.costPerResponse).toBe(tariffs.STANDARD.responsePrice);
    expect(responseCost).toBe(tariffs.STANDARD.responsePrice);
  });

  it('activates a newly paid subscription immediately after fallback to STANDARD', async () => {
    await authService.getCurrentUser(executorId);
    await prisma.balance.update({
      where: { userId: executorId },
      data: {
        amount: 6000,
        bonusAmount: 0,
      },
    });

    const minExpected = new Date();
    minExpected.setDate(minExpected.getDate() + 29);
    const maxExpected = new Date();
    maxExpected.setDate(maxExpected.getDate() + 31);

    const subscription = await subscriptionService.payFromBalance(executorId, 'PREMIUM');
    const expiresAt = new Date(subscription.expiresAt);

    expect(subscription.tariffType).toBe('PREMIUM');
    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(minExpected.getTime());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(maxExpected.getTime());
  });

  it('extends from the current expiry date and trims specializations when paying from balance', async () => {
    const currentExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const expectedExpiresAt = new Date(currentExpiresAt);
    expectedExpiresAt.setDate(expectedExpiresAt.getDate() + 30);

    await settingsService.updateSection('tariffs', { comfortPrice: '500' });

    await prisma.balance.update({
      where: { userId: executorId },
      data: {
        amount: 2000,
        bonusAmount: 0,
      },
    });

    await prisma.subscription.update({
      where: { userId: executorId },
      data: {
        tariffType: 'PREMIUM',
        expiresAt: currentExpiresAt,
        specializationCount: 3,
      },
    });

    await prisma.executorProfile.update({
      where: { userId: executorId },
      data: {
        specializations: ['WINDOWS', 'DOORS', 'CEILINGS'],
      },
    });

    const subscription = await subscriptionService.payFromBalance(executorId, 'COMFORT');
    const executorProfile = await prisma.executorProfile.findUnique({
      where: { userId: executorId },
    });

    expect(subscription.tariffType).toBe('COMFORT');
    expect(new Date(subscription.expiresAt).toISOString()).toBe(expectedExpiresAt.toISOString());
    expect(subscription.specializationCount).toBe(1);
    expect(executorProfile?.specializations).toEqual(['WINDOWS']);

    await settingsService.updateSection('tariffs', { comfortPrice: '0' });
  });

  it('extends and trims specializations when a paid subscription is activated from payment callback', async () => {
    const currentExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const expectedExpiresAt = new Date(currentExpiresAt);
    expectedExpiresAt.setDate(expectedExpiresAt.getDate() + 30);

    await prisma.subscription.update({
      where: { userId: executorId },
      data: {
        tariffType: 'PREMIUM',
        expiresAt: currentExpiresAt,
        specializationCount: 3,
      },
    });

    await prisma.executorProfile.update({
      where: { userId: executorId },
      data: {
        specializations: ['WINDOWS', 'DOORS', 'CEILINGS'],
      },
    });

    const payment = await prisma.payment.create({
      data: {
        userId: executorId,
        amount: 500,
        currency: 'RUB',
        status: 'PENDING',
        purpose: 'subscription',
        description: 'COMFORT renewal',
        metadata: {
          tariffType: 'COMFORT',
        },
      },
    });

    await paymentService.processSuccessfulPayment(payment.id);

    const subscription = await prisma.subscription.findUnique({
      where: { userId: executorId },
    });
    const executorProfile = await prisma.executorProfile.findUnique({
      where: { userId: executorId },
    });

    expect(subscription?.tariffType).toBe('COMFORT');
    expect(subscription?.specializationCount).toBe(1);
    expect(new Date(subscription!.expiresAt).toISOString()).toBe(expectedExpiresAt.toISOString());
    expect(executorProfile?.specializations).toEqual(['WINDOWS']);
  });

  it('trims stored specializations when tariff limits are lowered in settings', async () => {
    await prisma.subscription.update({
      where: { userId: executorId },
      data: {
        tariffType: 'PREMIUM',
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        specializationCount: 3,
      },
    });

    await prisma.executorProfile.update({
      where: { userId: executorId },
      data: {
        specializations: ['WINDOWS', 'DOORS', 'CEILINGS'],
      },
    });

    await settingsService.updateSection('tariffs', { premiumSpecializations: '1' });

    const subscription = await prisma.subscription.findUnique({
      where: { userId: executorId },
    });
    const executorProfile = await prisma.executorProfile.findUnique({
      where: { userId: executorId },
    });

    expect(subscription?.specializationCount).toBe(1);
    expect(executorProfile?.specializations).toEqual(['WINDOWS']);

    await settingsService.updateSection('tariffs', { premiumSpecializations: '3' });
  });

  it('does not allow responding outside the active specialization limit even if extra values remain in profile', async () => {
    await prisma.subscription.update({
      where: { userId: executorId },
      data: {
        tariffType: 'STANDARD',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        specializationCount: 1,
      },
    });

    await prisma.executorProfile.update({
      where: { userId: executorId },
      data: {
        specializations: ['WINDOWS', 'DOORS'],
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId,
        category: 'DOORS',
        title: 'Установка двери',
        description: 'Нужно установить межкомнатную дверь',
        region: 'Moscow',
        address: 'ул. Тестовая, д. 2',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        budget: 10000,
        paymentMethod: 'CASH',
        files: [],
        status: 'PUBLISHED',
      },
    });

    await expect(responseService.createResponse(order.id, executorId)).rejects.toThrow(
      'Вы можете откликаться только на заказы по выбранным специализациям'
    );
  });

  it('creates a refund transaction and restores balance when a published order is cancelled', async () => {
    await prisma.subscription.update({
      where: { userId: executorId },
      data: {
        tariffType: 'STANDARD',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        specializationCount: 1,
      },
    });

    await prisma.balance.update({
      where: { userId: executorId },
      data: {
        amount: 1000,
        bonusAmount: 0,
      },
    });

    await prisma.executorProfile.update({
      where: { userId: executorId },
      data: {
        specializations: ['WINDOWS'],
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId,
        category: 'WINDOWS',
        title: 'Отменяемый заказ',
        description: 'Тест возврата комиссии',
        region: 'Moscow',
        address: 'ул. Тестовая, д. 3',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        budget: 10000,
        paymentMethod: 'CASH',
        files: [],
        status: 'PUBLISHED',
      },
    });

    const createdResponse = await responseService.createResponse(order.id, executorId);
    await orderService.cancelOrder(order.id, customerId);

    const balance = await prisma.balance.findUnique({
      where: { userId: executorId },
    });
    const refundTransaction = await prisma.transaction.findFirst({
      where: {
        userId: executorId,
        type: 'REFUND',
        relatedOrderId: order.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    const cancelledResponse = await prisma.response.findUnique({
      where: { id: createdResponse.id },
    });

    expect(parseFloat(createdResponse.commissionPaid.toString())).toBeGreaterThan(0);
    expect(parseFloat(balance!.amount.toString())).toBe(1000);
    expect(parseFloat(balance!.bonusAmount.toString())).toBe(0);
    expect(parseFloat(refundTransaction!.amount.toString())).toBe(
      parseFloat(createdResponse.commissionPaid.toString())
    );
    expect(cancelledResponse?.status).toBe('CANCELLED');
  });

  it('updates the accepted COMFORT response with the charged order fee', async () => {
    const tariffSettings = await settingsService.getBySection('tariffs');
    const comfortOrderTakenPrice = parseInt(tariffSettings.comfortOrderTakenPrice || '500', 10);

    await prisma.subscription.update({
      where: { userId: executorId },
      data: {
        tariffType: 'COMFORT',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        specializationCount: 1,
      },
    });

    await prisma.balance.update({
      where: { userId: executorId },
      data: {
        amount: 1000,
        bonusAmount: 0,
      },
    });

    await prisma.executorProfile.update({
      where: { userId: executorId },
      data: {
        specializations: ['WINDOWS'],
      },
    });

    const order = await prisma.order.create({
      data: {
        customerId,
        category: 'WINDOWS',
        title: 'Заказ для COMFORT',
        description: 'Тест комиссии при выборе',
        region: 'Moscow',
        address: 'ул. Тестовая, д. 4',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        budget: 12000,
        paymentMethod: 'CASH',
        files: [],
        status: 'PUBLISHED',
      },
    });

    const createdResponse = await responseService.createResponse(order.id, executorId);
    await orderService.selectExecutor(order.id, customerId, executorId);

    const acceptedResponse = await prisma.response.findUnique({
      where: { id: createdResponse.id },
    });
    const orderFeeTransaction = await prisma.transaction.findFirst({
      where: {
        userId: executorId,
        type: 'ORDER_FEE',
        relatedOrderId: order.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(parseFloat(createdResponse.commissionPaid.toString())).toBe(0);
    expect(parseFloat(acceptedResponse!.commissionPaid.toString())).toBe(comfortOrderTakenPrice);
    expect(acceptedResponse?.status).toBe('ACCEPTED');
    expect(parseFloat(orderFeeTransaction!.amount.toString())).toBe(-comfortOrderTakenPrice);
  });

  it('records the actual paid amount for a subscription payment even if tariff settings change later', async () => {
    const payment = await prisma.payment.create({
      data: {
        userId: executorId,
        amount: 500,
        currency: 'RUB',
        status: 'PENDING',
        purpose: 'subscription',
        description: 'COMFORT payment with historical price',
        metadata: {
          tariffType: 'COMFORT',
        },
      },
    });

    await settingsService.updateSection('tariffs', { comfortPrice: '900' });
    await paymentService.processSuccessfulPayment(payment.id);

    const subscriptionTransaction = await prisma.transaction.findFirst({
      where: {
        userId: executorId,
        type: 'SUBSCRIPTION',
        relatedPaymentId: payment.id,
      },
    });

    expect(parseFloat(subscriptionTransaction!.amount.toString())).toBe(-500);

    await settingsService.updateSection('tariffs', { comfortPrice: '0' });
  });
});
