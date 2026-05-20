import React, { useState, useEffect } from 'react';
import { Calendar, TestTube2, Scissors, Sprout, Plus, Clock, Search, Filter, ArrowUpRight, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

const StatusBadge = ({ status }) => {
  const styles = {
    scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
    overdue: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || styles.scheduled}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export default function SeasonalOperations() {
  const [operations, setOperations] = useState([]);
  const [soilRecords, setSoilRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [opsRes, soilRes] = await Promise.all([
        apiClient.get('/crop/operations'),
        apiClient.get('/crop/soil-health')
      ]);
      if (opsRes.success) {
        const seasonalOps = opsRes.data.filter(o => ['soil_test', 'dolomite', 'pruning', 'replanting'].includes(o.operation_type));
        setOperations(seasonalOps);
      }
      if (soilRes.success) setSoilRecords(soilRes.data);
    } catch (error) {
      console.error('Fetch seasonal data failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-tea-500/10 flex items-center justify-center text-tea-600 dark:text-tea-400">
            <Calendar size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Seasonal Agronomics</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Pruning Cycles, Replanting & Soil Health Tracking</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-tea-600/20 transition-all hover:scale-[1.02] active:scale-95">
          <Plus size={16} /> New Seasonal Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="premium-card border-l-4 border-l-amber-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Latest Soil Health (pH)</h4>
            <div className="space-y-4">
               {soilRecords.slice(0, 3).map(r => (
                 <div key={r.id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{r.block_name}</span>
                    <span className={`text-sm font-black ${r.ph_level < 4.5 ? 'text-rose-500' : 'text-emerald-500'}`}>{r.ph_level} pH</span>
                 </div>
               ))}
               {soilRecords.length === 0 && <p className="text-[10px] text-slate-400 uppercase font-bold italic">No soil data found</p>}
            </div>
         </div>
         <div className="premium-card border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-500/5">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/20">
                  <Scissors size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-tight dark:text-white italic">Pruning Pulse</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Lifecycle monitoring active</p>
               </div>
            </div>
         </div>
         <div className="premium-card border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-500/5">
            <div className="flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                  <Sprout size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase tracking-tight dark:text-white italic">Replanting Status</h4>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Multi-year growth projects</p>
               </div>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 italic font-outfit">
          <Clock size={16} /> Activity History
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
             Array(3).fill(0).map((_, i) => <div key={i} className="premium-card h-24 animate-pulse bg-slate-100 dark:bg-slate-900"></div>)
          ) : operations.length > 0 ? (
            operations.map((op) => (
              <div key={op.id} className="premium-card hover:border-tea-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    op.operation_type === 'pruning' ? 'bg-rose-500/10 text-rose-600' : 
                    op.operation_type === 'soil_test' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-blue-500/10 text-blue-600'
                  }`}>
                    {op.operation_type === 'pruning' ? <Scissors size={20} /> :
                     op.operation_type === 'soil_test' ? <TestTube2 size={20} /> : <Sprout size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm font-outfit italic">{op.operation_type?.replace('_', ' ')}</h4>
                      <StatusBadge status={op.status} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{op.block_name} • {op.division_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 pr-4">
                   <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Labor</p>
                      <p className="font-bold text-xs dark:text-white">{op.labor_count || 0} <span className="text-[9px] text-slate-400">PAX</span></p>
                   </div>
                   <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cost</p>
                      <p className="font-bold text-xs dark:text-white">${parseFloat(op.cost_total || 0).toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="font-bold text-xs dark:text-white">{op.actual_date ? new Date(op.actual_date).toLocaleDateString() : 'N/A'}</p>
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="premium-card h-48 flex items-center justify-center text-slate-400 border-dashed border-2">
               <p className="text-xs font-bold uppercase tracking-widest opacity-50">No seasonal operations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
