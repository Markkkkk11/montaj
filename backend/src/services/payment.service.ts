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
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) {
        throw new Error('Платёж не найден');
      }

      if (payment.paid) {
        return payment; // Уже обработан
      }

      const paidAt = new Date();
      const claim = await tx.payment.updateMany({
        where: {
          id: paymentId,
          paid: false,
        },
        data: {
          status: 'SUCCEEDED',
          paid: true,
          paidAt,
        },
      });

      if (claim.count === 0) {
        const existingPayment = await tx.payment.findUnique({
          where: { id: paymentId },
        });

        if (!existingPayment) {
          throw new Error('Платёж не найден');
        }

        return existingPayment;
      }

      if (payment.purpose === 'top_up') {
        await this.processTopUp(tx, payment.id, payment.userId, parseFloat(payment.amount.toString()));
      } else if (payment.purpose === 'subscription') {
        await this.processSubscription(
          tx,
          payment.id,
          payment.userId,
          payment.metadata as any,
          parseFloat(payment.amount.toString())
        );
      }

      return {
        ...payment,
        status: 'SUCCEEDED',
        paid: true,
        paidAt,
      };
    });
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
  private async processTopUp(db: any, paymentId: string, userId: string, amount: number) {
    // Обновить баланс
    await db.balance.upsert({
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
    await db.transaction.create({
      data: {
        userId,
        type: 'TOP_UP',
        amount,
        description: `Пополнение баланса на ${amount}₽`,
        relatedPaymentId: paymentId,
      },
    });

    // Проверить бонус за первое пополнение ≥150₽ в течение 30 дней после регистрации
    if (amount >= 150) {
      await this.checkAndAwardRegistrationBonus(db, userId, amount);
    }
  }

  /**
   * Начислить бонус 1000₽ за первое пополнение ≥150₽
   * в течение 30 дней с момента регистрации (одноразово)
   */
  private async checkAndAwardRegistrationBonus(db: any, userId: string, topUpAmount: number) {
    try {
      const user = await db.user.findUnique({
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
      const existingBonus = await db.transaction.findFirst({
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
      await db.balance.update({
        where: { userId },
        data: {
          bonusAmount: {
            increment: bonusAmount,
          },
        },
      });

      // Записать транзакцию
      await db.transaction.create({
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
  private async processSubscription(
    db: any,
    paymentId: string,
    userId: string,
    metadata: any,
    paidAmount: number
  ) {
    const tariffType = metadata.tariffType || 'PREMIUM';
    const duration = 30; // дней
    const tariffSettings = await settingsService.getBySection('tariffs');
    const specializationCount =
      tariffType === 'COMFORT'
        ? parseInt(tariffSettings.comfortSpecializations || '1', 10)
        : parseInt(tariffSettings.premiumSpecializations || '3', 10);
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
      existingSubscription.tariffType !== 'STANDARD' &&
      new Date(existingSubscription.expiresAt) > now
        ? new Date(existingSubscription.expiresAt)
        : now;
    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Тарифные названия для транзакции
    const tariffNames: Record<string, string> = {
      STANDARD: 'Стандарт',
      COMFORT: 'Комфорт',
      PREMIUM: 'Премиум',
    };

    if (!['COMFORT', 'PREMIUM'].includes(tariffType)) {
      throw new Error('Неизвестный тариф подписки');
    }

    await db.subscription.upsert({
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

    const profile = await db.executorProfile.findUnique({
      where: { userId },
      select: {
        specializations: true,
      },
    });

    if (profile && profile.specializations.length > specializationCount) {
      await db.executorProfile.update({
        where: { userId },
        data: {
          specializations: profile.specializations.slice(0, specializationCount),
        },
      });
    }

    // Создать транзакцию
    if (paidAmount > 0) {
      await db.transaction.create({
        data: {
          userId,
          type: 'SUBSCRIPTION',
          amount: -paidAmount,
          description: `Оплата подписки «${tariffNames[tariffType] || tariffType}» на ${duration} дней`,
          relatedPaymentId: paymentId,
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
