import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { visitorsApi } from '../../src/services/api';
import { useKioskStore } from '../../src/stores/kioskStore';

export default function VisitorCodeScreen() {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { accessToken } = useKioskStore();

  const handleVerify = async () => {
    if (code.length !== 6 || !accessToken) return;
    setIsVerifying(true);

    try {
      const result = await visitorsApi.verify(accessToken, code.toUpperCase());

      router.replace({
        pathname: '/kiosk/visitor-result',
        params: {
          valid: String(result.valid),
          visitorName: result.visitorName || '',
          hostName: result.hostName || '',
          purpose: result.purpose || '',
          action: result.action || '',
          message: result.message,
        },
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Verification failed. Please try again.';
      Alert.alert('Error', message);
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Enter Access Code</Text>
      <Text style={styles.subtitle}>Type the 6-character code from your gate pass</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(text) => setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="______"
          placeholderTextColor="#334155"
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={[styles.verifyButton, code.length !== 6 && styles.verifyButtonDisabled]}
        onPress={handleVerify}
        disabled={code.length !== 6 || isVerifying}
      >
        <Text style={styles.verifyText}>
          {isVerifying ? 'Verifying...' : 'Verify'}
        </Text>
      </TouchableOpacity>
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
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 40,
  },
  inputContainer: {
    paddingHorizontal: 48,
    marginBottom: 32,
  },
  input: {
    fontSize: 40,
    fontWeight: '700',
    color: '#F8FAFC',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    paddingVertical: 20,
    paddingHorizontal: 16,
    letterSpacing: 12,
  },
  verifyButton: {
    marginHorizontal: 48,
    backgroundColor: '#0E7490',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  verifyButtonDisabled: {
    opacity: 0.4,
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
