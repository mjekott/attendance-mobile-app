import { router } from 'expo-router';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useKioskStore } from '../../src/stores/kioskStore';

export default function KioskHomeScreen() {
  const { kioskName, location, clearCredentials } = useKioskStore();
  const isOnline = useNetworkStatus();

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline banner */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline — only previously verified users can check in</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.kioskName}>{kioskName}</Text>
            <Text style={styles.location}>{location}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              Alert.alert(
                'Logout',
                'This will disconnect this kiosk device. You will need to re-enter the secret key to use it again.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                      await clearCredentials();
                      router.replace('/setup');
                    },
                  },
                ],
              );
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.statusDot, isOnline && styles.statusOnline]} />
      </View>

      {/* Welcome message */}
      <View style={styles.welcome}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.welcomeSubtext}>
          What would you like to do?
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionCard, styles.checkinCard]}
          onPress={() => router.push('/kiosk/attendance')}
        >
          <Text style={styles.actionIcon}>+</Text>
          <Text style={styles.actionTitle}>Attendance</Text>
          <Text style={styles.actionDesc}>Check in, check out, or enroll staff</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, styles.visitorCard]}
          onPress={() => router.push('/kiosk/visitor')}
        >
          <Text style={styles.actionIcon}>⌘</Text>
          <Text style={styles.actionTitle}>Visitor</Text>
          <Text style={styles.actionDesc}>Verify gate pass with code or QR</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 30,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  kioskName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  location: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginTop: 8,
  },
  statusOnline: {
    backgroundColor: '#22C55E',
  },
  welcome: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  welcomeSubtext: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 4,
  },
  actions: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  actionCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  checkinCard: {
    backgroundColor: '#0F2A1E',
    borderColor: '#166534',
  },
  visitorCard: {
    backgroundColor: '#0F2637',
    borderColor: '#0E7490',
  },
  actionIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 14,
    color: '#94A3B8',
  },
  offlineBanner: {
    backgroundColor: '#92400E',
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  offlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FEF3C7',
    textAlign: 'center',
  },
});
