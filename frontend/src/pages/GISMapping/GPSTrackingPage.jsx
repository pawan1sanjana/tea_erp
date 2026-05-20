import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Navigation, MapPin, Play, Square, Trash2, Save, CheckCircle, AlertTriangle,
  Loader2, Signal, Target, Download, RefreshCw, X, Crosshair, Layers,
  Zap, ZapOff, ChevronDown, Info, Undo2, PlusCircle, WifiOff, Wifi, Upload, ExternalLink
} from 'lucide-react';
import { apiClient } from '../../api/client';
import JSZip from 'jszip';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, LayersControl, Polygon, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

// ─── Maths helpers ────────────────────────────────────────────────────────────
const DEG2RAD = Math.PI / 180;

/** Haversine distance in metres between two lat/lng points */
function haversine(a, b) {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * DEG2RAD;
  const dLng = (b.lng - a.lng) * DEG2RAD;
  const sin2 = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * DEG2RAD) * Math.cos(b.lat * DEG2RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(sin2));
}

/** Shoelace formula – polygon area in m² then converted to hectares */
function calcArea(pts) {
  if (pts.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = pts[i].lng * Math.cos(pts[i].lat * DEG2RAD) * DEG2RAD * R;
    const yi = pts[i].lat * DEG2RAD * R;
    const xj = pts[j].lng * Math.cos(pts[j].lat * DEG2RAD) * DEG2RAD * R;
    const yj = pts[j].lat * DEG2RAD * R;
    area += xi * yj - xj * yi;
  }
  return Math.abs(area / 2) / 10000; // m² → hectares
}

/** Build GeoJSON polygon from waypoints */
function toGeoJSON(waypoints) {
  if (waypoints.length < 3) return null;
  const coords = [...waypoints, waypoints[0]].map(w => [w.lng, w.lat]);
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: { recorded_at: new Date().toISOString(), point_count: waypoints.length },
  };
}

// ─── Leaflet Real Map ─────────────────────────────────────────────────────────

function MapUpdater({ waypoints, livePos }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints.length > 0) {
      const allPts = livePos ? [...waypoints, livePos] : waypoints;
      const bounds = L.latLngBounds(allPts.map(p => [p.lat, p.lng]));
      if (bounds.isValid()) {
         map.fitBounds(bounds, { padding: [50, 50], maxZoom: 19 });
      }
    } else if (livePos) {
      map.setView([livePos.lat, livePos.lng], 18);
    }
  }, [waypoints, livePos, map]);
  return null;
}

function PolygonMap({ waypoints, livePos, isDark }) {
  const polyCoords = waypoints.map(w => [w.lat, w.lng]);
  const defaultCenter = [6.9271, 80.7744]; // Fallback

  return (
    <div className="w-full h-full relative z-0" style={{ minHeight: '320px' }}>
      <MapContainer
        center={waypoints.length > 0 ? [waypoints[0].lat, waypoints[0].lng] : (livePos ? [livePos.lat, livePos.lng] : defaultCenter)} 
        zoom={13} 
        style={{ width: '100%', height: '100%', zIndex: 10 }}
        scrollWheelZoom={true}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Google Maps Satellite">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
              attribution='&copy; Google Maps'
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="ArcGIS Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={20}
              attribution='&copy; ESRI'
              crossOrigin="anonymous"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic Map">
            <TileLayer
               url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
               maxZoom={17}
               crossOrigin="anonymous"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street Map">
            <TileLayer
               url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
               maxZoom={19}
               crossOrigin="anonymous"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapUpdater waypoints={waypoints} livePos={livePos} />

        {/* Draw waypoints as connected lines or polygon */}
        {polyCoords.length >= 3 ? (
          <Polygon positions={polyCoords} pathOptions={{ color: '#10b981', weight: 3, fillColor: '#10b981', fillOpacity: 0.3 }} />
        ) : polyCoords.length >= 2 ? (
          <Polyline positions={polyCoords} pathOptions={{ color: '#10b981', weight: 3, dashArray: '6, 4' }} />
        ) : null}

        {/* Draw waypoints as circles */}
        {polyCoords.map((pt, i) => (
          <CircleMarker key={i} center={pt} radius={5} pathOptions={{ color: 'white', weight: 1, fillColor: '#10b981', fillOpacity: 1 }} />
        ))}

        {/* Live position */}
        {livePos && (
          <CircleMarker center={[livePos.lat, livePos.lng]} radius={7} pathOptions={{ color: 'white', weight: 2, fillColor: '#ef4444', fillOpacity: 1 }} />
        )}
      </MapContainer>
    </div>
  );
}

