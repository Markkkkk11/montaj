'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { USER_STATUS_LABELS, SPECIALIZATION_LABELS } from '@/lib/utils';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const goBack = () => {
    if (user.role === 'CUSTOMER') {
      router.push('/customer/dashboard');
    } else {
      router.push('/executor/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Монтаж</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={goBack}>
              Назад
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Мой профиль</h2>
          <p className="text-muted-foreground">
            {user.role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'}
          </p>
        </div>

        {/* Basic Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ФИО</p>
                <p className="font-medium">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Телефон</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email || 'Не указан'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Город</p>
                <p className="font-medium">{user.city}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Организация</p>
                <p className="font-medium">{user.organization || 'Не указана'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Статус</p>
                <p className="font-medium">{USER_STATUS_LABELS[user.status]}</p>
              </div>
            </div>

            <Button variant="outline" disabled>
              Редактировать профиль (скоро)
            </Button>
          </CardContent>
        </Card>

        {/* Executor Profile */}
        {user.role === 'EXECUTOR' && user.executorProfile && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Профиль исполнителя</CardTitle>
              <CardDescription>Информация для заказчиков</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Регион работы</p>
                <p className="font-medium">{user.executorProfile.region || 'Не указан'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Специализации</p>
                {user.executorProfile.specializations.length > 0 ? (
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
                  <p className="font-medium">Не указаны</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Краткое описание</p>
                <p className="font-medium">
                  {user.executorProfile.shortDescription || 'Не указано'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Подробное описание</p>
                <p className="font-medium">
                  {user.executorProfile.fullDescription || 'Не указано'}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Фото работ ({user.executorProfile.workPhotos.length}/5)
                </p>
                {user.executorProfile.workPhotos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {user.executorProfile.workPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="aspect-square bg-gray-200 rounded-lg overflow-hidden"
                      >
                        <img src={photo} alt={`Work ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Фото не загружены</p>
                )}
              </div>

              <Button variant="outline" disabled>
                Редактировать профиль исполнителя (скоро)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Статистика</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Рейтинг</p>
                <p className="text-2xl font-bold">{user.rating.toFixed(1)} / 5.0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Выполнено заказов</p>
                <p className="text-2xl font-bold">{user.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

