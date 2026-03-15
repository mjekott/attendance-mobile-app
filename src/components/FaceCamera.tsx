import { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

export interface DetectedFace {
  bounds: { x: number; y: number; width: number; height: number };
  yawAngle: number;
  pitchAngle: number;
  rollAngle: number;
}

interface FaceCameraProps {
  isScanning: boolean;
  onFaceCapture: (uri: string, face: DetectedFace) => void;
  captureIntervalMs?: number;
  minFaceSize?: number;
  onFaceDetected?: (detected: boolean, face?: DetectedFace) => void;
  /** Require passive liveness before capture (anti-spoofing) */
  requireLiveness?: boolean;
  /** Called with liveness status message and whether it passed */
  onLivenessUpdate?: (message: string, passed: boolean) => void;
}

// Passive liveness: collect face positions over time, check for natural micro-movement
const MOVEMENT_SAMPLES = 8; // number of position samples to collect
const MOVEMENT_WINDOW_MS = 1500; // collect samples over this window
const MIN_MOVEMENT = 1.5; // minimum total position variance (pixels) to confirm real face
const MIN_EYE_OPEN = 0.4; // eyes must be at least this open

export function FaceCamera({
  isScanning,
  onFaceCapture,
  captureIntervalMs = 2000,
  minFaceSize = 0.2,
  onFaceDetected,
  requireLiveness = false,
  onLivenessUpdate,
}: FaceCameraProps) {
  const cameraRef = useRef<Camera>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const lastCaptureTime = useRef(0);
  const isCapturing = useRef(false);

  // Passive liveness state
  const positionSamples = useRef<{ x: number; y: number; t: number }[]>([]);
  const livenessChecked = useRef(false);

  const { detectFaces } = useFaceDetector({
    performanceMode: 'accurate',
    classificationMode: 'all',
    landmarkMode: 'all',
    minFaceSize,
    cameraFacing: 'front',
  });

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const resetLiveness = useCallback(() => {
    setLivenessPassed(false);
    positionSamples.current = [];
    livenessChecked.current = false;
    onLivenessUpdate?.('Detecting...', false);
  }, [onLivenessUpdate]);

  const handleFaceDetected = Worklets.createRunOnJS(
    (detected: boolean, face?: DetectedFace) => {
      const wasHasFace = hasFace;
      setHasFace(detected);
      if (!detected && wasHasFace) {
        resetLiveness();
      }
      onFaceDetected?.(detected, face);
    },
  );

  const handleLivenessCheck = Worklets.createRunOnJS(
    (centerX: number, centerY: number, leftEyeOpen: number, rightEyeOpen: number) => {
      if (!requireLiveness || livenessPassed || livenessChecked.current) return;

      // Check eyes are open (rejects photos of sleeping/closed eyes)
      if (leftEyeOpen < MIN_EYE_OPEN || rightEyeOpen < MIN_EYE_OPEN) {
        onLivenessUpdate?.('Open your eyes', false);
        return;
      }

      const now = Date.now();
      positionSamples.current.push({ x: centerX, y: centerY, t: now });

      // Remove samples outside the window
      positionSamples.current = positionSamples.current.filter(
        (s) => now - s.t < MOVEMENT_WINDOW_MS,
      );

      if (positionSamples.current.length < MOVEMENT_SAMPLES) {
        onLivenessUpdate?.('Hold still...', false);
        return;
      }

      // Calculate position variance (natural micro-movement)
      const samples = positionSamples.current;
      const avgX = samples.reduce((s, p) => s + p.x, 0) / samples.length;
      const avgY = samples.reduce((s, p) => s + p.y, 0) / samples.length;
      const variance = Math.sqrt(
        samples.reduce((s, p) => s + (p.x - avgX) ** 2 + (p.y - avgY) ** 2, 0) /
          samples.length,
      );

      if (variance >= MIN_MOVEMENT) {
        // Real face — natural micro-movements detected
        livenessChecked.current = true;
        setLivenessPassed(true);
        onLivenessUpdate?.('Verified', true);
      } else {
        onLivenessUpdate?.('Verifying...', false);
      }
    },
  );

  const handleCapture = Worklets.createRunOnJS(
    async (face: DetectedFace) => {
      if (!cameraRef.current || isCapturing.current || !isCameraReady) return;
      if (requireLiveness && !livenessPassed) return;

      const now = Date.now();
      if (now - lastCaptureTime.current < captureIntervalMs) return;

      isCapturing.current = true;
      lastCaptureTime.current = now;

      try {
        const photo = await cameraRef.current.takePhoto({ flash: 'off' });
        onFaceCapture(`file://${photo.path}`, face);
      } catch (error) {
        console.error('Photo capture failed:', error);
      } finally {
        isCapturing.current = false;
      }
    },
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      const faces = detectFaces(frame);

      if (faces.length === 0) {
        handleFaceDetected(false);
        return;
      }

      if (faces.length > 1) {
        handleFaceDetected(false);
        return;
      }

      const face = faces[0];
      const frameWidth = frame.width;
      const faceWidthRatio = face.bounds.width / frameWidth;

      if (faceWidthRatio < minFaceSize) {
        handleFaceDetected(false);
        return;
      }

      const detectedFace: DetectedFace = {
        bounds: face.bounds,
        yawAngle: face.yawAngle,
        pitchAngle: face.pitchAngle,
        rollAngle: face.rollAngle,
      };

      handleFaceDetected(true, detectedFace);

      // Passive liveness: track face center position + eye state
      const centerX = face.bounds.x + face.bounds.width / 2;
      const centerY = face.bounds.y + face.bounds.height / 2;
      handleLivenessCheck(
        centerX,
        centerY,
        face.leftEyeOpenProbability,
        face.rightEyeOpenProbability,
      );

      if (isScanning) {
        handleCapture(detectedFace);
      }
    },
    [detectFaces, isScanning, minFaceSize],
  );

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
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor}
        onInitialized={() => setIsCameraReady(true)}
      />
      <View style={styles.overlay}>
        <View
          style={[
            styles.faceGuide,
            hasFace && styles.faceGuideDetected,
            isScanning && hasFace && livenessPassed && styles.faceGuideScanning,
          ]}
        />
      </View>
      {isScanning && hasFace && (
        <View style={styles.scanIndicator}>
          <Text style={styles.scanText}>
            {livenessPassed ? 'Verified — scanning...' : 'Detecting...'}
          </Text>
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
    borderColor: 'rgba(100, 116, 139, 0.4)',
    borderStyle: 'dashed',
  },
  faceGuideDetected: {
    borderColor: 'rgba(34, 197, 94, 0.6)',
    borderStyle: 'solid',
  },
  faceGuideScanning: {
    borderColor: 'rgba(59, 130, 246, 0.8)',
    borderWidth: 4,
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
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
  },
});
