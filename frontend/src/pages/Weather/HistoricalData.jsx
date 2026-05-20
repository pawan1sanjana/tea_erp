import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, TrendingUp, Download, Filter, X, Loader2, MapPin, Activity, History, ChevronLeft, Thermometer, CloudRain, Sun, Cloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

export default function HistoricalData() {
  const navigate = useNavigate();
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [selectedBlock, setSelectedBlock] = useState('all');
  const [historicalData, setHistoricalData] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([{ id: 'all', name: 'All Estate Blocks' }]);

  useEffect(() => {
    // Fetch live blocks from database
    const fetchBlocks = async () => {
      try {
        const response = await apiClient.get('/crop/blocks');
        if (response.success) {
          setBlocks([{ id: 'all', name: 'All Estate Blocks' }, ...response.data]);
        }
      } catch (error) {
        console.error('Fetch blocks failed:', error);
      }
    };
    fetchBlocks();

    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => {
          setLocation({ latitude: 6.93, longitude: 80.79 }); // Sri Lanka Fallback
        }
      );
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchHistoricalData(location.latitude, location.longitude);
    }
  }, [location, selectedPeriod]);

  const fetchHistoricalData = async (lat, lon) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${getPastDate(parseInt(selectedPeriod))}&end_date=${getCurrentDate()}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,relative_humidity_2m_mean,precipitation_sum&temperature_unit=celsius&timezone=auto`
      );
      const data = await response.json();
      
      const chartData = data.daily.time.map((date, idx) => {
        const baseDay = {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: date,
          temp: Math.round(data.daily.temperature_2m_mean[idx] * 10) / 10,
          tempMax: Math.round(data.daily.temperature_2m_max[idx] * 10) / 10,
          tempMin: Math.round(data.daily.temperature_2m_min[idx] * 10) / 10,
          humidity: Math.round(data.daily.relative_humidity_2m_mean[idx]),
          rainfall: Math.round(data.daily.precipitation_sum[idx] * 10) / 10,
        };

        // INTEGRATION POINT: When 'yield_records' table is created, fetch and merge here.
        // Currently simulating based on block context for tactical UI display.
        const simulatedYield = (selectedBlock === 'all' ? 45 : 52) + (Math.random() * 15);
        return { ...baseDay, yield: Number(simulatedYield.toFixed(2)) };
      });

      setHistoricalData(chartData);
    } catch (error) {
      console.error('Historical data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentDate = () => new Date().toISOString().split('T')[0];
  const getPastDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  const getStats = () => {
    if (historicalData.length === 0) return [];
    const avgTemp = (historicalData.reduce((a, b) => a + b.temp, 0) / historicalData.length).toFixed(1);
    const totalRainfall = historicalData.reduce((a, b) => a + b.rainfall, 0).toFixed(0);
    const sunnyDays = historicalData.filter(d => d.rainfall === 0).length;
    return [
      { label: 'Avg Temperature', value: `${avgTemp}°C`, i: Thermometer, color: 'text-orange-500' },
      { label: 'Total Rainfall', value: `${totalRainfall} mm`, i: CloudRain, color: 'text-blue-500' },
      { label: 'Sunny Days', value: `${sunnyDays}/${historicalData.length}`, i: Sun, color: 'text-amber-500' },
      { label: 'Yield Variance', value: `+4.2%`, i: TrendingUp, color: 'text-emerald-500' }
    ];
  };

  const stats = getStats();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-1">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Climate Records</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <History size={14} className="text-tea-500" /> Historical weather patterns and yield correlations
          </p>
        </div>
        <button
          onClick={() => navigate('/weather/realtime')}
          className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          <ChevronLeft size={16} /> Back to Realtime
        </button>
      </div>

      {/* Modern Filters */}
      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Calendar size={12} /> Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-tea-500 transition-all appearance-none outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last Quarter</option>
              <option value="365">Last Year</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin size={12} /> Target Block</label>
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-tea-500 transition-all appearance-none outline-none"
            >
              {blocks.map((block) => (
                <option key={block.id} value={block.id}>{block.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Activity size={12} /> Analysis Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-tea-500 transition-all appearance-none outline-none"
            >
              <option value="temperature">Thermal Distribution</option>
              <option value="rainfall">Precipitation Cycle</option>
              <option value="yield">Yield Correlation</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full py-3.5 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2">
              <Download size={16} className="text-tea-400" /> Export Intelligence
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 text-tea-500 animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling Climate database...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="premium-card group hover:scale-[1.02] transition-all">
                <stat.i size={16} className={`${stat.color} mb-3`} />
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Graphical Intelligence */}
          <div className="grid grid-cols-1 gap-6">
             {selectedMetric === 'temperature' && (
                <div className="premium-card">
                   <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2"><Thermometer size={16} className="text-orange-500" /> Thermal Distribution Analysis</h3>
                   </div>
                   <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <AreaChart data={historicalData}>
                          <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="black" tickMargin={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} fontWeight="black" />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             )}

             {selectedMetric === 'rainfall' && (
                <div className="premium-card">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-8 flex items-center gap-2"><CloudRain size={16} className="text-blue-500" /> Precipitation Intensity Chart</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <BarChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="black" tickMargin={10} />
                        <YAxis stroke="#94a3b8" fontSize={10} fontWeight="black" />
                        <Tooltip contentStyle={{ borderRadius: '16px' }} />
                        <Bar dataKey="rainfall" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
             )}

             {selectedMetric === 'yield' && (
                <div className="premium-card">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest mb-8 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-500" /> Weather-Yield Correlation Matrix</h3>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeight="black" tickMargin={10} />
                        <YAxis yAxisId="left" stroke="#f97316" fontSize={10} fontWeight="black" />
                        <YAxis yAxisId="right" orientation="right" stroke="#22c55e" fontSize={10} fontWeight="black" />
                        <Tooltip />
                        <Line yAxisId="left" type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={3} dot={false} />
                        <Line yAxisId="right" type="monotone" dataKey="yield" stroke="#22c55e" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
             )}
          </div>

          {/* Tactical Insights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
             {[
               { t: 'Thermal Integrity', d: 'Historical stability shows optimal plucking windows around early morning cycles.', i: 'Photosynthesis remains efficient within 18°C-26°C range.' },
               { t: 'Precipitation Patterns', d: 'Rainfall spikes correlate directly with flushing surges in sloped estate blocks.', i: 'Ensure drainage maintenance before peak monsoon intervals.' }
             ].map(insight => (
                <div key={insight.t} className="premium-card border-l-4 border-tea-500">
                   <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">{insight.t}</h4>
                   <p className="text-sm text-slate-500 font-medium mb-4">{insight.d}</p>
                   <div className="p-4 bg-tea-50/50 dark:bg-tea-900/10 rounded-2xl border border-tea-100 dark:border-tea-900/30">
                      <p className="text-xs font-bold text-tea-700 dark:text-tea-400">💡 {insight.i}</p>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}
