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
});

export const changeTariffSchema = Joi.object({
  tariffType: Joi.string()
    .valid('STANDARD', 'COMFORT')
    .required()
    .messages({
      'any.only': 'Тариф должен быть STANDARD или COMFORT',
      'any.required': 'Укажите тип тарифа',
    }),
});

