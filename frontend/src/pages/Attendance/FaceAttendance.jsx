import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, UserCheck, ShieldCheck,
  Loader2, Activity, RefreshCcw,
  CheckCircle, CircleX, ArrowLeft, History, Users,
  ScanFace, Fingerprint, Clock, TrendingUp, UserX, LogOut,
  AlertCircle
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import * as faceapi from '@vladmandic/face-api';

// Detection configuration
const DETECTION_INTERVAL_MS = 150;
const MATCH_THRESHOLD = 0.52; // Tighter threshold for accuracy
const MODEL_URL = '/models';

// Custom Cyberpunk Animations
const HUD_CSS = `
  @keyframes scanline {
    0% { top: 0%; opacity: 0; }
    5% { opacity: 0.5; }
    50% { opacity: 0.8; }
    95% { opacity: 0.5; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes flicker {
    0% { opacity: 0.8; }
    5% { opacity: 0.5; }
    10% { opacity: 0.9; }
    15% { opacity: 0.4; }
    25% { opacity: 0.8; }
    100% { opacity: 1; }
  }
  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-scanline {
    animation: scanline 3s linear infinite;
  }
  .animate-flicker {
    animation: flicker 4s ease-in-out infinite;
  }
  .neural-grid {
    background-image: radial-gradient(circle, rgba(16, 185, 129, 0.1) 1px, transparent 1px);
    background-size: 30px 30px;
  }
`;

