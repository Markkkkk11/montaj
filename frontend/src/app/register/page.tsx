'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { RegisterData } from '@/lib/types';

export default function RegisterPage() {
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

  // Таймер повторной отправки
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
    // Оставляем только цифры
    const digits = value.replace(/\D/g, '');
    
    // Форматируем
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+${digits}`;
    if (digits.length <= 4) return `+${digits.slice(0, 1)} (${digits.slice(1)}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Если пользователь начинает вводить без +7, подставляем
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

    // Валидация телефона
    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 11) {
      setError('Введите корректный номер телефона');
      return;
    }

    try {
      await register(formData as RegisterData);
      setRegisteredPhone(formData.phone!);
      setResendTimer(60); // 60 секунд до повторной отправки
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Регистрация</CardTitle>
            <CardDescription>Выберите, кем вы хотите зарегистрироваться</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => handleRoleSelect('CUSTOMER')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors text-left"
            >
              <h3 className="text-xl font-semibold mb-2">Заказчик</h3>
              <p className="text-muted-foreground">
                Разместите заказ и выберите исполнителя из откликнувшихся специалистов
              </p>
            </button>

            <button
              onClick={() => handleRoleSelect('EXECUTOR')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-primary hover:bg-blue-50 transition-colors text-left"
            >
              <h3 className="text-xl font-semibold mb-2">Исполнитель</h3>
              <p className="text-muted-foreground">
                Откликайтесь на заказы и выполняйте работы по монтажу
              </p>
            </button>

            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Войти
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                Вернуться на главную
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Шаг 2: Заполнение информации
  if (step === 'info') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Регистрация ({role === 'CUSTOMER' ? 'Заказчик' : 'Исполнитель'})</CardTitle>
            <CardDescription>Заполните основные данные</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">ФИО *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="phone">Телефон * <span className="text-xs text-muted-foreground">(будет подтверждён звонком/SMS)</span></Label>
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
                <Label htmlFor="email">
                  Email <span className="text-xs text-muted-foreground">(необязательно, для уведомлений)</span>
                </Label>
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
                />
              </div>

              <div>
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  required
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="organization">Организация</Label>
                <Input
                  id="organization"
                  value={formData.organization || ''}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  required
                  checked={formData.agreeToTerms || false}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="agreeToTerms" className="font-normal">
                  Я согласен с условиями сервиса *
                </Label>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('role')}
                  disabled={isLoading}
                >
                  Назад
                </Button>
              </div>

              <div className="text-center">
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                  Вернуться на главную
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Шаг 3: Верификация телефона
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">📞</span>
          </div>
          <CardTitle>Подтверждение телефона</CardTitle>
          <CardDescription className="space-y-2">
            <p>
              Мы позвоним на номер <strong>{registeredPhone}</strong>
            </p>
            <p className="text-xs">
              Введите <strong>последние 4 цифры</strong> входящего номера.
              <br />
              Если звонок не поступит, мы отправим SMS с кодом.
            </p>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex items-center justify-center gap-3 px-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-14 h-14 flex-shrink-0"
                >
                  <input
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    autoComplete="one-time-code"
                    autoFocus={i === 0}
                    value={verificationCode[i] || ''}
                    className="w-full h-full text-center text-2xl font-bold border-2 border-gray-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
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
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-base" 
              disabled={isLoading || verificationCode.length < 4}
            >
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </Button>

            <div className="text-center space-y-3">
              {resendTimer > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Повторная отправка через <span className="font-semibold text-primary">{resendTimer} сек</span>
                </p>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary"
                >
                  Отправить код повторно
                </Button>
              )}
            </div>

            <div className="text-center border-t pt-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                Вернуться на главную
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
