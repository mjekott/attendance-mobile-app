import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { FaceCamera, DetectedFace } from '../../src/components/FaceCamera';
import { generateEmbedding } from '../../src/services/faceRecognition';
import { attendanceApi } from '../../src/services/api';
import { useKioskStore } from '../../src/stores/kioskStore';

export default function ScanScreen() {
  const { employeeId } = useLocalSearchParams<{ employeeId: string }>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [livenessMessage, setLivenessMessage] = useState('');
  const [livenessPassed, setLivenessPassed] = useState(false);
  const { accessToken } = useKioskStore();

  const handleFaceCapture = useCallback(
    async (uri: string, face: DetectedFace) => {
      if (isProcessing || !accessToken) return;
      setIsProcessing(true);

      try {
        const embedding = await generateEmbedding(uri, face.bounds);
        if (!embedding) {
          setIsProcessing(false);
          return;
        }

        const result = await attendanceApi.verify(accessToken, embedding, employeeId!);

        router.replace({
          pathname: '/kiosk/result',
          params: {
            matched: String(result.matched),
            userName: result.userName || '',
            action: result.action || '',
            message: result.message,
            timestamp: new Date().toISOString(),
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

  const handleLivenessUpdate = useCallback(
    (message: string, passed: boolean) => {
      setLivenessMessage(message);
      setLivenessPassed(passed);
    },
    [],
  );

  const getStatusText = () => {
    if (isProcessing) return 'Verifying your identity...';
    if (!faceDetected) return 'Position your face in the frame';
    if (livenessPassed) return 'Verified — scanning...';
    return livenessMessage || 'Detecting...';
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Face Scan</Text>
      <Text style={[
        styles.subtitle,
        livenessPassed && styles.subtitleSuccess,
      ]}>
        {getStatusText()}
      </Text>

      <View style={styles.cameraContainer}>
        <FaceCamera
          isScanning={!isProcessing}
          onFaceCapture={handleFaceCapture}
          onFaceDetected={(detected) => setFaceDetected(detected)}
          captureIntervalMs={2000}
          requireLiveness={true}
          onLivenessUpdate={handleLivenessUpdate}
        />
      </View>

      <Text style={styles.hint}>
        {isProcessing
          ? 'Please wait...'
          : 'Look at the camera — verification is automatic'}
      </Text>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#F97316',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 16,
  },
  subtitleSuccess: {
    color: '#22C55E',
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hint: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginVertical: 20,
  },
});
