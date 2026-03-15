import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useKioskStore } from '../../src/stores/kioskStore';
import { attendanceApi } from '../../src/services/api';
import { useNetworkStatus } from '../../src/hooks/useNetworkStatus';
import { FaceCamera } from '../../src/components/FaceCamera';
import { generateEmbedding } from '../../src/services/faceRecognition';

type AttendanceAction = 'CHECKIN' | 'CHECKOUT';

export default function KioskScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] =
    useState<AttendanceAction>('CHECKIN');
  const [statusText, setStatusText] = useState('Position your face in the frame');
  const { kioskName, location, accessToken } = useKioskStore();
  const isOnline = useNetworkStatus();

  const handlePhotoCapture = useCallback(
    async (photoUri: string) => {
      if (isProcessing || !isOnline || !accessToken) return;

      setIsProcessing(true);
      setStatusText('Processing...');

      try {
        const embedding = await generateEmbedding(photoUri);
        if (!embedding) {
          setStatusText('No face detected. Try again.');
          setIsProcessing(false);
          return;
        }

        const result = await attendanceApi.verify(
          accessToken,
          embedding,
          selectedAction,
        );

        router.push({
          pathname: '/kiosk/result',
          params: {
            matched: String(result.matched),
            userName: result.userName || '',
            action: selectedAction,
            message: result.message,
            timestamp: result.checkedIn || result.checkedOut || '',
          },
        });
      } catch {
        setStatusText('Verification failed. Retrying...');
      } finally {
        setIsProcessing(false);
        setStatusText('Position your face in the frame');
      }
    },
    [isProcessing, isOnline, accessToken, selectedAction],
  );

  // Manual scan fallback (for testing without camera)
  const handleManualScan = useCallback(async () => {
    if (isProcessing || !isOnline || !accessToken) return;

    setIsProcessing(true);
    try {
      const embedding = Array.from({ length: 128 }, () => Math.random());
      const result = await attendanceApi.verify(
        accessToken,
        embedding,
        selectedAction,
      );

      router.push({
        pathname: '/kiosk/result',
        params: {
          matched: String(result.matched),
          userName: result.userName || '',
          action: selectedAction,
          message: result.message,
          timestamp: result.checkedIn || result.checkedOut || '',
        },
      });
    } catch {
      Alert.alert('Error', 'Failed to verify. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, isOnline, accessToken, selectedAction]);

  if (!isOnline) {
    return (
      <View style={styles.container}>
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineIcon}>!</Text>
          <Text style={styles.offlineTitle}>Device Offline</Text>
          <Text style={styles.offlineText}>
            Check-in requires an internet connection. Please check your network
            settings.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.kioskName}>{kioskName}</Text>
        <Text style={styles.location}>{location}</Text>
        <View style={[styles.statusDot, isOnline && styles.statusOnline]} />
      </View>

      {/* Live camera feed */}
      <View style={styles.cameraContainer}>
        <FaceCamera
          isActive={!isProcessing}
          onPhotoCapture={handlePhotoCapture}
          captureIntervalMs={4000}
        />
      </View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        {isProcessing ? (
          <ActivityIndicator color="#3B82F6" style={styles.statusSpinner} />
        ) : null}
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {/* Action toggle */}
      <View style={styles.actionToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedAction === 'CHECKIN' && styles.toggleActive,
          ]}
          onPress={() => setSelectedAction('CHECKIN')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedAction === 'CHECKIN' && styles.toggleTextActive,
            ]}
          >
            Check In
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            selectedAction === 'CHECKOUT' && styles.toggleActive,
          ]}
          onPress={() => setSelectedAction('CHECKOUT')}
        >
          <Text
            style={[
              styles.toggleText,
              selectedAction === 'CHECKOUT' && styles.toggleTextActive,
            ]}
          >
            Check Out
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manual scan button (testing fallback) */}
      <TouchableOpacity
        style={[styles.scanButton, isProcessing && styles.scanButtonDisabled]}
        onPress={handleManualScan}
        disabled={isProcessing}
      >
        <Text style={styles.scanButtonText}>Manual Scan</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
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
    position: 'absolute',
    top: 8,
    right: 24,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },
  statusOnline: {
    backgroundColor: '#22C55E',
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 24,
  },
  statusSpinner: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  actionToggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#3B82F6',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  scanButton: {
    marginHorizontal: 24,
    marginBottom: 32,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  offlineBanner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  offlineIcon: {
    fontSize: 48,
    color: '#EF4444',
    fontWeight: '700',
    marginBottom: 16,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  offlineText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
});
