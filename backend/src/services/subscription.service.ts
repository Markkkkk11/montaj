import prisma from '../config/database';

export class SubscriptionService {
  /**
   * Получить подписку пользователя
   */
  async getUserSubscription(userId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    // Проверить, не истекла ли подписка
    const isActive = new Date() < new Date(subscription.expiresAt);

    return {
      ...subscription,
      isActive,
    };
  }

  /**
   * Проверить, активна ли подписка
   */
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription?.isActive || false;
  }

  /**
   * Получить текущий тариф пользователя
   */
  async getCurrentTariff(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription || !subscription.isActive) {
      return {
        tariffType: 'STANDARD',
        isActive: false,
        expiresAt: null,
        specializationCount: 1,
      };
    }

    return {
      tariffType: subscription.tariffType,
      isActive: true,
      expiresAt: subscription.expiresAt,
      specializationCount: subscription.specializationCount,
    };
  }

  /**
   * Создать или обновить подписку
   */
  async upsertSubscription(
    userId: string,
    tariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM',
    durationDays: number = 30
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const specializationCount = tariffType === 'PREMIUM' ? 3 : 1;

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffType,
        expiresAt,
        specializationCount,
      },
      update: {
        tariffType,
        expiresAt,
        specializationCount,
      },
    });

    return subscription;
  }

  /**
   * Сменить тариф
   */
  async changeTariff(userId: string, newTariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM') {
    const currentSubscription = await this.getUserSubscription(userId);

    // Если переходим на Premium, требуется оплата
    if (newTariffType === 'PREMIUM') {
      // Это будет обработано через payment service
      throw new Error('Для перехода на Premium требуется оплата подписки');
    }

    // Для Standard и Comfort просто меняем тариф
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffType: newTariffType,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 год для бесплатных
        specializationCount: 1,
      },
      update: {
        tariffType: newTariffType,
        specializationCount: 1,
      },
    });

    return subscription;
  }

  /**
   * Проверить, может ли пользователь откликнуться на заказ
   */
  async canRespondToOrder(userId: string): Promise<{
    canRespond: boolean;
    reason?: string;
    costPerResponse?: number;
  }> {
    const subscription = await this.getUserSubscription(userId);
    const balance = await prisma.balance.findUnique({
      where: { userId },
    });

    // Если нет подписки, назначаем Standard
    const tariffType = subscription?.tariffType || 'STANDARD';

    // Premium - безлимитные отклики
    if (tariffType === 'PREMIUM' && subscription?.isActive) {
      return {
        canRespond: true,
      };
    }

    // Standard - платный отклик 150₽
    if (tariffType === 'STANDARD') {
      const cost = 150;
      const totalBalance = parseFloat(balance?.amount.toString() || '0') + 
                          parseFloat(balance?.bonusAmount.toString() || '0');

      if (totalBalance < cost) {
        return {
          canRespond: false,
          reason: 'Недостаточно средств на балансе',
          costPerResponse: cost,
        };
      }

      return {
        canRespond: true,
        costPerResponse: cost,
      };
    }

    // Comfort - бесплатный отклик, оплата при выборе (500₽)
    if (tariffType === 'COMFORT') {
      return {
        canRespond: true,
        costPerResponse: 0, // Платят только при выборе
      };
    }

    return {
      canRespond: false,
      reason: 'Неизвестный тариф',
    };
  }

  /**
   * Получить стоимость отклика для пользователя
   */
  async getResponseCost(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    const tariffType = subscription?.tariffType || 'STANDARD';

    const costs = {
      STANDARD: 150,  // 150₽ за отклик
      COMFORT: 0,     // 0₽ за отклик, 500₽ при выборе
      PREMIUM: 0,     // Безлимитные отклики
    };

    return costs[tariffType];
  }

  /**
   * Получить стоимость за взятый заказ (для Comfort)
   */
  async getOrderTakenCost(userId: string): Promise<number> {
    const subscription = await this.getUserSubscription(userId);
    const tariffType = subscription?.tariffType || 'STANDARD';

    if (tariffType === 'COMFORT') {
      return 500; // 500₽ за взятый заказ
    }

    return 0;
  }

  /**
   * Продлить подписку Premium
   */
  async renewPremiumSubscription(userId: string) {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      throw new Error('Подписка не найдена');
    }

    // Продлить на 30 дней от текущей даты истечения или от сегодня
    const baseDate = subscription.isActive
      ? new Date(subscription.expiresAt)
      : new Date();

    const newExpiresAt = new Date(baseDate);
    newExpiresAt.setDate(newExpiresAt.getDate() + 30);

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        expiresAt: newExpiresAt,
        tariffType: 'PREMIUM',
        specializationCount: 3,
      },
    });

    return updated;
  }

  /**
   * Получить информацию о тарифах
   */
  getTariffInfo() {
    return {
      STANDARD: {
        name: 'Стандарт',
        price: 0,
        responsePrice: 150,
        orderTakenPrice: 0,
        description: 'Оплата за каждый отклик - 150₽',
        specializationCount: 1,
        features: [
          'Платный отклик 150₽',
          'Одна специализация',
          'Доступ к заказам',
        ],
      },
      COMFORT: {
        name: 'Комфорт',
        price: 0,
        responsePrice: 0,
        orderTakenPrice: 500,
        description: 'Оплата только за взятый заказ - 500₽',
        specializationCount: 1,
        features: [
          'Бесплатные отклики',
          'Оплата только при выборе - 500₽',
          'Одна специализация',
          'Доступ к заказам',
        ],
      },
      PREMIUM: {
        name: 'Премиум',
        price: 5000,
        responsePrice: 0,
        orderTakenPrice: 0,
        description: 'Подписка на 30 дней - 5000₽',
        duration: 30,
        specializationCount: 3,
        features: [
          'Безлимитные отклики',
          'До 3-х специализаций',
          'Приоритет в откликах',
          'Расширенная статистика',
        ],
      },
    };
  }
}

export default new SubscriptionService();

