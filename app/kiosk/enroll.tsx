import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useKioskStore } from '../../src/stores/kioskStore';
import { usersApi, embeddingsApi } from '../../src/services/api';
import { generateEmbedding } from '../../src/services/faceRecognition';
import { FaceCamera, DetectedFace } from '../../src/components/FaceCamera';

type EnrollStep = 'details' | 'capture' | 'saving';

// Angle prompts for liveness: user must turn head in these directions
const ANGLE_PROMPTS = [
  { label: 'Look Left', direction: 'left' as const, minYaw: 15, maxYaw: 90 },
  { label: 'Look Straight', direction: 'straight' as const, minYaw: -10, maxYaw: 10 },
  { label: 'Look Right', direction: 'right' as const, minYaw: -90, maxYaw: -15 },
];

export default function EnrollScreen() {
  const [step, setStep] = useState<EnrollStep>('details');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [capturedEmbeddings, setCapturedEmbeddings] = useState<number[][]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [captureIndex, setCaptureIndex] = useState(0);
  const [angleMatch, setAngleMatch] = useState(false);

  const { accessToken } = useKioskStore();
  const currentPrompt = ANGLE_PROMPTS[captureIndex];

  const handleNext = () => {
    if (!name.trim() || !employeeId.trim()) {
      Alert.alert('Error', 'Name and Employee ID are required.');
      return;
    }
    setStep('capture');
  };

  const handleFaceDetected = useCallback(
    (_detected: boolean, face?: DetectedFace) => {
      if (!face || !currentPrompt) {
        setAngleMatch(false);
        return;
      }

      // Check if face yaw angle matches the expected direction
      // Note: yaw is inverted on front camera
      const yaw = face.yawAngle;
      const matches = yaw >= currentPrompt.minYaw && yaw <= currentPrompt.maxYaw;
      setAngleMatch(matches);
    },
    [currentPrompt],
  );

  const handleFaceCapture = useCallback(
    async (uri: string, face: DetectedFace) => {
      if (!currentPrompt) return;

      // Verify angle matches before accepting
      const yaw = face.yawAngle;
      if (yaw < currentPrompt.minYaw || yaw > currentPrompt.maxYaw) {
        return; // Ignore capture if angle doesn't match
      }

      try {
        const embedding = await generateEmbedding(uri, face.bounds);

        if (!embedding) {
          Alert.alert('No Face Detected', 'Please position your face clearly and try again.');
          return;
        }

        const newEmbeddings = [...capturedEmbeddings, embedding];
        setCapturedEmbeddings(newEmbeddings);

        if (newEmbeddings.length >= ANGLE_PROMPTS.length) {
          await saveEnrollment(newEmbeddings);
        } else {
          setCaptureIndex(newEmbeddings.length);
          setAngleMatch(false);
        }
      } catch {
        Alert.alert('Error', 'Failed to process face. Try again.');
      }
    },
    [capturedEmbeddings, currentPrompt],
  );

  const saveEnrollment = async (embeddings: number[][]) => {
    if (!accessToken) {
      Alert.alert('Error', 'Device not authenticated.');
      return;
    }

    setStep('saving');
    setIsSaving(true);

    try {
      const user = await usersApi.create(accessToken, {
        name: name.trim(),
        employeeId: employeeId.trim(),
        department: department.trim() || undefined,
      });

      await embeddingsApi.enroll(accessToken, user.id, embeddings);

      Alert.alert(
        'Enrollment Complete',
        `${user.name} has been enrolled successfully. They can now check in using face scan.`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Failed to enroll. Please try again.';
      Alert.alert('Error', message);
      setStep('capture');
      setCapturedEmbeddings([]);
      setCaptureIndex(0);
    } finally {
      setIsSaving(false);
    }
  };

  // Step 1: Enter details
  if (step === 'details') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backText}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Enroll New Staff</Text>
            <Text style={styles.subtitle}>
              Enter the staff member's details, then capture their face from 3 angles.
            </Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Amara Okafor"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Employee ID *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. EMP004"
              placeholderTextColor="#64748B"
              value={employeeId}
              onChangeText={setEmployeeId}
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Department</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Engineering"
              placeholderTextColor="#64748B"
              value={department}
              onChangeText={setDepartment}
              autoCapitalize="words"
            />

            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next: Capture Face</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 2: Capture face from different angles
  if (step === 'capture') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setStep('details');
            setCapturedEmbeddings([]);
            setCaptureIndex(0);
          }}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.captureTitle}>Capture Face</Text>
        <Text style={styles.captureSubtitle}>Enrolling: {name}</Text>

        {/* Progress */}
        <View style={styles.progressContainer}>
          {ANGLE_PROMPTS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < capturedEmbeddings.length && styles.progressDotFilled,
                i === captureIndex && styles.progressDotActive,
              ]}
            />
          ))}
          <Text style={styles.progressText}>
            {capturedEmbeddings.length} / {ANGLE_PROMPTS.length}
          </Text>
        </View>

        {/* Angle prompt */}
        <View style={styles.anglePrompt}>
          <Text
            style={[
              styles.anglePromptText,
              angleMatch && styles.anglePromptMatch,
            ]}
          >
            {currentPrompt?.label}
          </Text>
          {angleMatch && (
            <Text style={styles.angleMatchText}>Hold still...</Text>
          )}
        </View>

        {/* Camera */}
        <View style={styles.captureCamera}>
          <FaceCamera
            isScanning={true}
            onFaceCapture={handleFaceCapture}
            onFaceDetected={handleFaceDetected}
            captureIntervalMs={1500}
            minFaceSize={0.25}
          />
        </View>

        <Text style={styles.captureHint}>
          Turn your head as prompted — captures automatically when angle matches
        </Text>
      </SafeAreaView>
    );
  }

  // Step 3: Saving
  return (
    <SafeAreaView style={[styles.container, styles.centered]}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.savingText}>Enrolling {name}...</Text>
      <Text style={styles.savingSubtext}>
        Saving details and face data to server
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  flex: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 16,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
    lineHeight: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#334155',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Capture step
  captureTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    paddingHorizontal: 24,
  },
  captureSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  progressDotFilled: {
    backgroundColor: '#22C55E',
  },
  progressDotActive: {
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#60A5FA',
  },
  progressText: {
    color: '#64748B',
    fontSize: 14,
    marginLeft: 8,
  },
  anglePrompt: {
    paddingHorizontal: 24,
    marginBottom: 12,
    alignItems: 'center',
  },
  anglePromptText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F97316',
  },
  anglePromptMatch: {
    color: '#22C55E',
  },
  angleMatchText: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 4,
  },
  captureCamera: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  captureHint: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginVertical: 16,
  },
  // Saving step
  savingText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
  },
  savingSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
  },
});
