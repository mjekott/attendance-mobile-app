import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useKioskStore } from '../stores/kioskStore';
import { authApi, kioskApi } from '../services/api';

/**
 * Tracks app foreground/background state and notifies the server.
 * - App comes to foreground → mark online + refresh JWT
 * - App goes to background → mark offline
 */
export function useKioskAppState() {
  const { secretKey, accessToken, saveCredentials } = useKioskStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!secretKey || !accessToken) return;

    // Mark online on mount
    kioskApi.updateStatus(accessToken, 'online').catch(() => {});
    // Also refresh JWT on mount
    refreshToken();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };

    function handleAppStateChange(nextState: AppStateStatus) {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        // App came to foreground
        kioskApi.updateStatus(accessToken!, 'online').catch(() => {});
        refreshToken();
      } else if (nextState.match(/inactive|background/)) {
        // App going to background
        kioskApi.updateStatus(accessToken!, 'offline').catch(() => {});
      }
      appState.current = nextState;
    }

    async function refreshToken() {
      try {
        const response = await authApi.loginKiosk(secretKey!);
        await saveCredentials({
          kioskId: response.kiosk.id,
          kioskName: response.kiosk.name,
          location: response.kiosk.location,
          secretKey: secretKey!,
          accessToken: response.accessToken,
        });
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
  }, [secretKey, accessToken]);
}
