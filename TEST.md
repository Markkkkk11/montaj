# Тестирование системы

## Быстрая проверка работоспособности

### Вариант 1: Автоматический скрипт (рекомендуется)

```bash
./test-system.sh
```

Этот скрипт проверит:
- ✅ Запущены ли Docker контейнеры (PostgreSQL, Redis)
- ✅ Открыты ли нужные порты
- ✅ Работает ли API и база данных

### Вариант 2: Только health check

```bash
cd backend
npm run test:health
```

Проверяет подключение к PostgreSQL, Redis, API и моделям Prisma.

### Вариант 3: Полные интеграционные тесты

```bash
# Убедитесь, что API запущен (npm run dev в backend)
cd backend
npm test
```

## Что проверяется

### Health Check (`npm run test:health`)
1. **PostgreSQL** - подключение к базе данных
2. **Redis** - подключение к кэшу
3. **Prisma Models** - работа моделей БД
4. **API Server** - доступность сервера на порту 3001

### Интеграционные тесты (`npm test`)
1. **Health endpoint** - `/health` возвращает OK
2. **Регистрация** - создание нового пользователя
3. **Валидация** - проверка обязательных полей
4. **Дубликаты** - запрет повторной регистрации
5. **SMS-верификация** - проверка кода
6. **Авторизация** - JWT токены
7. **Защита маршрутов** - доступ без токена запрещён

## Ручное тестирование через Postman/curl

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Ожидаемый ответ:
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T..."
}
```

### 2. Регистрация
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "role": "CUSTOMER",
    "phone": "+79991234567",
    "password": "test123456",
    "fullName": "Иван Иванов",
    "city": "Москва",
    "agreeToTerms": true
  }'
```

SMS-код будет в консоли backend (если SMSC_ENABLED=false)

### 3. Верификация SMS
```bash
curl -X POST http://localhost:3001/api/auth/verify-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "code": "123456"
  }'
```

### 4. Логин
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+79991234567",
    "password": "test123456"
  }'
```

Сохраните токен из ответа.

### 5. Получение профиля (с токеном)
```bash
curl http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Проверка после перезапуска

После каждого перезапуска системы выполните:

```bash
# 1. Запустите Docker контейнеры
docker-compose up -d

# 2. Подождите 5 секунд для инициализации
sleep 5

# 3. Запустите проверку
./test-system.sh
```

Если все тесты прошли успешно - система работает корректно! ✅

## Частые проблемы

### PostgreSQL не доступна
```bash
docker-compose up -d postgres
docker-compose logs postgres
```

### Redis не доступен
```bash
docker-compose up -d redis
docker-compose logs redis
```

### Prisma ошибки
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### API не запускается
```bash
cd backend
rm -rf node_modules
npm install
npm run dev
```

## Мониторинг в реальном времени

### Логи PostgreSQL
```bash
docker-compose logs -f postgres
```

### Логи Redis
```bash
docker-compose logs -f redis
```

### Prisma Studio (GUI для БД)
```bash
cd backend
npx prisma studio
# Откроется на http://localhost:5555
```

## Автоматизация

Добавьте в `.bashrc` или `.zshrc` для быстрого доступа:

```bash
alias montaj-test="cd /path/to/montaj && ./test-system.sh"
alias montaj-start="cd /path/to/montaj && docker-compose up -d && npm run dev"
```

Тогда можно запускать просто:
```bash
montaj-test
```

