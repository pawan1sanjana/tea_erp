import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud, MapPin, Thermometer, Droplets, Wind, Eye, Sun,
  AlertTriangle, Loader2, CheckCircle, Gauge, Compass,
  RefreshCw, CloudRain, Snowflake, Zap, CloudLightning,
  Activity, TrendingUp, TrendingDown, Leaf, Shield, AlertOctagon,
  Navigation, X, ChevronRight, Sunrise, Sunset
} from 'lucide-react';

// ── WMO Weather Code → Icon & Label ──
const WMO_CODES = {
  0:  { label: 'Clear Sky',          emoji: '☀️', color: 'text-amber-500' },
  1:  { label: 'Mainly Clear',       emoji: '🌤️', color: 'text-amber-400' },
  2:  { label: 'Partly Cloudy',      emoji: '⛅', color: 'text-slate-400' },
  3:  { label: 'Overcast',           emoji: '☁️', color: 'text-slate-500' },
  45: { label: 'Foggy',              emoji: '🌫️', color: 'text-slate-300' },
  48: { label: 'Depositing Ice Fog', emoji: '🌫️', color: 'text-slate-300' },
  51: { label: 'Light Drizzle',      emoji: '🌦️', color: 'text-blue-400' },
  61: { label: 'Slight Rain',        emoji: '🌧️', color: 'text-blue-500' },
  63: { label: 'Moderate Rain',      emoji: '🌧️', color: 'text-blue-600' },
  65: { label: 'Heavy Rain',         emoji: '🌧️', color: 'text-blue-700' },
  71: { label: 'Slight Snow',        emoji: '🌨️', color: 'text-sky-300' },
  80: { label: 'Rain Showers',       emoji: '🌦️', color: 'text-blue-400' },
  95: { label: 'Thunderstorm',       emoji: '⛈️', color: 'text-purple-600' },
  99: { label: 'Heavy Thunderstorm', emoji: '⛈️', color: 'text-purple-800' },
};

const getWMO = (code) => WMO_CODES[code] || { label: 'Unknown', emoji: '🌡️', color: 'text-slate-400' };

const getWindDirection = (degrees) => {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(degrees / 18.5) % 16];
};

const getBeaufort = (kmh) => {
  if (kmh < 1)  return { scale: 0, label: 'Calm' };
  if (kmh < 12) return { scale: 1, label: 'Breeze' };
  if (kmh < 29) return { scale: 3, label: 'Moderate' };
  if (kmh < 45) return { scale: 5, label: 'Strong' };
  return { scale: 7, label: 'Gale' };
};

