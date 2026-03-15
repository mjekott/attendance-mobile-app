import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AttendanceScreen() {
  const [employeeId, setEmployeeId] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Attendance</Text>
      <Text style={styles.subtitle}>Enter your Employee ID to continue</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={employeeId}
          onChangeText={setEmployeeId}
          placeholder="Employee ID"
          placeholderTextColor="#475569"
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={[styles.optionCard, styles.checkinCard, !employeeId && styles.optionDisabled]}
          disabled={!employeeId}
          onPress={() => router.push({ pathname: '/kiosk/scan', params: { employeeId } })}
        >
          <Text style={styles.optionIcon}>+</Text>
          <Text style={styles.optionTitle}>Check In / Out</Text>
          <Text style={styles.optionDesc}>Scan your face to check in or out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, styles.enrollCard]}
          onPress={() => router.push('/kiosk/enroll')}
        >
          <Text style={styles.optionIcon}>*</Text>
          <Text style={styles.optionTitle}>Enroll New Staff</Text>
          <Text style={styles.optionDesc}>Register a new team member</Text>
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
    marginBottom: 20,
  },
  inputContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  input: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F8FAFC',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    paddingVertical: 14,
    paddingHorizontal: 16,
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
  optionDisabled: {
    opacity: 0.4,
  },
  checkinCard: {
    backgroundColor: '#0F2A1E',
    borderColor: '#166534',
  },
  enrollCard: {
    backgroundColor: '#1E1A2E',
    borderColor: '#4C1D95',
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
