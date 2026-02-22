'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import {
  getNotificationSettings,
  updateNotificationSettings,
  NotificationSettings as NotifSettings,
} from '@/lib/api/notifications';
import { Save, Mail, MessageSquare, Bell } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 ${
        checked ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5.5 left-0.5' : 'translate-x-0 left-0.5'
      }`} style={{ transform: checked ? 'translateX(22px)' : 'translateX(0)' }} />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotifSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }
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
    setSettings({ ...settings, [field]: !settings[field] });
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await updateNotificationSettings(settings);
      toast({ variant: 'success', title: '✅ Настройки сохранены!' });
    } catch (error) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: 'Не удалось сохранить настройки' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack />
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 skeleton rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header showBack />
        <div className="container mx-auto py-16 text-center">
          <p className="text-red-600 font-semibold">Ошибка загрузки настроек</p>
        </div>
      </div>
    );
  }

  const SettingRow = ({ label, description, checked, onToggle }: { label: string; description?: string; checked: boolean; onToggle: () => void }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onToggle} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-8 max-w-3xl page-enter">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Настройки уведомлений</h1>
          <p className="text-muted-foreground">Управляйте способами получения уведомлений</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5" /> Email уведомления</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingRow label="Включить Email" description="Получать уведомления по электронной почте" checked={settings.emailEnabled} onToggle={() => handleToggle('emailEnabled')} />
              {settings.emailEnabled && (
                <>
                  <div className="border-t my-2" />
                  <SettingRow label="Новые заказы" checked={settings.emailOrderNew} onToggle={() => handleToggle('emailOrderNew')} />
                  <SettingRow label="Отклики на заказы" checked={settings.emailOrderResponse} onToggle={() => handleToggle('emailOrderResponse')} />
                  <SettingRow label="Выбор исполнителя" checked={settings.emailOrderSelected} onToggle={() => handleToggle('emailOrderSelected')} />
                  <SettingRow label="Завершение заказа" checked={settings.emailOrderCompleted} onToggle={() => handleToggle('emailOrderCompleted')} />
                  <SettingRow label="Новые отзывы" checked={settings.emailReviewNew} onToggle={() => handleToggle('emailReviewNew')} />
                  <SettingRow label="Успешные платежи" checked={settings.emailPaymentSuccess} onToggle={() => handleToggle('emailPaymentSuccess')} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5" /> SMS уведомления</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <SettingRow label="Включить SMS" description="Получать важные уведомления по SMS" checked={settings.smsEnabled} onToggle={() => handleToggle('smsEnabled')} />
              {settings.smsEnabled && (
                <>
                  <div className="border-t my-2" />
                  <SettingRow label="Выбор исполнителя" checked={settings.smsOrderSelected} onToggle={() => handleToggle('smsOrderSelected')} />
                  <SettingRow label="Завершение заказа" checked={settings.smsOrderCompleted} onToggle={() => handleToggle('smsOrderCompleted')} />
                  <SettingRow label="Успешные платежи" checked={settings.smsPaymentSuccess} onToggle={() => handleToggle('smsPaymentSuccess')} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" /> Уведомления в приложении</CardTitle>
            </CardHeader>
            <CardContent>
              <SettingRow label="Включить" description="Показывать уведомления внутри платформы" checked={settings.inAppEnabled} onToggle={() => handleToggle('inAppEnabled')} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
            <Save className="h-4 w-4" /> {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Отмена</Button>
        </div>
      </main>
    </div>
  );
}
