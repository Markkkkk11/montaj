import prisma from '../config/database';
import yookassa from '../config/yookassa';
import settingsService from './settings.service';

export class PaymentService {
  /**
   * Создать платёж для пополнения баланса
   */
  async createTopUpPayment(userId: string, amount: number, returnUrl: string) {
    if (amount < 100) {
      throw new Error('Минимальная сумма пополнения - 100₽');
    }

    // Создать запись о платеже
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'RUB',
        status: 'PENDING',
        purpose: 'top_up',
        description: `Пополнение баланса на ${amount}₽`,
      },
    });

    try {
      // Создать платёж в ЮKassa
      const yookassaPayment = await yookassa.createPayment({
        amount,
        description: payment.description,
        returnUrl: `${returnUrl}?payment_id=${payment.id}`,
        metadata: {
          paymentId: payment.id,
          userId,
          purpose: 'top_up',
        },
      });

      // Обновить запись с данными ЮKassa
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          yookassaPaymentId: yookassaPayment.id,
          confirmationUrl: yookassaPayment.confirmation?.confirmation_url,
          status: 'PROCESSING',
        },
      });

      return updatedPayment;
    } catch (error: any) {
      // Отметить платёж как неудачный
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Создать платёж для подписки
   */
  async createSubscriptionPayment(
    userId: string,
    tariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM',
    returnUrl: string
  ) {
    // Определить стоимость подписки из настроек БД
    const tariffSettings = await settingsService.getBySection('tariffs');
    const prices: Record<string, number> = {
      STANDARD: 0, // Бесплатный (платят за отклики)
      COMFORT: parseInt(tariffSettings.comfortPrice || '500', 10),
      PREMIUM: parseInt(tariffSettings.premiumPrice || '5000', 10),
    };

    const amount = prices[tariffType] || 0;

    if (amount === 0) {
      throw new Error('Данный тариф не требует оплаты подписки');
    }

    // Создать запись о платеже
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        currency: 'RUB',
        status: 'PENDING',
        purpose: 'subscription',
        description: `Подписка ${tariffType} на 30 дней`,
        metadata: {
          tariffType,
        },
      },
    });

    try {
      // Создать платёж в ЮKassa
      const yookassaPayment = await yookassa.createPayment({
        amount,
        description: payment.description,
        returnUrl: `${returnUrl}?payment_id=${payment.id}`,
        metadata: {
          paymentId: payment.id,
          userId,
          purpose: 'subscription',
          tariffType,
        },
      });

      // Обновить запись
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          yookassaPaymentId: yookassaPayment.id,
          confirmationUrl: yookassaPayment.confirmation?.confirmation_url,
          status: 'PROCESSING',
        },
      });

      return updatedPayment;
    } catch (error: any) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  /**
   * Обработать успешный платёж (вызывается из webhook или callback)
   */
  async processSuccessfulPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Платёж не найден');
    }

    if (payment.paid) {
      return payment; // Уже обработан
    }

    // Обновить статус платежа
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'SUCCEEDED',
        paid: true,
        paidAt: new Date(),
      },
    });

    // Обработать в зависимости от назначения
    if (payment.purpose === 'top_up') {
      await this.processTopUp(payment.userId, parseFloat(payment.amount.toString()));
    } else if (payment.purpose === 'subscription') {
      await this.processSubscription(
        payment.userId,
        payment.metadata as any
      );
    }

    return updatedPayment;
  }

  /**
   * Проверить и обработать платёж через callback (после редиректа из ЮKassa)
   * Проверяет статус в ЮKassa перед зачислением (в реальном режиме)
   */
  async verifyAndProcessPayment(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Платёж не найден');
    }

    // Проверка прав — только владелец платежа
    if (payment.userId !== userId) {
      throw new Error('Нет доступа к этому платежу');
    }

    if (payment.paid) {
      return payment; // Уже обработан (например, через webhook)
    }

    // Проверяем статус в ЮKassa перед зачислением
    if (payment.yookassaPaymentId) {
      const yookassaStatus = await yookassa.getPayment(payment.yookassaPaymentId);

      if (yookassaStatus.status !== 'succeeded') {
        // Платёж ещё не оплачен в ЮKassa — не зачисляем
        return payment;
      }
    }

    // ЮKassa подтвердила — зачисляем
    return await this.processSuccessfulPayment(paymentId);
  }

  /**
   * Пополнить баланс пользователя
   */
  private async processTopUp(userId: string, amount: number) {
    // Обновить баланс
    await prisma.balance.upsert({
      where: { userId },
      create: {
        userId,
        amount,
        bonusAmount: 0,
      },
      update: {
        amount: {
          increment: amount,
        },
      },
    });

    // Создать транзакцию
    await prisma.transaction.create({
      data: {
        userId,
        type: 'TOP_UP',
        amount,
        description: `Пополнение баланса на ${amount}₽`,
      },
    });

    // Проверить бонус за первое пополнение ≥150₽ в течение 30 дней после регистрации
    if (amount >= 150) {
      await this.checkAndAwardRegistrationBonus(userId, amount);
    }
  }

  /**
   * Начислить бонус 1000₽ за первое пополнение ≥150₽
   * в течение 30 дней с момента регистрации (одноразово)
   */
  private async checkAndAwardRegistrationBonus(userId: string, topUpAmount: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true },
      });

      if (!user) return;

      // Проверяем, что прошло не более 30 дней с регистрации
      const daysSinceRegistration = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceRegistration > 30) {
        return; // Срок акции истёк
      }

      // Проверяем, что бонус ещё не начислялся (по наличию транзакции BONUS с описанием)
      const existingBonus = await prisma.transaction.findFirst({
        where: {
          userId,
          type: 'BONUS',
          description: { contains: 'Бонус за первое пополнение' },
        },
      });

      if (existingBonus) {
        return; // Бонус уже начислен
      }

      const bonusAmount = 1000;

      // Начислить бонус
      await prisma.balance.update({
        where: { userId },
        data: {
          bonusAmount: {
            increment: bonusAmount,
          },
        },
      });

      // Записать транзакцию
      await prisma.transaction.create({
        data: {
          userId,
          type: 'BONUS',
          amount: bonusAmount,
          description: `Бонус за первое пополнение (${topUpAmount}₽ в течение 30 дней после регистрации)`,
        },
      });

      console.log(`🎁 Начислен бонус 1000₽ пользователю ${userId} за первое пополнение ${topUpAmount}₽`);
    } catch (error) {
      console.error('Ошибка при начислении бонуса:', error);
      // Не бросаем ошибку — бонус не должен блокировать пополнение
    }
  }

  /**
   * Активировать/продлить подписку
   */
  private async processSubscription(userId: string, metadata: any) {
    const tariffType = metadata.tariffType || 'PREMIUM';
    const duration = 30; // дней

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Берём кол-во специализаций и цены из настроек
    const tariffSettings = await settingsService.getBySection('tariffs');
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);
    const standardSpecs = parseInt(tariffSettings.standardSpecializations || '1', 10);
    const comfortSpecs = parseInt(tariffSettings.comfortSpecializations || '1', 10);

    // Определяем кол-во специализаций по тарифу
    const specCounts: Record<string, number> = {
      STANDARD: standardSpecs,
      COMFORT: comfortSpecs,
      PREMIUM: premiumSpecs,
    };
    const specCount = specCounts[tariffType] || standardSpecs;

    // Определяем цену по тарифу
    const prices: Record<string, number> = {
      STANDARD: 0,
      COMFORT: parseInt(tariffSettings.comfortPrice || '500', 10),
      PREMIUM: parseInt(tariffSettings.premiumPrice || '5000', 10),
    };
    const subscriptionPrice = prices[tariffType] || 0;

    // Тарифные названия для транзакции
    const tariffNames: Record<string, string> = {
      STANDARD: 'Стандарт',
      COMFORT: 'Комфорт',
      PREMIUM: 'Премиум',
    };

    // Обновить или создать подписку
    await prisma.subscription.upsert({
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
    if (subscriptionPrice > 0) {
      await prisma.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: -subscriptionPrice,
          description: `Оплата подписки «${tariffNames[tariffType] || tariffType}» на ${duration} дней`,
        },
      });
    }
  }

  /**
   * Получить информацию о платеже
   */
  async getPayment(paymentId: string, userId?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new Error('Платёж не найден');
    }

    // Проверка прав доступа
    if (userId && payment.userId !== userId) {
      throw new Error('Нет доступа к этому платежу');
    }

    return payment;
  }

  /**
   * Получить историю платежей пользователя
   */
  async getUserPayments(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    return {
      payments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Обработать webhook от ЮKassa
   */
  async handleWebhook(event: any) {
    const paymentData = event.object;

    // Найти платёж по yookassaPaymentId
    const payment = await prisma.payment.findUnique({
      where: { yookassaPaymentId: paymentData.id },
    });

    if (!payment) {
      console.warn(`Payment not found for yookassa_id: ${paymentData.id}`);
      return;
    }

    // Обработать в зависимости от статуса
    if (paymentData.status === 'succeeded' && !payment.paid) {
      await this.processSuccessfulPayment(payment.id);
    } else if (paymentData.status === 'canceled') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED' },
      });
    }
  }
}

export default new PaymentService();

