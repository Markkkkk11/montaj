import { useAuthStore } from '@/stores/authStore';

export const requireAdmin = () => {
  const { user } = useAuthStore.getState();
  
  if (!user) {
    return false;
  }
  
  return user.role === 'ADMIN';
};

