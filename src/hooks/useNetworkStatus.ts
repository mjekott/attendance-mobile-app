import { useState, useEffect } from 'react';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Simple connectivity check by pinging the API
    const checkConnection = async () => {
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
    };

    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return isOnline;
}
