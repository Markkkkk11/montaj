import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // SMSC.ru
  smsc: {
    login: process.env.SMSC_LOGIN || '',
    password: process.env.SMSC_PASSWORD || '',
    enabled: process.env.SMSC_ENABLED === 'true',
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3002',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3002').split(','),
  
  // File uploads
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  
  // Email (SMTP)
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587'),
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'noreply@montaj.ru',
  emailEnabled: process.env.EMAIL_ENABLED === 'true',
  
  // YooKassa
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',
};

