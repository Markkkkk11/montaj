'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuthStore } from '@/stores/authStore';
import { getUserFirstName } from '@/lib/utils';
import { LogOut, ArrowLeft, User } from 'lucide-react';

interface HeaderProps {
  showBack?: boolean;
  backHref?: string;
}

export function Header({ showBack = false, backHref }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const displayName = getUserFirstName(user?.fullName);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const goBack = () => {
    if (backHref) {
      router.push(backHref);
    } else if (user?.role === 'CUSTOMER') {
      router.push('/customer/dashboard');
    } else if (user?.role === 'EXECUTOR') {
      router.push('/executor/dashboard');
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-gray-100/50">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showBack && (
            <button
              onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500 group-hover:text-gray-900 group-hover:-translate-x-0.5 transition-all" />
            </button>
          )}
          <Link href={
            user?.role === 'CUSTOMER' ? '/customer/dashboard' : 
            user?.role === 'EXECUTOR' ? '/executor/dashboard' : 
            user?.role === 'ADMIN' ? '/admin' : '/'
          } className="flex items-center gap-3 group">
            <img
              src="/logo.jpg"
              alt="SVMontaj"
              className="h-10 w-10 rounded-full object-contain bg-white ring-2 ring-white shadow-soft transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-lg font-bold hidden sm:inline">
              <span className="text-blue-600">SV</span><span className="text-red-500">Montaj</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <NotificationBell />
          <Link href="/profile" className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
            {user?.photo ? (
              <img
                src={user.photo.startsWith('/') ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${user.photo}` : user.photo}
                alt={user.fullName}
                className="w-7 h-7 rounded-lg object-cover"
              />
            ) : (
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate hidden sm:inline">
              {displayName}
            </span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout} 
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 sm:h-10 sm:w-10"
            title="Выйти"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

