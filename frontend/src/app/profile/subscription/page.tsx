'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role === 'EXECUTOR') {
      router.replace('/executor/tariffs');
      return;
    }

    router.replace('/profile');
  }, [isHydrated, router, user]);

  return (
    <div className="container mx-auto py-8 px-4">
      <p className="text-sm text-muted-foreground">Перенаправление на актуальную страницу тарифов...</p>
    </div>
  );
}
