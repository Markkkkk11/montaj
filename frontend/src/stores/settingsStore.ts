import { create } from 'zustand';
import api from '@/lib/api';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  defaultRegion: string;
  standardPrice: string;
  standardResponsePrice: string;
  comfortPrice: string;
  comfortOrderTakenPrice: string;
  comfortSpecializations: string;
  premiumPrice: string;
  premiumSpecializations: string;
  standardSpecializations: string;
  trialDays: string;
  maxWorkPhotos: string;
  maxFileSize: string;
}

interface SettingsStore {
  settings: PlatformSettings;
  loaded: boolean;
  fetchSettings: () => Promise<void>;
}

const defaultSettings: PlatformSettings = {
  platformName: 'SVMontaj',
  supportEmail: 'support@svmontaj.ru',
  supportPhone: '+7 (800) 123-45-67',
  defaultRegion: 'Москва и обл.',
  standardPrice: '0',
  standardResponsePrice: '150',
  comfortPrice: '0',
  comfortOrderTakenPrice: '500',
  comfortSpecializations: '1',
  premiumPrice: '5000',
  premiumSpecializations: '3',
  standardSpecializations: '1',
  trialDays: '30',
  maxWorkPhotos: '8',
  maxFileSize: '5',
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  loaded: false,

  fetchSettings: async () => {
    if (get().loaded) return;
    try {
      const res = await api.get('/settings/public');
      if (res.data.success) {
        set({
          settings: { ...defaultSettings, ...res.data.settings },
          loaded: true,
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек платформы:', err);
      set({ loaded: true }); // Используем дефолтные
    }
  },
}));
