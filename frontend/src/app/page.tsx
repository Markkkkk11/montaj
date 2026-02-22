'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const SPECIALIZATION_DETAILS: Record<string, { icon: string; title: string; description: string; services: string[] }> = {
  'Окна': {
    icon: '🪟',
    title: 'Монтаж окон',
    description: 'Профессиональная установка и замена оконных конструкций любой сложности.',
    services: [
      'Установка пластиковых (ПВХ) окон',
      'Установка деревянных окон',
      'Установка алюминиевых окон',
      'Демонтаж старых окон',
      'Остекление балконов и лоджий',
      'Установка подоконников и откосов',
      'Установка отливов и москитных сеток',
      'Регулировка и ремонт фурнитуры',
    ],
  },
  'Двери': {
    icon: '🚪',
    title: 'Монтаж дверей',
    description: 'Установка входных и межкомнатных дверей с полным комплексом работ.',
    services: [
      'Установка входных металлических дверей',
      'Установка межкомнатных дверей',
      'Установка раздвижных дверей',
      'Демонтаж старых дверей',
      'Установка дверных коробок',
      'Монтаж наличников и доборов',
      'Установка фурнитуры и замков',
      'Установка порогов',
    ],
  },
  'Потолки': {
    icon: '🏠',
    title: 'Монтаж потолков',
    description: 'Установка натяжных, подвесных и реечных потолков.',
    services: [
      'Монтаж натяжных потолков (ПВХ, тканевые)',
      'Монтаж подвесных потолков (Armstrong)',
      'Монтаж реечных потолков',
      'Монтаж гипсокартонных потолков',
      'Установка многоуровневых конструкций',
      'Монтаж подсветки и светильников',
      'Обход труб и колонн',
      'Демонтаж старых потолков',
    ],
  },
  'Кондиционеры': {
    icon: '❄️',
    title: 'Монтаж кондиционеров',
    description: 'Установка, обслуживание и ремонт климатического оборудования.',
    services: [
      'Установка сплит-систем',
      'Установка мульти-сплит-систем',
      'Монтаж канальных кондиционеров',
      'Монтаж кассетных кондиционеров',
      'Прокладка трасс и коммуникаций',
      'Сервисное обслуживание',
      'Заправка фреоном',
      'Демонтаж и перенос оборудования',
    ],
  },
  'Жалюзи': {
    icon: '🪟',
    title: 'Монтаж жалюзи и рулонных штор',
    description: 'Установка жалюзи, рулонных штор и систем солнцезащиты.',
    services: [
      'Установка горизонтальных жалюзи',
      'Установка вертикальных жалюзи',
      'Монтаж рулонных штор',
      'Установка штор-плиссе',
      'Монтаж рольставен',
      'Замер и подбор конструкций',
      'Установка карнизов',
      'Ремонт и замена механизмов',
    ],
  },
  'Мебель': {
    icon: '🛋️',
    title: 'Сборка и монтаж мебели',
    description: 'Профессиональная сборка, установка и монтаж мебели.',
    services: [
      'Сборка корпусной мебели',
      'Сборка кухонных гарнитуров',
      'Установка встраиваемой техники',
      'Сборка шкафов-купе',
      'Навешивание кухонных модулей',
      'Сборка мебели IKEA и аналогов',
      'Установка столешниц',
      'Разборка и перевозка мебели',
    ],
  },
};

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

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
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Монтаж" className="h-14 w-14 rounded-lg object-cover shadow-sm" />
            <span className="text-2xl font-bold text-primary">Монтаж</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
              Обратная связь
            </Link>
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
        <h3 className="text-3xl font-bold text-center mb-4">Наши специализации</h3>
        <p className="text-center text-muted-foreground mb-12">Нажмите на специализацию, чтобы узнать подробнее</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {['Окна', 'Двери', 'Потолки', 'Кондиционеры', 'Жалюзи', 'Мебель'].map((spec) => {
            const details = SPECIALIZATION_DETAILS[spec];
            return (
              <div
                key={spec}
                onClick={() => setSelectedSpec(spec)}
                className="p-6 bg-white rounded-lg border hover:border-primary hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="text-3xl text-center mb-3">{details?.icon}</div>
                <h4 className="text-lg font-semibold text-center group-hover:text-primary transition-colors">{spec}</h4>
                <p className="text-sm text-muted-foreground text-center mt-2">Подробнее →</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Specialization Details Dialog */}
      <Dialog open={!!selectedSpec} onOpenChange={(open) => !open && setSelectedSpec(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedSpec && SPECIALIZATION_DETAILS[selectedSpec] && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  <span className="text-3xl">{SPECIALIZATION_DETAILS[selectedSpec].icon}</span>
                  {SPECIALIZATION_DETAILS[selectedSpec].title}
                </DialogTitle>
                <DialogDescription className="text-base mt-2">
                  {SPECIALIZATION_DETAILS[selectedSpec].description}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <h4 className="font-semibold mb-3">Виды работ:</h4>
                <ul className="space-y-2">
                  {SPECIALIZATION_DETAILS[selectedSpec].services.map((service, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t">
                <Link href="/register?role=customer">
                  <Button className="w-full">Заказать работы</Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">&copy; 2026 Монтаж. Все права защищены.</p>
            <div className="flex items-center gap-6">
              <Link href="/executor/tariffs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Тарифы для исполнителей
              </Link>
              <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Обратная связь
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

