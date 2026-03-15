import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../src/services/api';
import { useKioskStore } from '../src/stores/kioskStore';

export default function SetupScreen() {
  const [secretKey, setSecretKey] = useState('d42527fe6471c512265a');
  const [isLoading, setIsLoading] = useState(false);
  const { saveCredentials } = useKioskStore();

  const handleProvision = async () => {
    if (!secretKey.trim()) {
      Alert.alert('Error', 'Please enter a kiosk secret key');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.loginKiosk(secretKey.trim());
      await saveCredentials({
        kioskId: response.kiosk.id,
        kioskName: response.kiosk.name,
        location: response.kiosk.location,
        secretKey: secretKey.trim(),
        accessToken: response.accessToken,
      });
      router.replace('/kiosk');
    } catch {
      Alert.alert('Error', 'Invalid secret key or server unreachable');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Kiosk Setup</Text>
        <Text style={styles.subtitle}>
          Enter the secret key provided by your administrator to provision this
          device.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter kiosk secret key"
          placeholderTextColor="#64748B"
          value={secretKey}
          onChangeText={setSecretKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleProvision}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Provision Device</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
