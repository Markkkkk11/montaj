import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/**
 * Middleware для проверки прав администратора
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Не авторизован',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Доступ запрещён. Требуются права администратора.',
    });
  }

  next();
};

/**
 * Middleware для проверки статуса администратора
 */
export const requireActiveAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Не авторизован',
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: 'Доступ запрещён. Требуются права администратора.',
    });
  }

  if (req.user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      error: 'Аккаунт администратора не активен',
    });
  }

  next();
};

