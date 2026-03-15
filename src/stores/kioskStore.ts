import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface KioskCredentials {
  kioskId: string;
  kioskName: string;
  location: string;
  secretKey: string;
  accessToken: string;
}

interface KioskState extends Partial<KioskCredentials> {
  isProvisioned: boolean;
  loadCredentials: () => Promise<void>;
  saveCredentials: (credentials: KioskCredentials) => Promise<void>;
  clearCredentials: () => Promise<void>;
}

const STORAGE_KEY = 'kiosk_credentials';

export const useKioskStore = create<KioskState>((set) => ({
  isProvisioned: false,

  loadCredentials: async () => {
    try {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored) {
        const credentials: KioskCredentials = JSON.parse(stored);
        set({ ...credentials, isProvisioned: true });
      }
    } catch {
      set({ isProvisioned: false });
    }
  },

  saveCredentials: async (credentials: KioskCredentials) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(credentials));
    set({ ...credentials, isProvisioned: true });
  },

  clearCredentials: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
    set({
      kioskId: undefined,
      kioskName: undefined,
      location: undefined,
      secretKey: undefined,
      accessToken: undefined,
      isProvisioned: false,
    });
  },
}));
