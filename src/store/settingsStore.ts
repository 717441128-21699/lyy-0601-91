import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'arcade-rhythm-settings',
    }
  )
);
