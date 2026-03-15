import { useEffect, useRef } from 'react';
import { useKioskStore } from '../stores/kioskStore';
import { authApi } from '../services/api';

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Periodically re-authenticates the kiosk to refresh the JWT
 * and update the server's lastSeen timestamp.
 */
export function useKioskHeartbeat() {
  const { secretKey, saveCredentials, kioskId, kioskName, location } =
    useKioskStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!secretKey) return;

    const heartbeat = async () => {
      try {
        const response = await authApi.loginKiosk(secretKey);
        // Refresh the stored access token
        await saveCredentials({
          kioskId: response.kiosk.id,
          kioskName: response.kiosk.name,
          location: response.kiosk.location,
          secretKey,
          accessToken: response.accessToken,
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };

    intervalRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [secretKey, saveCredentials]);
}
