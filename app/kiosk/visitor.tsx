import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function VisitorScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Visitor Access</Text>
      <Text style={styles.subtitle}>How would you like to verify your gate pass?</Text>

      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.optionCard, styles.scanCard]}
          onPress={() => router.push('/kiosk/visitor-scan')}
        >
          <Text style={styles.optionIcon}>⎚</Text>
          <Text style={styles.optionTitle}>Scan QR Code</Text>
          <Text style={styles.optionDesc}>Use your printed or digital gate pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, styles.codeCard]}
          onPress={() => router.push('/kiosk/visitor-code')}
        >
          <Text style={styles.optionIcon}>#</Text>
          <Text style={styles.optionTitle}>Enter Access Code</Text>
          <Text style={styles.optionDesc}>Type your 6-character access code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 32,
  },
  options: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  scanCard: {
    backgroundColor: '#0F2637',
    borderColor: '#0E7490',
  },
  codeCard: {
    backgroundColor: '#1A2332',
    borderColor: '#1D4ED8',
  },
  optionIcon: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
