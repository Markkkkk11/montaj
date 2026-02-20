import nodemailer from 'nodemailer';
import { config } from './env';

// Создание транспорта для отправки email
const transporter = nodemailer.createTransport({
  host: config.smtpHost || 'smtp.yandex.ru',
  port: config.smtpPort || 465,
  secure: config.smtpPort === 465 || !config.smtpPort, // true для 465 (SSL)
  auth: {
    user: config.smtpUser,
    pass: config.smtpPassword,
  },
});

// Проверка подключения (опционально)
if (config.nodeEnv !== 'test') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transport error:', error);
    } else {
      console.log('✅ Email transport ready');
    }
  });
}

export default transporter;

