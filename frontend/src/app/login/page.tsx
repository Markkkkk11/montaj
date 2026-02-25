'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/stores/authStore';
import { LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading, error, setError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });

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

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      alert('Телефон успешно подтверждён! Теперь вы можете войти');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(formData);
    } catch (err) {
      // Ошибка уже в store
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute top-20 -left-10 w-48 sm:w-72 h-48 sm:h-72 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-10 w-56 sm:w-80 h-56 sm:h-80 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative animate-fade-in-up">
        {/* Back button */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-6 transition-colors group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          На главную
        </Link>

        <Card className="border-0 shadow-soft-xl">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
              <LogIn className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-extrabold">Вход в систему</CardTitle>
            <CardDescription className="text-base">Введите ваш телефон и пароль</CardDescription>
          </CardHeader>
          <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+7 (999) 123-45-67"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
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
                    Вход...
                  </div>
                ) : 'Войти'}
              </Button>

              <div className="text-center">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium">
                  Забыли пароль?
                </Link>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-muted-foreground">или</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Нет аккаунта?{' '}
                  <Link href="/register" className="text-primary hover:underline font-semibold">
                    Зарегистрироваться
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
