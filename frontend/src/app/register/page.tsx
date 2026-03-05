'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { RegisterData } from '@/lib/types';
import { ArrowLeft, UserPlus, Briefcase, Wrench, ChevronRight, ScrollText, Shield, Users, Hammer, CreditCard, Eye, Scale, Mail, Banknote, X } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyPhone, sendSMS, isLoading, error, setError } = useAuthStore();

  const [step, setStep] = useState<'role' | 'info' | 'verify'>('role');
  const [role, setRole] = useState<'CUSTOMER' | 'EXECUTOR'>(
    (searchParams.get('role')?.toUpperCase() as 'CUSTOMER' | 'EXECUTOR') || 'CUSTOMER'
  );
  const [formData, setFormData] = useState<Partial<RegisterData>>({
    role: role,
    agreeToTerms: false,
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleRoleSelect = (selectedRole: 'CUSTOMER' | 'EXECUTOR') => {
    setRole(selectedRole);
    setFormData({ ...formData, role: selectedRole });
    setStep('info');
  };

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const digits = value.replace(/\D/g, '');
    if (digits.length > 0 && !digits.startsWith('7') && !digits.startsWith('8')) {
      value = '7' + digits;
    } else if (digits.startsWith('8')) {
      value = '7' + digits.slice(1);
    }
    const formatted = formatPhone(value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setError('Введите корректный номер телефона');
      return;
    }

    try {
      await register(formData as RegisterData);
      setRegisteredPhone(formData.phone!);
      setResendTimer(60);
      setStep('verify');
    } catch (err) {
      // Ошибка уже в store
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (verificationCode.length < 4) {
      setError('Введите код полностью');
      return;
    }

    try {
      const success = await verifyPhone(registeredPhone, verificationCode);
      if (success) {
        router.push('/login?verified=true');
      }
    } catch (err) {
      // Ошибка уже в store
    }
  };

  const handleResendCode = useCallback(async () => {
    if (resendTimer > 0) return;
    setError(null);
    setVerificationCode('');
    
    try {
      await sendSMS(registeredPhone);
      setResendTimer(60);
    } catch (err) {
      // Ошибка уже в store
    }
  }, [resendTimer, registeredPhone, sendSMS, setError]);

  // Шаг 1: Выбор роли
  if (step === 'role') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-20 -right-10 w-48 sm:w-72 h-48 sm:h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -left-10 w-56 sm:w-80 h-56 sm:h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-2xl relative animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-6 transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            На главную
          </Link>

          <Card className="border-0 shadow-soft-xl">
            <CardHeader className="text-center pb-2 pt-6 sm:pt-8">
              <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-extrabold">Регистрация</CardTitle>
              <CardDescription className="text-sm sm:text-base">Выберите, кем вы хотите зарегистрироваться</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8 space-y-3 sm:space-y-4">
              <button
                onClick={() => handleRoleSelect('CUSTOMER')}
                className="w-full p-4 sm:p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 text-left group flex items-center gap-3 sm:gap-5 hover:shadow-soft"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold mb-0.5 sm:mb-1 text-gray-900">Заказчик</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Разместите заказ и выберите исполнителя
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
              </button>

              <button
                onClick={() => handleRoleSelect('EXECUTOR')}
                className="w-full p-4 sm:p-6 border-2 border-gray-100 rounded-2xl hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-300 text-left group flex items-center gap-3 sm:gap-5 hover:shadow-soft"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench className="h-6 w-6 sm:h-7 sm:w-7 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold mb-0.5 sm:mb-1 text-gray-900">Исполнитель</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Откликайтесь на заказы и выполняйте работы
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
              </button>

              <div className="pt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Уже есть аккаунт?{' '}
                  <Link href="/login" className="text-primary hover:underline font-semibold">
                    Войти
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Шаг 2: Заполнение информации
  if (step === 'info') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-20 -right-10 w-48 sm:w-72 h-48 sm:h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative animate-fade-in-up">
          <button
            onClick={() => setStep('role')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Назад к выбору роли
          </button>

          <Card className="border-0 shadow-soft-xl">
            <CardHeader className="pt-6 sm:pt-8 px-4 sm:px-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === 'CUSTOMER' ? 'bg-blue-50' : 'bg-violet-50'}`}>
                  {role === 'CUSTOMER' ? <Briefcase className="h-5 w-5 text-blue-600" /> : <Wrench className="h-5 w-5 text-violet-600" />}
                </div>
                <div>
                  <CardTitle className="text-xl">Регистрация</CardTitle>
                  <CardDescription>{role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">ФИО *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Иванов Иван Иванович"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+7 (999) 123-45-67"
                    value={formData.phone || ''}
                    onChange={handlePhoneChange}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.ru"
                  />
                  <p className="text-xs text-muted-foreground mt-1">На него будут приходить чеки оплат и рассылка</p>
                </div>

                <div>
                  <Label htmlFor="password">Пароль *</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Минимум 6 символов"
                  />
                </div>

                <div>
                  <Label htmlFor="city">Город *</Label>
                  <select
                    id="city"
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Выберите город</option>
                    <option value="Москва и обл.">Москва и обл.</option>
                    <option value="Санкт-Петербург и обл.">Санкт-Петербург и обл.</option>
                    <option value="Краснодар">Краснодар</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="organization">Организация <span className="text-xs text-muted-foreground font-normal">(необязательно)</span></Label>
                  <Input
                    id="organization"
                    value={formData.organization || ''}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="ООО «Компания»"
                  />
                </div>

                <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    required
                    checked={formData.agreeToTerms || false}
                    onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                    className="rounded mt-0.5 h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  />
                  <Label htmlFor="agreeToTerms" className="font-normal leading-relaxed text-sm mb-0">
                    Я ознакомился и согласен с{' '}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setShowRules(true); }}
                      className="text-primary hover:underline font-semibold"
                    >
                      правилами работы сайта
                    </button>
                  </Label>
                </div>

                {/* Модальное окно с правилами */}
                <Dialog open={showRules} onOpenChange={setShowRules}>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 [&>button:last-child]:hidden">
                    {/* Шапка */}
                    <div className="bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-5 text-white relative flex-shrink-0">
                      <button
                        onClick={() => setShowRules(false)}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      >
                        <X className="h-4 w-4 text-white" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                          <ScrollText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <DialogHeader>
                            <DialogTitle className="text-white text-lg font-bold">Правила работы на платформе «SVMontaj»</DialogTitle>
                          </DialogHeader>
                          <p className="text-blue-100 text-xs mt-0.5">от 21.02.2026</p>
                        </div>
                      </div>
                    </div>

                    {/* Содержимое с прокруткой */}
                    <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                      {/* 1. Общие положения */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">1. Общие положения</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-9">
                          Платформа «SVMontaj» (далее Компания) — это сервис, который помогает заказчикам найти проверенных специалистов по монтажным работам, а исполнителям — получать заказы. Регистрируясь на платформе, вы соглашаетесь с настоящими правилами. Компания оказывает информационные услуги, операционно-технологические услуги (в том числе, заведение/обработка информации на сайте, мониторинг и поиск Заявок, информирование Пользователей о текущем статусе Заявки) с использованием Интернет ресурса.
                        </p>
                      </section>

                      {/* 2. Для заказчиков */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">2. Для заказчиков</h3>
                        </div>
                        <ul className="space-y-1.5 pl-9">
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Регистрация и размещение заказов на платформе бесплатны.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Заказчик обязан предоставить достоверную информацию о себе и своих заказах.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Оплата за выполненные работы гарантируется и производится напрямую исполнителю по договорённости.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Заказчик обязуется оставлять объективные отзывы о работе исполнителя.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-emerald-500 mt-1.5 flex-shrink-0">•</span>Запрещено размещать не существующие заказы, заказы не связанные с монтажными работами, указывать в описании/прикреплённых файлах заказа контактную информацию, размещать информацию запрещённую на территории РФ.</li>
                        </ul>
                      </section>

                      {/* 3. Для исполнителей */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Hammer className="h-3.5 w-3.5 text-violet-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">3. Для исполнителей</h3>
                        </div>
                        <ul className="space-y-1.5 pl-9">
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Исполнитель обязан предоставить достоверную информацию о себе, опыте и квалификации.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Исполнитель обязан качественно выполнять принятые заказы в оговорённые сроки.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Стоимость отклика зависит от выбранного тарифа (Стандарт, Комфорт, Премиум).</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Новые исполнители получают тариф «Премиум» на 30 дней бесплатно. 1000 бонусных рублей начисляется только после первого пополнения баланса на сумму от 150 рублей в течении 30 дней после регистрации. Бонусы можно использовать для оплаты откликов на заказы.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Рейтинг исполнителя формируется на основе отзывов заказчиков.</li>
                          <li className="text-sm text-gray-600 flex items-start gap-2"><span className="text-violet-500 mt-1.5 flex-shrink-0">•</span>Контактные данные исполнителя открываются заказчику только после выбора исполнителя.</li>
                        </ul>
                      </section>

                      {/* 4. Тарифы для исполнителей */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">4. Тарифы для исполнителей</h3>
                        </div>
                        <div className="space-y-2 pl-9">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm font-semibold text-gray-800">Стандарт</p>
                            <p className="text-xs text-gray-500 mt-0.5">150 ₽ за каждый отклик. 1 специализация (свободный выбор).</p>
                          </div>
                          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                            <p className="text-sm font-semibold text-blue-800">Комфорт — 500 ₽/мес</p>
                            <p className="text-xs text-blue-600/70 mt-0.5">Бесплатные отклики. 500 ₽ списывается при выборе заказчиком. 1 специализация (свободный выбор).</p>
                          </div>
                          <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-100">
                            <p className="text-sm font-semibold text-violet-800">Премиум</p>
                            <p className="text-xs text-violet-600/70 mt-0.5">5000 ₽ за 30 дней. Безлимитные отклики, до 3 специализаций (свободный выбор).</p>
                          </div>
                        </div>
                      </section>

                      {/* 5. Модерация */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Eye className="h-3.5 w-3.5 text-sky-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">5. Модерация</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-9">
                          Все профили проходят модерацию. Отзывы также проходят проверку перед публикацией. Администрация оставляет за собой право заблокировать пользователя за нарушение правил.
                        </p>
                      </section>

                      {/* 6. Ответственность */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Scale className="h-3.5 w-3.5 text-red-500" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">6. Ответственность</h3>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed space-y-2 pl-9">
                          <p>Компания не будет выступать и не выступает в качестве лица, ответственного и (или) заинтересованного в отношениях между Исполнителем и Заказчиком. Отношения между Исполнителем и Заказчиком регулируется законодательством РФ, если иное прямо не предусмотрено Соглашением и (или) Регулирующими документами.</p>
                          <p>Пользователь самостоятельно и всецело несёт все риски и ответственность за соответствие законодательству, содержание, полноту, корректность и достоверность размещённой им информации и Контента.</p>
                          <p>Пользователь и (или) Посетитель соглашается и понимает, что Исполнитель и (или) Заказчик не является сотрудником Компании, аффилированным лицом либо иным лицом, как-либо связанным с Компанией, за которое Компания может, либо обязано нести ответственность.</p>
                          <p>Компания ни при каких обстоятельствах не несёт никакой ответственности за:</p>
                          <ul className="space-y-1 ml-3">
                            <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>какие-либо действия/бездействие, являющиеся прямым или косвенным результатом действий/бездействия Пользователя и/или третьих лиц;</li>
                            <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>какие-либо косвенные убытки и/или упущенную выгоду Пользователя и/или третьих сторон вне зависимости от того, могла ли Компания предвидеть возможность таких убытков или нет;</li>
                            <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>взаиморасчёты между Заказчиком и Исполнителем, так как все договорённости между заказчиком и исполнителем достигаются напрямую, самостоятельно;</li>
                            <li className="flex items-start gap-2"><span className="text-red-400 mt-1.5 flex-shrink-0">•</span>использование (невозможность использования) и какие бы то ни было последствия использования (невозможности использования) Пользователем выбранной им формы оплаты Услуг.</li>
                          </ul>
                          <p className="font-medium text-gray-700">Платформа не может гарантировать получение заказов исполнителями.</p>
                          <p>За нарушения правил пользования сервисом «SVMontaj», Пользователи будут безвозвратно заблокированы.</p>
                        </div>
                      </section>

                      {/* 7. Вступление в силу */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ScrollText className="h-3.5 w-3.5 text-orange-500" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">7. Вступление в силу правил и порядок изменения</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed pl-9">
                          Компания оставляет за собой право изменять условия Правил и всех их неотъемлемых частей без согласования с Пользователем с уведомлением последнего посредством размещения на своём Интернет-ресурсе новой редакции Правил. Пользователь обязуется самостоятельно знакомиться с новым содержанием Правил. Новая редакция Правил вступает в силу с момента опубликования на Интернет-ресурсе.
                        </p>
                      </section>

                      {/* 8. Возврат денежных средств */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Banknote className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">8. Возврат денежных средств</h3>
                        </div>
                        <div className="text-sm text-gray-600 leading-relaxed space-y-2 pl-9">
                          <p>Возврат денежных средств с баланса осуществляется путём направления заявки на электронную почту.</p>
                          <p>В заявке указать в строке темы: <span className="font-semibold">«Заявка на возврат денежных средств»</span>.</p>
                          <p>В заявке указать точные данные заявителя (ФИО — должны соответствовать данным, как в личном кабинете пользователя), контактный номер телефона, реквизиты карты банка, серия и номер паспорта, дата выдачи, кем выдан.</p>
                          <p>В ответ на заявку придёт уведомление о приёме заявки и присвоят номер.</p>
                          <p>Средства переводятся после идентификации заявителя в течение пяти рабочих дней за вычетом банковской комиссии.</p>
                          <p>Cумма средств на возврат не может превышать сумму текущего баланса.</p>
                          <p>
                            Почта для заявок:{' '}
                            <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="text-primary hover:underline font-semibold">SVMontaj24@mail.ru</a>
                          </p>
                        </div>
                      </section>

                      {/* 9. Обратная связь */}
                      <section>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Mail className="h-3.5 w-3.5 text-teal-600" />
                          </div>
                          <h3 className="text-sm font-bold text-gray-900">9. Обратная связь</h3>
                        </div>
                        <div className="pl-9 space-y-1.5">
                          <p className="text-sm text-gray-600">
                            По всем вопросам обращайтесь:{' '}
                            <a href="https://e.mail.ru/compose/?to=SVMontaj24@mail.ru" className="text-primary hover:underline font-semibold">SVMontaj24@mail.ru</a>
                          </p>
                          <p className="text-xs text-gray-400">
                            Пользователь выражает своё согласие на получение личных сообщений от Администрации в любое время и любого характера, в том числе и информационно-рекламного.
                          </p>
                        </div>
                      </section>
                    </div>

                    {/* Кнопка закрытия внизу */}
                    <div className="border-t px-6 py-4 bg-gray-50/80 flex-shrink-0">
                      <Button onClick={() => setShowRules(false)} className="w-full" size="lg">
                        Понятно
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl animate-fade-in">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Регистрация...
                    </div>
                  ) : 'Зарегистрироваться'}
                </Button>

                <div className="text-center">
                  <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Вернуться на главную
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Шаг 3: Верификация телефона
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute top-20 -left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-in-up">
        <Card className="border-0 shadow-soft-xl">
          <CardHeader className="text-center pt-6 sm:pt-8 px-4 sm:px-8">
            <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <span className="text-2xl sm:text-3xl">📞</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-extrabold">Подтверждение телефона</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                Мы позвоним на номер <strong>{registeredPhone}</strong>
              </p>
              <p className="text-xs">
                Введите <strong>последние 4 цифры</strong> входящего номера.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
                    <input
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete="one-time-code"
                      autoFocus={i === 0}
                      value={verificationCode[i] || ''}
                      className="w-full h-full text-center text-2xl font-bold border-2 border-gray-200 rounded-xl bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (!val) {
                          const newCode = verificationCode.split('');
                          newCode[i] = '';
                          setVerificationCode(newCode.join(''));
                          return;
                        }
                        const newCode = verificationCode.padEnd(4, ' ').split('');
                        newCode[i] = val[val.length - 1];
                        setVerificationCode(newCode.join('').replace(/ /g, '').slice(0, 4));
                        if (i < 3) {
                          document.getElementById(`code-${i + 1}`)?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          if (!verificationCode[i] && i > 0) {
                            e.preventDefault();
                            const newCode = verificationCode.padEnd(4, ' ').split('');
                            newCode[i - 1] = '';
                            setVerificationCode(newCode.join('').replace(/ /g, ''));
                            document.getElementById(`code-${i - 1}`)?.focus();
                          }
                        }
                        if (e.key === 'ArrowLeft' && i > 0) {
                          document.getElementById(`code-${i - 1}`)?.focus();
                        }
                        if (e.key === 'ArrowRight' && i < 3) {
                          document.getElementById(`code-${i + 1}`)?.focus();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                        setVerificationCode(pasted);
                        const focusIdx = Math.min(pasted.length, 3);
                        document.getElementById(`code-${focusIdx}`)?.focus();
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center animate-fade-in">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading || verificationCode.length < 4}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Проверка...
                  </div>
                ) : 'Подтвердить'}
              </Button>

              <div className="text-center space-y-3">
                {resendTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Повторная отправка через <span className="font-bold text-primary">{resendTimer} сек</span>
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-primary font-semibold"
                  >
                    Отправить код повторно
                  </Button>
                )}
              </div>

              <div className="text-center border-t border-gray-100 pt-4">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Вернуться на главную
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
