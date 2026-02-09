import axios from 'axios';

const YOOKASSA_API_URL = 'https://api.yookassa.ru/v3';

export class YooKassaClient {
  private shopId: string;
  private secretKey: string;
  private client: any;

  constructor() {
    this.shopId = process.env.YOOKASSA_SHOP_ID || '';
    this.secretKey = process.env.YOOKASSA_SECRET_KEY || '';

    if (!this.shopId || !this.secretKey) {
      console.warn('⚠️  ЮKassa credentials not configured. Using mock mode.');
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
    // Mock режим для разработки
    if (!this.shopId || !this.secretKey) {
      return this.createMockPayment(data);
    }

    try {
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
    // Mock режим
    if (!this.shopId || !this.secretKey) {
      return this.getMockPayment(paymentId);
    }

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
    // Mock режим
    if (!this.shopId || !this.secretKey) {
      return this.createMockRefund(paymentId, amount);
    }

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

  /**
   * Mock методы для разработки без реальных ключей
   */
  private createMockPayment(data: any) {
    const mockPaymentId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: mockPaymentId,
      status: 'pending',
      amount: {
        value: data.amount.toFixed(2),
        currency: data.currency || 'RUB',
      },
      confirmation: {
        type: 'redirect',
        confirmation_url: `${data.returnUrl}?payment_id=${mockPaymentId}&mock=true`,
      },
      created_at: new Date().toISOString(),
      description: data.description,
      metadata: data.metadata,
      paid: false,
    };
  }

  private getMockPayment(paymentId: string) {
    return {
      id: paymentId,
      status: 'succeeded',
      amount: {
        value: '1000.00',
        currency: 'RUB',
      },
      created_at: new Date().toISOString(),
      paid: true,
    };
  }

  private createMockRefund(paymentId: string, amount: number) {
    return {
      id: `refund_${Date.now()}`,
      payment_id: paymentId,
      status: 'succeeded',
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      created_at: new Date().toISOString(),
    };
  }
}

export default new YooKassaClient();

