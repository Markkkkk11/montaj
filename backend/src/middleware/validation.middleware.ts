import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Middleware для валидации тела запроса
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log('🔍 Валидация body:', JSON.stringify(req.body, null, 2));
    
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      console.log('❌ Ошибка валидации:', errors);

      res.status(400).json({
        error: 'Ошибка валидации',
        details: errors,
      });
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * Middleware для валидации query параметров
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      res.status(400).json({
        error: 'Ошибка валидации',
        details: errors,
      });
      return;
    }

    req.query = value;
    next();
  };
};

