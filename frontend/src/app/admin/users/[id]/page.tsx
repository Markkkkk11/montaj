'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminApi } from '@/lib/api/admin';
import { ArrowLeft } from 'lucide-react';

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [rating, setRating] = useState('');
  const [balance, setBalance] = useState('');
  const [bonusBalance, setBonusBalance] = useState('');
  const [tariffType, setTariffType] = useState('');
  const [specializationCount, setSpecializationCount] = useState('');

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUser(userId);
      setUser(data);
      
      // Populate form
      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setCity(data.city || '');
      setStatus(data.status || 'ACTIVE');
      setRating(data.rating?.toString() || '0');
      setBalance(data.balance?.amount?.toString() || '0');
      setBonusBalance(data.balance?.bonusAmount?.toString() || '0');
      setTariffType(data.subscription?.tariffType || 'STANDARD');
      setSpecializationCount(data.subscription?.specializationCount?.toString() || '1');
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('Ошибка загрузки пользователя');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update user info
      await adminApi.updateUser(userId, {
        fullName,
        email,
        city,
        status,
        rating: parseFloat(rating),
      });

      // Update balance if executor
      if (user.role === 'EXECUTOR') {
        await adminApi.updateUserBalance(
          userId,
          parseFloat(balance),
          parseFloat(bonusBalance)
        );

        // Update subscription
        await adminApi.updateUserSubscription(userId, {
          tariffType,
          specializationCount: parseInt(specializationCount),
        });
      }

      alert('Пользователь обновлен');
      router.push('/admin/users');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <p>Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Назад
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Редактирование пользователя</h1>
        <p className="text-muted-foreground mt-2">
          {user.phone} • {user.role === 'EXECUTOR' ? 'Исполнитель' : 'Заказчик'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>ФИО</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Город</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Активен</SelectItem>
                  <SelectItem value="PENDING">На модерации</SelectItem>
                  <SelectItem value="BLOCKED">Заблокирован</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.role === 'EXECUTOR' && (
              <div>
                <Label>Рейтинг</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Executor Specific */}
        {user.role === 'EXECUTOR' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Баланс</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Основной баланс (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Бонусный баланс (₽)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bonusBalance}
                    onChange={(e) => setBonusBalance(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Подписка</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Тариф</Label>
                  <Select value={tariffType} onValueChange={setTariffType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Стандарт</SelectItem>
                      <SelectItem value="COMFORT">Комфорт</SelectItem>
                      <SelectItem value="PREMIUM">Премиум</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Количество специализаций</Label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={specializationCount}
                    onChange={(e) => setSpecializationCount(e.target.value)}
                  />
                </div>

                {user.subscription?.expiresAt && (
                  <div>
                    <Label>Действует до</Label>
                    <Input
                      value={new Date(user.subscription.expiresAt).toLocaleDateString('ru-RU')}
                      disabled
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

