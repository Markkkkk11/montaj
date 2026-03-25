import prisma from '../config/database';
import emailService from './email.service';
import smsService from './sms.service';
import { config } from '../config/env';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export class NotificationService {
  /**
   * Создать уведомление
   */
  async createNotification(data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        channel: 'IN_APP',
        title: data.title,
        message: data.message,
        data: data.data,
        sent: true,
        sentAt: new Date(),
      },
    });

    return notification;
  }

  /**
   * Отправить уведомление по всем каналам
   */
  async sendNotification(data: CreateNotificationData, channels: {
    inApp?: boolean;
    email?: boolean;
    sms?: boolean;
  } = { inApp: true }) {
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { notificationSettings: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = user.notificationSettings;
    const results: any[] = [];

    // In-App уведомление
    if (channels.inApp && settings?.inAppEnabled !== false) {
      const inAppNotif = await this.createNotification(data);
      results.push({ channel: 'IN_APP', success: true, data: inAppNotif });
    }

    // Email уведомление
    if (channels.email && settings?.emailEnabled && user.email) {
      try {
        // Проверка настроек для конкретного типа
        const shouldSendEmail = this.shouldSendEmailForType(data.type, settings);
        
        if (shouldSendEmail) {
          await emailService.sendEmail({
            to: user.email,
            subject: data.title,
            html: data.message,
          });
          results.push({ channel: 'EMAIL', success: true });
        }
      } catch (error: any) {
        results.push({ channel: 'EMAIL', success: false, error: error.message });
      }
    }

    // SMS уведомление
    if (channels.sms && settings?.smsEnabled && user.phone) {
      try {
        const shouldSendSMS = this.shouldSendSMSForType(data.type, settings);
        
        if (shouldSendSMS) {
          // await smsService.sendSMS(user.phone, data.message);
          results.push({ channel: 'SMS', success: true });
        }
      } catch (error: any) {
        results.push({ channel: 'SMS', success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Проверить, нужно ли отправлять Email для данного типа уведомления
   */
  private shouldSendEmailForType(type: string, settings: any): boolean {
    if (!settings) return true;

    const typeSettings: any = {
      ORDER_NEW: settings.emailOrderNew,
      ORDER_RESPONSE: settings.emailOrderResponse,
      ORDER_SELECTED: settings.emailOrderSelected,
      ORDER_COMPLETED: settings.emailOrderCompleted,
      REVIEW_NEW: settings.emailReviewNew,
      PAYMENT_SUCCESS: settings.emailPaymentSuccess,
    };

    return typeSettings[type] !== false;
  }

  /**
   * Проверить, нужно ли отправлять SMS для данного типа уведомления
   */
  private shouldSendSMSForType(type: string, settings: any): boolean {
    if (!settings) return false;

    const typeSettings: any = {
      ORDER_SELECTED: settings.smsOrderSelected,
      ORDER_COMPLETED: settings.smsOrderCompleted,
      PAYMENT_SUCCESS: settings.smsPaymentSuccess,
    };

    return typeSettings[type] === true;
  }

  /**
   * Получить уведомления пользователя
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Отметить уведомление как прочитанное
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Отметить все уведомления как прочитанные
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Удалить уведомление
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, read: false },
    });
  }

  /**
   * Создать или получить настройки уведомлений
   */
  async getOrCreateSettings(userId: string) {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Обновить настройки уведомлений
   */
  async updateSettings(userId: string, data: any) {
    await this.getOrCreateSettings(userId);

    return prisma.notificationSettings.update({
      where: { userId },
      data,
    });
  }

  // ===== Специфичные уведомления =====

  /**
   * Уведомление о новом заказе (для исполнителей)
   */
  async notifyNewOrder(executorId: string, orderId: string, orderTitle: string) {
    const user = await prisma.user.findUnique({
      where: { id: executorId },
    });

    if (!user) return;

    const orderLink = `${config.frontendUrl}/orders/${orderId}`;

    // Всегда создаём IN_APP уведомление
    await this.createNotification({
      userId: executorId,
      type: 'ORDER_NEW',
      title: 'Новый заказ',
      message: `Новый заказ: ${orderTitle}`,
      data: { orderId, orderTitle },
    });

    // Email отправляем только если указан
    if (user.email) {
      await emailService.sendNewOrderEmail(user.email, orderTitle, orderLink);
    }
  }

  /**
   * Уведомление об отклике на заказ (для заказчика)
   */
  async notifyOrderResponse(customerId: string, executorName: string, orderId: string, orderTitle: string) {
    console.log(`📬 Создание уведомления о новом отклике для заказчика ${customerId}`);
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!user) {
      console.log(`❌ Заказчик ${customerId} не найден`);
      return;
    }

    const orderLink = `${config.frontendUrl}/orders/${orderId}`;

    // Всегда создаём IN_APP уведомление
    await this.createNotification({
      userId: customerId,
      type: 'ORDER_RESPONSE',
      title: 'Новый отклик',
      message: `${executorName} откликнулся на ваш заказ: ${orderTitle}`,
      data: { orderId, executorName },
    });
    console.log(`✅ Уведомление о новом отклике создано для ${user.fullName}`);

    // Email отправляем только если указан
    if (user.email) {
      await emailService.sendOrderResponseEmail(user.email, executorName, orderTitle, orderLink);
    }
  }

  /**
   * Уведомление о выборе исполнителя
   */
  async notifyExecutorSelected(
    executorId: string,
    orderId: string,
    orderTitle: string,
    customerName: string,
    customerPhone: string
  ) {
    console.log(`📬 Создание уведомления о выборе для исполнителя ${executorId}`);
    const user = await prisma.user.findUnique({
      where: { id: executorId },
    });

    if (!user) {
      console.log(`❌ Исполнитель ${executorId} не найден`);
      return;
    }

    const orderLink = `${config.frontendUrl}/orders/${orderId}`;

    await this.createNotification({
      userId: executorId,
      type: 'ORDER_SELECTED',
      title: 'Получен ответ на ваш отклик',
      message: `Заказчик ${customerName} выбрал вас для выполнения заказа "${orderTitle}". Вы можете приступить к работе или отказаться.`,
      data: { orderId, customerName, customerPhone },
    });
    console.log(`✅ Уведомление о выборе создано для ${user.fullName}`);

    if (user.email) {
      await emailService.sendExecutorSelectedEmail(
        user.email,
        orderTitle,
        customerName,
        customerPhone,
        orderLink
      );
    }

    // SMS уведомление
    if (user.phone && config.smsc.enabled) {
      // await smsService.sendSMS(
      //   user.phone,
      //   `Вас выбрали для заказа: ${orderTitle}. Контакт: ${customerPhone}`
      // );
    }
  }

  /**
   * Уведомление о завершении заказа
   */
  async notifyOrderCompleted(userId: string, orderId: string, orderTitle: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const reviewLink = `${config.frontendUrl}/orders/${orderId}`;

    // Всегда создаём IN_APP уведомление
    await this.createNotification({
      userId,
      type: 'ORDER_COMPLETED',
      title: 'Заказ завершён',
      message: `Заказ завершён: ${orderTitle}. Оставьте отзыв!`,
      data: { orderId },
    });

    if (user.email) {
      await emailService.sendOrderCompletedEmail(user.email, orderTitle, reviewLink);
    }
  }

  /**
   * Уведомление о новом отзыве
   */
  async notifyNewReview(userId: string, rating: number, comment: string, reviewerName: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    await this.createNotification({
      userId,
      type: 'REVIEW_NEW',
      title: 'Новый отзыв',
      message: `${reviewerName} оставил вам отзыв (${rating}/5)`,
      data: { rating, comment, reviewerName },
    });

    if (user.email) {
      await emailService.sendNewReviewEmail(user.email, rating, comment, reviewerName);
    }
  }

  /**
   * Уведомление об успешной оплате
   */
  async notifyPaymentSuccess(userId: string, amount: number, purpose: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    await this.createNotification({
      userId,
      type: 'PAYMENT_SUCCESS',
      title: 'Платёж успешен',
      message: `Оплата ${amount}₽ успешно проведена`,
      data: { amount, purpose },
    });

    if (user.email) {
      await emailService.sendPaymentSuccessEmail(user.email, amount, purpose);
    }
  }

  /**
   * Уведомление о начале работы исполнителем
   */
  async notifyWorkStarted(
    customerId: string,
    orderId: string,
    orderTitle: string,
    executorName: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!user) return;

    await this.createNotification({
      userId: customerId,
      type: 'ORDER_STARTED',
      title: 'Исполнитель приступил к работе',
      message: `${executorName} приступил к выполнению заказа "${orderTitle}"`,
      data: { orderId, orderTitle, executorName },
    });

    if (user.email) {
      const orderLink = `${config.frontendUrl}/orders/${orderId}`;
      await emailService.sendWorkStartedEmail(user.email, orderTitle, executorName, orderLink).catch(err =>
        console.error('❌ Email sendWorkStarted failed:', err.message)
      );
    }
  }

  /**
   * Уведомление об отказе исполнителя от заказа
   */
  async notifyExecutorCancelled(
    customerId: string,
    orderId: string,
    orderTitle: string,
    reason?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!user) return;

    const message = reason
      ? `Исполнитель отказался от заказа "${orderTitle}". Причина: ${reason}`
      : `Исполнитель отказался от заказа "${orderTitle}"`;

    await this.createNotification({
      userId: customerId,
      type: 'ORDER_CANCELLED',
      title: 'Исполнитель отказался от заказа',
      message,
      data: { orderId, orderTitle, reason },
    });

    if (user.email) {
      const orderLink = `${config.frontendUrl}/orders/${orderId}`;
      await emailService.sendExecutorCancelledEmail(user.email, orderTitle, reason, orderLink).catch(err =>
        console.error('❌ Email sendExecutorCancelled failed:', err.message)
      );
    }
  }

  /**
   * Уведомление заказчику об удалении заявки по истечении срока без откликов
   */
  async notifyOrderExpiredWithoutResponses(
    customerId: string,
    orderId: string,
    orderTitle: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!user) return;

    const message = `По заявке "${orderTitle}" не поступило ни одного отклика в течение 120 часов после даты начала работ. Заявка снята с публикации.`;

    await this.createNotification({
      userId: customerId,
      type: 'ORDER_CANCELLED',
      title: 'Заявка удалена по сроку',
      message,
      data: {
        orderId,
        orderTitle,
        reason: 'EXPIRED_WITHOUT_RESPONSES',
      },
    });

    if (user.email) {
      const ordersLink = `${config.frontendUrl}/customer/dashboard`;
      await emailService.sendOrderCancelledEmail(user.email, orderTitle, ordersLink).catch(err =>
        console.error('❌ Email notifyOrderExpiredWithoutResponses failed:', err.message)
      );
    }
  }

  /**
   * Уведомление о низком балансе
   */
  async notifyLowBalance(userId: string, balance: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const topUpLink = `${config.frontendUrl}/profile/balance`;

    await this.createNotification({
      userId,
      type: 'BALANCE_LOW',
      title: 'Низкий баланс',
      message: `Ваш баланс: ${balance}₽. Пополните для продолжения работы.`,
      data: { balance },
    });

    if (user.email) {
      await emailService.sendLowBalanceEmail(user.email, balance, topUpLink);
    }
  }

  /**
   * Уведомление об одобрении пользователя
   */
  async notifyUserApproved(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;

    const loginLink = `${config.frontendUrl}/login`;

    await this.createNotification({
      userId,
      type: 'USER_APPROVED',
      title: 'Профиль одобрен',
      message: 'Ваш профиль успешно прошёл модерацию!',
      data: {},
    });

    if (user.email) {
      await emailService.sendUserApprovedEmail(user.email, user.fullName, loginLink);
    }
  }

  /**
   * Уведомление о новом сообщении в чате
   */
  async notifyNewMessage(recipientId: string, senderName: string, orderId: string, orderTitle: string, messagePreview: string) {
    const user = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    await this.createNotification({
      userId: recipientId,
      type: 'NEW_MESSAGE',
      title: `Новое сообщение от ${senderName}`,
      message: messagePreview.length > 50 ? messagePreview.substring(0, 50) + '...' : messagePreview,
      data: { orderId, orderTitle },
    });

    if (user?.email) {
      const orderLink = `${config.frontendUrl}/orders/${orderId}`;
      const preview = messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview;
      await emailService.sendNewMessageEmail(user.email, senderName, orderTitle, preview, orderLink).catch(err =>
        console.error('❌ Email sendNewMessage failed:', err.message)
      );
    }
  }

  /**
   * Уведомление заказчику об отмене заказа (возврат средств исполнителям)
   * Для исполнителей, которые откликались — заказ отменён заказчиком
   */
  async notifyOrderCancelledByCustomer(
    executorIds: string[],
    orderId: string,
    orderTitle: string
  ) {
    const ordersLink = `${config.frontendUrl}/orders`;

    for (const executorId of executorIds) {
      const user = await prisma.user.findUnique({
        where: { id: executorId },
      });

      await this.createNotification({
        userId: executorId,
        type: 'ORDER_CANCELLED',
        title: 'Заказ отменён',
        message: `Заказчик отменил заказ "${orderTitle}". Комиссия за отклик возвращена.`,
        data: { orderId, orderTitle },
      });

      if (user?.email) {
        await emailService.sendOrderCancelledEmail(user.email, orderTitle, ordersLink).catch(err =>
          console.error('❌ Email sendOrderCancelled failed:', err.message)
        );
      }
    }
  }

  /**
   * Уведомление отклонённым исполнителям (при выборе другого)
   */
  async notifyResponseRejected(
    executorId: string,
    orderId: string,
    orderTitle: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: executorId },
    });

    await this.createNotification({
      userId: executorId,
      type: 'ORDER_CANCELLED',
      title: 'Отклик отклонён',
      message: `Заказчик выбрал другого исполнителя для заказа "${orderTitle}"`,
      data: { orderId, orderTitle },
    });

    if (user?.email) {
      const ordersLink = `${config.frontendUrl}/orders`;
      await emailService.sendResponseRejectedEmail(user.email, orderTitle, ordersLink).catch(err =>
        console.error('❌ Email sendResponseRejected failed:', err.message)
      );
    }
  }

  /**
   * Уведомление о получении нового отзыва
   */
  async notifyReviewReceived(
    revieweeId: string,
    reviewerName: string,
    rating: number,
    orderId: string,
    orderTitle: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: revieweeId },
    });

    const stars = '⭐'.repeat(rating);

    await this.createNotification({
      userId: revieweeId,
      type: 'REVIEW_NEW',
      title: 'Новый отзыв',
      message: `${reviewerName} оставил отзыв ${stars} по заказу "${orderTitle}"`,
      data: { orderId, orderTitle, rating, reviewerName },
    });

    if (user?.email) {
      await emailService.sendNewReviewEmail(user.email, rating, `Отзыв по заказу "${orderTitle}"`, reviewerName).catch(err =>
        console.error('❌ Email sendNewReview failed:', err.message)
      );
    }
  }

  /**
   * Уведомление о публикации отзыва (одобрен модератором)
   */
  async notifyReviewApproved(
    revieweeId: string,
    rating: number,
    reviewerName: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: revieweeId },
    });

    const stars = '⭐'.repeat(rating);

    await this.createNotification({
      userId: revieweeId,
      type: 'REVIEW_NEW',
      title: 'Отзыв опубликован',
      message: `Отзыв от ${reviewerName} (${stars}) прошёл модерацию и опубликован`,
      data: { rating, reviewerName },
    });

    if (user?.email) {
      await emailService.sendReviewApprovedEmail(user.email, rating, reviewerName).catch(err =>
        console.error('❌ Email sendReviewApproved failed:', err.message)
      );
    }
  }

  /**
   * Отправить уведомление от администрации
   * target: 'ALL' | 'CUSTOMERS' | 'EXECUTORS' | конкретный userId
   */
  async sendAdminNotification(params: {
    adminId: string;
    title: string;
    message: string;
    target: 'ALL' | 'CUSTOMERS' | 'EXECUTORS' | string;
  }) {
    let userIds: string[] = [];

    if (params.target === 'ALL') {
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (params.target === 'CUSTOMERS') {
      const users = await prisma.user.findMany({
        where: { role: 'CUSTOMER', status: 'ACTIVE' },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else if (params.target === 'EXECUTORS') {
      const users = await prisma.user.findMany({
        where: { role: 'EXECUTOR', status: 'ACTIVE' },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      // Конкретный userId
      const user = await prisma.user.findUnique({
        where: { id: params.target },
      });
      if (!user) {
        throw new Error('Пользователь не найден');
      }
      userIds = [params.target];
    }

    if (userIds.length === 0) {
      throw new Error('Не найдено пользователей для отправки');
    }

    // Массовая вставка уведомлений
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: 'SYSTEM' as any,
        channel: 'IN_APP' as any,
        title: params.title,
        message: params.message,
        data: { fromAdmin: true, adminId: params.adminId },
        sent: true,
        sentAt: new Date(),
      })),
    });

    // Записать в лог действий администратора
    await prisma.adminLog.create({
      data: {
        adminId: params.adminId,
        action: 'SEND_NOTIFICATION' as any,
        targetType: 'NOTIFICATION',
        targetId: params.target,
        metadata: {
          title: params.title,
          message: params.message,
          target: params.target,
          recipientsCount: userIds.length,
        },
      },
    });

    return { sent: userIds.length };
  }
}

export default new NotificationService();
