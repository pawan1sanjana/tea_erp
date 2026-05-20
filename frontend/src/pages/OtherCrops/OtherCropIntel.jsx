import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  Target, 
  Calendar, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BadgePercent,
  History,
  TrendingUp,
  FileSpreadsheet,
  Download,
  PlusCircle,
  Scissors,
  Sprout,
  Package,
  Settings,
  CircleDot,
  Activity
} from 'lucide-react';
import { apiClient } from '../../api/client';

const PayMultiplierModal = ({ isOpen, onClose, onSave, currentMultiplier, workerName }) => {
  const [multiplier, setMultiplier] = useState(currentMultiplier || 1.0);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <BadgePercent size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Pay Rate Override</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{workerName}</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Multiplier Value</label>
            <div className="grid grid-cols-4 gap-2">
              {[1.0, 1.25, 1.5, 2.0].map(val => (
                <button
                  key={val}
                  onClick={() => setMultiplier(val)}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${multiplier === val ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  {val.toFixed(1)}x
                </button>
              ))}
            </div>
          </div>
          
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.25"
            value={multiplier}
            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-medium text-slate-500">Custom Value</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">{multiplier.toFixed(2)}x</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(multiplier); onClose(); }}
              className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OtherCropIntel() {
  const [activeCrop, setActiveCrop] = useState('Cinnamon');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [workerData, setWorkerData] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [performanceData, setPerformanceData] = useState([]);
  const [showPerformance, setShowPerformance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [multiplierModal, setMultiplierModal] = useState({ open: false, workerIndex: null, workerName: '', currentVal: 1.0 });

  const cropConfig = {
    Cinnamon: {
      icon: <CircleDot size={14} />,
      color: "amber",
      unit: "kg",
      tasks: ["Peeling", "Harvesting", "Maintenance"],
      accent: "from-amber-500 to-orange-600"
    },
    Coconut: {
      icon: <CircleDot size={14} />,
      color: "emerald",
      unit: "nuts",
      tasks: ["Harvesting", "Cleaning", "Fertilizing"],
      accent: "from-emerald-500 to-teal-600"
    },
    Pepper: {
      icon: <CircleDot size={14} />,
      color: "rose",
      unit: "kg",
      tasks: ["Plucking", "Drying", "Sorting", "Maintenance"],
      accent: "from-rose-500 to-red-600"
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [selectedDate, activeCrop]);

  useEffect(() => {
    if (showPerformance) fetchPerformance();
  }, [showPerformance, activeCrop, selectedDate]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/crop/other-crop-logs?date=${selectedDate}&crop_type=${activeCrop}`);
      if (response.success) setBlocks(response.data);
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const response = await apiClient.get(`/crop/other-crop-performance?date=${selectedDate}&crop_type=${activeCrop}`);
      if (response.success) setPerformanceData(response.data);
    } catch (error) {
      console.error('Performance fetch failed:', error);
    }
  };

  const handleExpandBlock = async (blockId) => {
    if (expandedBlock === blockId) {
      setExpandedBlock(null);
      return;
    }
    
    setExpandedBlock(blockId);
    setLoadingWorkers(true);
    try {
      const response = await apiClient.get(`/crop/other-crop-logs/assigned-workers?date=${selectedDate}&block_id=${blockId}&crop_type=${activeCrop}`);
      if (response.success) setWorkerData(response.data);
    } catch (error) {
      console.error('Worker fetch failed:', error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleWorkerChange = (index, field, value) => {
    const newData = [...workerData];
    newData[index][field] = value;
    setWorkerData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiClient.post('/crop/other-crop-logs/individual', {
        date: selectedDate,
        block_id: expandedBlock,
        crop_type: activeCrop,
        entries: workerData
      });
      if (response.success) {
        fetchBlocks();
        setExpandedBlock(null);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredBlocks = useMemo(() => {
    return blocks.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [blocks, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight flex items-center gap-3">
            Other Crop <span className={`text-${cropConfig[activeCrop].color}-600`}>Intelligence</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1 uppercase tracking-widest text-[10px]">
            {React.cloneElement(cropConfig[activeCrop].icon, { className: `text-${cropConfig[activeCrop].color}-600` })}
            Dedicated Monitoring for {activeCrop} Production
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="flex items-center gap-2">
             <div className="relative">
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
               />
             </div>
          </div>
        </div>
      </div>

      {/* Type Switcher */}
      <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shadow-sm overflow-x-auto max-w-fit">
        {['Cinnamon', 'Coconut', 'Pepper'].map(crop => (
          <button
            key={crop}
            onClick={() => setActiveCrop(crop)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeCrop === crop 
                ? `bg-${cropConfig[crop].color}-600 text-white shadow-lg shadow-${cropConfig[crop].color}-600/20 scale-105 z-10` 
                : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            {cropConfig[crop].icon}
            {crop}
          </button>
        ))}
      </div>

      {/* ─── PREMIUM ANALYTICS SUMMARY ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Active Workforce", 
            val: blocks.reduce((acc, b) => acc + (b.logs?.worker_count || 0), 0), 
            unit: "Personnel", 
            icon: Users, 
            color: `text-${cropConfig[activeCrop].color}-500`, 
            gradient: `from-${cropConfig[activeCrop].color}-500/20 to-${cropConfig[activeCrop].color}-500/5` 
          },
          { 
            label: "Total Estate Output", 
            val: blocks.reduce((acc, b) => acc + (b.logs?.total_qty || 0), 0).toLocaleString(), 
            unit: cropConfig[activeCrop].unit, 
            icon: Target, 
            color: "text-amber-500", 
            gradient: "from-amber-500/20 to-amber-500/5" 
          },
          { 
            label: "Harvest Efficiency", 
            val: "88.4", 
            unit: "%", 
            icon: Activity, 
            color: "text-indigo-500", 
            gradient: "from-indigo-500/20 to-indigo-500/5" 
          },
          { 
            label: "Monthly Target", 
            val: "92", 
            unit: "% Achieved", 
            icon: TrendingUp, 
            color: "text-emerald-500", 
            gradient: "from-emerald-500/20 to-emerald-500/5" 
          },
        ].map((s, i) => (
          <div key={i} className="premium-card relative overflow-hidden group border-none shadow-xl shadow-black/5 dark:shadow-none p-5">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.gradient} -mr-8 -mt-8 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 opacity-50`}></div>
            <div className="relative flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group-hover:scale-110 transition-transform duration-300`}>
                <s.icon className={s.color} size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</p>
                <h4 className="text-2xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter leading-none">
                  {s.val}<span className="text-[10px] font-bold text-slate-400 not-italic ml-1 uppercase">{s.unit}</span>
                </h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Registry Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
               <History className="text-tea-500" /> Production Registry
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search field blocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-tea-500 focus:border-tea-500 w-full sm:w-64 transition-all"
                />
              </div>
              <button 
                onClick={() => setShowPerformance(!showPerformance)}
                className={`p-2 rounded-xl border transition-all ${showPerformance ? 'bg-tea-500 border-tea-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
              >
                <TrendingUp size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-500 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-500 font-medium">Syncing agricultural records...</p>
              </div>
            ) : filteredBlocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <Sprout size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium text-center px-6">No blocks assigned for {activeCrop} on this date. <br/><span className="text-xs">Check attendance muster for assignments.</span></p>
              </div>
            ) : (
              filteredBlocks.map(block => (
                <div 
                  key={block.id}
                  className={`group transition-all duration-300 ${expandedBlock === block.id ? 'scale-[1.02] z-20' : 'hover:scale-[1.01]'}`}
                >
                  <div className={`p-6 rounded-3xl border transition-all ${expandedBlock === block.id ? 'bg-white dark:bg-slate-900 border-tea-500 shadow-xl' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-tea-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cropConfig[activeCrop].accent} text-white flex items-center justify-center font-black text-xl shadow-lg`}>
                          {block.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">{block.name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 uppercase">
                              <Target size={12} /> {block.area_acres} Acres
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-tea-600">
                              <Users size={12} /> {block.logs?.worker_count || 0} / {block.assigned_pax || 0} Workers
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Yield</p>
                          <p className="text-2xl font-black text-slate-900 dark:text-white leading-none mt-1">
                            {block.logs?.total_qty || 0} <span className="text-xs font-bold text-slate-400">{cropConfig[activeCrop].unit}</span>
                          </p>
                        </div>
                        <button 
                          onClick={() => handleExpandBlock(block.id)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${expandedBlock === block.id ? 'bg-tea-500 text-white rotate-90 shadow-lg shadow-tea-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-tea-500 hover:bg-tea-50 dark:hover:bg-tea-900/30'}`}
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>
                    </div>

                    {/* Worker Input Grid (Expanded) */}
                    {expandedBlock === block.id && (
                      <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300">
                        <div className="space-y-3">
                          {loadingWorkers ? (
                            <div className="py-10 text-center text-slate-400 text-sm">Fetching assigned personnel...</div>
                          ) : workerData.length === 0 ? (
                            <div className="py-6 text-center text-slate-500 text-sm italic">No workers assigned to this block in muster.</div>
                          ) : (
                            <>
                              <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">
                                <div className="col-span-5">Worker Details</div>
                                <div className="col-span-3 text-center">Output ({cropConfig[activeCrop].unit})</div>
                                <div className="col-span-3">Task Type</div>
                                <div className="col-span-1">Rate</div>
                              </div>
                              <div className="space-y-2">
                                {workerData.map((worker, idx) => (
                                  <div key={worker.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors hover:border-tea-300">
                                    <div className="col-span-5 flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 overflow-hidden shrink-0 border border-white dark:border-slate-800">
                                        {worker.photo ? <img src={worker.photo} alt="" className="w-full h-full object-cover"/> : worker.first_name[0]}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{worker.first_name} {worker.last_name}</p>
                                        <p className="text-[10px] font-medium text-slate-500">{worker.worker_id} • {worker.worker_type}</p>
                                      </div>
                                    </div>
                                    <div className="col-span-3">
                                      <input 
                                        type="number"
                                        value={worker.quantity || ''}
                                        onChange={(e) => handleWorkerChange(idx, 'quantity', parseFloat(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black focus:ring-2 focus:ring-tea-500"
                                      />
                                    </div>
                                    <div className="col-span-3">
                                      <select
                                        value={worker.work_type}
                                        onChange={(e) => handleWorkerChange(idx, 'work_type', e.target.value)}
                                        className="w-full py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-tea-500"
                                      >
                                        {cropConfig[activeCrop].tasks.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                    </div>
                                    <div className="col-span-1 flex justify-center">
                                      <button
                                        onClick={() => setMultiplierModal({ open: true, workerIndex: idx, workerName: `${worker.first_name} ${worker.last_name}`, currentVal: worker.pay_multiplier })}
                                        className={`p-2 rounded-lg transition-all ${worker.pay_multiplier > 1 ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                      >
                                        <BadgePercent size={18} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end gap-3 pt-6">
                                <button 
                                  onClick={() => setExpandedBlock(null)}
                                  className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                                >
                                  Dismiss
                                </button>
                                <button 
                                  onClick={handleSave}
                                  disabled={isSaving}
                                  className="px-8 py-3 rounded-2xl bg-tea-600 hover:bg-tea-700 text-white font-bold shadow-lg shadow-tea-600/20 transition-all flex items-center gap-2"
                                >
                                  {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                  ) : (
                                    <CheckCircle2 size={18} />
                                  )}
                                  Commit Records
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Intelligence Side Panel */}
        <div className="lg:col-span-4 space-y-6">
          {showPerformance ? (
            <div className="glass-panel p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">Top Performers</h3>
                <button onClick={() => setShowPerformance(false)} className="text-slate-400 hover:text-slate-600"><PlusCircle className="rotate-45" size={20}/></button>
              </div>
              <div className="space-y-4">
                {performanceData.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-4 group">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                        {p.photo ? <img src={p.photo} alt="" className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">{p.first_name[0]}</div>}
                      </div>
                      <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ${idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : 'bg-orange-300 text-orange-900'}`}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{p.first_name} {p.last_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${cropConfig[activeCrop].accent} rounded-full`} style={{ width: `${Math.min(100, (p.total_qty / 50) * 100)}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{p.total_qty}{p.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-400 hover:border-tea-500 hover:text-tea-500 transition-all flex items-center justify-center gap-2">
                <FileSpreadsheet size={16}/> Download Performance Report
              </button>
            </div>
          ) : (
            <>
              <div className="glass-panel p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
                   <Scissors size={14} className="text-rose-500"/> Operational Tasks
                </h3>
                <div className="space-y-4">
                   {cropConfig[activeCrop].tasks.map((task, idx) => (
                     <div key={task} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
                             {idx === 0 ? <Sprout size={16}/> : <CircleDot size={16}/>}
                          </div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{task}</span>
                        </div>
                        <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-md uppercase">Active</span>
                     </div>
                   ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <PayMultiplierModal
        isOpen={multiplierModal.open}
        onClose={() => setMultiplierModal({ ...multiplierModal, open: false })}
        workerName={multiplierModal.workerName}
        currentMultiplier={multiplierModal.currentVal}
        onSave={(val) => handleWorkerChange(multiplierModal.workerIndex, 'pay_multiplier', val)}
      />
    </div>
  );
}
