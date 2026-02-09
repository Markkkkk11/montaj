import transporter from '../config/email';
import { config } from '../config/env';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Отправить email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!config.emailEnabled) {
      console.log('[Email] Disabled, skipping:', options.subject);
      return false;
    }

    try {
      const info = await transporter.sendMail({
        from: `"Montaj Platform" <${config.emailFrom}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });

      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Email send failed:', error.message);
      return false;
    }
  }

  /**
   * Новый заказ (для исполнителей)
   */
  async sendNewOrderEmail(to: string, orderTitle: string, orderLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🆕 Новый заказ доступен!</h2>
        <p>Появился новый заказ, который может вас заинтересовать:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>${orderTitle}</strong>
        </div>
        <p>
          <a href="${orderLink}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Посмотреть заказ
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Не упустите возможность откликнуться первым!
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '🆕 Новый заказ на платформе Montaj',
      html,
    });
  }

  /**
   * Отклик на заказ (для заказчика)
   */
  async sendOrderResponseEmail(to: string, executorName: string, orderTitle: string, orderLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>👋 Новый отклик на ваш заказ!</h2>
        <p>Исполнитель <strong>${executorName}</strong> откликнулся на ваш заказ:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>${orderTitle}</strong>
        </div>
        <p>
          <a href="${orderLink}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Посмотреть профиль исполнителя
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ознакомьтесь с профилем исполнителя и выберите лучшего кандидата.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '👋 Новый отклик на ваш заказ - Montaj',
      html,
    });
  }

  /**
   * Исполнитель выбран
   */
  async sendExecutorSelectedEmail(
    to: string,
    orderTitle: string,
    customerName: string,
    customerPhone: string,
    orderLink: string
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🎉 Вас выбрали исполнителем!</h2>
        <p>Заказчик выбрал вас для выполнения заказа:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>${orderTitle}</strong>
        </div>
        <div style="margin: 20px 0;">
          <p><strong>Контакты заказчика:</strong></p>
          <p>Имя: ${customerName}</p>
          <p>Телефон: <a href="tel:${customerPhone}">${customerPhone}</a></p>
        </div>
        <p>
          <a href="${orderLink}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Перейти к заказу
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Свяжитесь с заказчиком и приступайте к работе!
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '🎉 Вас выбрали для выполнения заказа - Montaj',
      html,
    });
  }

  /**
   * Заказ завершён
   */
  async sendOrderCompletedEmail(to: string, orderTitle: string, reviewLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>✅ Заказ завершён!</h2>
        <p>Заказ успешно выполнен:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <strong>${orderTitle}</strong>
        </div>
        <p>Пожалуйста, оставьте отзыв о работе!</p>
        <p>
          <a href="${reviewLink}" style="display: inline-block; background: #ffc107; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Оставить отзыв
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Ваш отзыв поможет другим пользователям сделать правильный выбор.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '✅ Заказ завершён - Оставьте отзыв',
      html,
    });
  }

  /**
   * Новый отзыв
   */
  async sendNewReviewEmail(to: string, rating: number, comment: string, reviewerName: string) {
    const stars = '⭐'.repeat(rating);
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⭐ Вам оставили отзыв!</h2>
        <p><strong>${reviewerName}</strong> оставил отзыв о вашей работе:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="font-size: 24px; margin: 0 0 10px 0;">${stars}</p>
          <p style="margin: 0;">${comment}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Продолжайте в том же духе! Хорошие отзывы помогут вам получать больше заказов.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '⭐ Вам оставили новый отзыв - Montaj',
      html,
    });
  }

  /**
   * Успешная оплата
   */
  async sendPaymentSuccessEmail(to: string, amount: number, purpose: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>💳 Оплата успешно проведена!</h2>
        <p>Ваш платёж успешно обработан:</p>
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0 0 5px 0;"><strong>Сумма:</strong> ${amount} ₽</p>
          <p style="margin: 0;"><strong>Назначение:</strong> ${purpose}</p>
        </div>
        <p style="color: #666; font-size: 14px;">
          Средства зачислены на ваш баланс.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '💳 Платёж успешно проведён - Montaj',
      html,
    });
  }

  /**
   * Подписка истекает
   */
  async sendSubscriptionExpiringEmail(to: string, daysLeft: number, renewLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⏰ Ваша подписка истекает!</h2>
        <p>Ваша подписка <strong>Premium</strong> истекает через <strong>${daysLeft} дней</strong>.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;">
            Продлите подписку, чтобы продолжать получать неограниченное количество откликов!
          </p>
        </div>
        <p>
          <a href="${renewLink}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Продлить подписку
          </a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '⏰ Ваша подписка истекает - Montaj',
      html,
    });
  }

  /**
   * Пользователь одобрен
   */
  async sendUserApprovedEmail(to: string, name: string, loginLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>✅ Ваш профиль одобрен!</h2>
        <p>Здравствуйте, ${name}!</p>
        <p>Ваш профиль успешно прошёл модерацию и активирован.</p>
        <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <p style="margin: 0;">
            Теперь вы можете полноценно пользоваться платформой Montaj!
          </p>
        </div>
        <p>
          <a href="${loginLink}" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Войти в личный кабинет
          </a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '✅ Ваш профиль одобрен - Montaj',
      html,
    });
  }

  /**
   * Низкий баланс
   */
  async sendLowBalanceEmail(to: string, balance: number, topUpLink: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⚠️ Низкий баланс</h2>
        <p>Ваш баланс на платформе Montaj составляет <strong>${balance} ₽</strong>.</p>
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0;">
            Пополните баланс, чтобы продолжать откликаться на заказы!
          </p>
        </div>
        <p>
          <a href="${topUpLink}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Пополнить баланс
          </a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: '⚠️ Низкий баланс на платформе - Montaj',
      html,
    });
  }
}

export default new EmailService();

