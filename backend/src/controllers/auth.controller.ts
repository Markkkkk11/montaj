import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import authService from '../services/auth.service';

export class AuthController {
  /**
   * POST /api/auth/register
   * Регистрация нового пользователя
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);

      res.status(201).json({
        message: 'Регистрация успешна. Проверьте SMS для подтверждения телефона',
        user: {
          id: result.user.id,
          role: result.user.role,
          phone: result.user.phone,
          fullName: result.user.fullName,
        },
        requiresVerification: result.requiresVerification,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/verify-sms
   * Проверка SMS-кода
   */
  async verifySMS(req: Request, res: Response): Promise<void> {
    try {
      const { phone, code } = req.body;
      const isValid = await authService.verifyPhone(phone, code);

      if (isValid) {
        res.json({ message: 'Телефон успешно подтверждён' });
      } else {
        res.status(400).json({ error: 'Неверный или истёкший код' });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/send-sms
   * Отправка/повторная отправка SMS-кода
   */
  async sendSMS(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      await authService.resendVerificationCode(phone);

      res.json({ message: 'SMS-код отправлен' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/request-reset
   * Запрос сброса пароля — отправляет код на телефон
   */
  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      await authService.requestPasswordReset(phone);
      res.json({ message: 'Код подтверждения отправлен' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Подтверждение кода и установка нового пароля
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { phone, code, newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' });
        return;
      }
      await authService.resetPassword(phone, code, newPassword);
      res.json({ message: 'Пароль успешно изменён' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/login
   * Вход в систему
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { user, token } = await authService.login(req.body);

      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = user;

      res.json({
        message: 'Вход выполнен успешно',
        token,
        user: userWithoutPassword,
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * GET /api/auth/me
   * Получить текущего пользователя
   */
  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const user = await authService.getCurrentUser(req.user.id);

      if (!user) {
        res.status(404).json({ error: 'Пользователь не найден' });
        return;
      }

      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/logout
   * Выход из системы (на клиенте удаляется токен)
   */
  async logout(req: Request, res: Response): Promise<void> {
    res.json({ message: 'Выход выполнен успешно' });
  }
}

export default new AuthController();

