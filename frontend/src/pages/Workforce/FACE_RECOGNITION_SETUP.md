# Biometric Face Recognition — System Implementation

The TeaERP Pro Smart Attendance system is now fully integrated using a high-performance neural face recognition pipeline.

## Current Architecture

### 1. **Neural Engine (@vladmandic/face-api)**
- **Detection**: Uses `SsdMobilenetv1` for high-accuracy enrollment and `TinyFaceDetector` for low-latency live tracking.
- **Landmarks**: 68-point facial landmark detection for feature alignment.
- **Recognition**: 128-dimensional floating-point descriptor extraction.

### 2. **Worker Enrollment Pipeline**
- **Multi-Sample Capture**: Captures 5 distinct face samples per worker.
- **Biometric Storage**: Descriptors are serialized as JSON and stored in the `face_descriptors` SQL table.
- **Upsert Logic**: Supports re-enrollment and removal of biometric data.

### 3. **Live Attendance Terminal**
- **Real-time Matching**: Compares live video frames against the global `FaceMatcher` initialized from the database.
- **Cyberpunk HUD**: Tactical overlay with scanlines, neural confidence bars, and simulated biometric metadata.
- **Smart Verification**: Multi-stage authentication flow (Neural Sync -> Liveness Check -> Finalize).

## Setup & Maintenance

### Backend Endpoints
- `GET /api/workforce/face-descriptors`: Fetches all enrolled descriptors for matcher initialization.
- `POST /api/workforce/face-descriptors`: Saves/Updates worker face samples.
- `POST /api/workforce/biometric-attendance`: Logs successful authentication events.

### Model Location
Neural weights are located in `frontend/public/models/`. Essential files include:
- `ssd_mobilenetv1_model-weights_manifest.json`
- `face_recognition_model-weights_manifest.json`
- `face_landmark_68_model-weights_manifest.json`

## Optimization & Tuning

### Confidence Thresholds
Adjust `MATCH_THRESHOLD` in `FaceAttendance.jsx` (currently `0.52` distance):
- **Lower Distance (e.g., 0.40)**: Stricter matching, higher security.
- **Higher Distance (e.g., 0.60)**: More lenient matching, easier check-in.

---
*TeaERP Pro — Biometric Extension v1.2*
