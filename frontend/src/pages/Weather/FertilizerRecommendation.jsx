import React, { useState, useEffect, useCallback } from 'react';
import { 
  Leaf, Droplets, Thermometer, AlertTriangle, CheckCircle, 
  Zap, TrendingUp, X, Loader2, MapPin, Activity, 
  Wind, ShieldAlert, FlaskConical, Beaker, Clock, ChevronLeft,
  Navigation, AlertOctagon, Sparkles, SlidersHorizontal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

export default function FertilizerRecommendation() {
  const navigate = useNavigate();
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [message, showMsg] = useState(null);

  const notify = (text, type = 'success') => {
    showMsg({ text, type });
    setTimeout(() => showMsg(null), 3000);
  };

  useEffect(() => {
    // 1. Fetch live blocks
    const loadBlocks = async () => {
      try {
        const r = await apiClient.get('/crop/blocks');
        if (r.success) setBlocks(r.data);
      } catch (e) { console.error('Blocks load failed', e); }
    };
    loadBlocks();

    // 2. Initial Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setLocation({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => setLocation({ lat: 6.9271, lon: 79.8612 }) // Fallback
      );
    }
  }, []);

  const fetchWeatherForBlock = useCallback(async (lat, lon) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                  `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code` +
                  `&hourly=precipitation_probability,cloud_cover&forecast_days=1`;
      const res = await fetch(url);
      const data = await res.json();
      setWeatherData(data);
    } catch (e) { notify('Weather sync failed', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (location && selectedBlock) {
      fetchWeatherForBlock(location.lat, location.lon);
    }
  }, [selectedBlock, location, fetchWeatherForBlock]);

  // Logic: Safety Status
  const getSafetyStatus = () => {
    if (!weatherData) return { level: 'Unknown', color: 'text-slate-400', bg: 'bg-slate-50' };
    const cur = weatherData.current;
    if (cur.precipitation > 2 || cur.wind_speed_10m > 25) 
      return { level: 'ABORT', desc: 'Heavy Rain/Wind: Leaching Risk', color: 'text-red-600', bg: 'bg-red-50' };
    if (cur.precipitation > 0 || cur.wind_speed_10m > 15)
      return { level: 'CAUTION', desc: 'Light Rain: Monitor Drift', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { level: 'SAFE', desc: 'Optimal conditions for absorbance', color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700' };
  };

  const safety = getSafetyStatus();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-1">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Fertilizer Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <FlaskConical size={14} className="text-tea-500" /> Agronomic nutrition schedules & precision safety
          </p>
        </div>
        <button
          onClick={() => navigate('/weather/realtime')}
          className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
        >
          <ChevronLeft size={16} /> Dashboard
        </button>
      </div>

      {message && <div className={`fixed top-4 right-4 z-[500] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 ${message.type === 'error' ? 'bg-red-500' : 'bg-tea-500'} text-white`}><CheckCircle size={16} /> <span className="text-sm font-bold">{message.text}</span></div>}

      {/* Target Asset Selection */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><MapPin size={12} /> Target Block Division</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {blocks.map((block) => (
            <button
              key={block.id}
              onClick={() => setSelectedBlock(block)}
              className={`p-5 rounded-3xl border-2 transition-all text-left relative group ${
                selectedBlock?.id === block.id 
                ? 'border-tea-500 bg-tea-50/30' 
                : 'border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 hover:border-tea-200'
              }`}
            >
              {selectedBlock?.id === block.id && <CheckCircle size={14} className="absolute top-4 right-4 text-tea-600" />}
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{block.name}</h4>
              <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{block.division_name || 'Main Estate'}</p>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-tea-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Atmospheric Nutrients...</p>
        </div>
      ) : selectedBlock && weatherData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            {/* Safety Radar */}
            <div className={`premium-card border-l-4 ${safety.level === 'ABORT' ? 'border-red-500' : safety.level === 'CAUTION' ? 'border-amber-500' : 'border-tea-500'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${safety.bg} ${safety.color}`}><ShieldAlert size={20} /></div>
                  <div>
                    <h3 className={`text-xl font-black tracking-tighter ${safety.color}`}>{safety.level} Status</h3>
                    <p className="text-xs text-slate-500 font-medium">{safety.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(weatherData.current.precipitation * 10)/10}<span className="text-[10px] text-slate-400 ml-1">mm rain</span></p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Local Intensity</p>
                </div>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Beaker size={12} /> Nutrition Protocol</h3>
              {[
                { t: 'Nitrogen Protocol (N)', p: 'Urea (46% N)', q: '42 kg/ha', i: 'High Leaching Risk', c: 'text-sky-500' },
                { t: 'Phosphorus Cycle (P)', p: 'DAP Complex', q: '28 kg/ha', i: 'Maintain Root Stability', c: 'text-amber-500' },
                { t: 'Potassium Intake (K)', p: 'MOP Solution', q: '35 kg/ha', i: 'Heat Stress Mitigation', c: 'text-orange-500' }
              ].map(rec => (
                <div key={rec.t} className="premium-card group hover:translate-x-1 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${rec.c}`}><Zap size={14} /></div>
                       <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{rec.t}</h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full uppercase">Optimal</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Product</p><p className="text-xs font-bold mt-1">{rec.p}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Input Qty</p><p className="text-xs font-bold mt-1">{rec.q}</p></div>
                    <div><p className="text-[9px] font-black text-slate-400 uppercase">Tactical Aim</p><p className="text-xs font-bold mt-1 text-tea-600">{rec.i}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {/* Atmospheric Summary */}
            <div className="premium-card">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={14} className="text-tea-500" /> Absorption Context</h3>
              <div className="space-y-5">
                {[
                  { l: 'Air Temp', v: `${weatherData.current.temperature_2m}°`, i: Thermometer, c: 'text-orange-500' },
                  { l: 'Humidity', v: `${weatherData.current.relative_humidity_2m}%`, i: Droplets, c: 'text-blue-500' },
                  { l: 'Wind Speed', v: `${weatherData.current.wind_speed_10m} km/h`, i: Wind, c: 'text-emerald-500' }
                ].map(s => (
                  <div key={s.l} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><s.i size={14} className={s.c} /><span className="text-[10px] uppercase font-black text-slate-400">{s.l}</span></div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tactical Schedule */}
            <div className="premium-card">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Clock size={14} className="text-sky-500" /> Field Schedule</h3>
              <div className="space-y-4">
                {[
                  { d: 'Today', a: 'Precision N-Boost', s: 'Awaiting Safety', c: safety.level === 'SAFE' ? 'text-tea-600' : 'text-amber-500' },
                  { d: '24 Apr', a: 'Foliar Micros', s: 'Scheduled', c: 'text-slate-400' },
                  { d: '02 May', a: 'Full NPK Reset', s: 'Scheduled', c: 'text-slate-400' }
                ].map(item => (
                  <div key={item.d} className="flex justify-between items-center border-b border-slate-50 dark:border-slate-800 pb-3 last:border-0">
                    <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white">{item.a}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase">{item.d}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${item.c}`}>{item.s}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
