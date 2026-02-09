import Joi from 'joi';

export const registerSchema = Joi.object({
  role: Joi.string().valid('CUSTOMER', 'EXECUTOR').required().messages({
    'any.required': 'Роль обязательна',
    'any.only': 'Роль должна быть CUSTOMER или EXECUTOR',
  }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{10,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Неверный формат номера телефона',
      'any.required': 'Номер телефона обязателен',
    }),
  email: Joi.string().email().optional().allow('').messages({
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
    whatsapp: Joi.string().optional().allow(''),
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
  code: Joi.string().length(6).required().messages({
    'string.length': 'Код должен содержать 6 цифр',
    'any.required': 'Код обязателен',
  }),
});

export const sendSMSSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{10,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Неверный формат номера телефона',
      'any.required': 'Номер телефона обязателен',
    }),
});

