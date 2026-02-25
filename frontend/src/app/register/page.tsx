'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { RegisterData } from '@/lib/types';
import { ArrowLeft, UserPlus, Briefcase, Wrench, ChevronRight } from 'lucide-react';

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
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-2xl relative animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-6 transition-colors group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            На главную
          </Link>

          <Card className="border-0 shadow-soft-xl">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                <UserPlus className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-extrabold">Регистрация</CardTitle>
              <CardDescription className="text-base">Выберите, кем вы хотите зарегистрироваться</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              <button
                onClick={() => handleRoleSelect('CUSTOMER')}
                className="w-full p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-300 text-left group flex items-center gap-5 hover:shadow-soft"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-7 w-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1 text-gray-900">Заказчик</h3>
                  <p className="text-sm text-muted-foreground">
                    Разместите заказ и выберите исполнителя из откликнувшихся специалистов
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>

              <button
                onClick={() => handleRoleSelect('EXECUTOR')}
                className="w-full p-6 border-2 border-gray-100 rounded-2xl hover:border-violet-300 hover:bg-violet-50/50 transition-all duration-300 text-left group flex items-center gap-5 hover:shadow-soft"
              >
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench className="h-7 w-7 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1 text-gray-900">Исполнитель</h3>
                  <p className="text-sm text-muted-foreground">
                    Откликайтесь на заказы и выполняйте работы по монтажу
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
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
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative animate-fade-in-up">
          <button
            onClick={() => setStep('role')}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Назад к выбору роли
          </button>

          <Card className="border-0 shadow-soft-xl">
            <CardHeader className="pt-8 px-8">
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
            <CardContent className="px-8 pb-8">
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
                  <Label htmlFor="email">Email <span className="text-xs text-muted-foreground font-normal">(необязательно)</span></Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.ru"
                  />
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
                    <a href="/terms" target="_blank" className="text-primary hover:underline font-semibold">
                      правилами работы сайта
                    </a>
                  </Label>
                </div>

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
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-in-up">
        <Card className="border-0 shadow-soft-xl">
          <CardHeader className="text-center pt-8 px-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <span className="text-3xl">📞</span>
            </div>
            <CardTitle className="text-2xl font-extrabold">Подтверждение телефона</CardTitle>
            <CardDescription className="space-y-2">
              <p>
                Мы позвоним на номер <strong>{registeredPhone}</strong>
              </p>
              <p className="text-xs">
                Введите <strong>последние 4 цифры</strong> входящего номера.
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex items-center justify-center gap-3 px-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="w-14 h-14 flex-shrink-0">
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