// ─── Accuracy Badge ────────────────────────────────────────────────────────────
function AccuracyBadge({ accuracy }) {
  if (accuracy === null) return null;
  const great = accuracy <= 5;
  const good = accuracy <= 15;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
      great ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
      good  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
               'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }`}>
      <Signal size={10} />
      {accuracy.toFixed(1)}m {great ? '· Excellent' : good ? '· Good' : '· Poor'}
    </span>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function GPSTrackingPage() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [blockDropOpen, setBlockDropOpen] = useState(false);

  const [tracking, setTracking] = useState(false);
  const [livePos, setLivePos] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [gpsSupported, setGpsSupported] = useState(true);
  const [accuracy, setAccuracy] = useState(null);

  const [waypoints, setWaypoints] = useState([]);
  const [autoCapture, setAutoCapture] = useState(true);
  const [minDist, setMinDist] = useState(3);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [existingPoly, setExistingPoly] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  const watchIdRef = useRef(null);
  const lastCaptRef = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Import GeoJSON / KML ────────────────────────────────────────────────────
  // ── Import GeoJSON / KML / KMZ / CSV ────────────────────────────────────────
  const parseKML = useCallback((content) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, "text/xml");
      const coordinatesNode = xmlDoc.getElementsByTagName("coordinates")[0];
      
      if (coordinatesNode) {
        const coordsStr = coordinatesNode.textContent.trim();
        const points = coordsStr.split(/\s+/).map(pair => {
          const parts = pair.split(',');
          if (parts.length >= 2) {
            return [parseFloat(parts[0]), parseFloat(parts[1])];
          }
          return null;
        }).filter(p => p !== null && !isNaN(p[0]) && !isNaN(p[1]));

        if (points.length >= 3) {
           const isClosed = points[0][0] === points[points.length-1][0] && points[0][1] === points[points.length-1][1];
           const parsedPoints = isClosed ? points.slice(0, -1) : points;
           
           const newWaypoints = parsedPoints.map(([lng, lat]) => ({ lat, lng, accuracy: 0, ts: Date.now(), loaded: true }));
           setWaypoints(newWaypoints);
           showToast('success', `Imported KML with ${newWaypoints.length} points.`);
        } else {
           showToast('error', 'Not enough valid coordinates in KML.');
        }
      } else {
         showToast('error', 'Could not find <coordinates> tag in KML.');
      }
    } catch (err) {
      showToast('error', 'Error parsing KML: ' + err.message);
    }
  }, [showToast]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const resetInput = () => { if (fileInputRef.current) fileInputRef.current.value = ''; };

    if (fileName.endsWith('.kmz')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const zip = new JSZip();
          const contents = await zip.loadAsync(event.target.result);
          const kmlFile = Object.values(contents.files).find(f => f.name.toLowerCase().endsWith('.kml'));
          if (!kmlFile) {
            showToast('error', 'No KML file found inside the KMZ archive.');
            return;
          }
          const kmlText = await kmlFile.async('text');
          parseKML(kmlText);
        } catch (err) {
          showToast('error', 'Error reading KMZ: ' + err.message);
        } finally {
          resetInput();
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        try {
          if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
            const data = JSON.parse(content);
            let coords = null;
            if (data.type === 'FeatureCollection' && data.features.length > 0) {
              const polyFeature = data.features.find(f => f.geometry?.type === 'Polygon');
              if (polyFeature) coords = polyFeature.geometry.coordinates[0];
            } else if (data.type === 'Feature' && data.geometry?.type === 'Polygon') {
              coords = data.geometry.coordinates[0];
            } else if (data.type === 'Polygon') {
              coords = data.coordinates[0];
            }

            if (coords && coords.length >= 3) {
              const newWaypoints = coords.slice(0, -1).map(([lng, lat]) => ({ lat, lng, accuracy: 0, ts: Date.now(), loaded: true }));
              setWaypoints(newWaypoints);
              showToast('success', `Imported GeoJSON with ${newWaypoints.length} points.`);
            } else {
               showToast('error', 'Could not find Polygon coordinates in GeoJSON.');
            }
          } 
          else if (fileName.endsWith('.kml')) {
            parseKML(content);
          }
          else if (fileName.endsWith('.csv')) {
            const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
            if (lines.length < 3) throw new Error('Not enough coordinates in CSV.');

            const headerParts = lines[0].toLowerCase().split(',');
            const isHeader = isNaN(parseFloat(headerParts[0]));
            const isLngLat = isHeader && headerParts[0].includes('lng');
            
            const startIndex = isHeader ? 1 : 0;
            const points = [];

            for (let i = startIndex; i < lines.length; i++) {
              const parts = lines[i].split(',').map(s => parseFloat(s.trim()));
              if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                let lat, lng;
                if (isLngLat) { lng = parts[0]; lat = parts[1]; }
                else { lat = parts[0]; lng = parts[1]; }
                points.push({ lat, lng, accuracy: 0, ts: Date.now(), loaded: true });
              }
            }

            if (points.length >= 3) {
               const isClosed = points[0].lat === points[points.length-1].lat && points[0].lng === points[points.length-1].lng;
               const parsedPoints = isClosed ? points.slice(0, -1) : points;
               setWaypoints(parsedPoints);
               showToast('success', `Imported CSV with ${parsedPoints.length} points.`);
            } else {
               showToast('error', 'Not enough valid coordinates in CSV.');
            }
          } else {
            showToast('error', 'Unsupported file format.');
          }
        } catch (err) {
          showToast('error', 'Error parsing file: ' + err.message);
        } finally {
           resetInput();
        }
      };
      reader.readAsText(file);
    }
  }, [parseKML, showToast]);

  // ── Fetch blocks ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingBlocks(true);
      try {
        const res = await apiClient.get('/crop/blocks');
        if (res.success) setBlocks(res.data);
      } catch { showToast('error', 'Cannot connect to backend.'); }
      finally { setLoadingBlocks(false); }
    })();
    return () => stopWatch();
  }, []);

  // ── Load existing polygon when block changes ─────────────────────────────
  useEffect(() => {
    if (!selectedBlock) { setExistingPoly(null); return; }
    (async () => {
      try {
        const res = await apiClient.get(`/crop/blocks/${selectedBlock.id}/polygon`);
        if (res.success && res.data.polygon_coordinates) {
          setExistingPoly(res.data.polygon_coordinates);
        } else {
          setExistingPoly(null);
        }
      } catch { setExistingPoly(null); }
    })();
    // Reset waypoints when block changes
    setWaypoints([]);
    lastCaptRef.current = null;
  }, [selectedBlock]);

  // ── GPS Watch ────────────────────────────────────────────────────────────────
  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsSupported(false);
      showToast('error', 'Geolocation is not supported on this device.');
      return;
    }
    setGpsError(null);
    setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        setLivePos(pt);
        setAccuracy(pos.coords.accuracy);

        if (autoCapture) {
          const last = lastCaptRef.current;
          if (!last || haversine(last, pt) >= minDist) {
            setWaypoints(prev => [...prev, { ...pt, ts: Date.now() }]);
            lastCaptRef.current = pt;
          }
        }
      },
      (err) => {
        setGpsError(err.message);
        showToast('error', `GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [autoCapture, minDist, showToast]);

  const stopTracking = useCallback(() => {
    stopWatch();
    setTracking(false);
    showToast('success', `Tracking stopped — ${waypoints.length} points captured.`);
  }, [stopWatch, waypoints.length, showToast]);

  // ── Manual point capture ────────────────────────────────────────────────────
  const captureCurrentPos = useCallback(() => {
    if (!livePos) { showToast('error', 'No live position available yet.'); return; }
    setWaypoints(prev => [...prev, { ...livePos, ts: Date.now() }]);
    lastCaptRef.current = livePos;
    showToast('success', 'Point captured!');
  }, [livePos, showToast]);

  const addManualPoint = useCallback(() => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      showToast('error', 'Invalid coordinates. Lat: –90…90, Lng: –180…180');
      return;
    }
    setWaypoints(prev => [...prev, { lat, lng, accuracy: 0, ts: Date.now(), manual: true }]);
    setManualLat(''); setManualLng('');
    setShowManual(false);
    showToast('success', 'Manual point added.');
  }, [manualLat, manualLng, showToast]);

  const removeWaypoint = useCallback((idx) => {
    setWaypoints(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const undoLast = useCallback(() => {
    setWaypoints(prev => prev.slice(0, -1));
  }, []);

  // ── Save to database ────────────────────────────────────────────────────────
  const saveBoundary = useCallback(async () => {
    if (!selectedBlock) { showToast('error', 'Select a block first.'); return; }
    if (waypoints.length < 3) { showToast('error', 'Need at least 3 points to form a boundary.'); return; }
    setSaving(true);
    try {
      const geojson = toGeoJSON(waypoints);
      const res = await fetch(`/api/crop/blocks/${selectedBlock.id}/polygon`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon_coordinates: geojson }),
      });
      const data = await res.json();
      if (data.success) {
        setExistingPoly(geojson);
        showToast('success', `Boundary for "${selectedBlock.name}" saved to database!`);
      } else {
        showToast('error', data.error || 'Failed to save boundary.');
      }
    } catch {
      showToast('error', 'Network error saving boundary.');
    } finally {
      setSaving(false);
    }
  }, [selectedBlock, waypoints, showToast]);

  // ── Load existing polygon as waypoints ────────────────────────────────────
  const loadExistingAsWaypoints = useCallback(() => {
    if (!existingPoly?.geometry?.coordinates?.[0]) return;
    const coords = existingPoly.geometry.coordinates[0].slice(0, -1); // remove closing point
    setWaypoints(coords.map(([lng, lat]) => ({ lat, lng, accuracy: 0, ts: Date.now(), loaded: true })));
    showToast('success', 'Existing boundary loaded for editing.');
  }, [existingPoly, showToast]);

  // ── Export GeoJSON ──────────────────────────────────────────────────────────
  const exportGeoJSON = useCallback(() => {
    if (waypoints.length < 3) { showToast('error', 'Need at least 3 points to export.'); return; }
    const geojson = toGeoJSON(waypoints);
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedBlock?.name || 'block'}_boundary_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [waypoints, selectedBlock, showToast]);

  // ── Computed values ─────────────────────────────────────────────────────────
  const areaHa    = calcArea(waypoints);
  const perimeter = waypoints.length >= 2
    ? waypoints.reduce((sum, pt, i) =>
        sum + (i > 0 ? haversine(waypoints[i - 1], pt) : 0), 0) +
      (waypoints.length >= 3 ? haversine(waypoints[waypoints.length - 1], waypoints[0]) : 0)
    : 0;

  const canSave = selectedBlock && waypoints.length >= 3;

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900 transition-all';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2';

  return (
    <div className="space-y-8 animate-fade-in relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
            Boundary Tracker
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Navigation size={14} className="text-emerald-500" />
            Walk field boundaries to map blocks in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
            !gpsSupported ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            tracking ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 animate-pulse' :
            'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {!gpsSupported ? <WifiOff size={10} /> : tracking ? <Wifi size={10} /> : <WifiOff size={10} />}
            {!gpsSupported ? 'GPS N/A' : tracking ? 'Live Tracking' : 'GPS Ready'}
          </span>
          <AccuracyBadge accuracy={accuracy} />
        </div>
      </div>

      {/* ── Block Selector ── */}
      <div className="premium-card border-l-4 border-emerald-500">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Layers size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Select Field Block to Map</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Choose which block boundary you are recording</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Custom dropdown */}
          <div className="relative">
            <button
              id="block-select-btn"
              onClick={() => setBlockDropOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-left transition-all hover:border-emerald-400 focus:outline-none focus:border-emerald-500"
            >
              <span className={`text-sm font-bold ${selectedBlock ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {loadingBlocks ? 'Loading blocks…' : selectedBlock ? `${selectedBlock.name} — ${selectedBlock.division_name}` : 'Choose a block…'}
              </span>
              {loadingBlocks
                ? <Loader2 size={16} className="animate-spin text-slate-400" />
                : <ChevronDown size={16} className={`text-slate-400 transition-transform ${blockDropOpen ? 'rotate-180' : ''}`} />
              }
            </button>

            {blockDropOpen && !loadingBlocks && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {blocks.length === 0
                  ? <p className="text-center text-xs text-slate-400 py-6">No blocks found</p>
                  : blocks.map(b => (
                    <button
                      key={b.id}
                      onClick={() => { setSelectedBlock(b); setBlockDropOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0 ${
                        selectedBlock?.id === b.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                      }`}
                    >
                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</p>
                        <p className="text-[11px] text-slate-500">{b.division_name} Division</p>
                      </div>
                    </button>
                  ))
                }
              </div>
            )}
          </div>

          {/* Existing polygon info */}
          {selectedBlock && (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 ${
              existingPoly
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
            }`}>
              {existingPoly ? <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            : <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${existingPoly ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
                  {existingPoly ? 'Existing boundary found' : 'No boundary recorded yet'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {existingPoly
                    ? `${existingPoly.geometry?.coordinates?.[0]?.length - 1 || 0} points saved`
                    : 'Start tracking to record boundary'}
                </p>
              </div>
              {existingPoly && waypoints.length === 0 && (
                <button onClick={loadExistingAsWaypoints}
                  className="shrink-0 text-[10px] font-black text-emerald-700 dark:text-emerald-400 hover:underline uppercase tracking-wider">
                  Load
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Interface ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* LEFT — Map Preview */}
        <div className="lg:col-span-3 space-y-4">
          <div className="premium-card p-0 overflow-hidden">
            {/* Map header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-500" />
                <span className="text-sm font-black text-slate-900 dark:text-white">Boundary Map</span>
                {waypoints.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-full">
                    {waypoints.length} pts
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {waypoints.length > 0 && (
                  <>
                    <button onClick={undoLast}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors" title="Undo last point">
                      <Undo2 size={14} />
                    </button>
                    <button onClick={() => { setWaypoints([]); lastCaptRef.current = null; }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Clear all points">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* SVG map */}
            <div className="aspect-video bg-slate-950 p-0">
              <PolygonMap waypoints={waypoints} livePos={livePos} isDark={true} />
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
              {[
                { label: 'Points', value: waypoints.length, unit: '' },
                { label: 'Area', value: waypoints.length >= 3 ? areaHa.toFixed(4) : '—', unit: ' ha' },
                { label: 'Perimeter', value: perimeter > 0 ? (perimeter < 1000 ? `${perimeter.toFixed(0)}m` : `${(perimeter/1000).toFixed(2)}km`) : '—', unit: '' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="flex flex-col items-center py-3 px-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{value}{unit}</p>
                </div>
              ))}
            </div>
          </div>

          {/* GPS Error Banner */}
          {gpsError && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm">
              <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-red-800 dark:text-red-300 font-semibold">{gpsError}</p>
            </div>
          )}

          {/* Tracking controls */}
          <div className="premium-card space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tracking Controls</h3>

            {/* Mode toggle */}
            <div className="flex gap-3 items-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Mode:</span>
              <button
                onClick={() => setAutoCapture(true)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  autoCapture ? 'bg-emerald-600 text-white shadow-lg' : 'border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-400'
                }`}
              >
                Auto Track
              </button>
              <button
                onClick={() => setAutoCapture(false)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  !autoCapture ? 'bg-blue-600 text-white shadow-lg' : 'border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400'
                }`}
              >
                Manual Tap
              </button>
            </div>

            {autoCapture && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">Min. distance:</span>
                <input type="range" min={1} max={50} value={minDist}
                  onChange={e => setMinDist(Number(e.target.value))}
                  className="flex-1 accent-emerald-600" />
                <span className="text-xs font-black text-emerald-600 w-12 text-right">{minDist} m</span>
              </div>
            )}

            {/* Primary action buttons */}
            <div className="flex flex-wrap gap-3">
              {!tracking ? (
                <button
                  id="start-tracking-btn"
                  onClick={startTracking}
                  disabled={!gpsSupported}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <Play size={16} /> Start Tracking
                </button>
              ) : (
                <button
                  id="stop-tracking-btn"
                  onClick={stopTracking}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-red-600/20 transition-all animate-pulse"
                >
                  <Square size={16} /> Stop Tracking
                </button>
              )}

              {!autoCapture && tracking && (
                <button
                  id="capture-point-btn"
                  onClick={captureCurrentPos}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  <Target size={16} /> Capture Point
                </button>
              )}

              <button onClick={() => setShowManual(v => !v)}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <PlusCircle size={14} /> Manual Point
              </button>
            </div>

            {/* Manual coordinate entry */}
            {showManual && (
              <div className="p-5 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">Manual Point Entry</p>
                  <button onClick={() => setShowManual(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Latitude</label>
                    <input type="number" step="0.000001" placeholder="e.g. 6.9271"
                      value={manualLat} onChange={e => setManualLat(e.target.value)}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Longitude</label>
                    <input type="number" step="0.000001" placeholder="e.g. 80.7744"
                      value={manualLng} onChange={e => setManualLng(e.target.value)}
                      className={inputClass} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={addManualPoint}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                    <PlusCircle size={14} /> Add Point
                  </button>
                  <button onClick={() => { setManualLat(''); setManualLng(''); }}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* External Precision Tool */}
          <div className="premium-card border-l-4 border-blue-500 bg-blue-50/20 dark:bg-blue-900/10">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 shrink-0">
                <Target size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">High-Precision Mapping</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  For professional-grade accuracy (centimeter-level), use our specialized mobile tool:
                </p>
                <div className="mt-4 space-y-3">
                  <a 
                    href="https://terra-nav.vercel.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20"
                  >
                    Launch Terra-Nav <ExternalLink size={12} />
                  </a>
                  <div className="bg-white/50 dark:bg-slate-950/50 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                    <p className="text-[9px] font-black text-blue-800 dark:text-blue-400 uppercase mb-2 tracking-widest">How it works:</p>
                    <ul className="text-[10px] text-slate-600 dark:text-slate-300 space-y-1.5">
                      <li className="flex gap-2"><span>1.</span> <span>Open Terra-Nav on your mobile device.</span></li>
                      <li className="flex gap-2"><span>2.</span> <span>Record boundary points with high GPS precision.</span></li>
                      <li className="flex gap-2"><span>3.</span> <span>Export the captured data as a <b>GeoJSON</b> file.</span></li>
                      <li className="flex gap-2"><span>4.</span> <span>Return here and use the <b>Import</b> button below.</span></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Waypoints list & actions */}
        <div className="lg:col-span-2 space-y-4">

          {/* Live position card */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Position</h3>
              {tracking && <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                LIVE
              </span>}
            </div>
            {livePos ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Latitude', value: livePos.lat.toFixed(7) },
                    { label: 'Longitude', value: livePos.lng.toFixed(7) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">GPS Accuracy</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1 font-mono">{livePos.accuracy.toFixed(1)} m</p>
                  </div>
                  <AccuracyBadge accuracy={livePos.accuracy} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 gap-2 text-slate-400">
                <Crosshair size={28} className="opacity-30" />
                <p className="text-xs font-bold">
                  {tracking ? 'Acquiring signal…' : 'Start tracking to see position'}
                </p>
              </div>
            )}
          </div>

          {/* Waypoints list */}
          <div className="premium-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Waypoints ({waypoints.length})
              </h3>
              {waypoints.length > 0 && (
                <button onClick={() => { setWaypoints([]); lastCaptRef.current = null; }}
                  className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors">
                  Clear All
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {waypoints.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
                  <MapPin size={24} className="opacity-30" />
                  <p className="text-xs font-bold">No waypoints yet</p>
                </div>
              ) : (
                [...waypoints].reverse().map((pt, reverseIdx) => {
                  const idx = waypoints.length - 1 - reverseIdx;
                  return (
                    <div key={idx} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 leading-tight truncate">
                          {pt.lat.toFixed(6)}, {pt.lng.toFixed(6)}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {pt.manual ? '✏️ Manual' : pt.loaded ? '📂 Loaded' : `±${pt.accuracy?.toFixed(1) || '?'}m`}
                        </p>
                      </div>
                      <button onClick={() => removeWaypoint(idx)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Save / Export actions */}
          <div className="flex flex-col gap-3">
            <button
              id="save-boundary-btn"
              onClick={saveBoundary}
              disabled={!canSave || saving}
              className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.01]"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving to Database...' : `Save Boundary${selectedBlock ? ` — ${selectedBlock.name}` : ''}`}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={exportGeoJSON}
                disabled={waypoints.length < 3}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                <Download size={16} /> Export
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
              >
                <Upload size={16} /> Import
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".geojson,.json,.kml,.kmz,.csv" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Tips card */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">
              📱 Field Tips
            </p>
            <ul className="text-[11px] text-blue-800 dark:text-blue-300 space-y-1.5 leading-relaxed">
              <li>→ Open on mobile for best GPS accuracy</li>
              <li>→ <b>Auto Track</b>: Walk the boundary slowly</li>
              <li>→ <b>Manual Tap</b>: Stop at each corner, then tap</li>
              <li>→ Need ≥ 3 points to save a polygon</li>
              <li>→ GPS accuracy under 5m is ideal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
