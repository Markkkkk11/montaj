'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { USER_STATUS_LABELS, SPECIALIZATION_LABELS, getTimeSinceRegistration } from '@/lib/utils';

export default function ProfilePage() {
  const { user, logout, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !user) {
      router.push('/login');
    }
  }, [user, router, isHydrated]);

  if (!isHydrated || !user) {
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
          <img src="/logo.jpg" alt="Монтаж" className="h-10 w-10 rounded-full object-cover" />
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

        {/* Avatar + Name */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {user.photo ? (
                  <img src={user.photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.photo}` : user.photo} alt="Аватар" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-500">{user.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold">{user.fullName}</h3>
                <p className="text-muted-foreground">{user.role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'}</p>
                <p className="text-sm text-muted-foreground mt-1">На сайте: {getTimeSinceRegistration(user.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div>
                <p className="text-sm text-muted-foreground">На сайте</p>
                <p className="font-medium">{getTimeSinceRegistration(user.createdAt)}</p>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={() => router.push('/profile/edit')}
            >
              Редактировать профиль
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
                <p className="text-sm text-muted-foreground mb-2">Самозанятый</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user.executorProfile.isSelfEmployed 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {user.executorProfile.isSelfEmployed ? '✅ Да' : '❌ Нет'}
                </span>
              </div>

              <Button 
                variant="outline" 
                onClick={() => router.push('/profile/edit')}
              >
                Редактировать профиль исполнителя
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

