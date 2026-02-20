import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import { User, LoginData, RegisterData } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyPhone: (phone: string, code: string) => Promise<boolean>;
  sendSMS: (phone: string) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  updateUser: (user: User) => void;
  setError: (error: string | null) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isHydrated: false,
      error: null,

      login: async (data: LoginData) => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.post('/auth/login', data);
          const { user, token } = response.data;

          set({ user, token, isLoading: false });
          localStorage.setItem('token', token);
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Ошибка входа',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        try {
          set({ isLoading: true, error: null });
          await api.post('/auth/register', data);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Ошибка регистрации',
            isLoading: false,
          });
          throw error;
        }
      },

      verifyPhone: async (phone: string, code: string) => {
        try {
          set({ isLoading: true, error: null });
          await api.post('/auth/verify-sms', { phone, code });
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Неверный код',
            isLoading: false,
          });
          return false;
        }
      },

      sendSMS: async (phone: string) => {
        try {
          set({ isLoading: true, error: null });
          await api.post('/auth/send-sms', { phone });
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.error || 'Ошибка отправки SMS',
            isLoading: false,
          });
          throw error;
        }
      },

      getCurrentUser: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            return;
          }

          const response = await api.get('/auth/me');
          set({ user: response.data.user });
        } catch (error) {
          console.error('Error fetching current user:', error);
          set({ user: null, token: null });
          localStorage.removeItem('token');
        }
      },

      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('token');
      },

      updateUser: (user: User) => {
        set({ user });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setHydrated: () => {
        set({ isHydrated: true });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

