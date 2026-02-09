import prisma from '../config/database';
import { config } from '../config/env';

export class SMSService {
  /**
   * Отправка SMS-кода верификации
   */
  async sendVerificationCode(phone: string): Promise<void> {
    // 🔧 ВРЕМЕННАЯ ЗАГЛУШКА: всегда используем код 123456
    const code = '123456';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час для удобства тестирования

    // Сохраняем в БД
    await prisma.sMSVerification.create({
      data: {
        phone,
        code,
        expiresAt,
      },
    });

    // Режим разработки - выводим код в консоль
    console.log(`\n🔧 =======================================`);
    console.log(`📱 SMS КОД ДЛЯ ТЕСТИРОВАНИЯ`);
    console.log(`📞 Телефон: ${phone}`);
    console.log(`🔑 КОД: ${code}`);
    console.log(`⏰ Действителен до: ${expiresAt.toLocaleString('ru-RU')}`);
    console.log(`🔧 =======================================\n`);

    // Реальная отправка SMS отключена
    // if (config.smsc.enabled) {
    //   await this.sendSMSViaSMSC(phone, `Ваш код подтверждения: ${code}`);
    // }
  }

  /**
   * Проверка SMS-кода
   */
  async verifyCode(phone: string, code: string): Promise<boolean> {
    const verification = await prisma.sMSVerification.findFirst({
      where: {
        phone,
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
   * Отправка SMS через SMSC.ru API
   */
  private async sendSMSViaSMSC(phone: string, message: string): Promise<void> {
    try {
      const params = new URLSearchParams({
        login: config.smsc.login,
        psw: config.smsc.password,
        phones: phone,
        mes: message,
        charset: 'utf-8',
      });

      const response = await fetch(`https://smsc.ru/sys/send.php?${params.toString()}`);
      const data = await response.text();

      if (!response.ok) {
        throw new Error(`SMSC API error: ${data}`);
      }

      console.log('✅ SMS отправлено через SMSC.ru:', phone);
    } catch (error) {
      console.error('❌ Ошибка отправки SMS:', error);
      throw new Error('Не удалось отправить SMS');
    }
  }

  /**
   * Очистка старых кодов верификации (можно запускать по cron)
   */
  async cleanupExpiredCodes(): Promise<void> {
    await prisma.sMSVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}

export default new SMSService();

