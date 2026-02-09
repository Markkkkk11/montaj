# 📋 Инструкция по запуску Этапа 6: Уведомления

## ✅ Что добавлено

### Backend
- ✅ Модели Notification и NotificationSettings
- ✅ Email сервис с 9 шаблонами
- ✅ NotificationService - управление уведомлениями
- ✅ 7 API endpoints
- ✅ Триггеры в order, response, admin сервисах
- ✅ Тесты уведомлений

### Frontend
- ✅ NotificationBell компонент
- ✅ Страница списка уведомлений
- ✅ Страница настроек уведомлений
- ✅ API клиент для уведомлений

## 🚀 Запуск

### Шаг 1: Установить зависимости

```bash
cd /home/mark/Documents/montaj/backend
npm install nodemailer @types/nodemailer
```

### Шаг 2: Настроить Email (SMTP)

Добавить в `backend/.env`:

```env
# Email настройки
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@montaj.ru
EMAIL_ENABLED=true
FRONTEND_URL=http://localhost:3000
```

**Для Gmail:**
1. Перейти: https://myaccount.google.com/apppasswords
2. Создать App Password
3. Скопировать 16-символьный пароль

**Альтернативы:**
- Yandex: smtp.yandex.ru:465
- Mail.ru: smtp.mail.ru:465
- SendGrid/Mailgun для продакшена

### Шаг 3: Применить миграции

```bash
cd /home/mark/Documents/montaj/backend
npx prisma migrate dev --name add_notifications
npx prisma generate
```

### Шаг 4: Запустить тесты

```bash
cd /home/mark/Documents/montaj

# Все тесты
./test-system.sh

# Только уведомления
cd backend
npm test -- notification.test.ts
```

### Шаг 5: Запустить приложение

```bash
cd /home/mark/Documents/montaj
npm run dev
```

## 🧪 Проверка функционала

### Сценарий 1: In-App уведомления

**Действия:**
1. Войдите на сайт (любой пользователь)
2. Обратите внимание на колокольчик в навигации
3. Создайте заказ (как заказчик)
4. Откликнитесь на заказ (как исполнитель)
5. Проверьте колокольчик заказчика

**Ожидаемый результат:**
- Красный бейдж с цифрой "1"
- При клике переход на /notifications
- Уведомление о новом отклике

### Сценарий 2: Email уведомления

**Действия:**
1. Убедитесь что EMAIL_ENABLED=true
2. Укажите email в профиле
3. Выберите исполнителя для заказа
4. Проверьте почту выбранного исполнителя

**Ожидаемый результат:**
- Email с темой "🎉 Вас выбрали для выполнения заказа"
- Красивый HTML шаблон
- Контакты заказчика
- Кнопка "Перейти к заказу"

### Сценарий 3: Список уведомлений

**Действия:**
1. Перейдите на /notifications
2. Увидите список всех уведомлений
3. Непрочитанные - с синим акцентом слева
4. Кликните на непрочитанное

**Ожидаемый результат:**
- Уведомление становится прочитанным (серым)
- Счётчик на колокольчике уменьшается
- Появляется время прочтения

### Сценарий 4: Настройки уведомлений

**Действия:**
1. Перейдите на /notifications/settings
2. Отключите "Email - Новые заказы"
3. Нажмите "Сохранить изменения"
4. Создайте новый заказ
5. Проверьте почту

**Ожидаемый результат:**
- Email НЕ отправлен (настройка сработала)
- In-App уведомление всё равно создано
- Настройки сохранены в БД

### Сценарий 5: Отметить все прочитанными

**Действия:**
1. Создайте несколько уведомлений (разные действия)
2. Перейдите на /notifications
3. Нажмите "Отметить все"

**Ожидаемый результат:**
- Все уведомления отмечены прочитанными
- Счётчик на колокольчике = 0
- Синие акценты исчезли

### Сценарий 6: Удаление уведомления

**Действия:**
1. В списке уведомлений найдите любое
2. Нажмите иконку корзины справа
3. Подтвердите удаление

**Ожидаемый результат:**
- Уведомление удалено из списка
- Счётчик обновлён
- БД очищена

## 📋 API Endpoints

### Получить уведомления
```bash
curl http://localhost:5000/api/notifications?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Количество непрочитанных
```bash
curl http://localhost:5000/api/notifications/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Отметить как прочитанное
```bash
curl -X PATCH http://localhost:5000/api/notifications/{id}/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Отметить все прочитанными
```bash
curl -X POST http://localhost:5000/api/notifications/mark-all-read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Удалить уведомление
```bash
curl -X DELETE http://localhost:5000/api/notifications/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Получить настройки
```bash
curl http://localhost:5000/api/notifications/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Обновить настройки
```bash
curl -X PUT http://localhost:5000/api/notifications/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": false,
    "smsEnabled": true,
    "inAppEnabled": true
  }'
```

## 🎯 Типы уведомлений

| Тип | Когда | Каналы |
|-----|-------|--------|
| ORDER_NEW | Новый заказ создан | In-App, Email |
| ORDER_RESPONSE | Отклик на заказ | In-App, Email |
| ORDER_SELECTED | Исполнитель выбран | In-App, Email, SMS |
| ORDER_COMPLETED | Заказ завершён | In-App, Email |
| REVIEW_NEW | Новый отзыв | In-App, Email |
| PAYMENT_SUCCESS | Оплата прошла | In-App, Email, SMS |
| USER_APPROVED | Профиль одобрен | In-App, Email |
| BALANCE_LOW | Низкий баланс | In-App, Email |

