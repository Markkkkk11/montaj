/**
 * Интеграционные тесты API
 * Тестирует основные сценарии работы с API
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const testPhone = `+7999${Math.floor(Math.random() * 10000000)}`;
const testPassword = 'test123456';

describe('API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let smsCode: string;

  // Тест 1: Health check
  test('Health check should return OK', async () => {
    const response = await axios.get('http://localhost:3001/health');
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('ok');
  });

  // Тест 2: Регистрация заказчика
  test('Register customer', async () => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      role: 'CUSTOMER',
      phone: testPhone,
      password: testPassword,
      fullName: 'Тестовый Заказчик',
      city: 'Москва',
      agreeToTerms: true,
      agreeToPrivacy: true,
    });

    expect(response.status).toBe(201);
    expect(response.data.requiresVerification).toBe(true);
    expect(response.data.user).toHaveProperty('id');
    userId = response.data.user.id;
  });

  // Тест 3: Попытка повторной регистрации с тем же телефоном
  test('Duplicate registration should fail', async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, {
        role: 'CUSTOMER',
        phone: testPhone,
        password: testPassword,
        fullName: 'Другой пользователь',
        city: 'Москва',
        agreeToTerms: true,
        agreeToPrivacy: true,
      });
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });

  // Тест 4: Логин без верификации должен вернуть ошибку
  test('Login without verification should fail', async () => {
    try {
      await axios.post(`${API_URL}/auth/login`, {
        phone: testPhone,
        password: testPassword,
      });
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.response.status).toBe(401);
      expect(error.response.data.error).toContain('не подтверждён');
    }
  });

  // Тест 5: Верификация с неверным кодом
  test('Verify with wrong code should fail', async () => {
    try {
      await axios.post(`${API_URL}/auth/verify-sms`, {
        phone: testPhone,
        code: '000000',
      });
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });

  // Тест 6: Успешный логин после верификации (требует ручной верификации в БД)
  test('Login after verification', async () => {
    // Пропускаем этот тест, т.к. требуется ручная верификация
    // В реальности нужно взять код из консоли и верифицировать
    console.log('⚠ Пропущен тест логина - требуется ручная верификация SMS');
  });

  // Тест 7: Получение профиля без токена
  test('Get profile without token should fail', async () => {
    try {
      await axios.get(`${API_URL}/users/profile`);
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }
  });

  // Тест 8: Валидация - короткий пароль
  test('Short password should fail', async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, {
        role: 'CUSTOMER',
        phone: '+79991234567',
        password: '12345',
        fullName: 'Test',
        city: 'Москва',
        agreeToTerms: true,
        agreeToPrivacy: true,
      });
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });

  // Тест 9: Валидация - отсутствие согласия с условиями
  test('Registration without agreeing to terms should fail', async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, {
        role: 'CUSTOMER',
        phone: '+79991234568',
        password: 'test123456',
        fullName: 'Test',
        city: 'Москва',
        agreeToTerms: false,
      });
      fail('Should have thrown error');
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  });
});

console.log(`
📝 Тестовый телефон: ${testPhone}
🔑 Тестовый пароль: ${testPassword}

Для полного тестирования:
1. Запустите тесты: npm test
2. Найдите SMS-код в консоли backend
3. Используйте testPhone и код для верификации
`);

