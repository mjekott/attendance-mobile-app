import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { useKioskAppState } from '../../src/hooks/useKioskAppState';

export default function KioskLayout() {
  // Track app foreground/background and update server status
  useKioskAppState();

  // Disable Android back button in kiosk mode
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back navigation
    });

    return () => handler.remove();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0F172A' },
        animation: 'fade',
        gestureEnabled: false, // Disable swipe-back on iOS
      }}
    />
  );
}
