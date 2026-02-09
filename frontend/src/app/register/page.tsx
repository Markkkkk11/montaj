'use client';

import { useState } from 'react';
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

  const handleRoleSelect = (selectedRole: 'CUSTOMER' | 'EXECUTOR') => {
    setRole(selectedRole);
    setFormData({ ...formData, role: selectedRole });
    setStep('info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await register(formData as RegisterData);
      setRegisteredPhone(formData.phone!);
      setStep('verify');
    } catch (err) {
      // Ошибка уже в store
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const success = await verifyPhone(registeredPhone, verificationCode);
      if (success) {
        router.push('/login?verified=true');
      }
    } catch (err) {
      // Ошибка уже в store
    }
  };

  const handleResendCode = async () => {
    setError(null);
    try {
      await sendSMS(registeredPhone);
      alert('Код отправлен повторно');
    } catch (err) {
      // Ошибка уже в store
    }
  };

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
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

  // Шаг 3: Верификация SMS
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Подтверждение телефона</CardTitle>
          <CardDescription>
            Мы отправили код подтверждения на номер <strong>{registeredPhone}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="code">Код из SMS</Label>
              <Input
                id="code"
                required
                maxLength={6}
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Проверка...' : 'Подтвердить'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendCode}
                disabled={isLoading}
              >
                Отправить код повторно
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

