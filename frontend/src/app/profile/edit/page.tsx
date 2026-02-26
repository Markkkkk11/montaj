'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { SPECIALIZATION_LABELS } from '@/lib/utils';
import { Specialization } from '@/lib/types';
import { Camera, Save, User, Briefcase, ImagePlus, X as XIcon, Loader2 } from 'lucide-react';

const FORM_STORAGE_KEY = 'editProfileForm';

export default function EditProfilePage() {
  const { user, getCurrentUser, isHydrated } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [about, setAbout] = useState('');
  const [website, setWebsite] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [maxMessenger, setMaxMessenger] = useState('');
  const [telegram, setTelegram] = useState('');
  const [inn, setInn] = useState('');
  const [ogrn, setOgrn] = useState('');

  const [region, setRegion] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [isSelfEmployed, setIsSelfEmployed] = useState(false);
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [uploadingWorkPhoto, setUploadingWorkPhoto] = useState(false);
  const workPhotoInputRef = useRef<HTMLInputElement>(null);
  const executorSectionRef = useRef<HTMLDivElement>(null);
  const [executorSectionUnlocked, setExecutorSectionUnlocked] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: 'Максимальный размер файла — 5 МБ' });
      return;
    }
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('photo', file);
      await api.post('/users/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ variant: 'success', title: '✅ Фото обновлено!' });
      await getCurrentUser();
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось загрузить фото' });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!user) { router.push('/login'); return; }

    if (!initializedRef.current) {
      initializedRef.current = true;

      // Check if returning from specializations page with saved form data
      let savedForm: any = null;
      try {
        const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
        if (raw) {
          savedForm = JSON.parse(raw);
          sessionStorage.removeItem(FORM_STORAGE_KEY);
        }
      } catch (e) { /* ignore */ }

      setFullName(savedForm?.fullName ?? user.fullName ?? '');
      setEmail(savedForm?.email ?? user.email ?? '');
      setOrganization(savedForm?.organization ?? user.organization ?? '');
      setCity(savedForm?.city ?? user.city ?? '');
      setAddress(savedForm?.address ?? user.address ?? '');
      setMaxMessenger(savedForm?.maxMessenger ?? user.messengers?.max ?? '');
      setTelegram(savedForm?.telegram ?? user.messengers?.telegram ?? '');
      setAbout(savedForm?.about ?? user.about ?? '');
      setWebsite(savedForm?.website ?? user.website ?? '');
      setInn(savedForm?.inn ?? user.inn ?? '');
      setOgrn(savedForm?.ogrn ?? user.ogrn ?? '');

      if (user.role === 'EXECUTOR' && user.executorProfile) {
        setRegion(savedForm?.region ?? user.executorProfile.region ?? '');
        setShortDescription(savedForm?.shortDescription ?? user.executorProfile.shortDescription ?? '');
        setFullDescription(savedForm?.fullDescription ?? user.executorProfile.fullDescription ?? '');
        setIsSelfEmployed(savedForm?.isSelfEmployed ?? user.executorProfile.isSelfEmployed ?? false);
        setWorkPhotos(user.executorProfile.workPhotos || []);
        setExecutorSectionUnlocked(savedForm?.executorSectionUnlocked ?? false);
      }
    } else {
      // Subsequent user updates (e.g. after photo upload / save) — only refresh work photos
      if (user.role === 'EXECUTOR' && user.executorProfile) {
        setWorkPhotos(user.executorProfile.workPhotos || []);
      }
    }
  }, [user, router, isHydrated]);

  const handleSaveBasicProfile = async () => {
    try {
      setIsSaving(true);
      await api.put('/users/profile', {
        fullName, email: email || undefined, organization: organization || undefined,
        about: about || undefined, website: website || undefined, city,
        address: address || undefined,
        messengers: { max: maxMessenger || undefined, telegram: telegram || undefined },
        inn: inn || undefined, ogrn: ogrn || undefined,
      });
      toast({ variant: 'success', title: '✅ Профиль обновлен!' });
      const cr = region, cs = shortDescription, cf = fullDescription;
      await getCurrentUser();
      setRegion(cr); setShortDescription(cs); setFullDescription(cf);
      if (user?.role === 'EXECUTOR') {
        setExecutorSectionUnlocked(true);
        setTimeout(() => executorSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось сохранить' });
    } finally { setIsSaving(false); }
  };

  const handleUploadWorkPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: 'Максимальный размер файла — 5 МБ' });
      return;
    }
    try {
      setUploadingWorkPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);
      const { data } = await api.post('/users/work-photos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setWorkPhotos(data.workPhotos || []);
      toast({ variant: 'success', title: '✅ Фото добавлено!' });
      await getCurrentUser();
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось загрузить фото' });
    } finally {
      setUploadingWorkPhoto(false);
      if (workPhotoInputRef.current) workPhotoInputRef.current.value = '';
    }
  };

  const handleRemoveWorkPhoto = async (photoUrl: string) => {
    try {
      const { data } = await api.delete('/users/work-photos', { data: { photoUrl } });
      setWorkPhotos(data.workPhotos || []);
      toast({ variant: 'success', title: '✅ Фото удалено!' });
      await getCurrentUser();
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось удалить фото' });
    }
  };

  const handleSaveExecutorProfile = async () => {
    try {
      setIsSaving(true);
      await api.put('/users/executor-profile', {
        region: region || undefined, shortDescription: shortDescription || undefined,
        fullDescription: fullDescription || undefined, isSelfEmployed,
      });
      toast({ variant: 'success', title: '✅ Профиль исполнителя обновлен!' });
      const cn = fullName, ce = email, co = organization, cc = city, ca = address, cm = maxMessenger, ct = telegram, ci = inn, cg = ogrn;
      await getCurrentUser();
      setFullName(cn); setEmail(ce); setOrganization(co); setCity(cc); setAddress(ca); setMaxMessenger(cm); setTelegram(ct); setInn(ci); setOgrn(cg);
    } catch (error: any) {
      toast({ variant: 'destructive', title: '❌ Ошибка', description: error.response?.data?.error || 'Не удалось сохранить' });
    } finally { setIsSaving(false); }
  };

  if (!isHydrated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack backHref="/profile" />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl page-enter">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Редактирование профиля</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Обновите информацию о себе</p>
        </div>

        {user.role === 'EXECUTOR' && (
          <Card className="mb-6 border-blue-100 bg-blue-50/40">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="px-4 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap flex-shrink-0">Шаг 1</span>
                <span className="text-blue-900">Сначала заполните и сохраните «Основная информация».</span>
              </div>
              <div className="flex items-center gap-3 text-sm mt-2">
                <span className={`px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 ${executorSectionUnlocked ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>Шаг 2</span>
                <span className={executorSectionUnlocked ? 'text-emerald-800' : 'text-gray-600'}>
                  {executorSectionUnlocked ? 'Теперь заполните «Профиль исполнителя».' : 'Профиль исполнителя откроется после сохранения шага 1.'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Avatar Upload */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-soft">
                  {user.photo ? (
                    <img
                      src={user.photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.photo}` : user.photo}
                      alt="Аватар"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-gray-300">{user.fullName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  disabled={uploadingAvatar}
                >
                  <Camera className="h-6 w-6 text-white" />
                </button>
              </div>
              <div>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} className="hidden" />
                <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="gap-2">
                  <Camera className="h-4 w-4" />
                  {uploadingAvatar ? 'Загрузка...' : user.photo ? 'Изменить фото' : 'Загрузить фото'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG или WebP. Макс. 5 МБ</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Profile */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5" /> Основная информация</CardTitle>
            <CardDescription>Личные данные и контакты</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">ФИО *</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иванов Иван Иванович" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Телефон *</Label>
                <Input id="phone" value={user.phone} disabled className="bg-gray-50 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Нельзя изменить</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@mail.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Город *</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Введите ваш город" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="organization">Организация</Label>
                <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder='ООО "Компания"' />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="about">О себе / О компании</Label>
                <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Коротко опишите чем занимается ваша фирма..." maxLength={1000} rows={3} />
                <p className="text-xs text-muted-foreground text-right">{about.length} / 1000</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">Сайт</Label>
                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Адрес</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="г. Москва, ул. Примерная, д. 1" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inn">ИНН</Label>
                <Input id="inn" value={inn} onChange={(e) => setInn(e.target.value)} placeholder="1234567890" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ogrn">ОГРН</Label>
                <Input id="ogrn" value={ogrn} onChange={(e) => setOgrn(e.target.value)} placeholder="1234567890123" />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-sm mb-3">Мессенджеры</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="maxMessenger">MAX</Label>
                  <Input id="maxMessenger" value={maxMessenger} onChange={(e) => setMaxMessenger(e.target.value)} placeholder="max.ru/username" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input id="telegram" value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveBasicProfile} disabled={isSaving || !fullName || !city} className="w-full gap-2">
              <Save className="h-4 w-4" /> {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </CardContent>
        </Card>

        {/* Executor Profile */}
        {user.role === 'EXECUTOR' && executorSectionUnlocked && (
          <Card className="mb-6" ref={executorSectionRef}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5" /> Профиль исполнителя</CardTitle>
              <CardDescription>Информация для заказчиков</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="region">Город работы *</Label>
                <select
                  id="region"
                  className="w-full mt-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-200"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">Выберите город</option>
                  <option value="Москва и обл.">Москва и обл.</option>
                  <option value="Санкт-Петербург и обл.">Санкт-Петербург и обл.</option>
                  <option value="Краснодар">Краснодар</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Специализации *</Label>
                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-100">
                  <p className="text-sm text-blue-900 mb-2">
                    Для изменения специализаций перейдите в{' '}
                    <Button variant="link" className="p-0 h-auto font-semibold text-blue-700" onClick={() => {
                      // Save current form data before navigating away
                      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({
                        fullName, email, organization, about, website, city, address,
                        maxMessenger, telegram, inn, ogrn,
                        region, shortDescription, fullDescription, isSelfEmployed,
                        executorSectionUnlocked: true
                      }));
                      router.push('/profile/specializations');
                    }}>
                      раздел управления специализациями
                    </Button>
                  </p>
                  {user.executorProfile?.specializations && user.executorProfile.specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {user.executorProfile.specializations.map((spec) => (
                        <span key={spec} className="badge-primary">{SPECIALIZATION_LABELS[spec]}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-red-500 font-medium">⚠️ Не выбраны (обязательно)</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shortDescription">Краткое описание * (до 500 символов)</Label>
                <Textarea id="shortDescription" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Кратко опишите свой опыт и навыки..." maxLength={500} rows={3} />
                <p className="text-xs text-muted-foreground text-right">{shortDescription.length} / 500</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fullDescription">Подробное описание (до 3000 символов)</Label>
                <Textarea id="fullDescription" value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Подробно расскажите о своём опыте работы..." maxLength={3000} rows={8} />
                <p className="text-xs text-muted-foreground text-right">{fullDescription.length} / 3000</p>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input type="checkbox" id="isSelfEmployed" checked={isSelfEmployed} onChange={(e) => setIsSelfEmployed(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                <Label htmlFor="isSelfEmployed" className="cursor-pointer font-normal">Я самозанятый</Label>
              </div>

              {/* Portfolio */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Портфолио (фото работ)</Label>
                  <span className="text-xs text-muted-foreground">{workPhotos.length} / 8</span>
                </div>
                <p className="text-xs text-muted-foreground">Загрузите до 8 фотографий ваших выполненных работ. Это поможет заказчикам оценить ваши возможности и качество.</p>
                
                {workPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {workPhotos.map((photo, idx) => {
                      const photoSrc = photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${photo}` : photo;
                      return (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          <img src={photoSrc} alt={`Работа ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemoveWorkPhoto(photo)}
                            className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                          >
                            <XIcon className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {workPhotos.length < 8 && (
                  <div>
                    <input ref={workPhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadWorkPhoto} className="hidden" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => workPhotoInputRef.current?.click()} 
                      disabled={uploadingWorkPhoto}
                      className="gap-2"
                    >
                      {uploadingWorkPhoto ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Загрузка...</>
                      ) : (
                        <><ImagePlus className="h-4 w-4" /> Добавить фото</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1.5">JPG, PNG или WebP. Макс. 5 МБ</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSaveExecutorProfile}
                disabled={isSaving || !region || !user.executorProfile?.specializations?.length || !shortDescription}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" /> {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              
              {(!region || !user.executorProfile?.specializations?.length || !shortDescription) && (
                <p className="text-sm text-amber-600 mt-2">⚠️ Заполните все обязательные поля (*) чтобы снять ограничения профиля</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
