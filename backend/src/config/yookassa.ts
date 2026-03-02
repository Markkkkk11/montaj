import axios from 'axios';
import crypto from 'crypto';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

export class YooKassaClient {
  private shopId: string;
  private secretKey: string;
  private client: any;

  constructor() {
    this.shopId = process.env.YOOKASSA_SHOP_ID || '';
    this.secretKey = process.env.YOOKASSA_SECRET_KEY || '';

    if (!this.shopId || !this.secretKey) {
      console.error('❌ ЮKassa credentials not configured! Payments will not work.');
    }

    // Создаём axios instance с базовой аутентификацией
    this.client = axios.create({
      baseURL: YOOKASSA_API_URL,
      auth: {
        username: this.shopId,
        password: this.secretKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Создать платёж
   */
  async createPayment(data: {
    amount: number;
    currency?: string;
    description: string;
    returnUrl: string;
    metadata?: any;
  }) {
    try {
      const idempotenceKey = crypto.randomUUID();
      const response = await this.client.post('/payments', {
        amount: {
          value: data.amount.toFixed(2),
          currency: data.currency || 'RUB',
        },
        confirmation: {
          type: 'redirect',
          return_url: data.returnUrl,
        },
        capture: true, // Автоматическое списание
        description: data.description,
        metadata: data.metadata,
      }, {
        headers: {
          'Idempotence-Key': idempotenceKey,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('YooKassa API Error:', error.response?.data || error.message);
      throw new Error('Ошибка создания платежа в ЮKassa');
    }
  }

  /**
   * Получить информацию о платеже
   */
  async getPayment(paymentId: string) {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('YooKassa API Error:', error.response?.data || error.message);
      throw new Error('Ошибка получения информации о платеже');
    }
  }

  /**
   * Создать возврат платежа
   */
  async createRefund(paymentId: string, amount: number) {
    try {
      const response = await this.client.post('/refunds', {
        payment_id: paymentId,
        amount: {
          value: amount.toFixed(2),
          currency: 'RUB',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('YooKassa API Error:', error.response?.data || error.message);
      throw new Error('Ошибка создания возврата');
    }
  }
}

export default new YooKassaClient();
