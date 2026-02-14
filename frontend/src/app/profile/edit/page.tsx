'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization } from '@/lib/types';

export default function EditProfilePage() {
  const { user, getCurrentUser } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Basic profile fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [inn, setInn] = useState('');
  const [ogrn, setOgrn] = useState('');

  // Executor profile fields
  const [region, setRegion] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load current values
    setFullName(user.fullName || '');
    setEmail(user.email || '');
    setOrganization(user.organization || '');
    setCity(user.city || '');
    setAddress(user.address || '');
    setWhatsapp(user.messengers?.whatsapp || '');
    setTelegram(user.messengers?.telegram || '');
    setInn(user.inn || '');
    setOgrn(user.ogrn || '');

    if (user.role === 'EXECUTOR' && user.executorProfile) {
      setRegion(user.executorProfile.region || '');
      setShortDescription(user.executorProfile.shortDescription || '');
      setFullDescription(user.executorProfile.fullDescription || '');
    }
  }, [user, router]);

  const handleSaveBasicProfile = async () => {
    try {
      setIsSaving(true);

      await api.put('/users/profile', {
        fullName,
        email: email || undefined,
        organization: organization || undefined,
        city,
        address: address || undefined,
        messengers: {
          whatsapp: whatsapp || undefined,
          telegram: telegram || undefined,
        },
        inn: inn || undefined,
        ogrn: ogrn || undefined,
      });

      toast({
        variant: 'success',
        title: '✅ Профиль обновлен!',
        description: 'Ваши данные успешно сохранены.',
      });

      // Reload user data and restore executor profile state
      const currentRegion = region;
      const currentShortDesc = shortDescription;
      const currentFullDesc = fullDescription;
      
      await getCurrentUser();
      
      // Restore executor profile state after reload
      setRegion(currentRegion);
      setShortDescription(currentShortDesc);
      setFullDescription(currentFullDesc);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить профиль',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExecutorProfile = async () => {
    try {
      setIsSaving(true);

      await api.put('/users/executor-profile', {
        region: region || undefined,
        shortDescription: shortDescription || undefined,
        fullDescription: fullDescription || undefined,
      });

      toast({
        variant: 'success',
        title: '✅ Профиль исполнителя обновлен!',
        description: 'Ваши данные успешно сохранены.',
      });

      // Reload user data and restore basic profile state
      const currentFullName = fullName;
      const currentEmail = email;
      const currentOrganization = organization;
      const currentCity = city;
      const currentAddress = address;
      const currentWhatsapp = whatsapp;
      const currentTelegram = telegram;
      const currentInn = inn;
      const currentOgrn = ogrn;
      
      await getCurrentUser();
      
      // Restore basic profile state after reload
      setFullName(currentFullName);
      setEmail(currentEmail);
      setOrganization(currentOrganization);
      setCity(currentCity);
      setAddress(currentAddress);
      setWhatsapp(currentWhatsapp);
      setTelegram(currentTelegram);
      setInn(currentInn);
      setOgrn(currentOgrn);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось сохранить профиль исполнителя',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Монтаж</h1>
          <Button variant="ghost" onClick={() => router.push('/profile')}>
            ← Назад к профилю
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Редактирование профиля</h2>
          <p className="text-muted-foreground">
            Обновите информацию о себе
          </p>
        </div>

        {/* Basic Profile */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
            <CardDescription>Личные данные и контакты</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">ФИО *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  value={user.phone}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-muted-foreground">
                  Телефон нельзя изменить
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Москва"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="organization">Организация</Label>
                <Input
                  id="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="ООО &quot;Компания&quot;"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="г. Москва, ул. Примерная, д. 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inn">ИНН</Label>
                <Input
                  id="inn"
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                  placeholder="1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ogrn">ОГРН</Label>
                <Input
                  id="ogrn"
                  value={ogrn}
                  onChange={(e) => setOgrn(e.target.value)}
                  placeholder="1234567890123"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-3">Мессенджеры</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+79001234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="@username"
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSaveBasicProfile} 
              disabled={isSaving || !fullName || !city}
              className="w-full"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить основную информацию'}
            </Button>
          </CardContent>
        </Card>

        {/* Executor Profile */}
        {user.role === 'EXECUTOR' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Профиль исполнителя</CardTitle>
              <CardDescription>Информация для заказчиков</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="region">Регион работы *</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Москва и МО"
                />
              </div>

              <div className="space-y-2">
                <Label>Специализации *</Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 mb-2">
                    Для изменения специализаций перейдите в{' '}
                    <Button
                      variant="link"
                      className="p-0 h-auto font-semibold"
                      onClick={() => router.push('/profile/specializations')}
                    >
                      раздел управления специализациями
                    </Button>
                  </p>
                  {user.executorProfile?.specializations && user.executorProfile.specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.executorProfile.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          {SPECIALIZATION_LABELS[spec]}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">⚠️ Не выбраны (обязательно)</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">
                  Краткое описание * (до 500 символов)
                </Label>
                <Textarea
                  id="shortDescription"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Кратко опишите свой опыт и навыки..."
                  maxLength={500}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {shortDescription.length} / 500
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">
                  Подробное описание (до 3000 символов)
                </Label>
                <Textarea
                  id="fullDescription"
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Подробно расскажите о своём опыте работы, выполненных проектах, навыках..."
                  maxLength={3000}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {fullDescription.length} / 3000
                </p>
              </div>

              <Button 
                onClick={handleSaveExecutorProfile} 
                disabled={
                  isSaving || 
                  !region || 
                  !user.executorProfile?.specializations?.length || 
                  !shortDescription
                }
                className="w-full"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить профиль исполнителя'}
              </Button>
              
              {(!region || !user.executorProfile?.specializations?.length || !shortDescription) && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Заполните все обязательные поля (отмечены *) чтобы снять ограничения профиля
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

