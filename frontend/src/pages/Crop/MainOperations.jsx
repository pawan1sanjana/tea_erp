import React, { useState, useEffect } from 'react';
import { Sprout, Shovel, Droplets, Plus, Clock, Search, Filter, ArrowUpRight, AlertCircle, BarChart3, X, Save, Activity, User, Loader2, Users, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
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

export default function MainOperations() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [individualModal, setIndividualModal] = useState(null);
  const [savingIndividual, setSavingIndividual] = useState(false);
  const [expandedOps, setExpandedOps] = useState({});
  const [opWorkers, setOpWorkers] = useState({});
  const [loadingWorkers, setLoadingWorkers] = useState({});

  const [formData, setFormData] = useState({
    block_id: '',
    operation_type: 'plucking',
    actual_date: new Date().toISOString().split('T')[0],
    labor_count: '',
    cost_total: '',
    status: 'completed',
    notes: '',
    plucking_details: {
      yield_kg: '',
      plucking_cycle_days: '7',
      plucking_method: 'manual'
    }
  });

  const toggleOpExpand = async (opId) => {
    if (expandedOps[opId]) {
      setExpandedOps(prev => ({ ...prev, [opId]: false }));
      return;
    }
    setExpandedOps(prev => ({ ...prev, [opId]: true }));
    if (!opWorkers[opId]) {
      setLoadingWorkers(prev => ({ ...prev, [opId]: true }));
      try {
        const res = await apiClient.get(`/crop/operations/${opId}/workers`);
        if (res.success) {
          setOpWorkers(prev => ({ ...prev, [opId]: res.data }));
        }
      } catch (error) {
        console.error('Fetch operation workers failed', error);
      } finally {
        setLoadingWorkers(prev => ({ ...prev, [opId]: false }));
      }
    }
  };

  useEffect(() => {
    fetchOperations();
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const res = await apiClient.get('/crop/blocks');
      if (res.success) {
        setBlocks(res.data);
        if (res.data.length > 0) setFormData(prev => ({ ...prev, block_id: res.data[0].id }));
      }
    } catch (error) {
      console.error('Fetch blocks failed', error);
    }
  };

  const fetchOperations = async () => {
    try {
      const res = await apiClient.get('/crop/operations');
      if (res.success) {
        const mainOps = res.data.filter(o => ['plucking', 'weeding', 'manure', 'foliar'].includes(o.operation_type));
        setOperations(mainOps);
      }
    } catch (error) {
      console.error('Fetch operations failed', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedWorkers = () => {
    if (!formData.block_id) return;
    const date = formData.actual_date;
    apiClient.get(`/crop/plucking-logs/assigned-workers?date=${date}&block_id=${formData.block_id}&interval_label=Morning`)
      .then(res => {
        if (res.success) {
          setIndividualModal({ block_id: formData.block_id, date, workers: res.data });
        }
      });
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
        setFormData(prev => ({
          ...prev,
          plucking_details: {
            ...prev.plucking_details,
            yield_kg: res.totalKg
          },
          labor_count: individualModal.workers.length
        }));
        setIndividualModal(null);
      }
    } catch (error) {
      console.error('Save individual weights failed', error);
    } finally {
      setSavingIndividual(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('plucking_.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        plucking_details: { ...prev.plucking_details, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (payload.operation_type !== 'plucking') delete payload.plucking_details;
      const res = await apiClient.post('/crop/operations', payload);
      if (res.success) {
        alert('Operation logged successfully!');
        setShowModal(false);
        fetchOperations();
      } else {
        throw new Error(res.error || 'Failed to log operation');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      alert('Error logging operation. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-tea-500/10 flex items-center justify-center text-tea-600 dark:text-tea-400">
            <Sprout size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Main Operations</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-none mt-1">Plucking Logs & Field Performance History</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/crop/plucking-intel" className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-tea-600 hover:scale-105 transition-all shadow-xl shadow-tea-500/5">
            <BarChart3 size={16} /> Plucking Intel
          </Link>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-tea-600/20 transition-all hover:scale-[1.02] active:scale-95">
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2 italic font-outfit">
          <Clock size={16} /> Activity History & Labour Distribution
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => <div key={i} className="premium-card h-24 animate-pulse bg-slate-100 dark:bg-slate-900 rounded-3xl"></div>)
          ) : operations.length > 0 ? (
            operations.map((op) => (
              <React.Fragment key={op.id}>
                <div className="premium-card hover:border-tea-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 group border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        op.operation_type === 'plucking' ? 'bg-tea-500/10 text-tea-600' : 
                        op.operation_type === 'weeding' ? 'bg-amber-500/10 text-amber-600' : 
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                      {op.operation_type === 'plucking' ? <Sprout size={20} /> : op.operation_type === 'weeding' ? <Shovel size={20} /> : <Droplets size={20} />}
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
                    <div className="text-center min-w-[60px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Labor</p>
                      <p className="font-bold text-xs dark:text-white">{op.labor_count || 0} <span className="text-[9px] text-slate-400">PAX</span></p>
                    </div>
                    <div className="text-center min-w-[80px]">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="font-bold text-xs dark:text-white">{new Date(op.actual_date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleOpExpand(op.id)} 
                        className={`p-2.5 rounded-xl transition-all ${expandedOps[op.id] ? 'bg-tea-500 text-white shadow-lg shadow-tea-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-tea-600'}`}
                        title="View Labour Details"
                      >
                        <Users size={18} />
                      </button>
                      <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-tea-500 transition-all opacity-0 group-hover:opacity-100">
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                {expandedOps[op.id] && (
                  <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 mt-[-1rem] pt-10 pb-8 animate-in slide-in-from-top-4 duration-300 relative z-0">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-tea-500/10 text-tea-600 rounded-lg"><Users size={16} /></div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Individual Performance Audit</h4>
                      </div>
                    </div>
                    {loadingWorkers[op.id] ? (
                      <div className="flex items-center gap-3 py-8 text-tea-600 justify-center">
                        <Activity className="animate-spin" size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic opacity-60">Fetching Performance Matrix...</span>
                      </div>
                    ) : opWorkers[op.id] && opWorkers[op.id].length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {opWorkers[op.id].map((w, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-sm transition-all hover:border-tea-500/30 group/worker">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200/50 group-hover/worker:scale-105 transition-transform">
                              {w.photo ? (
                                <img src={w.photo.startsWith('data:') ? w.photo : `/api/uploads/${w.photo}`} className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tighter">{w.first_name} {w.last_name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{w.worker_id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-tea-600 dark:text-tea-400 font-outfit italic tracking-tighter">
                                {w.performance || 0} <span className="text-[10px] not-italic text-slate-400 uppercase">{op.operation_type === 'plucking' ? 'kg' : op.operation_type === 'pruning' ? 'bushes' : op.operation_type === 'weeding' ? 'ac' : 'qty'}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Users size={32} className="mx-auto text-slate-300 mb-4 opacity-30" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-50">No individual performance logs detected for this session</p>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="premium-card h-64 flex flex-col items-center justify-center text-slate-400 border-dashed border-2">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest opacity-50 italic">No activity history identified in the registry</p>
            </div>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-tea-500/10 text-tea-600 rounded-xl"><Plus size={20} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">New Operation Entry</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Post dynamic field activities to SQL registry</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto dashboard-scroll">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Target Field Block</label>
                  <select name="block_id" value={formData.block_id} onChange={handleInputChange} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white">
                    {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Operation Type</label>
                  <select name="operation_type" value={formData.operation_type} onChange={handleInputChange} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white">
                    <option value="plucking">Plucking</option>
                    <option value="weeding">Weeding</option>
                    <option value="manure">Manure Application</option>
                    <option value="foliar">Foliar Application</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Log Date</label>
                  <input type="date" name="actual_date" value={formData.actual_date} onChange={handleInputChange} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Labor Strength</label>
                  <input type="number" name="labor_count" placeholder="E.g. 15" value={formData.labor_count} onChange={handleInputChange} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white" required />
                </div>
              </div>
              {formData.operation_type === 'plucking' && (
                <div className="p-6 bg-tea-500/5 rounded-[2rem] border border-tea-500/10 space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-tea-600 tracking-[0.2em] flex items-center gap-2"><Sprout size={14} /> Plucking Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Yield Quantity (kg)</label>
                      <div className="relative group/yield">
                        <input type="number" step="0.01" name="plucking_.yield_kg" value={formData.plucking_details.yield_kg} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-tea-500/20 rounded-xl text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white" placeholder="0.00" />
                        <button type="button" onClick={fetchAssignedWorkers} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-tea-500/10 text-tea-600 rounded-lg hover:bg-tea-500 hover:text-white transition-all" title="Enter Individual Weights"><User size={16} /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Method</label>
                      <select name="plucking_.plucking_method" value={formData.plucking_details.plucking_method} onChange={handleInputChange} className="w-full p-3 bg-white dark:bg-slate-950 border border-tea-500/20 rounded-xl text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white">
                        <option value="manual">Hand Plucking</option>
                        <option value="shear">Shear Plucking</option>
                        <option value="machine">Machine Plucking</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Observation Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" placeholder="Atmospheric conditions, ground quality..." className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] text-sm font-bold outline-none focus:border-tea-500 transition-all dark:text-white resize-none"></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all">Discard</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] px-6 py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-tea-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                  {isSubmitting ? <Activity className="animate-spin" size={16} /> : <><Save size={16} /> Log Activity</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Weights Modal */}
      {individualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-tea-500/10 text-tea-600 rounded-2xl"><User size={24} /></div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Individual Weights</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date: {individualModal.date}</p>
                </div>
              </div>
              <button onClick={() => setIndividualModal(null)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4 dashboard-scroll">
              {individualModal.workers.length > 0 ? (
                individualModal.workers.map((w, idx) => (
                  <div key={w.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-tea-500/30 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-tea-500/10 flex items-center justify-center text-tea-600 font-black text-xs">{w.worker_code || idx + 1}</div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{w.first_name} {w.last_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Plucker</p>
                    </div>
                    <div className="w-32 relative">
                      <input type="number" value={w.kg || ''} onChange={(e) => {
                        const val = e.target.value;
                        setIndividualModal(prev => ({ ...prev, workers: prev.workers.map(x => x.id === w.id ? { ...x, kg: val } : x) }));
                      }} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-sm font-black text-right pr-8 outline-none focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500" placeholder="0.0" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">KG</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400"><Users size={32} /></div>
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
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter">{individualModal.workers.length} <span className="text-xs not-italic uppercase">Pax</span></h4>
                </div>
              </div>
              <button onClick={handleSaveIndividual} disabled={savingIndividual || individualModal.workers.length === 0} className="w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-tea-600/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
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
