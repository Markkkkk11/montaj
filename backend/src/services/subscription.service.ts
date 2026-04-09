import prisma from '../config/database';
import { Specialization } from '@prisma/client';
import settingsService from './settings.service';

type TariffType = 'STANDARD' | 'COMFORT' | 'PREMIUM';

export class SubscriptionService {
  private async getTariffSettings() {
    return settingsService.getBySection('tariffs');
  }

  private getTariffSpecializationCount(
    tariffType: TariffType,
    tariffSettings: Record<string, string>
  ): number {
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);
    const comfortSpecs = parseInt(tariffSettings.comfortSpecializations || '1', 10);
    const standardSpecs = parseInt(tariffSettings.standardSpecializations || '1', 10);

    const specCounts: Record<'STANDARD' | 'COMFORT' | 'PREMIUM', number> = {
      STANDARD: standardSpecs,
      COMFORT: comfortSpecs,
      PREMIUM: premiumSpecs,
    };

    return specCounts[tariffType] || standardSpecs;
  }

  private getTariffPrice(
    tariffType: TariffType,
    tariffSettings: Record<string, string>
  ): number {
    const prices: Record<TariffType, number> = {
      STANDARD: 0,
      COMFORT: 0,
      PREMIUM: parseInt(tariffSettings.premiumPrice || '5000', 10),
    };

    return prices[tariffType] || 0;
  }

  private isTimeLimitedTariff(
    tariffType: TariffType,
    _tariffSettings: Record<string, string>
  ): boolean {
    return tariffType === 'PREMIUM';
  }

  private getNonExpiringTariffExpiresAt(): Date {
    // Для бессрочных тарифов храним техническую дату "сейчас",
    // чтобы такие записи не превращались в ложные оплаченные периоды,
    // если настройки тарифа позже изменятся.
    return new Date();
  }

  private async getStandardSpecializationCount(): Promise<number> {
    const tariffSettings = await this.getTariffSettings();
    return this.getTariffSpecializationCount('STANDARD', tariffSettings);
  }

  async getSpecializationCountForTariff(
    tariffType: TariffType
  ): Promise<number> {
    const tariffSettings = await this.getTariffSettings();
    return this.getTariffSpecializationCount(tariffType, tariffSettings);
  }

  private async getStandardResponsePrice(): Promise<number> {
    const tariffSettings = await this.getTariffSettings();
    return parseInt(tariffSettings.standardResponsePrice || '150', 10);
  }

  private isStoredSubscriptionActive(
    subscription: { tariffType: string; expiresAt: Date | string },
    tariffSettings: Record<string, string>
  ) {
    const tariffType = subscription.tariffType as TariffType;

    return this.isTimeLimitedTariff(tariffType, tariffSettings)
      ? new Date() < new Date(subscription.expiresAt)
      : true;
  }

  /**
   * Получить подписку пользователя
   */
  async getUserSubscription(userId: string) {
    const tariffSettings = await this.getTariffSettings();
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return null;
    }

    // Стандарт — бессрочный, остальные — проверяем дату
    const isActive = this.isStoredSubscriptionActive(subscription, tariffSettings);

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
  async getCurrentTariff(
    userId: string,
    existingSubscription?: { tariffType: string; expiresAt: Date | string; specializationCount?: number } | null
  ) {
    const tariffSettings = await this.getTariffSettings();
    const subscription = existingSubscription
      ? {
          ...existingSubscription,
          isActive: this.isStoredSubscriptionActive(existingSubscription, tariffSettings),
        }
      : await this.getUserSubscription(userId);

    if (!subscription || !subscription.isActive) {
      return {
        tariffType: 'STANDARD',
        isActive: true, // Стандарт — бессрочный
        expiresAt: null,
        specializationCount: await this.getStandardSpecializationCount(),
      };
    }

    const effectiveTariffType = subscription.tariffType as TariffType;
    const fallbackSpecializationCount = this.getTariffSpecializationCount(effectiveTariffType, tariffSettings);
    const expiresAt = this.isTimeLimitedTariff(effectiveTariffType, tariffSettings)
      ? subscription.expiresAt
      : null;

    return {
      tariffType: effectiveTariffType,
      isActive: true,
      expiresAt,
      specializationCount:
        typeof subscription.specializationCount === 'number' && subscription.specializationCount > 0
          ? subscription.specializationCount
          : fallbackSpecializationCount,
    };
  }

  /**
   * Создать или обновить подписку
   */
  async upsertSubscription(
    userId: string,
    tariffType: TariffType,
    durationDays: number = 30
  ) {
    const tariffSettings = await this.getTariffSettings();
    const expiresAt = this.isTimeLimitedTariff(tariffType, tariffSettings)
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : this.getNonExpiringTariffExpiresAt();
    const specializationCount = this.getTariffSpecializationCount(tariffType, tariffSettings);

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

    await this.trimSpecializations(userId, specializationCount);

    return subscription;
  }

  /**
   * Сменить тариф.
   * Standard и Comfort всегда бесплатные. Premium подключается через оплату.
   */
  async changeTariff(userId: string, newTariffType: TariffType) {
    const tariffSettings = await this.getTariffSettings();

    if (newTariffType === 'PREMIUM') {
      throw new Error('Для перехода на Премиум требуется оплата подписки');
    }

    const specializationCount = this.getTariffSpecializationCount(newTariffType, tariffSettings);
    const expiresAt = this.getNonExpiringTariffExpiresAt();

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffType: newTariffType,
        expiresAt,
        specializationCount,
      },
      update: {
        tariffType: newTariffType,
        expiresAt,
        specializationCount,
      },
    });

    // Обрезаем сохранённые специализации до нового лимита
    await this.trimSpecializations(userId, specializationCount);

    return subscription;
  }

  /**
   * Обрезать специализации профиля исполнителя до лимита тарифа
   */
  private async trimSpecializations(userId: string, maxSpecs: number, db: any = prisma) {
    try {
      const profile = await db.executorProfile.findUnique({
        where: { userId },
      });

      if (profile && (profile.specializations as Specialization[])?.length > maxSpecs) {
        const trimmed = (profile.specializations as Specialization[]).slice(0, maxSpecs);
        await db.executorProfile.update({
          where: { userId },
          data: { specializations: trimmed },
        });
        console.log(`✂️ Специализации пользователя ${userId} обрезаны до ${maxSpecs}: ${trimmed.join(', ')}`);
      }
    } catch (err) {
      console.error('Ошибка обрезки специализаций:', err);
    }
  }

  async trimSpecializationsToLimit(userId: string, maxSpecs: number) {
    await this.trimSpecializations(userId, maxSpecs);
  }

  async normalizeExecutorSubscription<T extends {
    id: string;
    subscription?: { tariffType: string; expiresAt: Date | string; specializationCount?: number } | null;
    executorProfile?: { specializations?: Specialization[] | null } | null;
  }>(executor: T): Promise<
    T & {
      subscription: {
        tariffType: string;
        isActive: boolean;
        expiresAt: Date | string | null;
        specializationCount: number;
      };
    }
  > {
    const subscription = await this.getCurrentTariff(executor.id, executor.subscription ?? null);

    return {
      ...executor,
      subscription,
      executorProfile: executor.executorProfile
        ? {
            ...executor.executorProfile,
            specializations: ((executor.executorProfile.specializations as Specialization[] | undefined) || []).slice(
              0,
              subscription.specializationCount || 1
            ),
          }
        : executor.executorProfile,
    };
  }

  /**
   * Проверить, может ли пользователь откликнуться на заказ
   */
  async canRespondToOrder(userId: string): Promise<{
    canRespond: boolean;
    reason?: string;
    costPerResponse?: number;
  }> {
    const tariff = await this.getCurrentTariff(userId);
    const balance = await prisma.balance.findUnique({
      where: { userId },
    });

    const tariffType = tariff.tariffType;

    // Premium - безлимитные отклики
    if (tariffType === 'PREMIUM') {
      return {
        canRespond: true,
      };
    }

    // Standard - платный отклик 150₽
    if (tariffType === 'STANDARD') {
      const cost = await this.getStandardResponsePrice();
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
      const tariffSettings = await this.getTariffSettings();
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
    const tariff = await this.getCurrentTariff(userId);

    if (tariff.tariffType === 'STANDARD') {
      return this.getStandardResponsePrice();
    }

    return 0;
  }

  /**
   * Получить стоимость за взятый заказ (для Comfort)
   */
  async getOrderTakenCost(userId: string): Promise<number> {
    const tariff = await this.getCurrentTariff(userId);

    if (tariff.tariffType === 'COMFORT') {
      const tariffSettings = await this.getTariffSettings();
      return parseInt(tariffSettings.comfortOrderTakenPrice || '500', 10);
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

    return this.activatePaidSubscription(userId, 'PREMIUM', 30);
  }

  async preparePaidSubscription(
    userId: string,
    tariffType: 'PREMIUM',
    durationDays: number = 30,
    db: any = prisma
  ) {
    const tariffSettings = await this.getTariffSettings();
    const specializationCount = this.getTariffSpecializationCount(tariffType, tariffSettings);
    const existingSubscription = await db.subscription.findUnique({
      where: { userId },
      select: {
        tariffType: true,
        expiresAt: true,
      },
    });

    const now = new Date();
    const baseDate =
      existingSubscription &&
      this.isTimeLimitedTariff(existingSubscription.tariffType as TariffType, tariffSettings) &&
      new Date(existingSubscription.expiresAt) > now
        ? new Date(existingSubscription.expiresAt)
        : now;

    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    return {
      expiresAt,
      specializationCount,
    };
  }

  async activatePaidSubscription(
    userId: string,
    tariffType: 'PREMIUM',
    durationDays: number = 30
  ) {
    const { expiresAt, specializationCount } = await this.preparePaidSubscription(
      userId,
      tariffType,
      durationDays
    );

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

    await this.trimSpecializations(userId, specializationCount);

    return subscription;
  }

  /**
   * Оплатить подписку с баланса пользователя
   */
  async payFromBalance(userId: string, tariffType: 'COMFORT' | 'PREMIUM') {
    const tariffSettings = await this.getTariffSettings();

    if (tariffType !== 'PREMIUM') {
      throw new Error('Оплата с баланса доступна только для тарифа «Премиум»');
    }

    const price = parseInt(tariffSettings.premiumPrice || '5000', 10);

    return prisma.$transaction(async (tx) => {
      const balance = await tx.balance.findUnique({ where: { userId } });
      const totalBalance =
        parseFloat(balance?.amount.toString() || '0') +
        parseFloat(balance?.bonusAmount.toString() || '0');

      if (totalBalance < price) {
        throw new Error(`Недостаточно средств на балансе. Нужно ${price}₽, на балансе ${Math.floor(totalBalance)}₽`);
      }

      // Списать средства: сначала бонусы, потом основной баланс
      let remaining = price;
      const bonusAmount = parseFloat(balance?.bonusAmount.toString() || '0');

      const bonusDeduct = Math.min(bonusAmount, remaining);
      remaining -= bonusDeduct;
      const mainDeduct = remaining;

      await tx.balance.update({
        where: { userId },
        data: {
          amount: { decrement: mainDeduct },
          bonusAmount: { decrement: bonusDeduct },
        },
      });

      const { expiresAt, specializationCount } = await this.preparePaidSubscription(
        userId,
        tariffType,
        30,
        tx
      );

      const subscription = await tx.subscription.upsert({
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

      await this.trimSpecializations(userId, specializationCount, tx);

      await tx.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: -price,
          description: 'Оплата подписки «Премиум» с баланса на 30 дней',
        },
      });

      return subscription;
    });
  }

  /**
   * Получить информацию о тарифах (из настроек БД)
   */
  async getTariffInfo() {
    const tariffSettings = await this.getTariffSettings();

    const standardPrice = 0; // Стандарт бесплатный
    const standardResponsePrice = parseInt(tariffSettings.standardResponsePrice || '150', 10);
    const comfortOrderTakenPrice = parseInt(tariffSettings.comfortOrderTakenPrice || '500', 10);
    const premiumPrice = parseInt(tariffSettings.premiumPrice || '5000', 10);
    const standardSpecs = parseInt(tariffSettings.standardSpecializations || '1', 10);
    const comfortSpecs = parseInt(tariffSettings.comfortSpecializations || '1', 10);
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);

    return {
      STANDARD: {
        name: 'Стандарт',
        price: standardPrice,
        periodLabel: 'без подписки',
        responsePrice: standardResponsePrice,
        orderTakenPrice: 0,
        description: `Бесплатный тариф, ${standardResponsePrice}₽ за каждый отклик`,
        specializationCount: standardSpecs,
        features: [
          `Платный отклик ${standardResponsePrice}₽`,
          `${standardSpecs === 1 ? 'Одна специализация' : `До ${standardSpecs} специализаций`}`,
          'Доступ ко всем заказам по выбранным специализациям',
        ],
      },
      COMFORT: {
        name: 'Комфорт',
        price: 0,
        periodLabel: 'без абонентской платы',
        responsePrice: 0,
        orderTakenPrice: comfortOrderTakenPrice,
        description: `${comfortOrderTakenPrice}₽ только за взятый заказ`,
        specializationCount: comfortSpecs,
        features: [
          'Бесплатное подключение тарифа',
          'Бесплатные отклики',
          `${comfortOrderTakenPrice}₽ только при выборе заказчиком`,
          `${comfortSpecs === 1 ? 'Одна специализация' : `До ${comfortSpecs} специализаций`}`,
          'Переключение между специализациями',
        ],
      },
      PREMIUM: {
        name: 'Премиум',
        price: premiumPrice,
        periodLabel: 'на 30 дней',
        responsePrice: 0,
        orderTakenPrice: 0,
        description: `Подписка на 30 дней — ${premiumPrice.toLocaleString('ru-RU')}₽`,
        duration: 30,
        specializationCount: premiumSpecs,
        features: [
          'Безлимитные отклики',
          `До ${premiumSpecs} специализаций одновременно`,
          'Переключение между специализациями',
          'Подключение на 30 дней',
        ],
      },
    };
  }
}

export default new SubscriptionService();
