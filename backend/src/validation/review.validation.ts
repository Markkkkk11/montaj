import Joi from 'joi';

export const createReviewSchema = Joi.object({
  orderId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Рейтинг должен быть от 1 до 5',
    'number.max': 'Рейтинг должен быть от 1 до 5',
    'any.required': 'Рейтинг обязателен',
  }),
  comment: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Комментарий должен содержать минимум 10 символов',
    'string.max': 'Комментарий не должен превышать 1000 символов',
    'any.required': 'Комментарий обязателен',
  }),
});

export const moderateReviewSchema = Joi.object({
  action: Joi.string().valid('approve', 'reject').required(),
  note: Joi.when('action', {
    is: 'reject',
    then: Joi.string().min(10).required().messages({
      'string.min': 'Причина отклонения должна содержать минимум 10 символов',
      'any.required': 'Укажите причину отклонения',
    }),
    otherwise: Joi.string().optional(),
  }),
});

