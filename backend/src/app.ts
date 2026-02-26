import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import orderRoutes from './routes/order.routes';
import responseRoutes from './routes/response.routes';
import reviewRoutes from './routes/review.routes';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import webhookRoutes from './routes/webhook.routes';
import adminRoutes from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import geocodingRoutes from './routes/geocoding.routes';
import contactRoutes from './routes/contact.routes';
import settingsController from './controllers/settings.controller';

// Инициализация приложения
const app: Application = express();

// Security middleware (разрешаем кросс-доменные ресурсы для фронтенда)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // Максимум 1000 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже',
});

app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование body ПОСЛЕ парсинга
app.use((req, res, next) => {
  if (req.url === '/api/orders' && req.method === 'POST') {
    console.log('🔍 PARSED BODY (после парсинга):', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Static files (uploads)
app.use('/uploads', express.static(config.uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/geocoding', geocodingRoutes);
app.use('/api/contact', contactRoutes);

// Публичные настройки платформы (без авторизации)
app.get('/api/settings/public', settingsController.getPublic);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Обработка ошибок Multer (файл слишком большой, неверный тип)
app.use(async (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      // Читаем лимит из настроек БД
      try {
        const settingsService = (await import('./services/settings.service')).default;
        const maxFileSizeMB = await settingsService.get('maxFileSize') || '5';
        res.status(400).json({ error: `Файл слишком большой. Максимум ${maxFileSizeMB} МБ.` });
      } catch {
      res.status(400).json({ error: 'Файл слишком большой. Максимум 10 МБ.' });
      }
      return;
    }
    res.status(400).json({ error: `Ошибка загрузки: ${err.message}` });
    return;
  }
  if (err && err.message && err.message.includes('Разрешены только изображения')) {
    res.status(400).json({ error: err.message });
    return;
  }
  next(err);
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;

