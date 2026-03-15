/**
 * On-device cosine similarity matching.
 * Same algorithm and threshold as the backend.
 */

const MATCH_THRESHOLD = 0.6;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function matchLocal(
  embedding: number[],
  cachedEmbeddings: number[][],
): { matched: boolean; confidence: number } {
  let bestScore = 0;

  for (const stored of cachedEmbeddings) {
    const score = cosineSimilarity(embedding, stored);
    if (score > bestScore) bestScore = score;
  }

  return {
    matched: bestScore >= MATCH_THRESHOLD,
    confidence: bestScore,
  };
}
