'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RulesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Назад
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Правила работы сайта</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Общие положения</h3>
              <p className="text-sm text-muted-foreground">
                Платформа «Монтаж» предоставляет сервис для поиска и заказа монтажных услуг. 
                Регистрируясь на платформе, вы соглашаетесь с настоящими правилами и обязуетесь 
                их соблюдать.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Правила для заказчиков</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Размещайте только достоверную информацию о заказах</li>
                <li>Указывайте реальный бюджет и сроки выполнения работ</li>
                <li>Оставляйте объективные отзывы об исполнителях</li>
                <li>Не используйте платформу для рассылки спама</li>
                <li>Уважительно относитесь к исполнителям</li>
                <li>Своевременно производите оплату за выполненные работы</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. Правила для исполнителей</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Заполните профиль полностью и достоверно</li>
                <li>Откликайтесь только на заказы, которые соответствуют вашей квалификации</li>
                <li>Выполняйте работы качественно и в оговорённые сроки</li>
                <li>Не передавайте заказы третьим лицам без согласия заказчика</li>
                <li>Соблюдайте конфиденциальность данных заказчиков</li>
                <li>Поддерживайте связь с заказчиком в процессе выполнения работ</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Тарифы и оплата</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Регистрация и размещение заказов — бесплатно</li>
                <li>Исполнители оплачивают отклики на заказы согласно выбранному тарифу</li>
                <li>Доступные тарифы: Стандарт (150₽/отклик), Комфорт (500₽/заказ), Премиум (5000₽/мес)</li>
                <li>Оплата между заказчиком и исполнителем осуществляется напрямую</li>
                <li>Возврат средств производится согласно условиям тарифа</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. Отзывы и рейтинг</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li>Отзывы проходят модерацию администратором</li>
                <li>Запрещены оскорбительные и ложные отзывы</li>
                <li>Рейтинг формируется на основе оценок от заказчиков и исполнителей</li>
                <li>Администрация оставляет за собой право удалять недобросовестные отзывы</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Конфиденциальность</h3>
              <p className="text-sm text-muted-foreground">
                Контактные данные пользователей защищены. Номер телефона и email исполнителя 
                открываются заказчику только после выбора исполнителя. Мы не передаём персональные 
                данные третьим лицам без согласия пользователя.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. Ответственность</h3>
              <p className="text-sm text-muted-foreground">
                Платформа не несёт ответственности за качество выполненных работ. 
                Все споры между заказчиком и исполнителем решаются между ними напрямую. 
                Администрация содействует в разрешении конфликтных ситуаций в рамках своих возможностей.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">8. Блокировка аккаунта</h3>
              <p className="text-sm text-muted-foreground">
                Администрация вправе заблокировать аккаунт пользователя при нарушении правил платформы, 
                систематических жалобах от других пользователей, а также при обнаружении мошеннических 
                действий.
              </p>
            </section>

            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Последнее обновление: Февраль 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
