'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings as NotifSettings,
} from '@/lib/api/notifications';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const [settings, setSettings] = useState<NotifSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) {
      router.push('/login');
      return;
    }

    loadSettings();
  }, [user, isHydrated]);

  const loadSettings = async () => {
    try {
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field: keyof NotifSettings) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [field]: !settings[field],
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await updateNotificationSettings(settings);
      alert('Настройки сохранены');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8">Загрузка...</div>;
  }

  if (!settings) {
    return <div className="container mx-auto py-8">Ошибка загрузки настроек</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Настройки уведомлений</h1>
        <p className="text-gray-600 mt-2">
          Управляйте способами получения уведомлений
        </p>
      </div>

      <div className="space-y-6">
        {/* Email уведомления */}
        <Card>
          <CardHeader>
            <CardTitle>Email уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Включить Email</p>
                <p className="text-sm text-gray-600">
                  Получать все уведомления по электронной почте
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={() => handleToggle('emailEnabled')}
                className="w-5 h-5"
              />
            </div>

            {settings.emailEnabled && (
              <>
                <hr />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Новые заказы</p>
                    <input
                      type="checkbox"
                      checked={settings.emailOrderNew}
                      onChange={() => handleToggle('emailOrderNew')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Отклики на заказы</p>
                    <input
                      type="checkbox"
                      checked={settings.emailOrderResponse}
                      onChange={() => handleToggle('emailOrderResponse')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Выбор исполнителя</p>
                    <input
                      type="checkbox"
                      checked={settings.emailOrderSelected}
                      onChange={() => handleToggle('emailOrderSelected')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Завершение заказа</p>
                    <input
                      type="checkbox"
                      checked={settings.emailOrderCompleted}
                      onChange={() => handleToggle('emailOrderCompleted')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Новые отзывы</p>
                    <input
                      type="checkbox"
                      checked={settings.emailReviewNew}
                      onChange={() => handleToggle('emailReviewNew')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Успешные платежи</p>
                    <input
                      type="checkbox"
                      checked={settings.emailPaymentSuccess}
                      onChange={() => handleToggle('emailPaymentSuccess')}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* SMS уведомления */}
        <Card>
          <CardHeader>
            <CardTitle>SMS уведомления</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Включить SMS</p>
                <p className="text-sm text-gray-600">
                  Получать важные уведомления по SMS
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.smsEnabled}
                onChange={() => handleToggle('smsEnabled')}
                className="w-5 h-5"
              />
            </div>

            {settings.smsEnabled && (
              <>
                <hr />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Выбор исполнителя</p>
                    <input
                      type="checkbox"
                      checked={settings.smsOrderSelected}
                      onChange={() => handleToggle('smsOrderSelected')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Завершение заказа</p>
                    <input
                      type="checkbox"
                      checked={settings.smsOrderCompleted}
                      onChange={() => handleToggle('smsOrderCompleted')}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Успешные платежи</p>
                    <input
                      type="checkbox"
                      checked={settings.smsPaymentSuccess}
                      onChange={() => handleToggle('smsPaymentSuccess')}
                      className="w-4 h-4"
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* In-App уведомления */}
        <Card>
          <CardHeader>
            <CardTitle>Уведомления в приложении</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Включить</p>
                <p className="text-sm text-gray-600">
                  Показывать уведомления внутри платформы
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.inAppEnabled}
                onChange={() => handleToggle('inAppEnabled')}
                className="w-5 h-5"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex gap-4">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

