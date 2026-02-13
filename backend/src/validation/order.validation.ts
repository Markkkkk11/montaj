import Joi from 'joi';

export const createOrderSchema = Joi.object({
  category: Joi.string()
    .valid('WINDOWS', 'DOORS', 'CEILINGS', 'CONDITIONERS', 'BLINDS', 'FURNITURE')
    .required()
    .messages({
      'any.required': 'Категория обязательна',
      'any.only': 'Неверная категория',
    }),
  title: Joi.string().min(10).max(200).required().messages({
    'string.min': 'Заголовок должен содержать минимум 10 символов',
    'string.max': 'Заголовок должен содержать максимум 200 символов',
    'any.required': 'Заголовок обязателен',
  }),
  description: Joi.string().min(20).required().messages({
    'string.min': 'Описание должно содержать минимум 20 символов',
    'any.required': 'Описание обязательно',
  }),
  region: Joi.string().required().messages({
    'any.required': 'Регион обязателен',
  }),
  address: Joi.string().required().messages({
    'any.required': 'Адрес обязателен',
  }),
  latitude: Joi.number().optional().allow(null).messages({
    'number.base': 'Широта должна быть числом',
  }),
  longitude: Joi.number().optional().allow(null).messages({
    'number.base': 'Долгота должна быть числом',
  }),
  startDate: Joi.date().iso().required().messages({
    'any.required': 'Дата начала обязательна',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().allow(null).messages({
    'date.min': 'Дата окончания должна быть позже даты начала',
  }),
  budget: Joi.number().min(0).required().messages({
    'number.min': 'Бюджет не может быть отрицательным',
    'any.required': 'Бюджет обязателен',
  }),
  budgetType: Joi.string().valid('fixed', 'negotiable').optional().default('fixed'),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK').required().messages({
    'any.required': 'Способ оплаты обязателен',
    'any.only': 'Неверный способ оплаты',
  }),
});

export const updateOrderSchema = Joi.object({
  title: Joi.string().min(10).max(200).optional(),
  description: Joi.string().min(20).optional(),
  region: Joi.string().optional(),
  address: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional().allow(null),
  budget: Joi.number().min(0).optional(),
  budgetType: Joi.string().valid('fixed', 'negotiable').optional(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK').optional(),
});

export const getOrdersQuerySchema = Joi.object({
  category: Joi.string()
    .valid('WINDOWS', 'DOORS', 'CEILINGS', 'CONDITIONERS', 'BLINDS', 'FURNITURE')
    .optional(),
  region: Joi.string().optional(),
  minBudget: Joi.number().min(0).optional(),
  maxBudget: Joi.number().min(0).optional(),
  status: Joi.string()
    .valid('PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED')
    .optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

