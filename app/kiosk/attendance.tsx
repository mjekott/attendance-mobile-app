import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { useKioskStore } from '../../src/stores/kioskStore';
import { useOfflineStore } from '../../src/stores/offlineStore';

export default function AttendanceScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [secretError, setSecretError] = useState('');
  const isOnline = useNetworkStatus();
  const secretKey = useKioskStore((s) => s.secretKey);
  const getCachedUser = useOfflineStore((s) => s.getCachedUser);

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
          onPress={() => {
            if (!isOnline && !getCachedUser(employeeId)) {
              Alert.alert('Offline', 'This employee hasn\'t been verified before. Please connect to the internet first.');
              return;
            }
            router.push({ pathname: '/kiosk/scan', params: { employeeId } });
          }}
        >
          <Text style={styles.optionIcon}>+</Text>
          <Text style={styles.optionTitle}>Check In / Out</Text>
          <Text style={styles.optionDesc}>Scan your face to check in or out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, styles.enrollCard, !isOnline && styles.optionDisabled]}
          disabled={!isOnline}
          onPress={() => {
            if (!isOnline) {
              Alert.alert('Offline', 'Enrolling new staff requires an internet connection.');
              return;
            }
            setShowSecretModal(true);
          }}
        >
          <Text style={styles.optionIcon}>*</Text>
          <Text style={styles.optionTitle}>Enroll New Staff</Text>
          <Text style={styles.optionDesc}>Register a new team member</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showSecretModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Admin Verification</Text>
            <Text style={styles.modalSubtitle}>Enter the kiosk secret key to continue</Text>
            <TextInput
              style={[styles.input, secretError ? styles.inputError : null]}
              value={secretInput}
              onChangeText={(text) => {
                setSecretInput(text);
                setSecretError('');
              }}
              placeholder="Secret key"
              placeholderTextColor="#475569"
              secureTextEntry
              autoFocus
            />
            {secretError ? <Text style={styles.errorText}>{secretError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowSecretModal(false);
                  setSecretInput('');
                  setSecretError('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  if (secretInput === secretKey) {
                    setShowSecretModal(false);
                    setSecretInput('');
                    setSecretError('');
                    router.push('/kiosk/enroll');
                  } else {
                    setSecretError('Invalid secret key');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
});
