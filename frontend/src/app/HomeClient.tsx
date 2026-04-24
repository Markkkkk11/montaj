'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { X, Mail, MessageCircle, ChevronRight, ChevronDown, Shield, Clock, Star, Zap, ArrowRight, HelpCircle } from 'lucide-react';

const SPECIALIZATIONS = [
  {
    name: 'Окна и СПК',
    icon: '🪟',
    color: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    description: 'Установка и замена пластиковых, деревянных и алюминиевых окон. Монтаж подоконников, откосов, отливов. Остекление балконов и лоджий.',
    works: ['Установка ПВХ-окон', 'Монтаж деревянных окон', 'Остекление балконов', 'Установка подоконников и откосов', 'Замена стеклопакетов', 'Регулировка фурнитуры', 'Монтаж светопрозрачных конструкций, перегородок'],
  },
  {
    name: 'Двери',
    icon: '🚪',
    color: 'from-amber-500 to-orange-400',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    description: 'Установка межкомнатных и входных дверей. Монтаж дверных коробок, наличников, доборов. Врезка замков и фурнитуры.',
    works: ['Установка входных дверей', 'Монтаж межкомнатных дверей', 'Врезка замков', 'Установка наличников и доборов', 'Раздвижные двери', 'Ремонт дверей'],
  },
  {
    name: 'Потолки',
    icon: '✨',
    color: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    description: 'Монтаж натяжных потолков (ПВХ, тканевых). Установка многоуровневых конструкций. Точечные светильники и LED-подсветка.',
    works: ['Натяжные потолки ПВХ', 'Тканевые натяжные потолки', 'Многоуровневые потолки', 'Установка светильников', 'Потолки из гипсокартона', 'LED-подсветка'],
  },
  {
    name: 'Кондиционеры',
    icon: '❄️',
    color: 'from-sky-500 to-blue-400',
    bg: 'bg-sky-50',
    border: 'border-sky-100',
    description: 'Установка сплит-систем и мульти-сплит систем. Монтаж канальных и кассетных кондиционеров. Прокладка фреоновых трасс.',
    works: ['Установка сплит-систем', 'Мульти-сплит системы', 'Канальные кондиционеры', 'Прокладка фреоновых трасс', 'Обслуживание и чистка', 'Заправка фреоном'],
  },
  {
    name: 'Рольставни',
    icon: '🏠',
    color: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    description: 'Установка рольставней на окна и двери. Монтаж защитных роллет. Автоматические приводы и ручное управление.',
    works: ['Установка рольставней', 'Защитные роллеты', 'Автоматические приводы', 'Ручное управление', 'Ремонт рольставней', 'Замена полотна'],
  },
  {
    name: 'Мебель',
    icon: '🪑',
    color: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    description: 'Сборка и установка корпусной мебели. Монтаж кухонных гарнитуров. Установка встроенных шкафов-купе.',
    works: ['Сборка корпусной мебели', 'Установка кухонь', 'Шкафы-купе', 'Встроенная мебель', 'Навеска полок и зеркал', 'Установка карнизов'],
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Проверенные специалисты',
    description: 'Каждый исполнитель проходит модерацию. Рейтинги и отзывы помогут сделать правильный выбор.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Clock,
    title: 'Быстрые отклики',
    description: 'Получайте предложения от специалистов в течение нескольких минут после размещения заказа.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Star,
    title: 'Гарантия качества',
    description: 'Система рейтингов и отзывов мотивирует исполнителей работать на высшем уровне.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Svmontaj.ru платный?',
    answer: 'Нет, регистрация и создание заявки в сервисе Svmontaj.ru является бесплатной.',
  },
  {
    question: 'По каким видам работ можно создавать/выполнять заказы?',
    answer: 'На данный момент на сайте Svmontaj.ru возможно размещать и выполнять работы по 6 специализациям:\n\n1. ОКНА И СПК — монтаж, регулировка, ремонт всех видов светопрозрачных конструкций.\n2. ДВЕРИ — монтаж, регулировка, ремонт всех видов дверей (входные, межкомнатные и т.п.)\n3. ПОТОЛКИ — монтаж, регулировка, ремонт всех видов потолков (натяжные, подвесные и т.п.)\n4. КОНДИЦИОНЕРЫ — монтаж, регулировка, ремонт систем кондиционирования воздуха, вентиляции и т.п.\n5. РОЛЬСТАВНИ — монтаж, регулировка, ремонт рольставней, жалюзи, роллеты и т.п.\n6. МЕБЕЛЬ — сборка мебели, регулировка, ремонт.',
  },
  {
    question: 'Как стать Исполнителем?',
    answer: 'Исполнителем может стать Организация, ИП, Физ. лицо.\n\nНа главной странице нажмите кнопку «Я исполнитель» или «Регистрация». Выберите роль «Исполнитель», заполните ФИО, номер телефона, пароль и город. После регистрации подтвердите номер телефона — вам поступит звонок, введите последние 4 цифры входящего номера. Затем войдите в личный кабинет и заполните профиль исполнителя: укажите специализации, город работы и описание опыта. После проверки профиля модератором вы получите доступ к заказам в выбранном городе. При регистрации вы бесплатно получаете тариф «Премиум» на 30 дней.',
  },
  {
    question: 'Как стать Заказчиком?',
    answer: 'Заказчиком может стать Организация, ИП, Физ. лицо.\n\nНа главной странице нажмите кнопку «Разместить заказ» или «Регистрация». Выберите роль «Заказчик», заполните ФИО, номер телефона, пароль и город. После регистрации подтвердите номер телефона — вам поступит звонок, введите последние 4 цифры входящего номера. Затем войдите в личный кабинет — вы сразу можете создавать заказы. Укажите категорию работ, описание, город, адрес объекта, бюджет и сроки. При необходимости прикрепите фото, чертежи или документы. Размещение заказов бесплатное.',
  },
  {
    question: 'Как работать Исполнителю на сайте?',
    answer: 'Пошаговая инструкция для исполнителя:\n\n1. Войдите в личный кабинет. В верхней части вы увидите статистику: баланс, бонусы, тариф, рейтинг и количество выполненных заказов.\n2. Нажмите кнопку «Заказы» — откроется список доступных заказов, отфильтрованных по вашему городу и специализациям. Можно переключиться между видами «Список» и «Карта».\n3. Используйте фильтры (регион, специализация, сортировка), чтобы найти подходящий заказ.\n4. Нажмите «Подробнее» на интересующем заказе — откроется полная карточка: описание работ, адрес объекта, бюджет, сроки, способ оплаты и прикреплённые документы/фото.\n5. Если заказ вам подходит, нажмите кнопку «Откликнуться на заказ». С вашего баланса/бонусов будет списана стоимость отклика (зависит от тарифа: Стандарт — 150₽, Комфорт — 500₽ при выборе, Премиум — бесплатно).\n6. Дождитесь ответа заказчика. Статус отклика отслеживайте в разделе «Мои отклики» в личном кабинете. Статус «Ожидание» означает, что заказчик ещё не принял решение.\n7. Как только заказчик выберет вас, вам придёт уведомление. Статус заказа изменится на «Исполнитель выбран». Вам станут доступны контакты заказчика — свяжитесь с ним для согласования всех деталей (дата, время, объём работ).\n8. Прибыв на объект, откройте заказ и нажмите кнопку «Приступить к работе». Статус заказа изменится на «В работе» — заказчик увидит, что вы приступили.\n9. После полного выполнения всех работ и получения оплаты от заказчика нажмите кнопку «Заказ выполнен». Статус изменится на «Завершён».\n10. После завершения заказа вам будет предложено оставить отзыв о заказчике — нажмите «Оставить отзыв», поставьте оценку и напишите комментарий.\n11. Завершённый заказ переместится в раздел «Завершённые заказы» в вашем личном кабинете.\n\nВажно: следите за балансом! Пополнить его можно через кнопку «Баланс» в личном кабинете. При первом пополнении от 150 рублей, в течении 30 дней с момента регистрации, вы получите 1000 бонусных рублей.',
  },
  {
    question: 'Как работать Заказчику на сайте?',
    answer: 'Пошаговая инструкция для заказчика:\n\n1. После входа в личный кабинет нажмите «Создать заказ».\n2. Заполните форму: выберите категорию работ, укажите заголовок, подробное описание, город, адрес объекта (выберите из подсказок), даты начала и окончания работ, бюджет и способ оплаты. При необходимости прикрепите фото, чертежи или документы (до 5 файлов).\n3. Нажмите «Создать заказ» — заявка будет опубликована и станет видна исполнителям.\n4. Дождитесь откликов от специалистов. Вы получите уведомление о каждом новом отклике.\n5. Откройте заказ и просмотрите список откликнувшихся исполнителей. Нажмите «Профиль», чтобы изучить опыт, рейтинг и отзывы каждого специалиста.\n6. Выберите подходящего исполнителя, нажав кнопку «Выбрать исполнителя» — после этого вам станут доступны его контакты (телефон, email) и откроется чат для общения.\n7. Исполнитель нажмёт «Приступить к работе», а после завершения — «Заказ выполнен». Вы сможете отслеживать статус заказа в личном кабинете.\n8. После завершения заказа оставьте отзыв об исполнителе, нажав «Оставить отзыв» — это поможет другим заказчикам.',
  },
  {
    question: 'Как быстро откликаются на Заказ?',
    answer: 'Время отклика на заказ зависит от нескольких факторов: время размещения заявки, количество свободных специалистов, стоимость работ.',
  },
  {
    question: 'Что сделать, чтобы на Заказы откликалось больше специалистов?',
    answer: 'Опишите подробно, какие работы необходимо выполнить, сроки выполнения, приложите необходимые чертежи/схемы/фото, укажите реалистичную стоимость и адрес.',
  },
  {
    question: 'Как выбрать специалиста?',
    answer: 'При выборе специалиста изучите анкету исполнителя, какой у него опыт в данной специализации. Обратите внимание на отзывы по выполненным работам. Данная информация поможет вам определиться, подходит вам специалист или нет.',
  },
  {
    question: 'Для чего нужны отзывы о специалистах?',
    answer: 'Отзывы на специалистов помогают улучшить качество монтажных работ. При проявлении грубых нарушений со стороны специалистов сервис Svmontaj.ru предусматривает меры, вплоть до блокировки анкеты специалиста. Также отзывы помогают создать большую базу хороших специалистов по монтажным работам, которая будет полезна вам при заказах.',
  },
  {
    question: 'Для чего нужны отзывы о Заказчиках?',
    answer: 'Отзывы на заказчиков помогают исполнителям понять о серьёзном отношении к поставленным задачам, насколько ответственный заказчик, защита от мошенников и недобросовестных заказчиков, а также для создания репутации профессионального заказчика. При проявлении грубых нарушений со стороны заказчика сервис Svmontaj.ru предусматривает меры, вплоть до блокировки анкеты заказчика.',
  },
  {
    question: 'Какие есть Бонусы и Акции?',
    answer: 'Бонусы и Акции для Исполнителей:\n• Все, кто выполнит более 120 заказов до 1 декабря 2026 года, получит от сайта SVMontaj.ru, денежные сертификаты от Мультикарты и 5000 бонусных рублей на свой счёт. Сертификаты и бонусные рубли будут доставлены до 25 декабря 2026г.\n• При первой регистрации на сайте вы бесплатно подключаетесь к Премиум тарифу на 30 дней.\n• 1000 бонусных рублей начисляется только после первого пополнения баланса на сумму от 150 рублей в течение 30 дней после регистрации. Бонусы можно использовать для оплаты откликов и Premium с баланса.\n\nБонусы и Акции для Заказчиков:\n• Все, кто разместит более 120 заказов до 1 декабря 2026 года, и их  выполнят исполнители, получит от сайта SVMontaj.ru, денежные сертификаты от Мультикарты. Сертификаты будут доставлены до 25 декабря 2026г.\n• При первой регистрации вы можете бесплатно размещать неограниченное количество заявок в течение года.',
  },
];

