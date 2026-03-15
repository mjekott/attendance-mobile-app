# Face Recognition & Attendance System — Technical Overview

## System Architecture

The system consists of two components:

1. **Mobile Kiosk App** (Expo/React Native) — wall-mounted tablet that captures faces, runs on-device AI inference, and communicates with the API
2. **Backend API** (NestJS + Prisma + SQLite) — stores user data, face embeddings, and handles attendance logic

All face detection and embedding generation happens **on-device**. The API never receives raw images — only numerical embeddings (arrays of 192 numbers). This is both a privacy benefit and a performance optimization.

---

## How It Works: Step by Step

### 1. Face Detection (On-Device)

**Technology:** Google MLKit via `react-native-vision-camera-face-detector`

The front-facing camera runs a real-time frame processor that analyzes every video frame for faces. MLKit returns:

- **Bounding box** — position and size of the face in the frame
- **Head angles** — yaw (left/right), pitch (up/down), roll (tilt)
- **Eye open probability** — 0.0 (closed) to 1.0 (fully open) for each eye
- **Landmarks** — positions of eyes, nose, mouth, ears

The system enforces several checks before proceeding:

| Check | Requirement | Why |
|-------|-------------|-----|
| Single face | Exactly 1 face in frame | Prevents ambiguity |
| Minimum size | Face width ≥ 20% of frame | Ensures sufficient detail for embedding |
| Eyes open | Both eyes ≥ 0.4 probability | Rejects photos of closed eyes |

### 2. Anti-Spoofing: Passive Liveness Detection

**Problem:** A photo of someone's face (e.g., displayed on a laptop screen) would otherwise pass face detection.

**Solution:** Passive liveness — the system tracks natural micro-movements of a real face without requiring any deliberate action from the user.

**How it works:**

1. As soon as a face is detected, the system begins sampling the face's center position (x, y coordinates) at every frame
2. Samples are collected over a **1.5-second sliding window**
3. Once **8+ samples** are collected, the system calculates the **position variance** (standard deviation of movement)
4. A real face naturally exhibits tiny involuntary movements (muscle tremors, breathing, balance shifts). A photo held still or displayed on a screen does not.

**The math:**

```
avgX = average of all sample X positions
avgY = average of all sample Y positions

variance = √( Σ((x - avgX)² + (y - avgY)²) / n )
```

If `variance ≥ 1.5 pixels`, liveness is confirmed. This threshold is low enough that a person standing still will pass (natural micro-movements are typically 2–5 pixels), but a static photo will not (variance ≈ 0).

**Parameters:**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `MOVEMENT_SAMPLES` | 8 | Minimum samples needed |
| `MOVEMENT_WINDOW_MS` | 1500ms | Sliding window duration |
| `MIN_MOVEMENT` | 1.5px | Minimum variance threshold |
| `MIN_EYE_OPEN` | 0.4 | Eyes must be open |

The liveness check is completely passive — the user just looks at the camera and verification happens automatically within ~1.5 seconds.

### 3. Face Embedding Generation (On-Device AI)

**Technology:** MobileFaceNet running via TensorFlow Lite (`react-native-fast-tflite`)

Once liveness passes and a photo is captured, the system generates a **face embedding** — a compact numerical representation of the face.

**Process:**

