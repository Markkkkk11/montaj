'use client';

import { useState, useEffect, useRef } from 'react';
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
  const { user, getCurrentUser, isHydrated } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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
  const [aboutDescription, setAboutDescription] = useState('');
  const [website, setWebsite] = useState('');

  // Executor profile fields
  const [region, setRegion] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [isSelfEmployed, setIsSelfEmployed] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: 'Максимальный размер файла — 5 МБ',
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('photo', file);
      await api.post('/users/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        variant: 'success',
        title: '✅ Фото обновлено!',
      });

      await getCurrentUser();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось загрузить фото',
      });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
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
    setAboutDescription(user.aboutDescription || '');
    setWebsite(user.website || '');

    if (user.role === 'EXECUTOR' && user.executorProfile) {
      setRegion(user.executorProfile.region || '');
      setShortDescription(user.executorProfile.shortDescription || '');
      setFullDescription(user.executorProfile.fullDescription || '');
      setIsSelfEmployed(user.executorProfile.isSelfEmployed || false);
    }
  }, [user, router, isHydrated]);

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
        aboutDescription: aboutDescription || undefined,
        website: website || undefined,
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
        isSelfEmployed,
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

  if (!isHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Монтаж" className="h-12 w-12 rounded-lg object-cover shadow-sm" />
            <span className="text-xl font-bold text-primary hidden sm:inline">Монтаж</span>
          </div>
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

        {/* Avatar Upload */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Фото профиля</CardTitle>
            <CardDescription>Загрузите аватар (макс. 5 МБ, jpg/png/webp)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {user.photo ? (
                  <img
                    src={user.photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.photo}` : user.photo}
                    alt="Аватар"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-gray-400">👤</span>
                )}
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Загрузка...' : user.photo ? 'Изменить фото' : 'Загрузить фото'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="aboutDescription">О себе / О компании</Label>
                <Textarea
                  id="aboutDescription"
                  value={aboutDescription}
                  onChange={(e) => setAboutDescription(e.target.value)}
                  placeholder="Расскажите коротко о себе или чем занимается ваша компания..."
                  maxLength={1000}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {aboutDescription.length} / 1000
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="website">Сайт</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
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

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="isSelfEmployed"
                  checked={isSelfEmployed}
                  onChange={(e) => setIsSelfEmployed(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="isSelfEmployed" className="cursor-pointer">
                  Я самозанятый
                </Label>
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

