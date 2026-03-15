import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

const AUTO_RETURN_MS = 4000;

export default function ResultScreen() {
  const { matched, userName, action, message } = useLocalSearchParams<{
    matched: string;
    userName: string;
    action: string;
    message: string;
    timestamp: string;
  }>();

  const isMatched = matched === 'true';
  const isCheckIn = action === 'CHECKIN';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.back();
    }, AUTO_RETURN_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View
      style={[
        styles.container,
        isMatched ? styles.successBg : styles.failureBg,
      ]}
    >
      <Text style={styles.icon}>{isMatched ? '✓' : '✗'}</Text>

      {isMatched ? (
        <>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.action}>
            {isCheckIn ? 'Checked In' : 'Checked Out'}
          </Text>
          <Text style={styles.time}>
            {new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </>
      ) : (
        <Text style={styles.failureText}>Face Not Recognized</Text>
      )}

      <Text style={styles.message}>{message}</Text>
      <Text style={styles.returnText}>Returning to scanner...</Text>
    </View>
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
    marginBottom: 32,
  },
  returnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
});
