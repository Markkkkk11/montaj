import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';

/**
 * Middleware проверки аутентификации
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyToken(token);

      // Получаем пользователя из БД
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          executorProfile: true,
          balance: true,
          subscription: true,
        },
      });

      if (!user) {
        res.status(401).json({ error: 'Пользователь не найден' });
        return;
      }

      if (user.status === 'BLOCKED') {
        res.status(403).json({ error: 'Аккаунт заблокирован' });
        return;
      }

      // Добавляем пользователя в request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Неверный или истёкший токен' });
      return;
    }
  } catch (error) {
    res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

/**
 * Опциональная аутентификация — если токен есть, парсим user, если нет — пропускаем
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            executorProfile: true,
            balance: true,
            subscription: true,
          },
        });

        if (user && user.status !== 'BLOCKED') {
          req.user = user;
        }
      } catch {
        // Невалидный токен — не ставим user, но не блокируем
      }
    }

    next();
  } catch {
    next();
  }
};

/**
 * Middleware проверки роли
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Недостаточно прав доступа' });
      return;
    }

    next();
  };
};

/**
 * Middleware проверки статуса пользователя
 */
export const requireStatus = (...statuses: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    if (!statuses.includes(req.user.status)) {
      res.status(403).json({ 
        error: 'Ваш профиль находится на модерации или заблокирован',
        status: req.user.status
      });
      return;
    }

    next();
  };
};

