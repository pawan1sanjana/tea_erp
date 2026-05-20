import React, { useState, useEffect } from 'react';
import { MapPin, Leaf, TrendingUp, Award, Activity, Search, RefreshCw, ChevronRight, X, BarChart3, Calendar, Layers, Zap, Loader2, Scissors } from 'lucide-react';
import { apiClient } from '../../api/client';
import { MapContainer, TileLayer, LayersControl, Polygon, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { jsPDF } from 'jspdf';

const STATUS_COLORS = {
  active:   { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-800' },
  pruned:   { bg: 'bg-sky-100 dark:bg-sky-900/30',         text: 'text-sky-700 dark:text-sky-400',         dot: 'bg-sky-500',     border: 'border-sky-200 dark:border-sky-800' },
  rested:   { bg: 'bg-purple-100 dark:bg-purple-900/30',      text: 'text-purple-700 dark:text-purple-400',      dot: 'bg-purple-500',  border: 'border-purple-200 dark:border-purple-800' },
  fallow:   { bg: 'bg-amber-100 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500',   border: 'border-amber-200 dark:border-amber-800' },
  inactive: { bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-500 dark:text-slate-400',     dot: 'bg-slate-400',   border: 'border-slate-200 dark:border-slate-700' },
};

const QUALITY_COLORS = {
  A: 'text-emerald-600 dark:text-emerald-400',
  B: 'text-amber-600 dark:text-amber-400',
  C: 'text-orange-600 dark:text-orange-400',
  'N/A': 'text-slate-400',
};

const BLOCK_GRADIENTS = [
  'from-emerald-500/20 to-teal-500/10',
  'from-tea-500/20 to-emerald-500/10',
  'from-blue-500/20 to-indigo-500/10',
  'from-violet-500/20 to-purple-500/10',
  'from-amber-500/20 to-orange-500/10',
  'from-cyan-500/20 to-teal-500/10',
];

function StatPill({ icon: Icon, label, value, color = 'text-slate-600 dark:text-slate-300' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
      <Icon size={14} className="text-slate-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 leading-none">{label}</p>
        <p className={`text-sm font-black mt-0.5 ${color} leading-none`}>{value}</p>
      </div>
    </div>
  );
}

const getBlockColor = (name) => {
  const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444'];
  let hash = 0;
  const str = String(name || '');
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getBlockArea = (block) => {
  const dbArea = Number(block.area_hectares) || Number(block.area);
  if (dbArea) return dbArea;
  
  if (!block.polygon_coordinates) return 0;
  
  let latLngs = [];
  try {
    let polyData = block.polygon_coordinates;
    if (typeof polyData === 'string') polyData = JSON.parse(polyData);
    
    let rawCoords = null;
    if (polyData && polyData.type === 'Feature' && polyData.geometry?.type === 'Polygon') {
      rawCoords = polyData.geometry.coordinates[0];
    } else if (polyData && polyData.type === 'Polygon') {
      rawCoords = polyData.coordinates[0];
    } else if (Array.isArray(polyData)) {
      rawCoords = polyData;
    }
    
    if (rawCoords && rawCoords.length > 0) {
      latLngs = rawCoords.map(c => {
        if (c && typeof c === 'object' && 'lat' in c && ('lng' in c || 'lon' in c)) return [c.lat, c.lng || c.lon];
        if (Array.isArray(c) && c.length >= 2) return typeof c[0] === 'number' ? [c[1], c[0]] : null;
        return null;
      }).filter(Boolean);
    }
  } catch(e) { return 0; }
  
  if (latLngs.length < 3) return 0;
  
  let area = 0;
  const R = 6378137;
  for (let i = 0; i < latLngs.length; i++) {
    const p1 = latLngs[i];
    const p2 = latLngs[(i + 1) % latLngs.length];
    const lat1 = p1[0] * Math.PI / 180;
    const lng1 = p1[1] * Math.PI / 180;
    const lat2 = p2[0] * Math.PI / 180;
    const lng2 = p2[1] * Math.PI / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2) / 10000;
};

// ─── Component: EstateMap ───────────────────────────────────────────────────
function EstateMap({ blocks, selectedIds, ndviMode, setNdviMode }) {
  const mapBlocks = blocks.filter(b => b.polygon_coordinates && (selectedIds.length === 0 || selectedIds.includes(b.id)));
  const defaultCenter = [6.9271, 80.7744];
  let bounds = [];

  const blockPolygons = mapBlocks.map(block => {
    let coords = null;
    let polyData = block.polygon_coordinates;
    try {
      if (typeof polyData === 'string') {
        polyData = JSON.parse(polyData);
      }
      if (polyData && polyData.type === 'Feature' && polyData.geometry?.type === 'Polygon') {
        coords = polyData.geometry.coordinates[0];
      } else if (polyData && polyData.type === 'Polygon') {
        coords = polyData.coordinates[0];
      } else if (Array.isArray(polyData)) {
        coords = polyData;
      }
      
      if (coords && coords.length > 0) {
        const latLngs = coords.map(c => {
          if (c && typeof c === 'object' && 'lat' in c && ('lng' in c || 'lon' in c)) {
            return [c.lat, c.lng || c.lon];
          }
          if (Array.isArray(c) && c.length >= 2) {
            return typeof c[0] === 'number' ? [c[1], c[0]] : null;
          }
          return null;
        }).filter(Boolean);

        if (latLngs.length > 0) {
           bounds.push(...latLngs);
           // Generate a mock NDVI value for simulation: 0.2 to 0.9
           const mockNDVI = 0.5 + (Math.sin(block.id * 1234.567) * 0.35);
           return { 
             id: block.id, 
             name: block.name, 
             status: block.status, 
             division: block.division_name, 
             positions: latLngs, 
             ndvi: mockNDVI,
             area: getBlockArea(block)
           };
        }
      }
    } catch (e) { console.error('Map parse error', e); }
    return null;
  }).filter(Boolean);

  const mapBounds = bounds.length > 0 ? L.latLngBounds(bounds) : null;

  // NDVI Color mapping
  const getNDVIColor = (val) => {
    if (val > 0.8) return '#065f46'; // Deep Green
    if (val > 0.6) return '#10b981'; // Green
    if (val > 0.4) return '#fbbf24'; // Yellow
    if (val > 0.2) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div id="estate-map-container" className="w-full h-[400px] md:h-[500px] mb-8 relative z-0 premium-card p-1.5 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-white dark:bg-slate-900">
      <div className="absolute top-4 left-12 z-[1000] flex gap-2">
        <button 
          onClick={() => setNdviMode(!ndviMode)}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
            ndviMode 
              ? 'bg-emerald-600 text-white shadow-emerald-600/30' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          {ndviMode ? 'Disable NDVI' : 'Enable NDVI Mode'}
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 z-[1000] glass-panel p-4 rounded-2xl border border-white/20 dark:border-slate-800 shadow-2xl min-w-[160px]">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Map Legend</h4>
        <div className="space-y-2">
          {ndviMode ? (
            <>
              {[
                { label: 'High Vegetation', color: '#065f46' },
                { label: 'Healthy', color: '#10b981' },
                { label: 'Moderate', color: '#fbbf24' },
                { label: 'Stressed', color: '#f97316' },
                { label: 'Low/Bare', color: '#ef4444' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="max-h-[250px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {blockPolygons.map(bp => (
                <div key={bp.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 max-w-[120px]">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getBlockColor(bp.name) }} />
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate" title={bp.name}>{bp.name}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-500 shrink-0">{bp.area.toFixed(2)} ha</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MapContainer
        bounds={mapBounds || undefined}
        center={mapBounds ? undefined : defaultCenter}
        zoom={mapBounds ? undefined : 13}
        style={{ width: '100%', height: '100%', borderRadius: '1.25rem', zIndex: 1 }}
        scrollWheelZoom={true}
        preferCanvas={true}
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

        {blockPolygons.map(bp => {
          const baseColor = getBlockColor(bp.name);
          const ndviColor = getNDVIColor(bp.ndvi);
          const activeColor = ndviMode ? ndviColor : baseColor;

          return (
            <Polygon 
              key={bp.id} 
              positions={bp.positions} 
              pathOptions={{ 
                color: activeColor, 
                weight: selectedIds.includes(bp.id) ? 4 : 2, 
                fillColor: activeColor, 
                fillOpacity: ndviMode ? 0.6 : 0.35,
                dashArray: selectedIds.includes(bp.id) ? '' : '5, 5'
              }}
            >
              <Tooltip sticky>
                <div className="text-center font-outfit">
                  <p className="font-black text-sm text-slate-800">{bp.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{bp.division || 'Estate'}</p>
                  {ndviMode && <p className="mt-1 text-[10px] font-black text-emerald-700">NDVI: {bp.ndvi.toFixed(2)}</p>}
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function FieldMapPage() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlockIds, setSelectedBlockIds] = useState([]);
  const [ndviMode, setNdviMode] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/crop/blocks');
      if (response.success) {
        setBlocks(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportMapReport = async () => {
    const mapElement = document.getElementById('estate-map-container');
    if (!mapElement) return;

    setExporting(true);
    try {
      const mapCanvas = mapElement.querySelector('canvas.leaflet-zoom-animated');
      if (!mapCanvas) {
        throw new Error("Map boundaries not rendered. Please ensure field blocks are loaded.");
      }

      // Draw the natively isolated Leaflet vector bounds onto a white background
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = mapCanvas.width;
      exportCanvas.height = mapCanvas.height;
      const ctx = exportCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      ctx.drawImage(mapCanvas, 0, 0);

      const imgData = exportCanvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(16, 185, 129); // tea-500
      pdf.text('Estate GIS Analysis Report', 15, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
      pdf.text(`Analysis Mode: ${ndviMode ? 'NDVI Vegetation Health' : 'Operational Status'}`, 15, 33);

      // Selection Info
      if (selectedBlockIds.length > 0) {
        pdf.text(`Selected Blocks: ${selectedBlockIds.length}`, 150, 28);
      }

      // Main Map Image
      const mapWidth = pageWidth - 30;
      const mapHeight = (exportCanvas.height * mapWidth) / exportCanvas.width;
      pdf.addImage(imgData, 'PNG', 15, 45, mapWidth, mapHeight);

      // Data Table (Simplified)
      pdf.setFontSize(14);
      pdf.setTextColor(30, 41, 59);
      pdf.text('Field Registry Summary', 15, mapHeight + 60);

      pdf.setFontSize(9);
      let yOffset = mapHeight + 70;
      pdf.text('Block Name', 15, yOffset);
      pdf.text('Division', 60, yOffset);
      pdf.text('Area (ha)', 100, yOffset);
      pdf.text('Status', 140, yOffset);
      
      pdf.line(15, yOffset + 2, pageWidth - 15, yOffset + 2);
      
      yOffset += 8;
      const reportBlocks = blocks.filter(b => selectedBlockIds.length === 0 || selectedBlockIds.includes(b.id)).slice(0, 15);
      
      reportBlocks.forEach(b => {
        pdf.text(String(b.name), 15, yOffset);
        pdf.text(String(b.division_name || 'Main'), 60, yOffset);
        pdf.text(String(getBlockArea(b).toFixed(2)), 100, yOffset);
        pdf.text(String(b.status || 'Active'), 140, yOffset);
        yOffset += 6;
      });

      pdf.save(`TeaERP-GIS-Report-${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('PDF Export Failed: ' + (err.message || 'Check console for details.'));
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const filtered = blocks.filter(b => {
    const matchSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.division_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || (b.status || '').toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedBlocks = filtered.slice(startIdx, endIdx);

  const statusKey = (s) => (s || 'inactive').toLowerCase();
  const totalArea = blocks.reduce((sum, b) => sum + getBlockArea(b), 0);
  const activeCount = blocks.filter(b => statusKey(b.status) === 'active').length;
  const prunedCount = blocks.filter(b => statusKey(b.status) === 'pruned').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Field Map</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-tea-500" /> GPS Estate Intelligence &amp; Block Registry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportMapReport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest transition-all hover:border-tea-500 shadow-sm"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} className="text-tea-500" />}
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <button
            onClick={fetchBlocks}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-tea-600 hover:bg-tea-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-tea-600/20"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Layers, label: 'Total Blocks', value: blocks.length, color: 'text-slate-800 dark:text-white' },
          { icon: Activity, label: 'Active Blocks', value: activeCount, color: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Scissors, label: 'Pruned Blocks', value: prunedCount, color: 'text-sky-600 dark:text-sky-400' },
          { icon: MapPin, label: 'Total Area', value: `${totalArea.toFixed(1)} ha / ${(totalArea * 2.471).toFixed(1)} ac`, color: 'text-blue-600 dark:text-blue-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="premium-card flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
              <h3 className={`text-xl font-black ${color}`}>{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Estate Map */}
      {!loading && <EstateMap blocks={blocks} selectedIds={selectedBlockIds} ndviMode={ndviMode} setNdviMode={setNdviMode} />}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by block or division..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-tea-500 transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'pruned', 'rested', 'fallow', 'inactive'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === s
                  ? 'bg-tea-600 text-white shadow-lg shadow-tea-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:border-tea-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {selectedBlockIds.length > 0 && (
          <button 
            onClick={() => setSelectedBlockIds([])}
            className="px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100 dark:border-red-900 hover:bg-red-100 transition-all flex items-center gap-2"
          >
            <X size={14} /> Clear Selection ({selectedBlockIds.length})
          </button>
        )}
      </div>

      {/* Block Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-tea-500 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Field Intelligence...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
          <MapPin size={48} className="opacity-30" />
          <p className="text-sm font-bold uppercase tracking-widest">No blocks found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedBlocks.map((block, idx) => {
            const sk = statusKey(block.status);
            const sc = STATUS_COLORS[sk] || STATUS_COLORS.inactive;
            const qc = QUALITY_COLORS[block.quality_grade] || QUALITY_COLORS['N/A'];
            const gradient = BLOCK_GRADIENTS[idx % BLOCK_GRADIENTS.length];

            return (
              <div
                key={block.id}
                onClick={() => {
                  setSelectedBlockIds(prev => 
                    prev.includes(block.id) 
                      ? prev.filter(id => id !== block.id) 
                      : [...prev, block.id]
                  );
                }}
                className={`group relative rounded-3xl p-5 cursor-pointer border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900 ${
                  selectedBlockIds.includes(block.id) ? 'border-tea-500 ring-4 ring-tea-500/10' : sc.border
                } overflow-hidden`}
              >
                {/* Gradient Accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-40 group-hover:opacity-60 transition-opacity rounded-3xl`} />

                <div className="relative z-10 space-y-4">
                  {/* Block Header */}
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-2xl bg-tea-500/10 dark:bg-tea-500/20">
                      <Leaf size={20} className="text-tea-600 dark:text-tea-400" />
                    </div>
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sc.bg} ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                      {block.status || 'Unknown'}
                    </span>
                  </div>

                  {/* Block Name & Division */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white font-outfit tracking-tight">
                      {block.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />
                      {block.division_name || 'Estate Division'}
                    </p>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Field Area</p>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">{getBlockArea(block).toFixed(2)} <span className="text-[9px] font-bold text-slate-400">ha</span></p>
                    </div>
                  </div>

                  {/* View Details CTA */}
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-tea-600 dark:text-tea-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Details</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                      currentPage === page
                        ? 'bg-tea-500 text-white shadow-lg shadow-tea-500/30'
                        : 'border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-300">{startIdx + 1}</span> to <span className="font-bold text-slate-700 dark:text-slate-300">{Math.min(endIdx, filtered.length)}</span> of <span className="font-bold text-slate-700 dark:text-slate-300">{filtered.length}</span> blocks
            </p>
          </div>
        </div>
      )}

      {/* Multi-Selection Intelligence Panel */}
      {selectedBlockIds.length > 0 && (() => {
        const selectedData = blocks.filter(b => selectedBlockIds.includes(b.id));
        const totalSelArea = selectedData.reduce((sum, b) => sum + getBlockArea(b), 0);
        const totalSelAcres = totalSelArea * 2.47105;
        const totalSelYield = selectedData.reduce((sum, b) => sum + (Number(b.last_yield) || 0), 0);
        const avgSelNDVI = selectedData.length > 0 ? 0.65 : 0; // Simulated

        return (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-3xl px-4 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-5 shadow-2xl shadow-emerald-900/20 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl">
                    <Zap size={24} className="text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black font-outfit tracking-tight">
                      {selectedBlockIds.length} Blocks Selected
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      Combined Field Analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-8 border-x border-slate-700/50 px-8 mx-auto md:mx-0">
                  <div className="flex gap-8">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Hectares</p>
                      <p className="text-xl font-black text-blue-400 font-outfit">{totalSelArea.toFixed(2)} <span className="text-xs font-bold text-slate-500">ha</span></p>
                    </div>
                    <div className="text-center border-l border-slate-700/50 pl-8">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Acres</p>
                      <p className="text-xl font-black text-sky-400 font-outfit">{totalSelAcres.toFixed(2)} <span className="text-xs font-bold text-slate-500">ac</span></p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Selection</p>
                    <p className="text-xl font-black text-emerald-400">{selectedBlockIds.length} <span className="text-xs font-bold text-slate-500">Blocks</span></p>
                  </div>
                  {ndviMode && (
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg NDVI</p>
                      <p className="text-xl font-black text-orange-400">0.72</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setSelectedBlockIds([])}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
