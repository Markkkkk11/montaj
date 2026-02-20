import { Router, Request, Response } from 'express';
import emailService from '../services/email.service';
import Joi from 'joi';

const router = Router();

const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'ФИО должно содержать минимум 2 символа',
    'any.required': 'ФИО обязательно',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Введите корректный email',
    'any.required': 'Email обязателен',
  }),
  phone: Joi.string().min(5).max(20).required().messages({
    'string.min': 'Введите корректный номер телефона',
    'any.required': 'Телефон обязателен',
  }),
  topic: Joi.string()
    .valid('site_questions', 'cooperation', 'commercial')
    .required()
    .messages({
      'any.only': 'Выберите тему обращения',
      'any.required': 'Тема обязательна',
    }),
  message: Joi.string().min(10).max(5000).required().messages({
    'string.min': 'Сообщение должно содержать минимум 10 символов',
    'any.required': 'Сообщение обязательно',
  }),
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { name, email, phone, topic, message } = value;

    const sent = await emailService.sendContactForm(name, email, phone, topic, message);

    if (sent) {
      res.json({ message: 'Сообщение успешно отправлено!' });
    } else {
      // Even if email fails, we acknowledge receipt
      console.error('Contact form email failed but accepting request');
      res.json({ message: 'Сообщение принято. Мы свяжемся с вами!' });
    }
  } catch (err: any) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

export default router;