export default function HomeClient() {
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSettingsStore();
  const router = useRouter();
  const [selectedSpec, setSelectedSpec] = useState<typeof SPECIALIZATIONS[0] | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings().catch((err) => console.error('Failed to load public settings:', err));
  }, [fetchSettings]);

  useEffect(() => {
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

  const trialDays = parseInt(settings.trialDays || '30', 10);
  const standardResponsePrice = parseInt(settings.standardResponsePrice || '150', 10);
  const comfortOrderTakenPrice = parseInt(settings.comfortOrderTakenPrice || '500', 10);
  const trialDaysLabel = `${trialDays} ${trialDays === 1 ? 'день' : trialDays < 5 ? 'дня' : 'дней'}`;
  const faqItems = FAQ_ITEMS.map((item) => ({
    ...item,
    answer: item.answer
      .replaceAll('тариф «Премиум» на 30 дней', `тариф «Премиум» на ${trialDaysLabel}`)
      .replaceAll('Премиум тарифу на 30 дней', `Премиум тарифу на ${trialDaysLabel}`)
      .replaceAll('Стандарт — 150₽', `Стандарт — ${standardResponsePrice}₽`)
      .replaceAll('Комфорт — 500₽ при выборе', `Комфорт — ${comfortOrderTakenPrice}₽ при выборе`),
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-white/20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.jpg" alt="SVMontaj" className="h-11 w-11 rounded-full object-contain bg-white ring-2 ring-white shadow-soft transition-transform duration-300 group-hover:scale-105" />
            <span className="text-xl font-bold hidden sm:inline">
              <span className="text-blue-600">SV</span><span className="text-red-500">Montaj</span>
            </span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Войти</Button>
            </Link>
            <Link href="/register">
              <Button className="shadow-lg shadow-primary/20">Регистрация</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden">
        {/* Background decorations - contained within section */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-20 -left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-10 w-56 sm:w-96 h-56 sm:h-96 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-32 sm:w-48 h-32 sm:h-48 bg-pink-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-blue-100 rounded-full px-3 sm:px-4 py-2 mb-6 sm:mb-8 shadow-soft">
              <Zap className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Платформа монтажных услуг №1</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 sm:mb-6 tracking-tight leading-[1.1]">
              <span className="text-gray-900">Найдите мастера</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                для любых задач
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-500 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-2">
              Проверенные специалисты по установке окон, дверей, потолков, кондиционеров
              и другим монтажным работам — рядом с вами
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link href="/register?role=customer">
                <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 shadow-xl shadow-blue-500/25">
                  Разместить заказ
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register?role=executor">
                <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 border-2">
                  Стать исполнителем
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Как это работает</h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Три простых шага до идеального результата
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 stagger-children max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Разместите заказ',
                desc: 'Опишите задачу, укажите бюджет и сроки. Регистрация и размещение заказов — бесплатно',
                gradient: 'from-blue-500 to-cyan-400',
              },
              {
                step: '02',
                title: 'Выберите исполнителя',
                desc: 'Получайте отклики от проверенных специалистов. Сравнивайте рейтинги и отзывы',
                gradient: 'from-violet-500 to-purple-400',
              },
              {
                step: '03',
                title: 'Получите результат',
                desc: 'Работа выполняется в оговорённые сроки. Оплата напрямую исполнителю',
                gradient: 'from-emerald-500 to-teal-400',
              },
            ].map((item) => (
              <div key={item.step} className="relative group">
                <div className="absolute -top-4 -left-2">
                  <span className={`text-6xl font-black bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent opacity-20 group-hover:opacity-30 transition-opacity`}>
                    {item.step}
                  </span>
                </div>
                <Card className="pt-10 h-full hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 border-gray-100 overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.gradient}`} />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 bg-gray-50/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Почему выбирают нас</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto stagger-children">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center text-center group">
                <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-soft`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specializations */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Наши специализации</h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto">
              Выберите направление и найдите подходящего мастера
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-6xl mx-auto">
            {SPECIALIZATIONS.map((spec) => (
              <div
                key={spec.name}
                onClick={() => setSelectedSpec(spec)}
                className={`relative p-4 sm:p-6 bg-white rounded-2xl border-2 ${spec.border} hover:shadow-soft-lg transition-shadow duration-300 cursor-pointer group hover:-translate-y-1 overflow-hidden`}
              >
                <div className={`absolute inset-0 ${spec.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative">
                  <div className="text-3xl sm:text-5xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                    {spec.icon}
                  </div>
                  <h4 className="text-lg font-bold mb-2 text-gray-900">{spec.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{spec.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    Подробнее <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialization Detail Modal */}
      {selectedSpec && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={() => setSelectedSpec(null)}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl transform scale-100 mx-2 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 ${selectedSpec.bg} rounded-2xl flex items-center justify-center`}>
                    <span className="text-4xl">{selectedSpec.icon}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900">{selectedSpec.name}</h3>
                </div>
                <button 
                  onClick={() => setSelectedSpec(null)} 
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <p className="text-gray-500 mb-8 leading-relaxed">{selectedSpec.description}</p>
              <h4 className="font-bold text-gray-900 mb-4">Виды работ:</h4>
              <ul className="space-y-3 mb-8">
                {selectedSpec.works.map((work, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 flex-shrink-0" />
                    <span className="text-sm">{work}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?role=customer">
                <Button className="w-full" size="lg">
                  Разместить заказ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MmgtNHYtMnptMC04aDR2MmgtNHYtMnptLTggOGg0djJoLTR2LTJ6bTAtOGg0djJoLTR2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30 pointer-events-none" />
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4">
            Готовы начать?
          </h2>
          <p className="text-blue-100 text-base sm:text-lg mb-6 sm:mb-8 max-w-xl mx-auto">
            Зарегистрируйтесь бесплатно и получите доступ к сотням заказов и исполнителей
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <Link href="/register?role=customer">
              <Button size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-gray-50 shadow-xl">
                Я заказчик
              </Button>
            </Link>
            <Link href="/register?role=executor">
              <Button size="lg" className="w-full sm:w-auto bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 hover:border-white/60 shadow-xl">
                Я исполнитель
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-blue-50 rounded-full px-3 sm:px-4 py-2 mb-4 sm:mb-6">
              <HelpCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-blue-700">Ответы на вопросы</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-gray-900">Популярные вопросы</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Всё, что нужно знать о работе с платформой
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-soft"
            >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left gap-4"
                >
                  <span className="font-semibold text-gray-900 text-[15px] leading-snug">{item.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaqIndex === index ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-5 pb-5 pt-0">
                    <div className="w-full h-px bg-gray-200 mb-4" />
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.answer}</p>
                  </div>
                </div>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section className="py-20 bg-gray-50/80">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card className="overflow-hidden border-0 shadow-soft-lg">
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-xl sm:text-2xl font-extrabold">Обратная связь</CardTitle>
                <CardDescription className="text-sm sm:text-base">Есть вопросы? Свяжитесь с нами</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-all duration-200 group hover:shadow-soft">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Email</p>
                      <p className="text-xs text-muted-foreground">SVMontaj24@mail.ru</p>
                    </div>
                  </a>
                  <a href="https://max.ru/u/f9LHodD0cOKIe-cyRoYq_Udu4_b14n0rL0vJ3BA4GWqjW0uOGlGmWjK1Vow" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-sky-50 rounded-2xl hover:bg-sky-100 transition-all duration-200 group hover:shadow-soft">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                      <MessageCircle className="h-5 w-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">MAX</p>
                      <p className="text-xs text-muted-foreground">Мессенджер</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="SVMontaj" className="h-8 w-8 rounded-full object-contain bg-white" />
              <span className="font-bold"><span className="text-blue-600">SV</span><span className="text-red-500">Montaj</span></span>
            </div>
            <div className="text-sm text-muted-foreground text-center sm:text-right">
              <p>&copy; 2026 SVMontaj. Все права защищены.</p>
              <p className="text-[10px] mt-1 text-muted-foreground/50">Сосновцев Сергей Геннадьевич, ИНН 502715051593</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
