import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { RegisterData, LoginData } from '../types';
import smsService from './sms.service';

export class AuthService {
  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterData): Promise<{ user: User; requiresVerification: boolean }> {
    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser) {
      throw new Error('Пользователь с таким номером телефона уже зарегистрирован');
    }

    // Хэшируем пароль
    const hashedPassword = await hashPassword(data.password);

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        role: data.role,
        phone: data.phone,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        organization: data.organization,
        city: data.city,
        address: data.address,
        messengers: data.messengers as Prisma.JsonObject,
        inn: data.inn,
        ogrn: data.ogrn,
      },
    });

    // Если это исполнитель - создаём профиль, баланс и подписку
    if (data.role === 'EXECUTOR') {
      await this.initializeExecutorData(user.id);
    }

    // Отправляем SMS-код
    await smsService.sendVerificationCode(data.phone);

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

    // Создаём баланс с бонусом 1000₽
    await prisma.balance.create({
      data: {
        userId,
        amount: 0,
        bonusAmount: 1000, // Приветственный бонус
      },
    });

    // Создаём подписку Premium на 1 месяц
    await prisma.subscription.create({
      data: {
        userId,
        tariffType: 'PREMIUM',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        specializationCount: 3,
      },
    });
  }

  /**
   * Верификация телефона по SMS-коду
   */
  async verifyPhone(phone: string, code: string): Promise<boolean> {
    const isValid = await smsService.verifyCode(phone, code);

    if (isValid) {
      // Обновляем статус пользователя
      await prisma.user.updateMany({
        where: { phone },
        data: { isPhoneVerified: true },
      });
    }

    return isValid;
  }

  /**
   * Вход в систему
   */
  async login(data: LoginData): Promise<{ user: User; token: string }> {
    // Находим пользователя
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
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

    // Генерируем JWT токен
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Получить текущего пользователя по ID
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        executorProfile: true,
        balance: true,
        subscription: true,
      },
    });
  }

  /**
   * Повторная отправка SMS-кода
   */
  async resendVerificationCode(phone: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (user.isPhoneVerified) {
      throw new Error('Телефон уже подтверждён');
    }

    await smsService.sendVerificationCode(phone);
  }
}

export default new AuthService();

