# Инструкция по запуску проекта

## Этап 1: Базовая инфраструктура и аутентификация ✅

### Что готово
- ✅ Backend API (Express + PostgreSQL + Prisma)
- ✅ Frontend (Next.js 14 + Tailwind + Shadcn/ui)
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Система регистрации и авторизации
- ✅ SMS-верификация (с заглушкой)
- ✅ Профили пользователей (базовые)
- ✅ Личные кабинеты заказчика и исполнителя

### Установка и запуск

#### 1. Установите зависимости

```bash
# Корневые зависимости
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

#### 2. Запустите Docker с базами данных

```bash
# Из корневой директории
docker-compose up -d

# Проверьте, что контейнеры запущены
docker ps
```

#### 3. Настройте переменные окружения

**Backend:**
```bash
cd backend
cp .env.example .env
# Отредактируйте .env при необходимости
```

Содержимое `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/montaj"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
SMSC_LOGIN="your-smsc-login"
SMSC_PASSWORD="your-smsc-password"
SMSC_ENABLED="false"
NODE_ENV="development"
PORT="3001"
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,http://localhost:3002"
```

**Frontend:**
Frontend использует переменную из `next.config.js`:
```js
NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
```

#### 4. Запустите миграции Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

#### 5. Запустите приложение

**Вариант 1: Запуск всего сразу (из корня):**
```bash
npm run dev
```

**Вариант 2: Запуск по отдельности:**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

#### 6. Откройте приложение

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health check:** http://localhost:3001/health

### Как протестировать

1. **Открой

те главную страницу** http://localhost:3000
   - Увидите landing с кнопками "Войти" и "Регистрация"

2. **Зарегистрируйтесь как Заказчик или Исполнитель:**
   - Перейдите на `/register`
   - Выберите роль
   - Заполните форму
   - SMS-код будет выведен в консоль backend'а (т.к. SMSC_ENABLED=false)
   - Скопируйте код из консоли и введите на странице верификации

3. **Войдите в систему:**
   - Используйте телефон и пароль
   - Вас перенаправит в соответствующий dashboard

4. **Просмотрите профиль:**
   - В dashboard нажмите "Перейти в профиль"
   - Увидите свои данные

### Структура API

#### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/verify-sms` - Проверка SMS-кода
- `POST /api/auth/send-sms` - Отправка/повторная отправка SMS
- `GET /api/auth/me` - Получить текущего пользователя (требует токен)
- `POST /api/auth/logout` - Выход

#### Профили пользователей
- `GET /api/users/profile` - Получить свой профиль
- `PUT /api/users/profile` - Обновить профиль
- `POST /api/users/upload-photo` - Загрузить фото профиля
- `PUT /api/users/executor-profile` - Обновить профиль исполнителя (только для исполнителей)
- `POST /api/users/work-photos` - Добавить фото работы
- `DELETE /api/users/work-photos` - Удалить фото работы
- `GET /api/users/balance` - Получить баланс (только для исполнителей)

### Prisma Studio (просмотр БД)

```bash
cd backend
npx prisma studio
```

Откроется в браузере на http://localhost:5555

### Полезные команды

```bash
# Остановить Docker контейнеры
docker-compose down

# Очистить БД и пересоздать
cd backend
npx prisma migrate reset

# Проверить логи Docker
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Возможные проблемы

1. **Порт 3000 занят:**
   ```bash
   # Убить процесс на порту 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Порт 3001 занят:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

3. **PostgreSQL не запускается:**
   ```bash
   # Проверьте логи
   docker-compose logs postgres
   
   # Пересоздайте контейнер
   docker-compose down
   docker volume rm montaj_postgres_data
   docker-compose up -d
   ```

4. **Prisma ошибки:**
   ```bash
   # Пересгенерируйте клиент
   cd backend
   npx prisma generate
   ```

### Что будет дальше

**Этап 2: Система заказов**
- Создание заказов заказчиками
- Лента заказов
- Карта с Яндекс.Картами
- Фильтры и поиск

**Этап 3: Отклики и тарификация**
- Баланс исполнителей
- Система тарифов (Стандарт, Комфорт, Премиум)
- Отклики на заказы
- Интеграция ЮKassa

**Этап 4: Выполнение работ и отзывы**
- Workflow заказов
- Система отзывов
- Рейтинги

**Этап 5: Админ-панель**
- Модерация пользователей
- Управление заказами
- Аналитика

---

## Заметки разработчика

- В режиме разработки SMS-коды выводятся в консоль backend'а
- Все пароли хэшируются с помощью bcrypt
- JWT токены хранятся в localStorage
- При первой регистрации исполнителя начисляется 1000₽ бонусов и тариф Premium на 30 дней
- Новый исполнитель получает начальный рейтинг 3.0/5.0

