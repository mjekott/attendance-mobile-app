import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    checkConnection();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkConnection();
      }
    });

    return () => subscription.remove();

    async function checkConnection() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch('https://clients3.google.com/generate_204', {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    }
  }, []);

  return isOnline;
}
