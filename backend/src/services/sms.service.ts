import prisma from '../config/database';
import { config } from '../config/env';

interface GreenSMSResponse {
  error?: string;
  code?: string | number;
  request_id?: string;
  balance?: string;
  status?: string;
}

export class SMSService {
  private baseUrl = config.greenSms.baseUrl;
  private token = config.greenSms.token;
  private enabled = config.greenSms.enabled;

  /**
   * Отправка кода верификации через GreenSMS (звонок — дешевле)
   * Метод call/send — звонит на номер, код = последние 4 цифры вызывающего номера
   */
  async sendVerificationCode(phone: string): Promise<void> {
    // Нормализуем телефон: оставляем только цифры, убираем +
    const cleanPhone = phone.replace(/\D/g, '');
    
    let code: string;
    let method: 'call' | 'sms' = 'sms';

    if (this.enabled && this.token) {
      try {
        // Основной метод — SMS через GreenSMS (from: SVMONTAJ.ru)
        code = this.generateCode();
        await this.sendSMSVerification(cleanPhone, code);
        method = 'sms';
        console.log(`📱 SMS верификация отправлена на ${cleanPhone}`);
      } catch (smsError: any) {
        console.warn(`⚠️ SMS не удалось: ${smsError.message}, пробуем звонок...`);

        try {
          // Фоллбэк на звонок
          const callResult = await this.sendCallVerification(cleanPhone);
          code = callResult.code;
          method = 'call';
          console.log(`📞 Верификация звонком отправлена на ${cleanPhone}`);
        } catch (callError: any) {
          console.error(`❌ Звонок тоже не удался: ${callError.message}`);
          // Фоллбэк на заглушку в dev
          code = this.generateCode();
          method = 'sms';
          console.log(`🔧 DEV: Используем сгенерированный код: ${code}`);
        }
      }
    } else {
      // Режим разработки без GreenSMS
      code = '123456';
      console.log(`\n🔧 =======================================`);
      console.log(`📱 SMS КОД ДЛЯ ТЕСТИРОВАНИЯ (GreenSMS отключен)`);
      console.log(`📞 Телефон: ${cleanPhone}`);
      console.log(`🔑 КОД: ${code}`);
      console.log(`🔧 =======================================\n`);
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые неиспользованные коды для этого номера
    await prisma.sMSVerification.updateMany({
      where: {
        phone: cleanPhone,
        verified: false,
      },
      data: {
        expiresAt: new Date(0), // Помечаем как истёкшие
      },
    });

    // Сохраняем новый код в БД
    await prisma.sMSVerification.create({
      data: {
        phone: cleanPhone,
        code,
        expiresAt,
      },
    });

    console.log(`✅ Код верификации сохранён. Метод: ${method}. Телефон: ${cleanPhone}. Истекает: ${expiresAt.toLocaleString('ru-RU')}`);
  }

  /**
   * Верификация через звонок GreenSMS
   * Возвращает код (последние 4 цифры вызывающего номера)
   */
  private async sendCallVerification(phone: string): Promise<{ code: string; requestId: string }> {
    const response = await fetch(`${this.baseUrl}/call/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: phone }),
    });

    const data: GreenSMSResponse = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || `GreenSMS call error: HTTP ${response.status}`);
    }

    if (!data.code) {
      throw new Error('GreenSMS call: код не получен в ответе');
    }

    return {
      code: String(data.code),
      requestId: data.request_id || '',
    };
  }

  /**
   * Верификация через SMS GreenSMS
   */
  private async sendSMSVerification(phone: string, code: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/sms/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        // from: 'SVMONTAJ.ru', // TODO: раскомментировать после одобрения имени отправителя в GreenSMS
        txt: `Ваш код подтверждения: ${code}`,
      }),
    });

    const data: GreenSMSResponse = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || `GreenSMS SMS error: HTTP ${response.status}`);
    }
  }

  /**
   * Отправка произвольного SMS через GreenSMS (для уведомлений)
   */
  async sendSMS(phone: string, message: string): Promise<void> {
    if (!this.enabled || !this.token) {
      console.log(`📱 SMS (dev): ${phone} → ${message}`);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    try {
      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: cleanPhone,
          // from: 'SVMONTAJ.ru', // TODO: раскомментировать после одобрения имени отправителя в GreenSMS
          txt: message,
        }),
      });

      const data: GreenSMSResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `GreenSMS error: HTTP ${response.status}`);
      }

      console.log(`✅ SMS отправлено на ${cleanPhone}`);
    } catch (error: any) {
      console.error(`❌ Ошибка отправки SMS на ${cleanPhone}:`, error.message);
      throw new Error('Не удалось отправить SMS');
    }
  }

  /**
   * Проверка SMS-кода
   */
  async verifyCode(phone: string, code: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '');

    const verification = await prisma.sMSVerification.findFirst({
      where: {
        phone: cleanPhone,
        code,
        verified: false,
        expiresAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!verification) {
      return false;
    }

    // Отмечаем код как использованный
    await prisma.sMSVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    return true;
  }

  /**
   * Генерация 4-значного кода (для SMS метода)
   */
  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Очистка старых кодов верификации (можно запускать по cron)
   */
  async cleanupExpiredCodes(): Promise<void> {
    const deleted = await prisma.sMSVerification.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { verified: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    console.log(`🧹 Очищено ${deleted.count} устаревших кодов верификации`);
  }

  /**
   * Проверка баланса GreenSMS
   */
  async checkBalance(): Promise<{ balance: string } | null> {
    if (!this.enabled || !this.token) return null;

    try {
      const response = await fetch(`${this.baseUrl}/account/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: GreenSMSResponse = await response.json();
      if (data.balance) {
        console.log(`💰 GreenSMS баланс: ${data.balance} руб.`);
        return { balance: data.balance };
      }
      return null;
    } catch (error) {
      console.error('❌ Ошибка проверки баланса GreenSMS:', error);
      return null;
    }
  }
}

export default new SMSService();
