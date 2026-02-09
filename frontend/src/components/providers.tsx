'use client';

import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 минута
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const getCurrentUser = useAuthStore((state) => state.getCurrentUser);

  useEffect(() => {
    // Загружаем текущего пользователя при старте приложения
    getCurrentUser();
  }, [getCurrentUser]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