const AgroRisks = ({ weather }) => {
  const risks = [];
  if (!weather) return null;

  // 1. Heat Stress & Photosynthesis Inhibition
  if (weather.temperature > 32) {
    risks.push({ level: 'critical', icon: AlertOctagon, title: 'Thermal Inhibition', color: 'red', desc: 'Photosynthesis rate is slowing. Ensure shade management & irrigation.' });
  } else if (weather.temperature < 13) {
    risks.push({ level: 'high', icon: Snowflake, title: 'Dormancy Risk', color: 'sky', desc: 'Low temps may inhibit bud growth. Monitor for night frost in high altitudes.' });
  } else if (weather.temperature >= 18 && weather.temperature <= 28) {
    risks.push({ level: 'optimal', icon: CheckCircle, title: 'Optimal Plucking', color: 'emerald', desc: 'Ideal temperature for high-quality leaf processing.' });
  }

  // 2. Fungal & Blister Blight Risk (Humidity + Temperature)
  if (weather.humidity > 88) {
    risks.push({ level: 'high', icon: AlertTriangle, title: 'Blister Blight Alert', color: 'amber', desc: 'Critical fungal risk. Evaluate immediate fungicide application.' });
  }

  // 3. Logistics & Infrastructure (Wind/Rain)
  if (weather.windSpeed > 35) {
    risks.push({ level: 'high', icon: Wind, title: 'Wind Hazard', color: 'amber', desc: 'High winds. Secure nurseries and monitor shade tree stability.' });
  }
  
  if (weather.rainfall > 15) {
    risks.push({ level: 'high', icon: CloudRain, title: 'Erosion Warning', color: 'blue', desc: 'Significant runoff. Check drainage in sloped blocks.' });
  }

  if (risks.length === 0) {
    risks.push({ level: 'clear', icon: Shield, title: 'Safe Operations', color: 'emerald', desc: 'All meteorological factors favor standard maintenance.' });
  }

  return (
    <div className="premium-card space-y-3">
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
        <Leaf size={16} className="text-tea-600" /> Agronomic Intelligence
      </h3>
      {risks.map((r, i) => (
        <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl border ${r.color === 'red' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : r.color === 'amber' ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20'}`}>
          <r.icon size={16} className={`mt-0.5 shrink-0 ${r.color === 'red' ? 'text-red-600' : r.color === 'amber' ? 'text-amber-600' : 'text-emerald-600'}`} />
          <div><p className={`text-[11px] font-black uppercase tracking-widest ${r.color === 'red' ? 'text-red-700' : r.color === 'amber' ? 'text-amber-700' : 'text-emerald-700'}`}>{r.title}</p><p className="text-[10px] text-slate-500 font-medium">{r.desc}</p></div>
        </div>
      ))}
    </div>
  );
};

const WindCompass = ({ degrees, speed }) => {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 120 120" className="w-full h-full text-slate-200 dark:text-slate-800">
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
          <g transform={`rotate(${degrees}, 60, 60)`}><polygon points="60,10 65,55 60,60 55,55" fill="#38ad6c" /></g>
        </svg>
      </div>
      <p className="text-xl font-black">{Math.round(speed)} <span className="text-[10px] text-slate-400">km/h</span></p>
      <p className="text-[9px] font-black text-tea-600 uppercase tracking-widest">{getWindDirection(degrees)}</p>
    </div>
  );
};

const UVGauge = ({ index = 0 }) => {
  const pct = Math.min(index / 11, 1);
  const color = index <= 2 ? '#22c55e' : index <= 5 ? '#eab308' : '#ef4444';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-2xl font-black" style={{ color }}>{index}</div>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">UV Index</p>
    </div>
  );
};

