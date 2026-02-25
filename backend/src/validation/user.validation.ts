import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).optional(),
  organization: Joi.string().optional().allow(''),
  city: Joi.string().optional(),
  address: Joi.string().optional().allow(''),
  email: Joi.string().email().optional().allow(''),
  about: Joi.string().max(1000).optional().allow(''),
  website: Joi.string().max(255).optional().allow(''),
  messengers: Joi.object({
    max: Joi.string().optional().allow(''),
    telegram: Joi.string().optional().allow(''),
  }).optional(),
  inn: Joi.string().optional().allow(''),
  ogrn: Joi.string().optional().allow(''),
});

export const updateExecutorProfileSchema = Joi.object({
  region: Joi.string().optional(),
  specializations: Joi.array()
    .items(
      Joi.string().valid(
        'WINDOWS',
        'DOORS',
        'CEILINGS',
        'CONDITIONERS',
        'BLINDS',
        'FURNITURE'
      )
    )
    .min(1)
    .max(6)
    .optional()
    .messages({
      'array.min': 'Необходимо выбрать хотя бы одну специализацию',
      'array.max': 'Максимум 6 специализаций',
    }),
  shortDescription: Joi.string().max(500).optional().allow(''),
  fullDescription: Joi.string().max(3000).optional().allow(''),
  isSelfEmployed: Joi.boolean().optional(),
});

