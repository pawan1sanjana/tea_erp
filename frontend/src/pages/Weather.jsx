import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Thermometer, Droplets, Wind, Zap, Navigation } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../api/client';

const WeatherStat = ({ icon: Icon, label, value, unit, color }) => (
  <div className="premium-card flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold dark:text-white">{value}{unit}</p>
    </div>
  </div>
);

export default function WeatherPage() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await apiClient.get('/weather/current');
        if (response.success) {
          setWeather(response.data);
        }
      } catch (error) {
        console.error("Weather fetch failed", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-500">
        <CloudRain className="animate-bounce w-8 h-8 text-sky-500 mr-3" />
        Synchronizing with Meteo Satellite...
      </div>
    );
  }

  // Fallback data
  const data = weather?.forecast || [
    { day: 'Mon', temp: 24 }, { day: 'Tue', temp: 26 }, { day: 'Wed', temp: 23 },
    { day: 'Thu', temp: 28 }, { day: 'Fri', temp: 27 }, { day: 'Sat', temp: 25 },
    { day: 'Sun', temp: 24 }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Current Condition Header */}
      <div className="premium-card relative overflow-hidden bg-gradient-to-br from-tea-500 to-tea-700 text-white border-none">
        <div className="absolute top-0 right-0 p-8 opacity-20">
          <Sun size={120} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Micro-Climate: Ruhuna Estate</h2>
            <div className="flex items-center gap-4">
              <span className="text-6xl font-bold">28°C</span>
              <div>
                <p className="text-2xl font-semibold">Partly Cloudy</p>
                <p className="opacity-80">Next rainfall expected in 4h</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-lg">
            <button className="px-4 py-2 bg-white text-tea-700 rounded-md font-bold transition-all shadow-sm">Current</button>
            <button className="px-4 py-2 hover:bg-white/10 rounded-md transition-all">Historical</button>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <WeatherStat 
          icon={Thermometer} label="Heat Index" value="31" unit="°C" 
          color="bg-amber-100/50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" 
        />
        <WeatherStat 
          icon={Droplets} label="Humidity" value="72" unit="%" 
          color="bg-sky-100/50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" 
        />
        <WeatherStat 
          icon={Wind} label="Wind Speed" value="12.4" unit=" km/h" 
          color="bg-slate-100/50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400" 
        />
        <WeatherStat 
          icon={Zap} label="Solar Rad." value="420" unit=" W/m²" 
          color="bg-yellow-100/50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400" 
        />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 premium-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 dark:text-white">Temperature Trends (7 Days)</h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="w-3 h-3 rounded-full bg-tea-500"></span> Avg. Temp
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38ad6c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38ad6c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="°" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="temp" stroke="#38ad6c" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-6">Climate Insights</h3>
            <div className="space-y-4">
              <div className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="p-2 rounded-lg bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 h-fit">
                  <Zap size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white">Rain Delay Alert</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">High probability of storm activity at 16:00. Accelerate pluck collection.</p>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="p-2 rounded-lg bg-tea-100 text-tea-600 dark:bg-tea-500/10 dark:text-tea-400 h-fit">
                  <Droplets size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold dark:text-white">Optimal Evaporation</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">Low wind and high sun today. Best for drying processes in factory.</p>
                </div>
              </div>
            </div>
          </div>
          
          <button className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            <Navigation size={18} />
            Full Estate Radar
          </button>
        </div>
      </div>
    </div>
  );
}