export default function RealtimeWeather() {
  const [locationName, setLocationName] = useState('Estate Precise Location');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  const [coords, setCoords] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showGPSModal, setShowGPSModal] = useState(false);

  const [current, setCurrent] = useState(null);
  const [hourly, setHourly] = useState([]);
  const [daily, setDaily] = useState([]);

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 3500); };

  const fetchWeather = useCallback(async (lat, lon, silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,dew_point_2m,pressure_msl,cloud_cover` +
        `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m` +
        `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max,uv_index_max,sunrise,sunset` +
        `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto&forecast_days=7&past_days=0`;
      const res = await fetch(url);
      const data = await res.json();
      
      setCurrent({
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        rainfall: data.current.precipitation,
        windSpeed: data.current.wind_speed_10m,
        windDegrees: data.current.wind_direction_10m,
        dewPoint: data.current.dew_point_2m,
        pressure: data.current.pressure_msl,
        cloudCover: data.current.cloud_cover,
        wmoCode: data.current.weather_code,
      });

      const hTimes = data.hourly.time;
      const startIdx = hTimes.findIndex(t => new Date(t) >= new Date());
      setHourly(hTimes.slice(startIdx, startIdx + 12).map((t, i) => ({
        time: new Date(t).getHours() + ':00',
        temp: Math.round(data.hourly.temperature_2m[startIdx + i]),
        precip: data.hourly.precipitation_probability[startIdx + i],
        code: data.hourly.weather_code[startIdx + i],
      })));

      setDaily(data.daily.time.map((t, i) => {
        const d = new Date(t);
        return {
          dateNum: d.getDate(),
          dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          max: Math.round(data.daily.temperature_2m_max[i]),
          min: Math.round(data.daily.temperature_2m_min[i]),
          rain: data.daily.precipitation_sum[i],
          code: data.daily.weather_code[i],
          uv: data.daily.uv_index_max[i],
          sunrise: data.daily.sunrise[i],
          sunset: data.daily.sunset[i],
        };
      }));

      setLastUpdated(new Date().toLocaleTimeString());
      if (!silent) showMsg('success', 'Satellite Sync Success');
    } catch { showMsg('error', 'API Connection Error'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const detectLocation = () => {
    setShowGPSModal(false);
    if (!navigator.geolocation) return showMsg('error', 'GPS not supported');
    navigator.geolocation.getCurrentPosition(
      pos => { 
        const { latitude: lat, longitude: lon } = pos.coords;
        setCoords({ lat, lon }); fetchWeather(lat, lon); 
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`).then(r=>r.json()).then(d=> {
           const a = d.address; setLocationName(a.city || a.town || a.village || 'Your Estate');
        });
      },
      () => showMsg('error', 'Location Access Denied')
    );
  };

  useEffect(() => { fetchWeather(6.93, 80.79); }, [fetchWeather]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 p-1">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Weather Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1"><Cloud size={14} className="text-tea-500" /> Real-time atmospheric conditions and forecasts</p>
        </div>
        <button onClick={() => setShowGPSModal(true)} className="btn-primary px-6 py-3.5 flex items-center gap-2 rounded-2xl shadow-xl shadow-tea-500/20 text-[10px] uppercase font-black tracking-widest"><Navigation size={16} /> Detect Sync Location</button>
      </div>

      {message && <div className={`fixed top-4 right-4 z-[500] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-tea-500 text-white' : 'bg-red-500 text-white'}`}><CheckCircle size={16} /><span className="text-sm font-bold">{message.text}</span></div>}

      {/* Hero Overview */}
      <div className="premium-card relative">
        {loading ? <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="w-10 h-10 text-tea-500 animate-spin" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Satellite Feeds...</p></div> : current && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="flex items-center gap-8">
              <div className="text-8xl select-none">{getWMO(current.wmoCode).emoji}</div>
              <div>
                <div className="flex items-baseline gap-2"><h2 className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter">{current.temperature}°</h2><span className="text-3xl font-bold text-slate-400">c</span></div>
                <p className={`text-xl font-black uppercase tracking-tight ${getWMO(current.wmoCode).color}`}>{getWMO(current.wmoCode).label}</p>
                <p className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-2 uppercase tracking-widest"><MapPin size={12} className="text-tea-500" /> {locationName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 max-w-2xl">
              {[{l:'Feels Like', v:current.feelsLike+'°', i:Thermometer, c:'text-orange-500'}, {l:'Humidity', v:current.humidity+'%', i:Droplets, c:'text-blue-500'}, {l:'Rainfall', v:current.rainfall+'mm', i:CloudRain, c:'text-sky-500'}, {l:'Pressure', v:current.pressure+'hPa', i:Gauge, c:'text-indigo-500'}].map(s=>(
                <div key={s.l} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800"><s.i size={14} className={`${s.c} mb-2`} /><p className="text-xl font-black">{s.v}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 12-HOUR FORECAST GRID (TWO ROWS) */}
      <div className="premium-card">
         <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={16} className="text-sky-500" /> 12-Hour Micro-Trend</h3>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {hourly.map((h, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all border ${i === 0 ? 'bg-tea-500 text-white border-tea-600 shadow-lg shadow-tea-500/30 scale-[1.03]' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-tea-200'}`}>
                 <p className={`text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'text-tea-100' : 'text-slate-400'}`}>{i === 0 ? 'Now' : h.time}</p>
                 <span className="text-3xl select-none">{getWMO(h.code).emoji}</span>
                 <p className="text-lg font-black">{h.temp}°</p>
                 <div className="flex items-center gap-1.5"><Droplets size={10} className={i===0?'text-white':'text-blue-500'} /><span className={`text-[10px] font-bold ${i===0?'text-white':'text-slate-400'}`}>{h.precip}%</span></div>
              </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-DAY TACTICAL OUTLOOK */}
        <div className="lg:col-span-2 premium-card">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-tea-600" /> 7-Day Precision Outlook</h3>
          <div className="space-y-3">
             {daily.map((d, i) => {
               const wmo = getWMO(d.code);
               return (
                <div key={i} className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${i === 0 ? 'bg-tea-50/30 border-tea-100 dark:bg-tea-900/10 dark:border-tea-900/30' : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:scale-[1.01]'}`}>
                  <div className="flex items-center gap-4 w-32 shrink-0">
                    <span className="text-3xl">{wmo.emoji}</span>
                    <div><p className={`text-[11px] font-black uppercase tracking-tight ${i === 0 ? 'text-tea-700' : 'text-slate-700 dark:text-slate-300'}`}>{i === 0 ? 'Today' : `${d.dateNum} ${d.dayName}`}</p><p className="text-[9px] font-black text-slate-400 uppercase">{wmo.label}</p></div>
                  </div>
                  <div className="flex items-center gap-4 flex-1 px-8">
                     <div className="hidden md:flex flex-col gap-1 w-full max-w-[120px]">
                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase px-1"><span>{d.min}°</span><span>{d.max}°</span></div>
                        <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-400 to-orange-400 rounded-full w-full" /></div>
                     </div>
                     <div className="flex items-center gap-1.5 text-blue-500 font-black"><Droplets size={12} /><p className="text-xs">{d.rain}<span className="text-[9px] ml-0.5 font-bold">mm</span></p></div>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-4">
                     <div><p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">{d.max}°</p><p className="text-[9px] font-black text-slate-400 uppercase mt-1">High</p></div>
                     <ChevronRight size={14} className="text-slate-300" />
                  </div>
                </div>
               );
             })}
          </div>
        </div>

        <div className="space-y-6">
           <AgroRisks weather={current || {}} daily={daily} />
           
           <div className="premium-card">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-6 flex items-center gap-2"><Sun size={16} className="text-amber-400" /> Solar Cycle</h3>
              {daily[0] && (
                <div className="space-y-5">
                   <div className="flex items-center justify-between text-center">
                      <div><Sunrise size={20} className="text-amber-500 mx-auto mb-1" /><p className="text-lg font-black">{new Date(daily[0].sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sunrise</p></div>
                      <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                      <div><Sunset size={20} className="text-orange-500 mx-auto mb-1" /><p className="text-lg font-black">{new Date(daily[0].sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sunset</p></div>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-200 via-orange-400 to-slate-400 rounded-full" style={{ width: '65%' }} /></div>
                </div>
              )}
           </div>

           <div className="premium-card grid grid-cols-2 gap-4">
              <div className="text-center"><Wind size={18} className="text-emerald-500 mx-auto mb-2" /><p className="text-xl font-black">{current?.windSpeed}<span className="text-[9px] ml-0.5 text-slate-400">km/h</span></p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wind Speed</p></div>
              <div className="text-center"><Compass size={18} className="text-tea-600 mx-auto mb-2" /><p className="text-xl font-black">{getWindDirection(current?.windDegrees || 0)}</p><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Direction</p></div>
           </div>

           <div className="premium-card"><UVGauge index={daily[0]?.uv || 0} /></div>
        </div>
      </div>

      {/* GPS MODAL */}
      {showGPSModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
             <div className="p-8 text-center text-slate-900 dark:text-white">
                <div className="w-20 h-20 bg-tea-100 dark:bg-tea-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-tea-600"><Navigation size={40} className="animate-pulse" /></div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Geo-Precision Sync</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed mt-4">We need absolute GPS coordinates to calibrate hyper-local climate predictions for your specific estate blocks.</p>
             </div>
             <div className="p-6 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-3">
                <button onClick={detectLocation} className="btn-primary w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest">Authorize Satellite Link</button>
                <button onClick={() => setShowGPSModal(false)} className="text-[10px] font-black uppercase text-slate-400 py-2">Keep Manual Fallback</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
