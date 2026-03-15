/**
 * Face Recognition Service — Production Implementation
 *
 * Uses MobileFaceNet TFLite model for real face embedding generation.
 * Input: 112×112 RGB image, normalized to [-1, 1]
 * Output: 192-dimensional L2-normalized face embedding
 */

import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import { Buffer } from 'buffer';

const MODEL_INPUT_SIZE = 112;
const EMBEDDING_DIM = 192;

let model: TensorflowModel | null = null;

/**
 * Initialize the MobileFaceNet TFLite model.
 * Call this once on app startup.
 */
export async function initModel(): Promise<void> {
  if (model) return;

  try {
    model = await loadTensorflowModel(
      require('../../assets/models/mobilefacenet.tflite'),
      'default',
    );
    console.log('MobileFaceNet model loaded successfully');
    console.log('Input:', model.inputs[0]?.shape, model.inputs[0]?.dataType);
    console.log('Output:', model.outputs[0]?.shape, model.outputs[0]?.dataType);
  } catch (error) {
    console.error('Failed to load MobileFaceNet model:', error);
    throw error;
  }
}

/**
 * Generate a face embedding from a captured photo URI.
 *
 * @param imageUri - file:// URI of the captured photo
 * @param faceBounds - optional face bounding box for cropping
 * @returns 192-dimensional embedding or null if failed
 */
export async function generateEmbedding(
  imageUri: string,
  faceBounds?: { x: number; y: number; width: number; height: number },
): Promise<number[] | null> {
  if (!model) {
    console.error('Model not initialized. Call initModel() first.');
    return null;
  }

  try {
    // Step 1: Crop to face region (if provided) and resize to 112×112
    const actions: any[] = [];

    if (faceBounds) {
      actions.push({
        crop: {
          originX: Math.max(0, Math.round(faceBounds.x)),
          originY: Math.max(0, Math.round(faceBounds.y)),
          width: Math.round(faceBounds.width),
          height: Math.round(faceBounds.height),
        },
      });
    }

    actions.push({
      resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE },
    });

    const processed = await manipulateAsync(imageUri, actions, {
      format: SaveFormat.JPEG,
      compress: 1,
      base64: true,
    });

    if (!processed.base64) {
      console.error('Failed to get base64 from processed image');
      return null;
    }

    // Step 2: Decode JPEG to raw RGBA pixel data
    const jpegBuffer = Buffer.from(processed.base64, 'base64');
    const rawImage = jpeg.decode(jpegBuffer, { useTArray: true });

    // Step 3: Convert RGBA to normalized RGB Float32Array [-1, 1]
    const tensorSize = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3;
    const inputTensor = new Float32Array(tensorSize);

    for (let i = 0; i < MODEL_INPUT_SIZE * MODEL_INPUT_SIZE; i++) {
      const rgbaIdx = i * 4; // RGBA format from jpeg-js
      const rgbIdx = i * 3;  // RGB for model input

      inputTensor[rgbIdx] = rawImage.data[rgbaIdx] / 127.5 - 1.0;       // R
      inputTensor[rgbIdx + 1] = rawImage.data[rgbaIdx + 1] / 127.5 - 1.0; // G
      inputTensor[rgbIdx + 2] = rawImage.data[rgbaIdx + 2] / 127.5 - 1.0; // B
    }

    // Step 4: Run MobileFaceNet inference
    const outputs = model.runSync([inputTensor]);
    const rawEmbedding = outputs[0];

    if (!rawEmbedding || rawEmbedding.length < EMBEDDING_DIM) {
      console.error('Invalid model output, length:', rawEmbedding?.length);
      return null;
    }

    // Step 5: L2-normalize the embedding
    const embedding = Array.from(rawEmbedding as Float32Array).slice(0, EMBEDDING_DIM);
    return l2Normalize(embedding);
  } catch (error) {
    console.error('Embedding generation failed:', error);
    return null;
  }
}

/**
 * L2-normalize a vector to unit length.
 */
function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) return vector;
  return vector.map((val) => val / norm);
}
