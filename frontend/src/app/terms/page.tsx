'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettingsStore } from '@/stores/settingsStore';
import { ArrowLeft, Shield, Users, Hammer, CreditCard, Eye, Scale, ScrollText, Mail, Banknote, Trash2 } from 'lucide-react';

export default function TermsPage() {
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    fetchSettings().catch((err) => console.error('Failed to load public settings:', err));
  }, [fetchSettings]);

  const standardResponsePrice = parseInt(settings.standardResponsePrice || '150', 10);
  const comfortOrderTakenPrice = parseInt(settings.comfortOrderTakenPrice || '500', 10);
  const premiumPrice = parseInt(settings.premiumPrice || '5000', 10);
  const standardSpecs = parseInt(settings.standardSpecializations || '1', 10);
  const comfortSpecs = parseInt(settings.comfortSpecializations || '1', 10);
  const premiumSpecs = parseInt(settings.premiumSpecializations || '3', 10);
  const trialDays = parseInt(settings.trialDays || '30', 10);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <img src="/logo.jpg" alt="SVMontaj" className="h-14 w-14 rounded-full object-contain bg-white" />
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
        <Card className="border-0 shadow-soft-xl overflow-hidden">
          {/* Шапка с градиентом */}
          <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 sm:px-8 py-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ScrollText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-xl sm:text-2xl font-bold">Правила работы на платформе «SVMontaj»</CardTitle>
                <p className="text-blue-100 text-sm mt-1">от 21.02.2026</p>
              </div>
            </div>
          </div>

          <CardContent className="px-6 sm:px-8 py-8 space-y-8">
            {/* 1. Общие положения */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">1. Общие положения</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-12">
                Платформа «SVMontaj» (далее Компания) — это сервис, который помогает заказчикам найти проверенных специалистов по монтажным работам, а исполнителям — получать заказы. Регистрируясь на платформе, вы соглашаетесь с настоящими правилами. Компания оказывает информационные услуги, операционно-технологические услуги (в том числе, заведение/обработка информации на сайте, мониторинг и поиск Заявок, информирование Пользователей о текущем статусе Заявки) с использованием Интернет ресурса.
              </p>
            </section>

            {/* 2. Для заказчиков */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">2. Для заказчиков</h3>
              </div>
              <ul className="space-y-2 pl-12">
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Регистрация и размещение заказов на платформе бесплатны.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Заказчик обязан предоставить достоверную информацию о себе и своих заказах.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Оплата за выполненные работы гарантируется и производится напрямую исполнителю по договорённости.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Заказчик обязуется оставлять объективные отзывы о работе исполнителя.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Запрещено размещать не существующие заказы, заказы не связанные с монтажными работами, указывать в описании/прикреплённых файлах заказа контактную информацию, размещать информацию запрещённую на территории РФ.</li>
              </ul>
            </section>

            {/* 3. Для исполнителей */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Hammer className="h-4 w-4 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">3. Для исполнителей</h3>
              </div>
              <ul className="space-y-2 pl-12">
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Исполнитель обязан предоставить достоверную информацию о себе, опыте и квалификации.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Исполнитель обязан качественно выполнять принятые заказы в оговорённые сроки.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Стоимость отклика зависит от выбранного тарифа (Стандарт, Комфорт, Премиум).</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>{`Новые исполнители получают тариф «Премиум» на ${trialDays} ${trialDays === 1 ? 'день' : trialDays < 5 ? 'дня' : 'дней'} бесплатно. 1000 бонусных рублей начисляется только после первого пополнения баланса на сумму от 150 рублей в течении 30 дней после регистрации. Бонусы можно использовать для оплаты откликов на заказы.`}</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Рейтинг исполнителя формируется на основе отзывов заказчиков.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Контактные данные исполнителя открываются заказчику только после выбора исполнителя.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Исполнитель обязан выполнять правила сайта и реагировать на замечания от администрации.</li>
                <li className="text-muted-foreground flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Исполнитель после регистрации, должен пройти, не менее трёх Тестовых заданий, чтобы быть допущенным к реальным Заказам. При работе с тестовыми заданиями, определяется функциональность сайта для исполнителя и даёт возможность администрации, определить возможные ошибки, в заполнении профиля/работе на сайте, которые необходимо исправить, для эффективной работы исполнителя с заказчиками.</li>
              </ul>
            </section>

            {/* 4. Тарифы для исполнителей */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">4. Тарифы для исполнителей</h3>
              </div>
              <div className="space-y-3 pl-12">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="font-semibold text-gray-800">Стандарт</p>
                  <p className="text-sm text-gray-500 mt-1">{`${standardResponsePrice} ₽ за каждый отклик. ${standardSpecs === 1 ? '1 специализация' : `${standardSpecs} специализации`} (свободный выбор).`}</p>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <p className="font-semibold text-blue-800">Комфорт</p>
                  <p className="text-sm text-blue-600/70 mt-1">{`Бесплатные отклики. ${comfortOrderTakenPrice} ₽ списывается при выборе заказчиком. ${comfortSpecs === 1 ? '1 специализация' : `${comfortSpecs} специализации`}.`}</p>
                </div>
                <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-100">
                  <p className="font-semibold text-violet-800">Премиум</p>
                  <p className="text-sm text-violet-600/70 mt-1">{`${premiumPrice} ₽ за 30 дней. Безлимитные отклики, до ${premiumSpecs} специализаций (свободный выбор).`}</p>
                </div>
              </div>
            </section>

            {/* 5. Модерация */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Eye className="h-4 w-4 text-sky-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">5. Модерация</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-12">
                Все профили проходят модерацию. Отзывы также проходят проверку перед публикацией. Администрация оставляет за собой право заблокировать пользователя за нарушение правил.
              </p>
            </section>

            {/* 6. Ответственность */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Scale className="h-4 w-4 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">6. Ответственность</h3>
              </div>
              <div className="text-muted-foreground leading-relaxed space-y-3 pl-12">
                <p>Компания не будет выступать и не выступает в качестве лица, ответственного и (или) заинтересованного в отношениях между Исполнителем и Заказчиком. Отношения между Исполнителем и Заказчиком регулируется законодательством РФ, если иное прямо не предусмотрено Соглашением и (или) Регулирующими документами.</p>
                <p>Пользователь самостоятельно и всецело несёт все риски и ответственность за соответствие законодательству, содержание, полноту, корректность и достоверность размещённой им информации и Контента.</p>
                <p>Пользователь и (или) Посетитель соглашается и понимает, что Исполнитель и (или) Заказчик не является сотрудником Компании, аффилированным лицом либо иным лицом, как-либо связанным с Компанией, за которое Компания может, либо обязано нести ответственность. Компания несёт ответственность лишь в части оказываемых Информационных услуг, которые оказываются Пользователю и (или) Посетителю через средства Интернет-ресурса, в связи с чем Компания не может нести ответственность за третьих лиц, в том числе за Заказчика либо Исполнителя.</p>
                <p>Компания ни при каких обстоятельствах не несёт никакой ответственности за:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>какие-либо действия/бездействие, являющиеся прямым или косвенным результатом действий/бездействия Пользователя и/или третьих лиц;</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>какие-либо косвенные убытки и/или упущенную выгоду Пользователя и/или третьих сторон вне зависимости от того, могла ли Компания предвидеть возможность таких убытков или нет;</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>взаиморасчёты между Заказчиком и Исполнителем, так как все договорённости между заказчиком и исполнителем достигаются напрямую, самостоятельно;</li>
                  <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>использование (невозможность использования) и какие бы то ни было последствия использования (невозможности использования) Пользователем выбранной им формы оплаты Услуг, а равно использование/невозможность использования Пользователем и/или третьими лицами любых средств и/или способов передачи/получения информации.</li>
                </ul>
                <p className="font-medium text-gray-700">Платформа не может гарантировать получение заказов исполнителями.</p>
                <p className="font-medium text-red-600">За нарушения правил пользования сервисом «SVMontaj», Пользователи будут безвозвратно заблокированы.</p>
              </div>
            </section>

            {/* 7. Вступление в силу */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ScrollText className="h-4 w-4 text-orange-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">7. Вступление в силу правил и порядок изменения</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-12">
                Компания оставляет за собой право изменять условия Правил и всех их неотъемлемых частей без согласования с Пользователем с уведомлением последнего посредством размещения на своём Интернет-ресурсе новой редакции Правил, или какой-либо его неотъемлемой части, подвергшейся изменениям. При этом Пользователь обязуется самостоятельно знакомиться с новым содержанием Правил, размещённого на Интернет-ресурсе. Новая редакция Правил и/или какой-либо его неотъемлемой части вступает в силу с момента опубликования на Интернет-ресурсе.
              </p>
            </section>

            {/* 8. Возврат денежных средств */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">8. Возврат денежных средств</h3>
              </div>
              <div className="text-muted-foreground leading-relaxed space-y-3 pl-12">
                <p>Возврат денежных средств с баланса осуществляется путём направления заявки на электронную почту.</p>
                <p>В заявке указать в строке темы: <span className="font-semibold">«Заявка на возврат денежных средств»</span>.</p>
                <p>В заявке указать точные данные заявителя (ФИО — должны соответствовать данным, как в личном кабинете пользователя), контактный номер телефона, реквизиты карты банка, серия и номер паспорта, дата выдачи, кем выдан.</p>
                <p>В ответ на заявку придёт уведомление о приёме заявки и присвоят номер.</p>
                <p>Средства переводятся после идентификации заявителя в течение пяти рабочих дней за вычетом банковской комиссии.</p>
                <p className="mt-2">
                  Почта для заявок:{' '}
                  <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="text-primary hover:underline font-semibold">SVMontaj24@mail.ru</a>
                </p>
              </div>
            </section>

            {/* 9. Удаление своего аккаунта */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">9. Удаление своего аккаунта</h3>
              </div>
              <div className="text-muted-foreground leading-relaxed space-y-3 pl-12">
                <p>Удаление пользователя с сайта, происходит, путём направления Заявления (свободная форма), о желании удалить свой аккаунт с площадки. Необходимо указать в заявлении свои личные данные и контактный номер телефона заявителя. Заявление направляется на электронную почту, по обратной связи.</p>
                <p>В теме указать: <span className="font-semibold">«Заявление на удаление аккаунта»</span>. В тексте можете написать причину.</p>
                <p>После проверки подлинности заявления, аккаунт заявителя с его данными, будет удалён.</p>
                <p>В случае, желания восстановить аккаунт обратно, вы должны будете пройти заново регистрацию.</p>
              </div>
            </section>

            {/* 10. Обратная связь */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-teal-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">10. Обратная связь</h3>
              </div>
              <div className="pl-12 space-y-2">
              <p className="text-muted-foreground">
                  По всем вопросам обращайтесь:{' '}
                  <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="text-primary hover:underline font-semibold">SVMontaj24@mail.ru</a>
              </p>
                <p className="text-sm text-gray-400">
                  Пользователь выражает своё согласие на получение личных сообщений от Администрации в любое время и любого характера, в том числе и информационно-рекламного.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
