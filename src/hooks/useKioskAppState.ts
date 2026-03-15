import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import { useKioskStore } from '../stores/kioskStore';
import { useOfflineStore } from '../stores/offlineStore';
import { authApi, kioskApi } from '../services/api';

async function isOnline(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isInternetReachable ?? state.isConnected ?? false;
  } catch {
    return false;
  }
}

/**
 * Tracks app foreground/background state and notifies the server.
 * - App comes to foreground → if online: mark online + refresh JWT + flush queue + sync gate passes
 * - App goes to background → if online: mark offline
 */
export function useKioskAppState() {
  const { secretKey, accessToken, saveCredentials } = useKioskStore();
  const { flushQueue, syncGatePasses } = useOfflineStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!secretKey || !accessToken) return;

    onForeground(accessToken);

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };

    async function onForeground(token: string) {
      if (!(await isOnline())) return;

      kioskApi.updateStatus(token, 'online').catch(() => {});
      refreshToken();
      flushQueue(token).catch(() => {});
      syncGatePasses(token).catch(() => {});
    }

    async function handleAppStateChange(nextState: AppStateStatus) {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        onForeground(accessToken!);
      } else if (nextState.match(/inactive|background/)) {
        if (await isOnline()) {
          kioskApi.updateStatus(accessToken!, 'offline').catch(() => {});
        }
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
