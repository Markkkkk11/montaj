import Joi from 'joi';

export const createTopUpSchema = Joi.object({
  amount: Joi.number()
    .min(100)
    .max(100000)
    .required()
    .messages({
      'number.min': 'Минимальная сумма пополнения - 100₽',
      'number.max': 'Максимальная сумма пополнения - 100000₽',
      'any.required': 'Укажите сумму пополнения',
    }),
  returnPath: Joi.string()
    .pattern(/^\/[A-Za-z0-9\-/_?=&]*$/)
    .optional()
    .messages({
      'string.pattern.base': 'Некорректный путь возврата',
    }),
});

export const changeTariffSchema = Joi.object({
  tariffType: Joi.string()
    .valid('STANDARD')
    .required()
    .messages({
      'any.only': 'Бесплатно можно перейти только на STANDARD. Для Комфорт и Премиум — оплатите через /payments/subscription',
      'any.required': 'Укажите тип тарифа',
    }),
});
