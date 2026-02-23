'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <img src="/logo.jpg" alt="SVMontaj" className="h-14 w-14 rounded-full object-cover" />
          </Link>
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              На главную
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Правила работы на платформе «SVMontaj»</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Общие положения</h3>
              <p className="text-muted-foreground">
                Платформа «SVMontaj» — это сервис, который помогает заказчикам найти проверенных специалистов по монтажным работам,
                а исполнителям — получать заказы. Регистрируясь на платформе, вы соглашаетесь с настоящими правилами.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Для заказчиков</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Регистрация и размещение заказов на платформе бесплатны.</li>
                <li>Заказчик обязан предоставить достоверную информацию о себе и своих заказах.</li>
                <li>Оплата работ производится напрямую исполнителю по договорённости.</li>
                <li>Заказчик обязуется оставлять объективные отзывы о работе исполнителя.</li>
                <li>Запрещено размещать заказы, не связанные с монтажными работами.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Для исполнителей</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Исполнитель обязан предоставить достоверную информацию о себе, опыте и квалификации.</li>
                <li>Исполнитель обязан качественно выполнять принятые заказы в оговорённые сроки.</li>
                <li>Стоимость отклика зависит от выбранного тарифа (Стандарт, Комфорт, Премиум).</li>
                <li>Новые исполнители получают приветственный бонус: 1000 бонусных рублей и тариф «Премиум» на 1 месяц.</li>
                <li>Рейтинг исполнителя формируется на основе отзывов заказчиков.</li>
                <li>Контактные данные исполнителя открываются заказчику только после выбора исполнителя.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Тарифы для исполнителей</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong>Стандарт</strong> — 150 ₽ за каждый отклик. 1 специализация.</li>
                <li><strong>Комфорт</strong> — 500 ₽ только за взятый заказ. Возврат при отмене заказчиком.</li>
                <li><strong>Премиум</strong> — 5000 ₽ за 30 дней. Безлимитные отклики, до 3 специализаций.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Модерация</h3>
              <p className="text-muted-foreground">
                Все профили проходят модерацию. Отзывы также проходят проверку перед публикацией. 
                Администрация оставляет за собой право заблокировать пользователя за нарушение правил.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Ответственность</h3>
              <p className="text-muted-foreground">
                Платформа является посредником и не несёт ответственности за качество выполненных работ. 
                Все договорённости между заказчиком и исполнителем достигаются напрямую.
                Платформа не гарантирует получение заказов исполнителями.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Обратная связь</h3>
              <p className="text-muted-foreground">
                По всем вопросам обращайтесь: <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="text-primary hover:underline">SVMontaj24@mail.ru</a>
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

