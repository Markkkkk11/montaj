'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Settings, Shield, CreditCard, Mail, Database, Save, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);

  const [platformSettings, setPlatformSettings] = useState({
    platformName: 'SVMontaj',
    supportEmail: 'support@svmontaj.ru',
    supportPhone: '+7 (800) 123-45-67',
    maxFileSize: '5',
    maxWorkPhotos: '8',
    defaultRegion: 'Москва и обл.',
  });

  const [moderationSettings, setModerationSettings] = useState({
    autoApproveUsers: 'false',
    autoApproveReviews: 'false',
    autoApproveOrders: 'true',
    minReviewLength: '10',
  });

  const [tariffSettings, setTariffSettings] = useState({
    standardPrice: '0',
    premiumPrice: '990',
    premiumSpecializations: '3',
    standardSpecializations: '1',
    trialDays: '7',
  });

  const [emailSettings, setEmailSettings] = useState({
    emailEnabled: 'true',
    smtpHost: 'smtp.yandex.ru',
    smtpPort: '465',
    emailFrom: 'SVMontaj24@mail.ru',
  });

  // Загрузка настроек с сервера
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');

        if (res.data.success) {
          const s = res.data.settings;

          if (s.general) {
            setPlatformSettings((prev) => ({ ...prev, ...s.general }));
          }
          if (s.moderation) {
            setModerationSettings((prev) => ({ ...prev, ...s.moderation }));
          }
          if (s.tariffs) {
            setTariffSettings((prev) => ({ ...prev, ...s.tariffs }));
          }
          if (s.email) {
            setEmailSettings((prev) => ({ ...prev, ...s.email }));
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки настроек:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchSettings();
  }, [token]);

  const handleSave = async (section: string, data: Record<string, string>) => {
    setSavingSection(section);
    setSavedSection(null);
    try {
      await api.put(`/admin/settings/${section}`, data);
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 2000);
    } catch (err: any) {
      alert(`Ошибка сохранения: ${err.response?.data?.error || err.message}`);
    } finally {
      setSavingSection(null);
    }
  };

  const SaveButton = ({ section, data }: { section: string; data: Record<string, string> }) => (
    <Button
      onClick={() => handleSave(section, data)}
      disabled={savingSection === section}
    >
      {savingSection === section ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : savedSection === section ? (
        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
      ) : (
        <Save className="h-4 w-4 mr-2" />
      )}
      {savedSection === section ? 'Сохранено ✓' : 'Сохранить'}
    </Button>
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Загрузка настроек...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-2">
          Управление параметрами платформы
        </p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Основные настройки */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Основные настройки</CardTitle>
                <CardDescription>Название, контакты, лимиты</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="platformName">Название платформы</Label>
                <Input
                  id="platformName"
                  value={platformSettings.platformName}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, platformName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="defaultRegion">Регион по умолчанию</Label>
                <Input
                  id="defaultRegion"
                  value={platformSettings.defaultRegion}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, defaultRegion: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="supportEmail">Email поддержки</Label>
                <Input
                  id="supportEmail"
                  type="email"
                  value={platformSettings.supportEmail}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="supportPhone">Телефон поддержки</Label>
                <Input
                  id="supportPhone"
                  value={platformSettings.supportPhone}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxFileSize">Макс. размер файла (МБ)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={platformSettings.maxFileSize}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, maxFileSize: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxWorkPhotos">Макс. фото работ</Label>
                <Input
                  id="maxWorkPhotos"
                  type="number"
                  value={platformSettings.maxWorkPhotos}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, maxWorkPhotos: e.target.value })
                  }
                />
              </div>
            </div>
            <SaveButton section="general" data={platformSettings} />
          </CardContent>
        </Card>

        {/* Модерация */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle>Модерация</CardTitle>
                <CardDescription>Правила автоматической и ручной модерации</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Автоодобрение пользователей</Label>
                <Select
                  value={moderationSettings.autoApproveUsers}
                  onValueChange={(val) =>
                    setModerationSettings({ ...moderationSettings, autoApproveUsers: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Включено</SelectItem>
                    <SelectItem value="false">Выключено (ручная проверка)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Автоодобрение отзывов</Label>
                <Select
                  value={moderationSettings.autoApproveReviews}
                  onValueChange={(val) =>
                    setModerationSettings({ ...moderationSettings, autoApproveReviews: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Включено</SelectItem>
                    <SelectItem value="false">Выключено (ручная проверка)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Автоодобрение заказов</Label>
                <Select
                  value={moderationSettings.autoApproveOrders}
                  onValueChange={(val) =>
                    setModerationSettings({ ...moderationSettings, autoApproveOrders: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Включено</SelectItem>
                    <SelectItem value="false">Выключено (ручная проверка)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minReviewLength">Мин. длина отзыва (символов)</Label>
                <Input
                  id="minReviewLength"
                  type="number"
                  value={moderationSettings.minReviewLength}
                  onChange={(e) =>
                    setModerationSettings({ ...moderationSettings, minReviewLength: e.target.value })
                  }
                />
              </div>
            </div>
            <SaveButton section="moderation" data={moderationSettings} />
          </CardContent>
        </Card>

        {/* Тарифы */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>Тарифы</CardTitle>
                <CardDescription>Стоимость подписок и лимиты</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standardPrice">Стандарт — цена (₽/мес)</Label>
                <Input
                  id="standardPrice"
                  type="number"
                  value={tariffSettings.standardPrice}
                  onChange={(e) =>
                    setTariffSettings({ ...tariffSettings, standardPrice: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="premiumPrice">Премиум — цена (₽/мес)</Label>
                <Input
                  id="premiumPrice"
                  type="number"
                  value={tariffSettings.premiumPrice}
                  onChange={(e) =>
                    setTariffSettings({ ...tariffSettings, premiumPrice: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="standardSpecializations">Стандарт — специализаций</Label>
                <Input
                  id="standardSpecializations"
                  type="number"
                  value={tariffSettings.standardSpecializations}
                  onChange={(e) =>
                    setTariffSettings({ ...tariffSettings, standardSpecializations: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="premiumSpecializations">Премиум — специализаций</Label>
                <Input
                  id="premiumSpecializations"
                  type="number"
                  value={tariffSettings.premiumSpecializations}
                  onChange={(e) =>
                    setTariffSettings({ ...tariffSettings, premiumSpecializations: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="trialDays">Пробный период (дней)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  value={tariffSettings.trialDays}
                  onChange={(e) =>
                    setTariffSettings({ ...tariffSettings, trialDays: e.target.value })
                  }
                />
              </div>
            </div>
            <SaveButton section="tariffs" data={tariffSettings} />
          </CardContent>
        </Card>

        {/* Email */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle>Email-рассылка</CardTitle>
                <CardDescription>SMTP настройки для отправки писем</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Рассылка включена</Label>
                <Select
                  value={emailSettings.emailEnabled}
                  onValueChange={(val) =>
                    setEmailSettings({ ...emailSettings, emailEnabled: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Включена</SelectItem>
                    <SelectItem value="false">Выключена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="smtpHost">SMTP сервер</Label>
                <Input
                  id="smtpHost"
                  value={emailSettings.smtpHost}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">SMTP порт</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={emailSettings.smtpPort}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, smtpPort: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="emailFrom">Отправитель (email)</Label>
                <Input
                  id="emailFrom"
                  type="email"
                  value={emailSettings.emailFrom}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, emailFrom: e.target.value })
                  }
                />
              </div>
            </div>
            <SaveButton section="email" data={emailSettings} />
          </CardContent>
        </Card>

        {/* Информация о системе */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-gray-500" />
              <div>
                <CardTitle>Информация о системе</CardTitle>
                <CardDescription>Технические данные платформы</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Версия платформы</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Среда</span>
                <span className="font-medium">Production</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Backend</span>
                <span className="font-medium">Node.js + Express</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Frontend</span>
                <span className="font-medium">Next.js 14</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">База данных</span>
                <span className="font-medium">PostgreSQL + Prisma</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Кэш</span>
                <span className="font-medium">Redis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