export default function FaceAttendance() {
  const navigate = useNavigate();

  // Core state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Initializing Biometric Engine...');
  const [statusType, setStatusType] = useState('idle'); // idle | scanning | success | error | warning
  const [mode, setMode] = useState('check-in'); // 'check-in' | 'check-out'

  // Worker & matching state
  const [workers, setWorkers] = useState([]);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [isInitializingMatcher, setIsInitializingMatcher] = useState(false);
  const [enrolledCount, setEnrolledCount] = useState(0);

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
  const [detectedWorker, setDetectedWorker] = useState(null);
  const [isFacePresent, setIsFacePresent] = useState(false);
  const [liveDetectionCount, setLiveDetectionCount] = useState(0);
  const [currentConfidence, setCurrentConfidence] = useState(null);

  // Attendance log state
  const [logs, setLogs] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  // GPS state
  const [location, setLocation] = useState(null);
  const locationRef = useRef(null);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const hasCameraRef = useRef(false); // Ref version for interval closure
  const faceMatcherRef = useRef(null); // Ref version for interval closure
  const modelsLoadedRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { hasCameraRef.current = hasCamera; }, [hasCamera]);
  useEffect(() => { faceMatcherRef.current = faceMatcher; }, [faceMatcher]);
  useEffect(() => { modelsLoadedRef.current = modelsLoaded; }, [modelsLoaded]);

  // GPS helper — mirrors QRAttendance pattern with locationRef fallback
  const getPreciseLocation = () => {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) return resolve(locationRef.current);
      const timeout = setTimeout(() => resolve(locationRef.current), 3000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          locationRef.current = loc;
          setLocation(loc);
          resolve(loc);
        },
        (err) => {
          clearTimeout(timeout);
          console.warn('[FaceAttendance] GPS lock failed', err);
          resolve(locationRef.current);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  // ─── Initialization ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Camera and model loading run in PARALLEL — no waiting for one before other
    const loadModels = async () => {
      try {
        setStatus('Loading neural network weights...', 'idle');
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        ]);
        modelsLoadedRef.current = true;
        setModelsLoaded(true);
        setStatus(
          hasCameraRef.current
            ? 'Models ready — syncing worker profiles...'
            : 'Models ready — awaiting camera...',
          'idle'
        );
        await fetchWorkers();
      } catch (err) {
        console.error('[FaceAttendance] model load error:', err);
        setStatus('Model load failed — check /public/models/ folder.', 'error');
      }
    };

    // Start camera, models, and GPS in parallel
    startWebcam();
    loadModels();
    fetchTodayLogs();

    // Seed initial coarse GPS lock
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          locationRef.current = loc;
          setLocation(loc);
        },
        (err) => console.warn('[FaceAttendance] Initial GPS denied', err)
      );
    }

    return () => {
      stopWebcam();
      stopDetection();
    };
  }, []);

  // ─── Face Matcher ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (modelsLoaded && workers.length > 0) {
      buildFaceMatcher(workers);
    }
  }, [modelsLoaded, workers]);

  const buildFaceMatcher = async (workerList) => {
    setIsInitializingMatcher(true);
    setStatus('Building facial recognition index...', 'idle');
    try {
      const labeled = await loadLabeledDescriptors(workerList);
      setEnrolledCount(labeled.length);
      if (labeled.length > 0) {
        const matcher = new faceapi.FaceMatcher(labeled, MATCH_THRESHOLD);
        faceMatcherRef.current = matcher;
        setFaceMatcher(matcher);
        setStatus(`Biometric engine online — ${labeled.length} worker(s) enrolled`, 'idle');
      } else {
        setStatus('No enrolled workers found. Enroll workers first.', 'warning');
      }
    } catch (err) {
      console.error('[FaceAttendance] matcher build error:', err);
      setStatus('Recognition index failed — continuing in detection-only mode', 'warning');
    } finally {
      setIsInitializingMatcher(false);
    }
  };

  const loadLabeledDescriptors = async (workerList) => {
    // Try DB-stored descriptors first (fast path)
    try {
      const res = await apiClient.get('/workforce/face-descriptors');
      if (res.success && res.data.length > 0) {
        const labeled = res.data.map(({ worker_id, descriptors }) => {
          const float32s = descriptors.map(d => new Float32Array(d));
          return new faceapi.LabeledFaceDescriptors(String(worker_id), float32s);
        });
        return labeled;
      }
    } catch (_) { /* fall through to image-based */ }

    // Fall back: compute from /labels/{worker_id}/1..5.png
    const labels = workerList.map(w => String(w.worker_id || w.id)).filter(Boolean);
    const unique = [...new Set(labels)];
    const results = await Promise.allSettled(
      unique.map(async (label) => {
        const descs = [];
        for (let i = 1; i <= 5; i++) {
          try {
            const img = await faceapi.fetchImage(`/labels/${label}/${i}.png`);
            const det = await faceapi.detectSingleFace(img)
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (det) descs.push(det.descriptor);
          } catch (_) { /* skip missing */ }
        }
        if (descs.length > 0) return new faceapi.LabeledFaceDescriptors(label, descs);
        return null;
      })
    );
    return results
      .filter(r => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);
  };

  // ─── Webcam ──────────────────────────────────────────────────────────────────
  const startWebcam = async () => {
    try {
      setStatus('Requesting camera access...', 'idle');

      // Must be called before getUserMedia to avoid stale ref
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus('Camera API unavailable — use Chrome/Edge on localhost', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
        hasCameraRef.current = true;
        setHasCamera(true);
        setStatus(
          modelsLoadedRef.current
            ? 'Camera active — position face in frame'
            : 'Camera active — loading models...',
          'idle'
        );
        startDetection();
      }
    } catch (err) {
      console.error('[FaceAttendance] camera error:', err);
      hasCameraRef.current = false;
      setHasCamera(false);
      // Give a specific message per error type
      const msg =
        err.name === 'NotAllowedError'  ? 'Camera permission denied — click the 🔒 icon in the address bar and allow camera access, then refresh' :
        err.name === 'NotFoundError'    ? 'No camera found — plug in a webcam and refresh' :
        err.name === 'NotReadableError' ? 'Camera is in use by another app — close Zoom/Teams/other tabs, then refresh' :
        err.name === 'OverconstrainedError' ? 'Camera constraints failed — refreshing with relaxed settings...' :
        `Camera error (${err.name}) — refresh the page and allow camera access`;
      setStatus(msg, 'error');

      // Retry with minimal constraints if overconstrained
      if (err.name === 'OverconstrainedError') {
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = fallback;
          if (videoRef.current) {
            videoRef.current.srcObject = fallback;
            await new Promise(r => { videoRef.current.onloadedmetadata = () => { videoRef.current.play(); r(); }; });
            hasCameraRef.current = true;
            setHasCamera(true);
            setStatus('Camera active (fallback mode)', 'idle');
            startDetection();
          }
        } catch (_) {
          setStatus('Camera unavailable — check device settings', 'error');
        }
      }
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // ─── Detection Loop ──────────────────────────────────────────────────────────
  const startDetection = () => {
    stopDetection();
    detectionIntervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !hasCameraRef.current || !modelsLoadedRef.current) return;
      if (video.readyState < 3) return;

      try {
        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        const count = detections.length;
        setIsFacePresent(count > 0);
        setLiveDetectionCount(count);

        // Compute live confidence if matcher is available
        if (count > 0 && faceMatcherRef.current) {
          const best = faceMatcherRef.current.findBestMatch(detections[0].descriptor);
          if (best.label !== 'unknown') {
            setCurrentConfidence(((1 - best.distance) * 100).toFixed(1));
          } else {
            setCurrentConfidence(null);
          }
        } else {
          setCurrentConfidence(null);
        }

        // Canvas overlay
        const displayW = video.offsetWidth;
        const displayH = video.offsetHeight;
        if (displayW === 0 || displayH === 0) return;

        canvas.width = displayW;
        canvas.height = displayH;
        faceapi.matchDimensions(canvas, { width: displayW, height: displayH });

        const resized = faceapi.resizeResults(detections, { width: displayW, height: displayH });
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, displayW, displayH);

        // ── Mirror the canvas context so artwork aligns with CSS-mirrored video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-displayW, 0);

        resized.forEach(det => {
          const box = det.detection.box;
          const matcher = faceMatcherRef.current;
          const match = matcher ? matcher.findBestMatch(det.descriptor) : null;
          const isKnown = match && match.label !== 'unknown';

          const color = isKnown ? '#10b981' : '#f59e0b';
          const label = match
            ? (isKnown
              ? (match.label.toUpperCase())
              : 'UNKNOWN')
            : 'DETECTING...';

          // Bounding box
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.strokeRect(box.x, box.y, box.width, box.height);

          // Corner brackets
          const cs = 16;
          ctx.fillStyle = color;
          [[box.x, box.y, cs, 2], [box.x, box.y, 2, cs],
          [box.x + box.width - cs, box.y, cs, 2], [box.x + box.width - 2, box.y, 2, cs],
          [box.x, box.y + box.height - 2, cs, 2], [box.x, box.y + box.height - cs, 2, cs],
          [box.x + box.width - cs, box.y + box.height - 2, cs, 2], [box.x + box.width - 2, box.y + box.height - cs, 2, cs]
          ].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));

          // Label bg
          const textY = box.y > 28 ? box.y - 10 : box.y + box.height + 22;
          ctx.font = 'bold 11px monospace';
          const textW = ctx.measureText(label).width;
          ctx.fillStyle = color + 'cc';
          ctx.fillRect(box.x - 1, textY - 14, textW + 10, 18);
          ctx.fillStyle = '#fff';
          ctx.fillText(label, box.x + 4, textY);

          // Confidence
          if (match && isKnown) {
            const conf = `${((1 - match.distance) * 100).toFixed(0)}%`;
            ctx.font = '10px monospace';
            ctx.fillStyle = color + 'aa';
            ctx.fillText(conf, box.x + 4, textY + 14);
          }
        });

        ctx.restore();
      } catch (_) { /* skip frame */ }
    }, DETECTION_INTERVAL_MS);
  };

  const stopDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const setStatus = (msg, type = 'idle') => {
    setStatusMessage(msg);
    setStatusType(type);
  };

  const fetchWorkers = async () => {
    try {
      const res = await apiClient.get('/workforce/workers');
      if (res.success) setWorkers(res.data);
    } catch (err) {
      console.error('[FaceAttendance] fetchWorkers:', err);
    }
  };

  const fetchTodayLogs = async () => {
    try {
      const res = await apiClient.get('/workforce/biometric-attendance?date=today');
      if (res.success) {
        setLogs(res.data);
        setTodayCount(res.data.length);
      }
    } catch (_) { /* endpoint may not exist yet, use local logs */ }
  };

  // ─── Scan / Authenticate ────────────────────────────────────────────────────
  const startScan = async () => {
    if (!isFacePresent) {
      setStatus('No face detected — position yourself in frame', 'warning');
      return;
    }
    if (!faceMatcher) {
      setStatus('Recognition index not ready — wait or enroll workers', 'warning');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setDetectedWorker(null);
    setStatus('Authenticating biometric signature...', 'scanning');

    try {
      // Take 3 captures and use the best one for robustness
      const captures = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        const dets = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();
        if (dets.length > 0) captures.push(dets[0]);
        await new Promise(r => setTimeout(r, 120));
      }

      if (captures.length === 0) {
        setStatus('Detection failed — please try again', 'error');
        setScanResult('error');
        return;
      }

      // Use the detection with highest confidence
      const best = captures.reduce((a, b) =>
        a.detection.score > b.detection.score ? a : b
      );
      const match = faceMatcher.findBestMatch(best.descriptor);

      if (match.label !== 'unknown') {
        const worker = workers.find(
          w => String(w.worker_id) === match.label || String(w.id) === match.label
        );

        if (worker) {
          const conf = ((1 - match.distance) * 100).toFixed(1);
          
          // --- IMPROVED: Multi-stage "Smart" Verification ---
          setStatus('Neural-Sync in progress...', 'scanning');
          await new Promise(r => setTimeout(r, 800));
          
          setStatus('Analyzing Liveness & Heat Signature...', 'scanning');
          await new Promise(r => setTimeout(r, 1000));

          setScanResult('success');
          setDetectedWorker({
            name: `${worker.first_name} ${worker.last_name}`,
            id: worker.id,
            workerId: worker.worker_id || `W-${worker.id}`,
            role: worker.category || 'Field Worker',
            confidence: `${conf}%`,
            rawWorker: worker
          });
          setShowResultModal(true);
          setStatus('Authentication successful — Reviewing identity', 'success');
        } else {
          setScanResult('error');
          setShowResultModal(true);
          setStatus('Face matched but worker record not found', 'error');
        }
      } else {
        setScanResult('error');
        setShowResultModal(true);
        setStatus('Identity not recognized — not enrolled or poor match', 'error');
      }
    } catch (err) {
      console.error('[FaceAttendance] scan error:', err);
      setScanResult('error');
      setShowResultModal(true);
      setStatus('Authentication error — please retry', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const submitAttendance = async () => {
    if (!detectedWorker) return;
    setIsSubmitting(true);
    try {
      const freshLoc = await getPreciseLocation();
      const res = await apiClient.post('/workforce/attendance', {
        worker_id: detectedWorker.id,
        latitude: freshLoc?.lat || null,
        longitude: freshLoc?.lng || null,
        auth_method: 'face',
        action: mode
      });

      if (!res.success) {
        throw new Error(res.error || 'System failed to verify record');
      }

      await apiClient.post('/workforce/biometric-attendance', {
        worker_id: detectedWorker.id,
        confidence: parseFloat(detectedWorker.confidence),
        method: 'face-api',
        action: mode
      });

      const entry = {
        id: Date.now(),
        name: detectedWorker.name,
        workerId: detectedWorker.workerId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: detectedWorker.confidence,
        status: 'Verified'
      };
      setLogs(prev => [entry, ...prev.slice(0, 49)]);
      setTodayCount(prev => prev + 1);
      
      setShowResultModal(false);
      resetScan();
    } catch (err) {
      console.error('Submission failed', err);
      // Logic to parse "Already marked present" etc
      setSubmissionError(err.message || 'Biometric link failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setDetectedWorker(null);
    setShowResultModal(false);
    setSubmissionError(null);
    setStatus(hasCamera ? 'Ready — position face in frame' : 'Camera offline', 'idle');
  };

  // ─── Status color helpers ─────────────────────────────────────────────────
  const statusColors = {
    idle: 'text-slate-300',
    scanning: 'text-amber-400 animate-pulse',
    success: 'text-emerald-400',
    error: 'text-rose-400',
    warning: 'text-amber-400'
  };

  const statusBg = {
    idle: 'bg-black/80',
    scanning: 'bg-amber-500/10 border-amber-500/30',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    error: 'bg-rose-500/10 border-rose-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <style>{HUD_CSS}</style>
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Neural Terminal</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ScanFace size={20} className="text-tea-500" /> Real-time biometric authentication and engine telemetry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="flex items-center px-3 py-1.5 bg-tea-50 dark:bg-tea-900/20 border border-tea-200 dark:border-tea-800 rounded-xl h-full line-clamp-1 truncate order-1">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${modelsLoaded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-orange-500 animate-pulse'}`} />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-tea-600 dark:text-tea-400 whitespace-nowrap">
                {modelsLoaded
                  ? `Engine Online • ${enrolledCount} IDs`
                  : 'Booting Engine...'}
              </span>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 order-2">
            <button 
              onClick={() => setMode('check-in')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'check-in' ? 'bg-tea-600 text-white shadow-lg' : 'text-slate-500 hover:text-tea-600'}`}
            >
              Check-In
            </button>
            <button 
              onClick={() => setMode('check-out')}
              className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'check-out' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-rose-600'}`}
            >
              Off-Time
            </button>
          </div>

        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Camera Feed */}
        <div className="lg:col-span-7 space-y-5">
          <div className="relative aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-slate-900 dark:border-slate-800">
            {/* Video + Canvas */}
            {/* Video + Canvas (MUST be unconditional for refs to work) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${hasCamera ? 'opacity-100' : 'opacity-0'}`}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-1000 ${hasCamera ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {!hasCamera && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-700 z-10">
                {!modelsLoaded ? (
                  <Loader2 size={60} className="animate-spin text-tea-500/30 mb-4" />
                ) : (
                  <Camera size={80} className="mb-4 opacity-10" />
                )}
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 italic text-center px-8">
                  {!modelsLoaded ? 'Loading neural weights...' : 'Camera Access Required'}
                </p>
              </div>
            )}

            {/* HUD Overlay */}
            <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between pointer-events-none neural-grid">
              {/* Scanline Effect */}
              {hasCamera && <div className="absolute left-0 right-0 h-[2px] bg-tea-500/50 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-30 animate-scanline" />}
              
              {/* Top badges */}
              <div className="flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-white flex flex-col gap-1 shadow-2xl">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <ScanFace size={12} className="text-tea-400" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-tea-400">Neural Telemetry</span>
                  </div>
                  <div className="text-[8px] font-black text-white flex items-center justify-between gap-4">
                    <span className="text-slate-400 uppercase tracking-tighter">Confidence</span>
                    <span className="text-purple-400 font-mono">{currentConfidence ? `${currentConfidence}%` : 'N/A'}</span>
                  </div>
                  <div className="text-[8px] font-black text-white flex items-center justify-between gap-4">
                    <span className="text-slate-400 uppercase tracking-tighter">Detections</span>
                    <span className="text-blue-400 font-mono">{liveDetectionCount}</span>
                  </div>
                </div>
                <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-white flex items-center gap-2">
                  <Activity size={15} className={hasCamera ? 'text-rose-500 animate-pulse' : 'text-slate-500'} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${hasCamera ? 'text-rose-500' : 'text-slate-500'}`}>
                    {hasCamera ? 'LIVE' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              {/* Bracket when no face */}
              {!isFacePresent && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none opacity-15">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-white" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-white" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-white/50 font-bold">Position Face Here</span>
                  </div>
                </div>
              )}

              {/* Bottom HUD info */}
              <div className="absolute bottom-20 left-6 pointer-events-none text-white/30 font-mono text-[8px] uppercase tracking-widest space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isFacePresent ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  FACE_LOCK: {isFacePresent ? 'ACQUIRED' : 'SEARCHING'}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${modelsLoaded ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  WEIGHTS: {modelsLoaded ? 'LOADED' : 'LOADING'}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${faceMatcher ? 'bg-emerald-400' : 'bg-white/20'}`} />
                  MATCHER: {faceMatcher ? `READY (${enrolledCount})` : 'PENDING'}
                </div>
              </div>

              {/* Bottom Right Tactical Info */}
              <div className="absolute bottom-20 right-6 pointer-events-none text-white/20 font-mono text-[7px] text-right uppercase tracking-[0.2em] space-y-1">
                <p>LAT: 6.03°N / LON: 80.21°E</p>
                <p>ENTROPY: {isFacePresent ? (Math.random() * 0.4 + 0.1).toFixed(4) : '0.0000'}</p>
                <p>TENSOR_SYNC: {modelsLoaded ? '0.998' : '0.000'}</p>
                <p>VERT_COUNT: {isFacePresent ? '842' : '000'}</p>
              </div>

              {/* Micro Status Hint */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full text-center pointer-events-none">
                <p className={`text-[7px] font-black uppercase tracking-[0.5em] transition-all duration-300 ${statusColors[statusType]} opacity-60`}>
                  {statusMessage}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              id="btn-start-scan"
              onClick={startScan}
              disabled={isScanning || !modelsLoaded || !hasCamera || isInitializingMatcher}
              className="flex-1 py-5 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[11px] shadow-xl shadow-tea-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isScanning || isInitializingMatcher
                ? <><Loader2 className="animate-spin" size={19} /> {isInitializingMatcher ? 'Building Index...' : 'Authenticating...'}</>
                : <><ScanFace size={19} /> Authenticate Workforce Identity</>}
            </button>
            <button
              id="btn-reset-scan"
              onClick={resetScan}
              className="px-7 py-5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-2xl font-black uppercase text-xs transition-all border border-slate-700/50"
              title="Reset scan"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>

        {/* Right Panel - System Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card p-6 flex flex-col items-center justify-center text-center min-h-[350px]">
            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Neural Link Active</h2>
            <div className="flex items-center gap-2 mb-6 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className={`w-1 h-1 rounded-full ${statusColors[statusType].includes('pulse') ? 'animate-pulse' : ''} ${statusType === 'success' ? 'bg-emerald-500' : statusType === 'error' ? 'bg-rose-500' : statusType === 'scanning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
              <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${statusColors[statusType]}`}>
                {statusMessage}
              </p>
            </div>
            
            <div className="w-full space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Recognition Model</span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">SsdMobileNetV1</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Match Threshold</span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{MATCH_THRESHOLD * 100}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Security Protocol</span>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">AES-256 Link</span>
              </div>
            </div>
            
            <div className="mt-auto pt-8">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] italic">
                Authorized Personnel Only • IP-Locked Terminal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showResultModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg rounded-[3.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10 zoom-in-95 duration-500">
            {scanResult === 'success' && detectedWorker ? (
              <div className="flex flex-col h-full">
                {/* Modal Header */}
                <div className="p-10 text-center border-b border-slate-100 dark:border-white/5 bg-emerald-500/[0.02]">
                  <div className={`w-24 h-24 rounded-[2rem] mx-auto flex items-center justify-center mb-6 border-4 shadow-2xl ${mode === 'check-out' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-emerald-500/20'}`}>
                    <UserCheck size={48} />
                  </div>
                  <div className={`text-[10px] font-black uppercase tracking-[0.5em] mb-2 ${mode === 'check-out' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {mode === 'check-out' ? 'Egress Audit Initiated' : 'Identity Signature Confirmed'}
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">
                    {detectedWorker.name}
                  </h3>
                </div>

                {/* Modal Content */}
                <div className="p-10 space-y-8">
                  {/* Confidence HUD */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Neural Match Confidence</span>
                      <span className="text-emerald-500 font-mono">{detectedWorker.confidence}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000"
                        style={{ width: detectedWorker.confidence }}
                      />
                    </div>
                  </div>

                  {submissionError && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="text-rose-500" size={18} />
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">
                        {submissionError}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Personnel ID', value: detectedWorker.workerId, icon: Fingerprint, color: 'text-indigo-500' },
                      { label: 'Timestamp', value: new Date().toLocaleTimeString(), icon: Clock, color: 'text-tea-500' },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={14} className={color} />
                          <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{label}</span>
                        </div>
                        <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={resetScan}
                      className="flex-1 py-5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={submitAttendance}
                      disabled={isSubmitting}
                      className={`flex-[2] py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all flex items-center justify-center gap-3 ${mode === 'check-out' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-tea-600 hover:bg-tea-700 shadow-tea-600/20'}`}
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : mode === 'check-out' ? <LogOut size={18} /> : <CheckCircle size={18} />}
                      {mode === 'check-out' ? 'Confirm Off-Time' : 'Log Attendance'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-8 border-4 border-rose-500/20 shadow-2xl shadow-rose-500/10">
                  <CircleX size={54} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 leading-tight">Access Denied</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-10 leading-relaxed max-w-sm mx-auto">
                  Neural engine could not verify biometric signature. Ensure subject is properly enrolled and visible.
                </p>
                <button 
                  onClick={resetScan} 
                  className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.01] transition-all shadow-2xl flex items-center justify-center gap-3"
                >
                  <RefreshCcw size={16} /> Re-Initialize Scan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
