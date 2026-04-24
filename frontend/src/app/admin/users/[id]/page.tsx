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
import { getTariffInfo, TariffInfo } from '@/lib/api/subscriptions';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

export default function AdminUserEditPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tariffLimits, setTariffLimits] = useState<Record<string, TariffInfo>>({});

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
  const [initialTariffType, setInitialTariffType] = useState('');
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] = useState('');
  const [initialSubscriptionExpiresAt, setInitialSubscriptionExpiresAt] = useState('');

  const formatDateForInput = (value?: string | null) => {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  useEffect(() => {
    loadTariffLimits();
  }, []);

  useEffect(() => {
    const limit = tariffLimits[tariffType]?.specializationCount;
    if (typeof limit === 'number') {
      setSpecializationCount(limit.toString());
    }
  }, [tariffType, tariffLimits]);

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
      setInitialTariffType(data.subscription?.tariffType || 'STANDARD');
      setSpecializationCount(data.subscription?.specializationCount?.toString() || '1');
      const expiryDate = formatDateForInput(data.subscription?.expiresAt);
      setSubscriptionExpiresAt(expiryDate);
      setInitialSubscriptionExpiresAt(expiryDate);
    } catch (error) {
      console.error('Failed to load user:', error);
      alert('Ошибка загрузки пользователя');
    } finally {
      setLoading(false);
    }
  };

  const loadTariffLimits = async () => {
    try {
      const data = await getTariffInfo();
      setTariffLimits(data);
    } catch (error) {
      console.error('Failed to load tariff limits:', error);
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

        const shouldUpdateSubscription =
          tariffType !== initialTariffType ||
          (tariffType === 'PREMIUM' && subscriptionExpiresAt !== initialSubscriptionExpiresAt);

        if (shouldUpdateSubscription) {
          await adminApi.updateUserSubscription(userId, {
            tariffType,
            expiresAt: tariffType === 'PREMIUM' ? subscriptionExpiresAt || undefined : undefined,
          });
        }
      }

      alert('Пользователь обновлен');
      router.push('/admin/users');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const shouldShowExpiryField =
    tariffType === 'PREMIUM';
  const premiumDurationDays = tariffLimits.PREMIUM?.duration ?? 30;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('ru-RU');
  };

  const displayValue = (value?: string | number | boolean | null) => {
    if (value === true) return 'Да';
    if (value === false) return 'Нет';
    if (value === 0) return '0';
    return value || '—';
  };

  const getFileUrl = (file: string) => (
    file.startsWith('/') ? `${API_URL}${file}` : file
  );

  useEffect(() => {
    if (tariffType !== 'PREMIUM') {
      return;
    }

    if (subscriptionExpiresAt) {
      return;
    }

    const fallbackDate = new Date(Date.now() + premiumDurationDays * 24 * 60 * 60 * 1000);
    const year = fallbackDate.getFullYear();
    const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const day = String(fallbackDate.getDate()).padStart(2, '0');
    setSubscriptionExpiresAt(`${year}-${month}-${day}`);
  }, [premiumDurationDays, subscriptionExpiresAt, tariffType]);

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
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Полный профиль</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Контакты</h3>
                <p><span className="text-muted-foreground">Телефон:</span> {displayValue(user.phone)}</p>
                <p><span className="text-muted-foreground">Email:</span> {displayValue(user.email)}</p>
                <p><span className="text-muted-foreground">Город:</span> {displayValue(user.city)}</p>
                <p><span className="text-muted-foreground">Адрес:</span> {displayValue(user.address)}</p>
                <p><span className="text-muted-foreground">MAX:</span> {displayValue(user.messengers?.max)}</p>
                <p><span className="text-muted-foreground">Телефон подтверждён:</span> {displayValue(user.isPhoneVerified)}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Организация</h3>
                <p><span className="text-muted-foreground">Название:</span> {displayValue(user.organization)}</p>
                <p><span className="text-muted-foreground">ИНН:</span> {displayValue(user.inn)}</p>
                <p><span className="text-muted-foreground">ОГРН:</span> {displayValue(user.ogrn)}</p>
                <p><span className="text-muted-foreground">Сайт:</span> {displayValue(user.website)}</p>
                <p><span className="text-muted-foreground">Роль:</span> {user.role === 'EXECUTOR' ? 'Исполнитель' : user.role === 'CUSTOMER' ? 'Заказчик' : 'Админ'}</p>
                <p><span className="text-muted-foreground">ID:</span> <span className="font-mono text-xs">{user.id}</span></p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">Активность</h3>
                <p><span className="text-muted-foreground">Рейтинг:</span> {Number(user.rating || 0).toFixed(1)}</p>
                <p><span className="text-muted-foreground">Завершённых заказов:</span> {displayValue(user.completedOrders)}</p>
                <p><span className="text-muted-foreground">Создано заявок:</span> {displayValue(user._count?.createdOrders)}</p>
                <p><span className="text-muted-foreground">Назначено заявок:</span> {displayValue(user._count?.assignedOrders)}</p>
                <p><span className="text-muted-foreground">Откликов:</span> {displayValue(user._count?.responses)}</p>
                <p><span className="text-muted-foreground">Регистрация:</span> {formatDateTime(user.createdAt)}</p>
                <p><span className="text-muted-foreground">Обновлён:</span> {formatDateTime(user.updatedAt)}</p>
              </div>
            </div>

            {user.about && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">О себе / компании</h3>
                <p className="whitespace-pre-line text-sm">{user.about}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {user.role === 'EXECUTOR' && user.executorProfile && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Полный профиль исполнителя</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1">Регион работы</p>
                  <p className="font-medium">{displayValue(user.executorProfile.region)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Самозанятый</p>
                  <p className="font-medium">{displayValue(user.executorProfile.isSelfEmployed)}</p>
                </div>
              </div>

              {user.executorProfile.specializations?.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">Специализации</p>
                  <div className="flex flex-wrap gap-2">
                    {user.executorProfile.specializations.map((spec: string) => (
                      <span key={spec} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {SPECIALIZATION_LABELS[spec] || spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.executorProfile.shortDescription && (
                <div>
                  <p className="text-muted-foreground mb-1">Краткое описание</p>
                  <p className="whitespace-pre-line">{user.executorProfile.shortDescription}</p>
                </div>
              )}

              {user.executorProfile.fullDescription && (
                <div>
                  <p className="text-muted-foreground mb-1">Подробное описание</p>
                  <p className="whitespace-pre-line">{user.executorProfile.fullDescription}</p>
                </div>
              )}

              {user.executorProfile.workPhotos?.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2">Фото работ ({user.executorProfile.workPhotos.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {user.executorProfile.workPhotos.map((photo: string, index: number) => {
                      const photoUrl = getFileUrl(photo);
                      return (
                        <a key={`${photo}-${index}`} href={photoUrl} target="_blank" rel="noopener noreferrer" className="aspect-square overflow-hidden rounded-lg border bg-gray-50">
                          <img src={photoUrl} alt={`Фото работы ${index + 1}`} className="h-full w-full object-cover hover:scale-105 transition-transform" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
                    disabled
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Лимит определяется автоматически по выбранному тарифу.
                  </p>
                </div>

                {shouldShowExpiryField && (
                  <div>
                    <Label>{tariffType === initialTariffType ? 'Действует до' : 'Будет действовать до'}</Label>
                    <Input
                      type="date"
                      value={subscriptionExpiresAt}
                      onChange={(e) => setSubscriptionExpiresAt(e.target.value)}
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
