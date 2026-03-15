/**
 * Face Recognition Service
 *
 * Architecture:
 * - Vision Camera captures frames
 * - This service generates face embeddings from captured photos
 * - Embeddings are sent to the server for matching
 *
 * Current implementation uses a deterministic hash-based mock.
 * To use real on-device inference, swap in one of:
 * - react-native-fast-tflite with FaceNet/MobileFaceNet model
 * - @vladkurkov/react-native-face-recognition
 * - Custom frame processor plugin
 */

import { File, Paths } from 'expo-file-system';

const EMBEDDING_DIM = 128;

/**
 * Generate a 128-dimensional face embedding from a captured photo URI.
 *
 * MOCK IMPLEMENTATION: generates a deterministic embedding from image bytes.
 * Replace this with a real FaceNet model for production use.
 */
export async function generateEmbedding(
  imageUri: string,
): Promise<number[] | null> {
  try {
    const file = new File(imageUri);
    if (!file.exists) return null;

    // Read image as base64 to create a deterministic "embedding"
    const base64 = await file.base64();

    // Hash the base64 string into a reproducible 128-dim vector
    return hashToEmbedding(base64);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

/**
 * Deterministic hash -> embedding for testing.
 * Same image -> same embedding. Different images -> different embeddings.
 */
function hashToEmbedding(input: string): number[] {
  const embedding: number[] = [];
  let hash = 0;

  for (let i = 0; i < EMBEDDING_DIM; i++) {
    // Simple hash using character codes at spaced intervals
    const charIndex = Math.floor((i / EMBEDDING_DIM) * input.length);
    const char = input.charCodeAt(charIndex % input.length);
    hash = ((hash << 5) - hash + char) | 0;

    // Normalize to [-1, 1] range like real embeddings
    embedding.push(Math.sin(hash * (i + 1)));
  }

  // L2 normalize the vector
  const norm = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  return embedding.map((val) => val / (norm || 1));
}