1. **Crop** — Extract the face region from the full photo using the bounding box from MLKit
2. **Resize** — Scale the cropped face to exactly **112 × 112 pixels** (MobileFaceNet's required input size)
3. **Normalize** — Convert pixel values from [0, 255] to [-1, 1] range: `(pixel / 127.5) - 1.0`
4. **Inference** — Feed the normalized image tensor into MobileFaceNet
5. **L2 Normalize** — Normalize the raw 192-dimensional output vector to unit length

**Output:** A **192-dimensional vector** (array of 192 floating-point numbers) where each number captures an abstract facial feature. This vector is the face's "fingerprint."

**What MobileFaceNet learns:**

The model was pre-trained on millions of face images. It learned to map faces into a 192-dimensional space where:
- The **same person's** face always maps to **nearby points** (regardless of lighting, angle, expression)
- **Different people's** faces map to **distant points**

The L2 normalization step ensures all embeddings lie on the surface of a unit hypersphere, which makes cosine similarity equivalent to the dot product.

### 4. Face Matching: Cosine Similarity

**What is cosine similarity?**

Cosine similarity measures how similar two vectors are by computing the cosine of the angle between them. It ranges from -1 (opposite) to +1 (identical direction).

**Formula:**

```
                    A · B           Σ(aᵢ × bᵢ)
similarity = ─────────── = ─────────────────────────
              ‖A‖ × ‖B‖    √(Σaᵢ²) × √(Σbᵢ²)
```

Where:
- `A · B` is the dot product of the two vectors
- `‖A‖` and `‖B‖` are the magnitudes (lengths) of each vector

**Intuition:** Imagine two arrows pointing from the origin in 192-dimensional space. If they point in almost the same direction (small angle between them), cosine similarity is close to 1.0 — the faces are similar. If they point in very different directions, the value is close to 0 — the faces are different.

Since our embeddings are L2-normalized (unit length), the formula simplifies to just the dot product:

```
similarity = Σ(aᵢ × bᵢ)
```

**Thresholds:**

| Similarity | Interpretation |
|------------|---------------|
| ≥ 0.6 | **Match** — same person |
| 0.4 – 0.6 | Uncertain (currently treated as no match) |
| < 0.4 | **No match** — different person |

The 0.6 threshold was chosen to balance security (rejecting impostors) against usability (accepting the same person under varying conditions).

### 5. Employee ID–Scoped Matching

When a user checks in, they first enter their **Employee ID**. The system then:

1. Looks up that specific user's stored embeddings in the database
2. Compares the live face embedding **only** against that user's embeddings
3. If the highest cosine similarity ≥ 0.6, it's a match

This is different from a global search (comparing against all users). Benefits:

- **Faster** — comparing against 3 embeddings instead of potentially hundreds
- **More accurate** — eliminates false matches between similar-looking people
- **Simpler** — no need for a "best match" algorithm across all users

---

## Enrollment Flow

When enrolling a new staff member, the system captures face embeddings from **3 different angles** to improve matching reliability:

1. **Look Left** (yaw 15° to 90°)
2. **Look Straight** (yaw -10° to 10°)
3. **Look Right** (yaw -90° to -15°)

Each capture generates one 192-dimensional embedding. All 3 embeddings are stored in the database linked to that user. During verification, the live embedding is compared against all 3 stored embeddings, and the highest similarity score is used.

Multiple angles ensure the system can recognize the person even if they're not looking perfectly straight at the camera.

---

## Verification (Check-In/Out) Flow

```
User enters Employee ID
        ↓
Camera starts → MLKit detects face
        ↓
Passive liveness check (~1.5s)
        ↓
Photo captured automatically
        ↓
MobileFaceNet generates 192-dim embedding (on-device)
        ↓
Embedding sent to API with Employee ID
        ↓
API compares against that user's stored embeddings
        ↓
Cosine similarity ≥ 0.6? → Match → Check in or out
                          → No match → Rejected
```

The API auto-detects whether this is a check-in or check-out based on the user's current status (no attendance record today = check-in, already checked in = check-out).

---

## Data Flow & Privacy

| Data | Where it lives | Sent over network? |
|------|----------------|-------------------|
| Camera frames | Device memory only | No |
| Face photos | Device temp storage, deleted after processing | No |
| Face embeddings (192 numbers) | Device → API → Database | Yes (numbers only) |
| Raw images | Never stored permanently | Never |

The API never sees the user's face — only an array of 192 numbers that cannot be reversed back into an image. This is a one-way transformation.

---

## Technology Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Camera | react-native-vision-camera v4 | Real-time camera with frame processing |
| Face Detection | react-native-vision-camera-face-detector (MLKit) | Detect faces, landmarks, angles |
| AI Inference | react-native-fast-tflite + MobileFaceNet | Generate face embeddings on-device |
| Worklet Bridge | react-native-worklets-core | Bridge frame processor to JS thread |
| Matching | Custom cosine similarity | Compare face embeddings |
| Backend | NestJS + Prisma + SQLite | Store embeddings, manage attendance |
