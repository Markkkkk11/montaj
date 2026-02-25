import Joi from 'joi';

// Кастомная валидация телефона: принимает любой формат, нормализует до цифр
const phoneValidator = Joi.string()
  .custom((value, helpers) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return helpers.error('string.pattern.base');
    }
    return value; // Оставляем оригинал, нормализация на сервисе
  })
  .required()
  .messages({
    'string.pattern.base': 'Неверный формат номера телефона (минимум 10 цифр)',
    'any.required': 'Номер телефона обязателен',
  });

export const registerSchema = Joi.object({
  role: Joi.string().valid('CUSTOMER', 'EXECUTOR').required().messages({
    'any.required': 'Роль обязательна',
    'any.only': 'Роль должна быть CUSTOMER или EXECUTOR',
  }),
  phone: phoneValidator,
  email: Joi.string().email().optional().allow('', null).messages({
    'string.email': 'Неверный формат email',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Пароль должен содержать минимум 6 символов',
    'any.required': 'Пароль обязателен',
  }),
  fullName: Joi.string().min(2).required().messages({
    'string.min': 'ФИО должно содержать минимум 2 символа',
    'any.required': 'ФИО обязательно',
  }),
  organization: Joi.string().optional().allow(''),
  city: Joi.string().required().messages({
    'any.required': 'Город обязателен',
  }),
  address: Joi.string().optional().allow(''),
  messengers: Joi.object({
    max: Joi.string().optional().allow(''),
    telegram: Joi.string().optional().allow(''),
  }).optional(),
  inn: Joi.string().optional().allow(''),
  ogrn: Joi.string().optional().allow(''),
  agreeToTerms: Joi.boolean().valid(true).required().messages({
    'any.only': 'Необходимо согласиться с условиями сервиса',
    'any.required': 'Необходимо согласиться с условиями сервиса',
  }),
});

export const loginSchema = Joi.object({
  phone: Joi.string().required().messages({
    'any.required': 'Номер телефона обязателен',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Пароль обязателен',
  }),
});

export const verifySMSSchema = Joi.object({
  phone: Joi.string().required().messages({
    'any.required': 'Номер телефона обязателен',
  }),
  code: Joi.string().min(4).max(6).pattern(/^\d+$/).required().messages({
    'string.min': 'Код должен содержать минимум 4 цифры',
    'string.max': 'Код должен содержать максимум 6 цифр',
    'string.pattern.base': 'Код должен содержать только цифры',
    'any.required': 'Код обязателен',
  }),
});

export const sendSMSSchema = Joi.object({
  phone: phoneValidator,
});
