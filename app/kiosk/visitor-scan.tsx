import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { visitorsApi } from '../../src/services/api';
import { useKioskStore } from '../../src/stores/kioskStore';

export default function VisitorScanScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { accessToken } = useKioskStore();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const handleCodeScanned = useCallback(
    async (codes: { value?: string }[]) => {
      if (isProcessing || !accessToken) return;
      const value = codes[0]?.value;
      if (!value || value.length !== 6) return;

      setIsProcessing(true);

      try {
        const result = await visitorsApi.verify(accessToken, value.toUpperCase());

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
        setIsProcessing(false);
      }
    },
    [isProcessing, accessToken],
  );

  if (!hasPermission) {
    requestPermission();
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No camera found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Scan QR Code</Text>
      <Text style={styles.subtitle}>
        {isProcessing ? 'Verifying...' : 'Hold your gate pass QR code to the camera'}
      </Text>

      <View style={styles.cameraContainer}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!isProcessing}
          codeScanner={{
            codeTypes: ['qr'],
            onCodeScanned: handleCodeScanned,
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
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
    marginBottom: 16,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderWidth: 3,
    borderColor: 'rgba(14, 116, 144, 0.8)',
    borderRadius: 16,
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
});
