import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { RegisterData, LoginData } from '../types';
import smsService from './sms.service';
import settingsService from './settings.service';
import subscriptionService from './subscription.service';

export class AuthService {
  private applyExecutorSpecializationLimit(user: any) {
    if (user?.role !== 'EXECUTOR' || !user.executorProfile) {
      return user;
    }

    const maxSpecializations = user.subscription?.specializationCount || 1;
    user.executorProfile = {
      ...user.executorProfile,
      specializations: (user.executorProfile.specializations || []).slice(0, maxSpecializations),
    };

    return user;
  }

  /**
   * Нормализация телефона (оставляем только цифры)
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterData): Promise<{ user: any; requiresVerification: boolean }> {
    const normalizedPhone = this.normalizePhone(data.phone);

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      // Если пользователь не верифицирован — разрешаем повторную регистрацию
      if (!existingUser.isPhoneVerified) {
        console.log(`♻️ Повторная регистрация для неверифицированного пользователя: ${normalizedPhone}`);
        // Удаляем старого неверифицированного пользователя
        await prisma.user.delete({ where: { id: existingUser.id } }).catch(() => {});
      } else {
        throw new Error('Пользователь с таким номером телефона уже зарегистрирован');
      }
    }

    // Хэшируем пароль
    const hashedPassword = await hashPassword(data.password);

    // Проверяем настройку автоодобрения пользователей
    const autoApprove = await settingsService.get('autoApproveUsers');
    const initialStatus = autoApprove === 'true' ? 'ACTIVE' : 'PENDING';

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        role: data.role,
        phone: normalizedPhone,
        email: data.email || null,
        password: hashedPassword,
        fullName: data.fullName,
        organization: data.organization,
        city: data.city,
        address: data.address,
        messengers: (data.messengers || {}) as any,
        inn: data.inn,
        ogrn: data.ogrn,
        status: initialStatus,
      },
    });

    // Если это исполнитель - создаём профиль, баланс и подписку
    if (data.role === 'EXECUTOR') {
      await this.initializeExecutorData(user.id);
    }

    // Отправляем код верификации ЗВОНКОМ (при регистрации — звонок, при повторной отправке — SMS)
    try {
      await smsService.sendVerificationByCall(normalizedPhone);
    } catch (err: any) {
      console.error('❌ Ошибка отправки кода верификации:', err.message);
      // Не блокируем регистрацию если звонок не прошёл
    }

    return { user, requiresVerification: true };
  }

  /**
   * Инициализация данных исполнителя (профиль, баланс, подписка)
   */
  private async initializeExecutorData(userId: string): Promise<void> {
    // Создаём пустой профиль исполнителя
    await prisma.executorProfile.create({
      data: {
        userId,
        region: '',
        specializations: [],
        workPhotos: [],
      },
    });

    // Создаём баланс (бонус 1000₽ начисляется только после первого пополнения от 150₽)
    await prisma.balance.create({
      data: {
        userId,
        amount: 0,
        bonusAmount: 0,
      },
    });

    // Создаём подписку Premium (пробный период и кол-во специализаций из настроек)
    const tariffSettings = await settingsService.getBySection('tariffs');
    const premiumSpecs = parseInt(tariffSettings.premiumSpecializations || '3', 10);
    const trialDays = parseInt(tariffSettings.trialDays || '30', 10);

    await prisma.subscription.create({
      data: {
        userId,
        tariffType: 'PREMIUM',
        expiresAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000),
        specializationCount: premiumSpecs,
      },
    });
  }

  /**
   * Верификация телефона по SMS/звонку коду
   */
  async verifyPhone(phone: string, code: string): Promise<boolean> {
    const normalizedPhone = this.normalizePhone(phone);
    const isValid = await smsService.verifyCode(normalizedPhone, code);

    if (isValid) {
      // Обновляем статус пользователя
      await prisma.user.updateMany({
        where: { phone: normalizedPhone },
        data: { isPhoneVerified: true },
      });
      console.log(`✅ Телефон ${normalizedPhone} подтверждён`);
    }

    return isValid;
  }

  /**
   * Вход в систему
   */
  async login(data: LoginData): Promise<{ user: any; token: string }> {
    const normalizedPhone = this.normalizePhone(data.phone);

    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        executorProfile: true,
        balance: true,
        subscription: true,
      },
    });

    if (!user) {
      throw new Error('Неверный номер телефона или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await comparePassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Неверный номер телефона или пароль');
    }

    // Проверяем верификацию телефона
    if (!user.isPhoneVerified) {
      throw new Error('Телефон не подтверждён. Пожалуйста, введите код из SMS');
    }

    // Проверяем статус пользователя
    if (user.status === 'BLOCKED') {
      throw new Error('Ваш аккаунт заблокирован. Обратитесь в поддержку');
    }

    if (user.status === 'REJECTED') {
      throw new Error('Ваш профиль не прошёл модерацию');
    }

    // Проверяем срок подписки: если истекла, переводим на Standard
    if (user.subscription && user.subscription.tariffType !== 'STANDARD') {
      const isExpired = new Date() >= new Date(user.subscription.expiresAt);
      if (isExpired) {
        console.log(`⏰ Подписка ${user.subscription.tariffType} истекла у пользователя ${user.id}, переводим на Стандарт`);
        const updatedSub = await subscriptionService.changeTariff(user.id, 'STANDARD');
        user.subscription = updatedSub as any;
      }
    }

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    return { user: this.applyExecutorSpecializationLimit(user), token };
  }

  /**
   * Получить текущего пользователя по ID
   * Проверяет срок подписки и автоматически переводит на Стандарт при истечении.
   */
  async getCurrentUser(userId: string): Promise<any | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        executorProfile: true,
        balance: true,
        subscription: true,
      },
    });

    if (!user) return null;

    // Проверяем срок подписки: если истекла, переводим на Standard
    if (user.subscription && user.subscription.tariffType !== 'STANDARD') {
      const isExpired = new Date() >= new Date(user.subscription.expiresAt);
      if (isExpired) {
        console.log(`⏰ Подписка ${user.subscription.tariffType} истекла у пользователя ${userId}, переводим на Стандарт`);
        const updatedSub = await subscriptionService.changeTariff(userId, 'STANDARD');
        user.subscription = updatedSub as any;
      }
    }

    return this.applyExecutorSpecializationLimit(user);
  }

  /**
   * Запрос сброса пароля — отправляет код на телефон
   */
  async requestPasswordReset(phone: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new Error('Пользователь с таким номером не найден');
    }

    if (!user.isPhoneVerified) {
      throw new Error('Телефон не подтверждён');
    }

    // Для сброса пароля отправляем SMS (не звонок)
    await smsService.sendVerificationBySMS(normalizedPhone);
  }

  /**
   * Подтверждение кода и установка нового пароля
   */
  async resetPassword(phone: string, code: string, newPassword: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    const isValid = await smsService.verifyCode(normalizedPhone, code);
    if (!isValid) {
      throw new Error('Неверный код подтверждения');
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log(`✅ Пароль сброшен для: ${normalizedPhone}`);
  }

  /**
   * Повторная отправка кода верификации (через SMS)
   */
  async resendVerificationCode(phone: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (user.isPhoneVerified) {
      throw new Error('Телефон уже подтверждён');
    }

    // При повторной отправке используем SMS (при регистрации был звонок)
    await smsService.sendVerificationBySMS(normalizedPhone);
  }
}

export default new AuthService();
