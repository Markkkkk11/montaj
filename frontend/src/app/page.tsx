'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Если пользователь авторизован, перенаправляем на его dashboard
    if (user) {
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'CUSTOMER') {
        router.push('/customer/dashboard');
      } else if (user.role === 'EXECUTOR') {
        router.push('/executor/dashboard');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src="/logo.jpg" alt="Монтаж" className="h-10 w-10 rounded-full object-cover" />
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline">Войти</Button>
            </Link>
            <Link href="/register">
              <Button>Регистрация</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold mb-6">
          Платформа заказа <br />
          <span className="text-primary">монтажных услуг</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Найдите проверенных специалистов по установке окон, дверей, потолков, кондиционеров и
          другим монтажным работам
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register?role=customer">
            <Button size="lg">Разместить заказ</Button>
          </Link>
          <Link href="/register?role=executor">
            <Button size="lg" variant="outline">
              Стать исполнителем
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Как это работает</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">1. Разместите заказ</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Опишите задачу, укажите бюджет и сроки. Регистрация и размещение заказов бесплатны
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">2. Выберите исполнителя</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Получайте отклики от проверенных специалистов. Сравнивайте рейтинги и отзывы
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">3. Получите результат</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Работа выполняется в оговорённые сроки. Оплата напрямую исполнителю
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Specializations */}
      <section className="container mx-auto px-4 py-16 bg-gray-50 rounded-lg">
        <h3 className="text-3xl font-bold text-center mb-12">Наши специализации</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Окна', 'Двери', 'Потолки', 'Кондиционеры', 'Жалюзи', 'Мебель'].map((spec) => (
            <div
              key={spec}
              className="p-6 bg-white rounded-lg border hover:border-primary transition-colors cursor-pointer"
            >
              <h4 className="text-lg font-semibold text-center">{spec}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 Монтаж. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
}

