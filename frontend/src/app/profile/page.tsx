'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { USER_STATUS_LABELS, SPECIALIZATION_LABELS, getTimeSinceRegistration } from '@/lib/utils';
import Link from 'next/link';
import { Star, Edit, Phone, Mail, MapPin, Building2, Clock, ChevronRight, ChevronLeft, Shield, Briefcase, X } from 'lucide-react';

export default function ProfilePage() {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();
  const [lightboxPhoto, setLightboxPhoto] = useState<number | null>(null);

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [user, router, isHydrated]);

  if (!isHydrated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header showBack />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-3xl page-enter">
        {/* Profile Header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5 -mt-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-soft-lg flex-shrink-0">
                {user.photo ? (
                  <img src={user.photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.photo}` : user.photo} alt="Аватар" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gray-300">{user.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 truncate">{user.fullName}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`badge-${user.role === 'CUSTOMER' ? 'primary' : 'success'}`}>
                    {user.role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {getTimeSinceRegistration(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-start sm:justify-end">
              <Button variant="outline" size="sm" onClick={() => router.push('/profile/edit')} className="gap-2">
                <Edit className="h-4 w-4" /> Редактировать
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Основная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Phone, label: 'Телефон', value: user.phone, color: 'text-blue-600 bg-blue-50' },
                { icon: Mail, label: 'Email', value: user.email || 'Не указан', color: 'text-violet-600 bg-violet-50' },
                { icon: MapPin, label: 'Город', value: user.city, color: 'text-emerald-600 bg-emerald-50' },
                { icon: Building2, label: 'Организация', value: user.organization || 'Не указана', color: 'text-amber-600 bg-amber-50' },
                { icon: Shield, label: 'Статус', value: USER_STATUS_LABELS[user.status], color: 'text-sky-600 bg-sky-50' },
                { icon: Clock, label: 'На сайте', value: getTimeSinceRegistration(user.createdAt), color: 'text-gray-600 bg-gray-50' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color.split(' ')[1]}`}>
                    <item.icon className={`h-4 w-4 ${item.color.split(' ')[0]}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reviews Link */}
        <Card className="mb-6 hover:shadow-soft-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5" onClick={() => router.push(`/profile/${user.id}/reviews`)}>
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Мои отзывы</p>
                  <p className="text-sm text-muted-foreground">Рейтинг: {user.rating.toFixed(1)} / 5.0</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </div>
          </CardContent>
        </Card>

        {/* Executor Profile */}
        {user.role === 'EXECUTOR' && user.executorProfile && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Профиль исполнителя</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/profile/edit')} className="gap-1 text-muted-foreground">
                  <Edit className="h-3.5 w-3.5" /> Изменить
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Регион работы</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <p className="font-semibold text-gray-900">{user.executorProfile.region || 'Не указан'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Специализации</p>
                {user.executorProfile.specializations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.executorProfile.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-violet-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-100"
                      >
                        {SPECIALIZATION_LABELS[spec]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Не указаны</p>
                )}
              </div>

              {user.executorProfile.shortDescription && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Краткое описание</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{user.executorProfile.shortDescription}</p>
                </div>
              )}

              {user.executorProfile.fullDescription && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Подробное описание</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{user.executorProfile.fullDescription}</p>
                </div>
              )}

              {user.executorProfile.workPhotos && user.executorProfile.workPhotos.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Портфолио ({user.executorProfile.workPhotos.length} фото)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {user.executorProfile.workPhotos.map((photo: string, idx: number) => {
                      const photoSrc = photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${photo}` : photo;
                      return (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer" onClick={() => setLightboxPhoto(idx)}>
                          <img src={photoSrc} alt={`Работа ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Самозанятый</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold ${
                  user.executorProfile.isSelfEmployed 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-gray-50 text-gray-600 border border-gray-100'
                }`}>
                  {user.executorProfile.isSelfEmployed ? '✅ Да' : '❌ Нет'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Статистика</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl text-center">
                <p className="text-3xl font-extrabold text-amber-600">{user.rating.toFixed(1)}</p>
                <p className="text-xs font-medium text-amber-700 mt-1">Рейтинг из 5.0</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-center">
                <p className="text-3xl font-extrabold text-blue-600">{user.completedOrders}</p>
                <p className="text-xs font-medium text-blue-700 mt-1">Выполнено заказов</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Lightbox — rendered via portal to body */}
      {lightboxPhoto !== null && user.executorProfile?.workPhotos && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            className="absolute top-3 right-3 sm:top-5 sm:right-5 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            onClick={() => setLightboxPhoto(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {user.executorProfile.workPhotos.length > 1 && (
            <>
              <button
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxPhoto((lightboxPhoto - 1 + user.executorProfile!.workPhotos.length) % user.executorProfile!.workPhotos.length); }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                onClick={(e) => { e.stopPropagation(); setLightboxPhoto((lightboxPhoto + 1) % user.executorProfile!.workPhotos.length); }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <img
            src={(() => { const p = user.executorProfile!.workPhotos[lightboxPhoto]; return p.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${p}` : p; })()}
            alt={`Работа ${lightboxPhoto + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {user.executorProfile.workPhotos.length > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
              {lightboxPhoto + 1} / {user.executorProfile.workPhotos.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
