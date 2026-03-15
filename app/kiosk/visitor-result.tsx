import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

const AUTO_RETURN_MS = 4000;

export default function VisitorResultScreen() {
  const { valid, visitorName, hostName, purpose, action, message } = useLocalSearchParams<{
    valid: string;
    visitorName: string;
    hostName: string;
    purpose: string;
    action: string;
    message: string;
  }>();

  const isValid = valid === 'true';
  const isCheckIn = action === 'CHECKIN';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/kiosk');
    }, AUTO_RETURN_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      style={[
        styles.container,
        isValid ? styles.successBg : styles.failureBg,
      ]}
    >
      <Text style={styles.icon}>{isValid ? '✓' : '✗'}</Text>

      {isValid ? (
        <>
          <Text style={styles.name}>{visitorName}</Text>
          <Text style={styles.action}>
            {isCheckIn ? 'Checked In' : 'Checked Out'}
          </Text>
          <Text style={styles.time}>
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.detail}>Visiting: {hostName}</Text>
          {purpose ? <Text style={styles.detail}>Purpose: {purpose}</Text> : null}
        </>
      ) : (
        <Text style={styles.failureText}>Access Denied</Text>
      )}

      <Text style={styles.message}>{message}</Text>
      <Text style={styles.returnText}>Returning to kiosk...</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successBg: {
    backgroundColor: '#064E3B',
  },
  failureBg: {
    backgroundColor: '#7F1D1D',
  },
  icon: {
    fontSize: 80,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  action: {
    fontSize: 20,
    color: '#D1FAE5',
    fontWeight: '600',
    marginBottom: 8,
  },
  time: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  failureText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FECACA',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  returnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
