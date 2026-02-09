import Joi from 'joi';

export const moderateUserSchema = Joi.object({
  action: Joi.string()
    .valid('APPROVE', 'REJECT', 'BLOCK', 'UNBLOCK')
    .required()
    .messages({
      'any.only': 'Действие должно быть APPROVE, REJECT, BLOCK или UNBLOCK',
      'any.required': 'Укажите действие',
    }),
  reason: Joi.string().optional().max(500).messages({
    'string.max': 'Причина не может быть длиннее 500 символов',
  }),
});

export const moderateOrderSchema = Joi.object({
  action: Joi.string()
    .valid('APPROVE', 'REJECT', 'BLOCK')
    .required()
    .messages({
      'any.only': 'Действие должно быть APPROVE, REJECT или BLOCK',
      'any.required': 'Укажите действие',
    }),
  reason: Joi.string().optional().max(500).messages({
    'string.max': 'Причина не может быть длиннее 500 символов',
  }),
});

export const moderateReviewSchema = Joi.object({
  action: Joi.string()
    .valid('APPROVE', 'REJECT')
    .required()
    .messages({
      'any.only': 'Действие должно быть APPROVE или REJECT',
      'any.required': 'Укажите действие',
    }),
  note: Joi.string().optional().max(500).messages({
    'string.max': 'Примечание не может быть длиннее 500 символов',
  }),
});

