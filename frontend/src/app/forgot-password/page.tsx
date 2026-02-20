'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

type Step = 'phone' | 'code' | 'password';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    try {
      setIsLoading(true);
      await api.post('/auth/request-reset', { phone });
      setStep('code');
      toast({
        variant: 'success',
        title: 'Код отправлен',
        description: 'Проверьте входящий звонок или SMS',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось отправить код',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 3 && newCode.every((d) => d !== '')) {
      setStep('password');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: 'Пароль должен содержать минимум 6 символов',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: 'Пароли не совпадают',
      });
      return;
    }

    try {
      setIsLoading(true);
      await api.post('/auth/reset-password', {
        phone,
        code: code.join(''),
        newPassword,
      });
      toast({
        variant: 'success',
        title: '✅ Пароль изменён!',
        description: 'Теперь вы можете войти с новым паролем',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '❌ Ошибка',
        description: error.response?.data?.error || 'Не удалось сменить пароль',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
          <CardDescription>
            {step === 'phone' && 'Введите номер телефона для восстановления доступа'}
            {step === 'code' && 'Введите код из звонка или SMS'}
            {step === 'password' && 'Установите новый пароль'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (900) 123-45-67"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Отправка...' : 'Отправить код'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => router.push('/login')}
              >
                Вернуться ко входу
              </Button>
            </form>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {code.map((digit, index) => (
                  <div key={index} className="w-14 h-14 flex-shrink-0">
                    <input
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      className="w-full h-full text-center text-2xl font-bold border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Код отправлен на {phone}
              </p>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep('phone')}
              >
                Изменить номер
              </Button>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Новый пароль</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Установить новый пароль'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

