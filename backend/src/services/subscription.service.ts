import prisma from '../config/database';
import settingsService from './settings.service';

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

    // Стандарт — бессрочный, остальные — проверяем дату
    const isActive = subscription.tariffType === 'STANDARD'
      ? true
      : new Date() < new Date(subscription.expiresAt);

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
        isActive: true, // Стандарт — бессрочный
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

    const tariffSettings = await settingsService.getBySection('tariffs');
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);
    const comfortSpecs = parseInt(tariffSettings.comfortSpecializations || '1', 10);
    const standardSpecs = parseInt(tariffSettings.standardSpecializations || '1', 10);
    const specCounts: Record<string, number> = { STANDARD: standardSpecs, COMFORT: comfortSpecs, PREMIUM: premiumSpecs };
    const specializationCount = specCounts[tariffType] || standardSpecs;

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
   * Сменить тариф (бесплатно — только на Standard)
   */
  async changeTariff(userId: string, newTariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM') {
    // Переход на Comfort и Premium требует оплаты через ЮKassa
    if (newTariffType === 'PREMIUM') {
      throw new Error('Для перехода на Премиум требуется оплата подписки');
    }

    if (newTariffType === 'COMFORT') {
      throw new Error('Для перехода на Комфорт требуется оплата подписки');
    }

    // Только Standard — бесплатная смена
    const tariffSettings = await settingsService.getBySection('tariffs');
    const standardSpecs = parseInt(tariffSettings.standardSpecializations || '1', 10);

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffType: 'STANDARD',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 год для бесплатных
        specializationCount: standardSpecs,
      },
      update: {
        tariffType: 'STANDARD',
        specializationCount: standardSpecs,
      },
    });

    // Обрезаем сохранённые специализации до нового лимита
    await this.trimSpecializations(userId, standardSpecs);

    return subscription;
  }

  /**
   * Обрезать специализации профиля исполнителя до лимита тарифа
   */
  private async trimSpecializations(userId: string, maxSpecs: number) {
    try {
      const profile = await prisma.executorProfile.findUnique({
        where: { userId },
      });

      if (profile && (profile.specializations as string[])?.length > maxSpecs) {
        const trimmed = (profile.specializations as string[]).slice(0, maxSpecs);
        await prisma.executorProfile.update({
          where: { userId },
          data: { specializations: trimmed },
        });
        console.log(`✂️ Специализации пользователя ${userId} обрезаны до ${maxSpecs}: ${trimmed.join(', ')}`);
      }
    } catch (err) {
      console.error('Ошибка обрезки специализаций:', err);
    }
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

    // Comfort - бесплатный отклик, но баланс должен быть >= comfortOrderTakenPrice
    // (списывается только при принятии заказа заказчиком)
    if (tariffType === 'COMFORT') {
      const tariffSettings = await settingsService.getBySection('tariffs');
      const comfortFee = parseInt(tariffSettings.comfortOrderTakenPrice || '500', 10);
      const totalBalance = parseFloat(balance?.amount.toString() || '0') + 
                          parseFloat(balance?.bonusAmount.toString() || '0');

      if (totalBalance < comfortFee) {
        return {
          canRespond: false,
          reason: `Для отклика на тарифе «Комфорт» необходимо минимум ${comfortFee}₽ на балансе`,
          costPerResponse: 0,
        };
      }

      return {
        canRespond: true,
        costPerResponse: 0, // Платят только при выборе заказчиком
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

    const costs: any = {
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

    const tariffSettings = await settingsService.getBySection('tariffs');
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);

    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        expiresAt: newExpiresAt,
        tariffType: 'PREMIUM',
        specializationCount: premiumSpecs,
      },
    });

    return updated;
  }

  /**
   * Оплатить подписку с баланса пользователя
   */
  async payFromBalance(userId: string, tariffType: 'COMFORT' | 'PREMIUM') {
    const tariffSettings = await settingsService.getBySection('tariffs');

    const prices: Record<string, number> = {
      COMFORT: parseInt(tariffSettings.comfortPrice || '500', 10),
      PREMIUM: parseInt(tariffSettings.premiumPrice || '5000', 10),
    };
    const price = prices[tariffType];
    if (!price) throw new Error('Неизвестный тариф');

    const tariffNames: Record<string, string> = {
      COMFORT: 'Комфорт',
      PREMIUM: 'Премиум',
    };

    // Получить баланс пользователя
    const balance = await prisma.balance.findUnique({ where: { userId } });
    const totalBalance = parseFloat(balance?.amount.toString() || '0') +
                        parseFloat(balance?.bonusAmount.toString() || '0');

    if (totalBalance < price) {
      throw new Error(`Недостаточно средств на балансе. Нужно ${price}₽, на балансе ${Math.floor(totalBalance)}₽`);
    }

    // Определить кол-во специализаций
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);
    const comfortSpecs = parseInt(tariffSettings.comfortSpecializations || '1', 10);
    const specCount = tariffType === 'PREMIUM' ? premiumSpecs : comfortSpecs;

    // Списать средства: сначала бонусы, потом основной баланс
    let remaining = price;
    const bonusAmount = parseFloat(balance?.bonusAmount.toString() || '0');
    const mainAmount = parseFloat(balance?.amount.toString() || '0');

    let bonusDeduct = Math.min(bonusAmount, remaining);
    remaining -= bonusDeduct;
    let mainDeduct = remaining;

    await prisma.balance.update({
      where: { userId },
      data: {
        amount: { decrement: mainDeduct },
        bonusAmount: { decrement: bonusDeduct },
      },
    });

    // Срок подписки — 30 дней
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Активировать подписку
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffType,
        expiresAt,
        specializationCount: specCount,
      },
      update: {
        tariffType,
        expiresAt,
        specializationCount: specCount,
      },
    });

    // Создать транзакцию
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        amount: -price,
        description: `Оплата подписки «${tariffNames[tariffType]}» с баланса на 30 дней`,
      },
    });

    return subscription;
  }

  /**
   * Получить информацию о тарифах (из настроек БД)
   */
  async getTariffInfo() {
    const tariffSettings = await settingsService.getBySection('tariffs');

    const standardPrice = 0; // Стандарт бесплатный
    const standardResponsePrice = parseInt(tariffSettings.standardResponsePrice || '150', 10);
    const comfortPrice = parseInt(tariffSettings.comfortPrice || '500', 10);
    const comfortOrderTakenPrice = parseInt(tariffSettings.comfortOrderTakenPrice || '500', 10);
    const premiumPrice = parseInt(tariffSettings.premiumPrice || '5000', 10);
    const standardSpecs = parseInt(tariffSettings.standardSpecializations || '1', 10);
    const comfortSpecs = parseInt(tariffSettings.comfortSpecializations || '1', 10);
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);

    return {
      STANDARD: {
        name: 'Стандарт',
        price: standardPrice,
        responsePrice: standardResponsePrice,
        orderTakenPrice: 0,
        description: `Бесплатный тариф, ${standardResponsePrice}₽ за каждый отклик`,
        specializationCount: standardSpecs,
        features: [
          `Платный отклик ${standardResponsePrice}₽`,
          `${standardSpecs === 1 ? 'Одна специализация' : `До ${standardSpecs} специализаций`}`,
          'Доступ к заказам',
        ],
      },
      COMFORT: {
        name: 'Комфорт',
        price: comfortPrice,
        responsePrice: 0,
        orderTakenPrice: comfortOrderTakenPrice,
        description: `${comfortPrice}₽/мес, ${comfortOrderTakenPrice}₽ за взятый заказ`,
        specializationCount: comfortSpecs,
        features: [
          `Подписка ${comfortPrice}₽/мес`,
          'Бесплатные отклики',
          `${comfortOrderTakenPrice}₽ только при выборе заказчиком`,
          `${comfortSpecs === 1 ? 'Одна специализация' : `До ${comfortSpecs} специализаций`}`,
          'Приоритет в откликах',
        ],
      },
      PREMIUM: {
        name: 'Премиум',
        price: premiumPrice,
        responsePrice: 0,
        orderTakenPrice: 0,
        description: `Подписка на 30 дней — ${premiumPrice.toLocaleString('ru-RU')}₽`,
        duration: 30,
        specializationCount: premiumSpecs,
        features: [
          'Безлимитные отклики',
          `До ${premiumSpecs} специализаций`,
          'Приоритет в откликах',
          'Расширенная статистика',
        ],
      },
    };
  }
}

export default new SubscriptionService();

