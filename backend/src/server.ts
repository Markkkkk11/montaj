import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { initializeSocket } from './socket';
import settingsService from './services/settings.service';
import orderService from './services/order.service';

const PORT = config.port;

// Создаём HTTP сервер
const httpServer = createServer(app);

// Инициализируем Socket.io
const io = initializeSocket(httpServer);

// Сохраняем io в app для доступа из контроллеров
app.set('io', io);

// Запуск сервера
httpServer.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🌍 CORS origins: ${config.corsOrigins.join(', ')}`);
  console.log(`💬 Socket.io initialized`);

  // Инициализируем дефолтные настройки платформы
  try {
    await settingsService.seedDefaults();
  } catch (e) {
    console.error('⚠️  Не удалось инициализировать настройки:', e);
  }

  // Планировщик автоматических задач (каждый час)
  setInterval(async () => {
    try {
      const closedCount = await orderService.autoCloseExpiredOrders();
      if (closedCount > 0) {
        console.log(`🕐 Автозакрытие: ${closedCount} заказов без откликов (72ч)`);
      }

      const returnedCount = await orderService.autoReturnStaleOrders();
      if (returnedCount > 0) {
        console.log(`🕐 Автовозврат: ${returnedCount} заказов (исполнитель не приступил 48ч)`);
      }
    } catch (err) {
      console.error('❌ Ошибка планировщика:', err);
    }
  }, 60 * 60 * 1000); // Каждый час

  console.log('⏰ Планировщик задач запущен (интервал: 1 час)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export { httpServer, io };

