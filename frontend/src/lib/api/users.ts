import api from '../api';

export interface Balance {
  id: string;
  userId: string;
  amount: string;
  bonusAmount: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Получить баланс пользователя
 */
export async function getBalance(): Promise<Balance> {
  const { data } = await api.get('/users/balance');
  return data.balance;
}

/**
 * Получить профиль пользователя
 */
export async function getUserProfile(userId: string): Promise<any> {
  const { data } = await api.get(`/users/${userId}`);
  return data.user;
}

/**
 * Обновить профиль пользователя
 */
export async function updateUserProfile(updates: any): Promise<any> {
  const { data } = await api.put('/users/profile', updates);
  return data.user;
}

