/**
 * Face Recognition Utilities
 * 
 * Reusable face recognition functions for the ERP system
 * Can be extracted to a separate utils file for use across components
 */

// Initialize face detection models
export const initializeFaceDetection = async () => {
  try {
    const MODEL_URL = '/models/';
    await Promise.all([
      fetch(`${MODEL_URL}tiny_face_detector_model-weights_manifest.json`),
      fetch(`${MODEL_URL}face_recognition_model-weights_manifest.json`),
      fetch(`${MODEL_URL}face_expression_model-weights_manifest.json`)
    ].map(p => p.catch(() => console.warn('Model loading skipped'))));
    return true;
  } catch (error) {
    console.warn('Face detection models not available', error);
    return false;
  }
};

/**
 * Extract face descriptor from video element
 * In production, integrate with @vladmandic/face-api for real face detection
 * 
 * @param {HTMLVideoElement} video - Video element with live stream
 * @returns {Array<number>} Face descriptor array (128 dimensions)
 */
export const extractFaceDescriptor = async (video) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const descriptor = [];
    for (let i = 0; i < Math.min(imageData.length, 128); i += 4) {
      descriptor.push((imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3 / 255);
    }
    return descriptor;
  } catch (error) {
    console.error('Face extraction error:', error);
    return null;
  }
};

/**
 * Calculate similarity between two face descriptors
 * Uses Euclidean distance converted to percentage similarity
 * 
 * @param {Array<number>} descriptor1 - First face descriptor
 * @param {Array<number>} descriptor2 - Second face descriptor
 * @returns {number} Similarity score (0-100)
 */
export const calculateFaceSimilarity = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
    return 0;
  }
  
  let sumSquares = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sumSquares += diff * diff;
  }
  
  const distance = Math.sqrt(sumSquares);
  const similarity = Math.max(0, 100 - (distance * 50));
  return similarity;
};

/**
 * Find best matching worker from face descriptor
 * 
 * @param {Array<number>} faceDescriptor - Detected face descriptor
 * @param {Object} workerDescriptors - Map of worker IDs to their descriptors
 * @param {number} threshold - Minimum confidence threshold (default: 55)
 * @returns {Object|null} Best match with worker data and similarity
 */
export const findMatchingWorker = (faceDescriptor, workerDescriptors, threshold = 55) => {
  let bestMatch = null;
  let bestSimilarity = 0;

  for (const [workerId, data] of Object.entries(workerDescriptors)) {
    const similarity = calculateFaceSimilarity(faceDescriptor, data.descriptor);
    
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      if (similarity >= threshold) {
        bestMatch = {
          workerId,
          worker: data.worker,
          similarity
        };
      }
    }
  }

  return bestMatch;
};

/**
 * Generate deterministic face descriptor for worker (for demo)
 * In production, use actual face encodings from face-api.js
 * 
 * @param {number|string} workerId - Worker ID
 * @returns {Array<number>} 128-dimensional descriptor
 */
export const generateWorkerDescriptor = (workerId) => {
  const descriptor = [];
  const seed = typeof workerId === 'string' ? workerId.charCodeAt(0) : workerId;
  
  for (let i = 0; i < 128; i++) {
    descriptor.push((Math.sin(seed + i) * 0.5 + 0.5));
  }
  
  return descriptor;
};

/**
 * Convert similarity percentage to confidence label
 * 
 * @param {number} similarity - Similarity percentage (0-100)
 * @returns {string} Confidence label
 */
export const getSimilarityLabel = (similarity) => {
  if (similarity >= 85) return 'Very High';
  if (similarity >= 70) return 'High';
  if (similarity >= 55) return 'Acceptable';
  if (similarity >= 40) return 'Low';
  return 'Very Low';
};

/**
 * Check for duplicate attendance (same person within timeframe)
 * 
 * @param {Array} logs - Attendance logs
 * @param {string} workerId - Worker ID to check
 * @param {number} minutes - Time window in minutes (default: 30)
 * @returns {boolean} True if duplicate found
 */
export const isDuplicateAttendance = (logs, workerId, minutes = 30) => {
  const cutoffTime = new Date(Date.now() - minutes * 60000);
  
  return logs.some(log => 
    log.worker_id === workerId && 
    new Date(log.timestamp) > cutoffTime
  );
};
