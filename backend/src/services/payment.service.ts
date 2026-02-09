import prisma from '../config/database';
import yookassa from '../config/yookassa';

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
    // Определить стоимость подписки
    const prices = {
      STANDARD: 0, // Бесплатный (платят за отклики)
      COMFORT: 0, // Бесплатный (платят при выборе)
      PREMIUM: 5000, // 5000₽ на 30 дней
    };

    const amount = prices[tariffType];

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
   * Обработать успешный платёж
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
  }

  /**
   * Активировать/продлить подписку
   */
  private async processSubscription(userId: string, metadata: any) {
    const tariffType = metadata.tariffType || 'PREMIUM';
    const duration = 30; // дней

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    // Обновить или создать подписку
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tariffType,
        expiresAt,
        specializationCount: tariffType === 'PREMIUM' ? 3 : 1,
      },
      update: {
        tariffType,
        expiresAt,
        specializationCount: tariffType === 'PREMIUM' ? 3 : 1,
      },
    });

    // Создать транзакцию
    await prisma.transaction.create({
      data: {
        userId,
        type: 'SUBSCRIPTION',
        amount: -5000,
        description: `Оплата подписки ${tariffType} на ${duration} дней`,
      },
    });
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

