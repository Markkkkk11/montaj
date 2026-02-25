import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import { initializeSocket } from './socket';
import settingsService from './services/settings.service';

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

