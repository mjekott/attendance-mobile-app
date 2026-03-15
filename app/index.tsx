import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useKioskStore } from '../src/stores/kioskStore';

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const { isProvisioned, loadCredentials } = useKioskStore();

  useEffect(() => {
    loadCredentials().finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!isProvisioned) {
    return <Redirect href="/setup" />;
  }

  return <Redirect href="/kiosk" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
