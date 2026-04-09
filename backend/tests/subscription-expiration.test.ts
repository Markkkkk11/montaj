import prisma from '../src/config/database';
import subscriptionService from '../src/services/subscription.service';

describe('Subscription expiration handling', () => {
  let executorId: string;

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

    await prisma.subscription.create({
      data: {
        userId: executorId,
        tariffType: 'PREMIUM',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        specializationCount: 3,
      },
    });
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany({ where: { userId: executorId } });
    await prisma.balance.deleteMany({ where: { userId: executorId } });
    await prisma.user.deleteMany({ where: { id: executorId } });
    await prisma.$disconnect();
  });

  it('returns STANDARD as the effective tariff for an expired paid subscription', async () => {
    const tariff = await subscriptionService.getCurrentTariff(executorId);

    expect(tariff.tariffType).toBe('STANDARD');
    expect(tariff.expiresAt).toBeNull();
    expect(tariff.isActive).toBe(true);
  });

  it('charges the standard response price after paid subscription expires', async () => {
    const tariffs = await subscriptionService.getTariffInfo();
    const responseRule = await subscriptionService.canRespondToOrder(executorId);
    const responseCost = await subscriptionService.getResponseCost(executorId);

    expect(responseRule.canRespond).toBe(true);
    expect(responseRule.costPerResponse).toBe(tariffs.STANDARD.responsePrice);
    expect(responseCost).toBe(tariffs.STANDARD.responsePrice);
  });
});
