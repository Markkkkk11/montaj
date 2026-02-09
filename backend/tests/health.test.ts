/**
 * Быстрый тест работоспособности системы
 * Запуск: npm run test:health
 */

import prisma from '../src/config/database';
import redis from '../src/config/redis';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

async function testDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`${colors.green}✓${colors.reset} PostgreSQL подключена`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} PostgreSQL недоступна:`, error);
    return false;
  }
}

async function testRedis() {
  try {
    await redis.ping();
    console.log(`${colors.green}✓${colors.reset} Redis подключен`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Redis недоступен:`, error);
    return false;
  }
}

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log(`${colors.green}✓${colors.reset} API сервер работает`);
      return true;
    } else {
      console.log(`${colors.red}✗${colors.reset} API вернул ошибку: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠${colors.reset} API сервер не запущен (запустите: npm run dev)`);
    return false;
  }
}

async function testModels() {
  try {
    const userCount = await prisma.user.count();
    console.log(`${colors.green}✓${colors.reset} Модели Prisma работают (пользователей: ${userCount})`);
    return true;
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Ошибка моделей Prisma:`, error);
    return false;
  }
}

async function runHealthCheck() {
  console.log('\n🏥 Проверка работоспособности системы...\n');

  const results = {
    database: await testDatabase(),
    redis: await testRedis(),
    models: await testModels(),
    api: await testAPI(),
  };

  console.log('\n📊 Результаты:');
  const allPassed = Object.values(results).every((r) => r);

  if (allPassed) {
    console.log(`${colors.green}✓ Все системы работают!${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}⚠ Некоторые системы недоступны${colors.reset}\n`);
    
    if (!results.database) {
      console.log('  → Запустите: docker-compose up -d postgres');
    }
    if (!results.redis) {
      console.log('  → Запустите: docker-compose up -d redis');
    }
    if (!results.models) {
      console.log('  → Запустите миграции: cd backend && npx prisma migrate dev');
    }
    if (!results.api) {
      console.log('  → Запустите API: cd backend && npm run dev');
    }
    console.log('');
  }

  await prisma.$disconnect();
  await redis.quit();

  process.exit(allPassed ? 0 : 1);
}

runHealthCheck();

