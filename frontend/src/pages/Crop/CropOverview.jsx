import React, { useState, useEffect } from 'react';
import { Leaf, BarChart3, Map as MapIcon, Calendar, CheckCircle2, TrendingUp, Search, Droplets, Sprout, Clock, Users, X, Save, User, Loader2, RefreshCcw, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { apiClient } from '../../api/client';

export default function CropOverview() {
  const [blocks, setBlocks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [individualModal, setIndividualModal] = useState(null); // { block_id, date, workers: [] }
  const [savingIndividual, setSavingIndividual] = useState(false);

  const fetchAssignedWorkers = async (blockId) => {
    const date = new Date().toISOString().split('T')[0];
    try {
      const res = await apiClient.get(`/crop/plucking-logs/assigned-workers?date=${date}&block_id=${blockId}&interval_label=Morning`);
      if (res.success) {
        setIndividualModal({ block_id: blockId, date, workers: res.data });
      }
    } catch (error) {
      console.error('Fetch assigned workers failed', error);
    }
  };

  const handleSaveIndividual = async () => {
    setSavingIndividual(true);
    try {
      const res = await apiClient.post('/crop/plucking-logs/individual', {
        date: individualModal.date,
        block_id: individualModal.block_id,
        interval_label: 'Morning',
        entries: individualModal.workers.map(w => ({ worker_id: w.id, kg: w.kg }))
      });
      if (res.success) {
        setIndividualModal(null);
        // Maybe refresh overview to see total yield update
        const overviewRes = await apiClient.get('/crop/overview');
        if (overviewRes.success) setOverview(overviewRes.data);
      }
    } catch (error) {
      console.error('Save individual weights failed', error);
    } finally {
      setSavingIndividual(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blocksRes, overviewRes] = await Promise.all([
        apiClient.get('/crop/blocks'),
        apiClient.get('/crop/overview')
      ]);
      if (blocksRes.success) setBlocks(blocksRes.data);
      if (overviewRes.success) setOverview(overviewRes.data);
    } catch (error) {
      console.error('Fetch crop overview failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic animate-pulse">Analyzing Biological Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight uppercase italic">Overall <span className="text-tea-500">Intelligence</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time biological & operational audit dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm group"
          >
            <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500 text-tea-500" />
            Refresh Intelligence
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Today's Yield", value: overview?.totalYieldToday || 0, unit: "kg", icon: Sprout, color: "text-tea-500" },
          { label: "Today's Workers", value: overview?.totalAssignedToday || 0, unit: "PAX", icon: Users, color: "text-blue-500" },
          { label: "Avg. Quality", value: overview?.avgQualityGrade || "A", unit: "Grade", icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Harvest Cycle", value: overview?.harvestCycleDays || 21, unit: "Days", icon: Clock, color: "text-amber-500" },
          { label: "Active Blocks", value: blocks?.length || 0, unit: "Fields", icon: MapIcon, color: "text-blue-500" },
        ].map((stat, i) => (
          <div key={i} className="premium-card relative overflow-hidden group">
            <stat.icon className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${stat.color}`} size={100} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">{stat.value}</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Deployment Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-0 overflow-hidden">
             <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                   <Users className="text-blue-500" size={20} />
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Workforce Deployment Analysis</h3>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Live from Smart Muster</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                         <th className="px-6 py-4">Block Name</th>
                         <th className="px-6 py-4">Current Task</th>
                         <th className="px-6 py-4 text-right">Worker Count</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {overview?.blockWorkers?.length > 0 ? overview.blockWorkers.map((bw, i) => (
                         <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs">{bw.block_name}</td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                  {bw.task || 'General'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">
                               <div className="flex items-center justify-end gap-3">
                                  <span>{bw.worker_count} <span className="text-[9px] text-slate-400 not-italic uppercase ml-1">Pax</span></span>
                                  {bw.task?.toLowerCase() === 'plucking' && (
                                     <button 
                                       onClick={() => fetchAssignedWorkers(bw.block_id)}
                                       className="p-1.5 bg-tea-500/10 text-tea-600 rounded-lg hover:bg-tea-500 hover:text-white transition-all"
                                       title="Enter Individual Weights"
                                     >
                                        <Leaf size={12} />
                                     </button>
                                  )}
                               </div>
                            </td>
                         </tr>
                      )) : (
                         <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic opacity-50">
                               No active workforce deployment detected today
                            </td>
                         </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>

        {/* Right: Existing Yield History Chart */}
        <div className="premium-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <TrendingUp size={16} className="text-tea-500" /> Factory Intake Performance
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={overview?.yieldHistory || []}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38ad6c" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38ad6c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff', padding: '12px' }}
                  itemStyle={{ color: '#38ad6c', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="kg" stroke="#38ad6c" strokeWidth={4} fillOpacity={1} fill="url(#colorYield)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card bg-slate-900 border-none relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Droplets size={120} className="text-tea-500" />
          </div>
          <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2 font-outfit italic">
            <Search size={16} className="text-tea-400" /> Quick Smart Search
          </h3>
          <div className="space-y-4">
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-tea-400 uppercase tracking-widest mb-2">Jump to Block Operations</p>
                <select className="w-full bg-transparent outline-none text-white font-bold text-sm">
                  {blocks.map(b => <option key={b.id} value={b.id} className="bg-slate-900">{b.name} - {b.division_name}</option>)}
                </select>
             </div>
             <button className="w-full py-4 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-tea-600/20 mt-4">
                Access GIS Mapping
             </button>
          </div>
        </div>
      </div>
      {/* Individual Weights Modal (Harvesting) */}
      {individualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-tea-500/10 text-tea-600 rounded-2xl">
                  <Leaf size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Individual Weights</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Record Entry — {individualModal.date}</p>
                </div>
              </div>
              <button onClick={() => setIndividualModal(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 dashboard-scroll">
              {individualModal.workers.length > 0 ? (
                individualModal.workers.map((w, idx) => (
                  <div key={w.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-tea-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-tea-500/10 flex items-center justify-center text-tea-600 font-black text-xs">
                      {w.worker_code || idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{w.first_name} {w.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Plucker</p>
                    </div>
                    <div className="w-32 relative">
                      <input 
                        type="number"
                        value={w.kg || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIndividualModal(prev => ({
                            ...prev,
                            workers: prev.workers.map(x => x.id === w.id ? { ...x, kg: val } : x)
                          }));
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm font-black text-right pr-8 outline-none focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500"
                        placeholder="0.0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">KG</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400">
                    <Users size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest italic">No workers assigned to this block in today's muster</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Collected</p>
                  <h4 className="text-2xl font-black text-tea-600 font-outfit italic tracking-tighter">
                    {individualModal.workers.reduce((s, w) => s + (parseFloat(w.kg) || 0), 0).toFixed(2)} <span className="text-xs not-italic">KG</span>
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Force</p>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">
                    {individualModal.workers.length} <span className="text-xs not-italic uppercase">Pax</span>
                  </h4>
                </div>
              </div>
              <button 
                onClick={handleSaveIndividual}
                disabled={savingIndividual || individualModal.workers.length === 0}
                className="w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-tea-600/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {savingIndividual ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {savingIndividual ? 'Syncing Records...' : 'Save Individual Weights'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
