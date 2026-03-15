import { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';

interface FaceCameraProps {
  isActive: boolean;
  onPhotoCapture: (uri: string) => void;
  captureIntervalMs?: number;
}

export function FaceCamera({
  isActive,
  onPhotoCapture,
  captureIntervalMs = 3000,
}: FaceCameraProps) {
  const cameraRef = useRef<Camera>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const captureFrame = useCallback(async () => {
    if (!cameraRef.current || !isCameraReady || !isActive) return;

    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
      });
      onPhotoCapture(`file://${photo.path}`);
    } catch (error) {
      console.error('Photo capture failed:', error);
    }
  }, [isCameraReady, isActive, onPhotoCapture]);

  // Auto-capture at interval when active
  useEffect(() => {
    if (isActive && isCameraReady) {
      intervalRef.current = setInterval(captureFrame, captureIntervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isCameraReady, captureFrame, captureIntervalMs]);

  if (!hasPermission) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Camera permission required</Text>
        <Text style={styles.placeholderSubtext}>
          Please grant camera access in settings
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No front camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        photo={true}
        onInitialized={() => setIsCameraReady(true)}
      />
      {/* Face guide overlay */}
      <View style={styles.overlay}>
        <View style={styles.faceGuide} />
      </View>
      {isActive && (
        <View style={styles.scanIndicator}>
          <Text style={styles.scanText}>Scanning...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748B',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuide: {
    width: 220,
    height: 280,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: 'rgba(59, 130, 246, 0.6)',
    borderStyle: 'dashed',
  },
  scanIndicator: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
});
