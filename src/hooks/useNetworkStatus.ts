import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check immediately
    Network.getNetworkStateAsync().then((state) => {
      setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
    });

    // Listen for changes
    const subscription = Network.addNetworkStateListener((state) => {
      setIsOnline(state.isInternetReachable ?? state.isConnected ?? false);
    });

    return () => subscription.remove();
  }, []);

  return isOnline;
}