## 🐛 Возможные проблемы

### Email не отправляются

**Проблема:** EMAIL_ENABLED=false или неверные SMTP настройки

**Решение:**
```bash
# Проверить .env
cat backend/.env | grep EMAIL

# Проверить логи сервера
# Должно быть: "✅ Email transport ready"
```

### Ошибка "Auth failed" при отправке Email

**Проблема:** Неверный пароль или не включен доступ

**Gmail решение:**
1. Включить 2FA: https://myaccount.google.com/security
2. Создать App Password: https://myaccount.google.com/apppasswords
3. Использовать 16-символьный пароль

**Yandex решение:**
- Включить "Доступ по паролю" в настройках почты

### Колокольчик не показывает уведомления

**Проблема:** Не создаются уведомления или ошибка авторизации

**Решение:**
```bash
# Проверить в БД
psql -U postgres -d montaj -c "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5"

# Проверить в браузере
# F12 → Network → API запрос к /notifications/unread-count
```

### Счётчик не обновляется автоматически

**Проблема:** Interval не работает

**Решение:**
- Обновить страницу (F5)
- Interval установлен на 30 секунд
- Для real-time нужен WebSocket (Этап 7)

### Уведомления не сохраняются

**Проблема:** Ошибка в БД или не применены миграции

**Решение:**
```bash
cd backend
npx prisma migrate status
npx prisma migrate dev
```

## 🔧 Настройка SMTP для разных провайдеров

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password-16-chars
```

### Yandex
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=your-email@yandex.ru
SMTP_PASSWORD=your-password
```

### Mail.ru
```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=your-email@mail.ru
SMTP_PASSWORD=your-password
```

### SendGrid (рекомендуется для продакшена)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

## 📊 Структура БД

### Таблица notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR, -- ORDER_NEW, PAYMENT_SUCCESS, etc.
  channel VARCHAR, -- IN_APP, EMAIL, SMS
  title VARCHAR,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
```

### Таблица notification_settings
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  
  email_enabled BOOLEAN DEFAULT true,
  email_order_new BOOLEAN DEFAULT true,
  email_order_response BOOLEAN DEFAULT true,
  email_order_selected BOOLEAN DEFAULT true,
  email_order_completed BOOLEAN DEFAULT true,
  email_review_new BOOLEAN DEFAULT true,
  email_payment_success BOOLEAN DEFAULT true,
  
  sms_enabled BOOLEAN DEFAULT true,
  sms_order_selected BOOLEAN DEFAULT true,
  sms_order_completed BOOLEAN DEFAULT false,
  sms_payment_success BOOLEAN DEFAULT true,
  
  in_app_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Кастомизация шаблонов Email

Шаблоны находятся в `backend/src/services/email.service.ts`

**Пример изменения:**

```typescript
async sendNewOrderEmail(to: string, orderTitle: string, orderLink: string) {
  const html = `
    <div style="font-family: Arial; max-width: 600px;">
      <h2>🆕 Новый заказ!</h2>
      <p>${orderTitle}</p>
      <a href="${orderLink}">Посмотреть заказ</a>
    </div>
  `;
  
  return this.sendEmail({
    to,
    subject: 'Новый заказ - Montaj',
    html,
  });
}
```

## 💡 Полезные команды

```bash
# Просмотр всех уведомлений
psql -U postgres -d montaj -c "SELECT id, type, title, read, created_at FROM notifications ORDER BY created_at DESC LIMIT 20"

# Удалить все уведомления (для тестирования)
psql -U postgres -d montaj -c "DELETE FROM notifications"

# Проверить настройки пользователя
psql -U postgres -d montaj -c "SELECT * FROM notification_settings WHERE user_id='USER_ID'"

# Создать тестовое уведомление (SQL)
psql -U postgres -d montaj -c "INSERT INTO notifications (id, user_id, type, channel, title, message, sent, sent_at) VALUES (gen_random_uuid(), 'USER_ID', 'SYSTEM', 'IN_APP', 'Test', 'Test message', true, NOW())"

# Отправить тестовый Email (через node)
cd backend
node -e "
const service = require('./dist/services/email.service').default;
service.sendEmail({
  to: 'your-email@gmail.com',
  subject: 'Test',
  html: '<h1>Test Email</h1>'
});
"
```

## 🎯 Следующие шаги

После проверки работы системы уведомлений:

1. ✅ Протестируйте все каналы (In-App, Email, SMS)
2. ✅ Проверьте настройки для каждого типа
3. ✅ Убедитесь что триггеры работают
4. ✅ Настройте продакшн SMTP (SendGrid/Mailgun)

**Готово к Этапу 7: Деплой и оптимизация!** 🚀

---

## 📚 Дополнительная информация

**Email шаблоны:** 9 готовых HTML шаблонов
**API endpoints:** 7 endpoints
**Тестов:** 20+ unit тестов
**Поддержка:** In-App, Email, SMS (SMSC.ru)
**Персонализация:** Полная настройка для каждого пользователя
