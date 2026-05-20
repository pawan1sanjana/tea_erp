import React, { useState, useEffect } from 'react';
import {
  Leaf, MapPin, Droplets, Gauge, Sprout, AlertOctagon,
  CheckCircle, AlertTriangle, Loader2, X, Plus, Save,
  ClipboardCheck, History, Activity, FlaskConical, Calendar,
  TrendingUp, Edit2, Beaker, Clock, ChevronRight, Trash2,
  CheckSquare, PlayCircle, Timer, Search, Filter, SlidersHorizontal
} from 'lucide-react';
import { apiClient } from '../../api/client';
import './FieldData.css';

// ─── helpers ─────────────────────────────────────────────────
const num = (v, fallback = 0) => (v !== null && v !== undefined && v !== '') ? Number(v) : fallback;
const toAcres = (hectares) => (num(hectares) * 2.47105).toFixed(2);

const StatusBadge = ({ status }) => {
  const map = {
    Active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pruned:   'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400',
    Rested:   'bg-blue-100    text-blue-700    dark:bg-blue-900/30    dark:text-blue-400',
    Fallow:   'bg-slate-100   text-slate-600   dark:bg-slate-800      dark:text-slate-400',
    Inactive: 'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-400',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${map[status] || map.Inactive}`}>{status}</span>;
};

const HealthBadge = ({ status }) => {
  const map = { Optimal: 'bg-emerald-100 text-emerald-700', Good: 'bg-sky-100 text-sky-700', Warning: 'bg-amber-100 text-amber-700', Critical: 'bg-red-100 text-red-700' };
  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map[status] || map.Good}`}>{status}</span>;
};

export default function FieldData() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [records, setRecords] = useState([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMetricsForm, setShowMetricsForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [latestMetrics, setLatestMetrics] = useState({});

  const [metricsForm, setMetricsForm] = useState({
    soil_moisture: '', soil_ph: '', leaf_health: '', pest_pressure: '',
    plant_height: '', tea_yield: '', leaf_quality_score: '', leaf_wetness: '',
    soil_temp: '', nitrogen_level: '', phosphorus_level: '', potassium_level: '', plucking_cycle_days: ''
  });

  const [inspectionForm, setInspectionForm] = useState({ instructor_name: '', health_status: 'Good', observations: '', recommendations: '', feedback_notes: '' });
  const [taskForm, setTaskForm] = useState({ task_title: '', task_description: '', task_due_date: '', task_priority: 'medium', task_status: 'Pending' });

  const showMsg = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 3500); };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await apiClient.get('/crop/blocks');
        if (r.success) setBlocks(r.data);
      } catch { showMsg('error', 'Cannot load blocks'); }
      finally { setLoading(false); }
    })();
  }, []);

  const loadBlockData = async (block) => {
    setSelectedBlock(block);
    setLoading(true);
    try {
      const r = await apiClient.get(`/crop/blocks/${block.id}/records`);
      if (r.success) {
        setRecords(r.data);
        const latestM = r.data.find(rec => rec.record_type === 'METRIC');
        setLatestMetrics(latestM || {});
      }
    } catch { showMsg('error', 'Journal load failed'); }
    finally { setLoading(false); }
  };

  const saveRecord = async (type, data) => {
    setSaving(true);
    try {
      const r = await apiClient.post(`/crop/blocks/${selectedBlock.id}/records`, { record_type: type, ...data });
      if (r.success) {
        showMsg('success', `${type} logged successfully`);
        await loadBlockData(selectedBlock);
        setShowMetricsForm(false); setShowInspectionModal(false); setShowTaskModal(false);
        if (type === 'TASK') setTaskForm({ task_title: '', task_description: '', task_due_date: '', task_priority: 'medium', task_status: 'Pending' });
        if (type === 'INSPECTION') setInspectionForm({ instructor_name: '', health_status: 'Good', observations: '', recommendations: '', feedback_notes: '' });
      }
    } catch { showMsg('error', 'Failed to save'); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setSaving(true);
    try {
      const r = await apiClient.delete(`/crop/records/${deletingId}`);
      if (r.success) {
        showMsg('success', 'Entry removed');
        setDeletingId(null);
        await loadBlockData(selectedBlock);
      }
    } catch { showMsg('error', 'Delete failed'); }
    finally { setSaving(false); }
  };

  const updateRecord = async () => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      const dbColumns = [
        'block_id', 'record_type', 'recorded_by', 'instructor_name', 'soil_moisture', 'soil_ph', 
        'leaf_health', 'pest_pressure', 'plant_height', 'tea_yield', 'leaf_quality_score', 
        'leaf_wetness', 'soil_temp', 'nitrogen_level', 'phosphorus_level', 'potassium_level', 
        'plucking_cycle_days', 'task_title', 'task_description', 'task_due_date', 
        'task_priority', 'task_status', 'health_status', 'observations', 
        'recommendations', 'feedback_notes'
      ];
      const cleanData = {};
      dbColumns.forEach(col => { if (editingRecord[col] !== undefined) cleanData[col] = editingRecord[col]; });
      const r = await apiClient.patch(`/crop/records/${editingRecord.id}`, cleanData);
      if (r.success) {
        showMsg('success', 'Updated');
        setEditingRecord(null);
        await loadBlockData(selectedBlock);
      }
    } catch { showMsg('error', 'Update failed'); }
    finally { setSaving(false); }
  };

  const filteredBlocks = blocks.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (b.partition_name && b.partition_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!selectedBlock) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row gap-4 mb-2">
           <div className="relative flex-1 group">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tea-500 transition-colors" />
             <input type="text" placeholder="Search blocks or divisions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[24px] focus:border-tea-500 outline-none transition-all font-bold text-slate-700 dark:text-white shadow-xl shadow-slate-200/40 dark:shadow-none" />
           </div>
           
           <div className="relative min-w-[200px] group">
              <SlidersHorizontal size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full pl-12 pr-10 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[24px] focus:border-tea-500 outline-none transition-all font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer">
                 <option value="All">All Operations</option>
                 <option value="Active">Active Plucking</option>
                 <option value="Pruned">Pruned Stage</option>
                 <option value="Rested">Rested/Locked</option>
                 <option value="Inactive">Out of Service</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"><ChevronRight size={14} className="rotate-90 text-slate-400" /></div>
           </div>
        </div>

        <div className="flex items-center justify-between px-2">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Showing {filteredBlocks.length} Ground Blocks</p>
           {searchQuery || statusFilter !== 'All' ? <button onClick={() => {setSearchQuery(''); setStatusFilter('All')}} className="text-[10px] font-black text-tea-600 uppercase tracking-widest flex items-center gap-1 hover:text-tea-700">Clear Search <X size={10} /></button> : null}
        </div>

        {loading ? <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-tea-500 animate-spin" /></div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBlocks.map(block => (
              <button key={block.id} onClick={() => loadBlockData(block)} className="premium-card text-left group hover:scale-[1.02] transition-all border-l-4 border-transparent hover:border-tea-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-tea-500/10 transition-colors"><Leaf size={18} className="text-slate-500 group-hover:text-tea-600" /></div>
                  <StatusBadge status={block.status} />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-0.5">{block.name}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-4">{block.partition_name || 'Main'} Division</p>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div><p className="text-[9px] text-slate-400 font-black uppercase">Area</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300">{toAcres(getBlockArea(block))} ac</p></div>
                  <div><p className="text-[9px] text-slate-400 font-black uppercase">Last Yield</p><p className="text-xs font-bold text-emerald-600">{num(block.last_yield).toFixed(1)} kg</p></div>
                </div>
              </button>
            ))}
            {filteredBlocks.length === 0 && (
              <div className="col-span-full py-20 text-center">
                 <Search size={40} className="text-slate-200 mx-auto mb-4" />
                 <p className="text-sm font-black text-slate-400 uppercase tracking-tight">No blocks found matching filters</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {message && <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xl animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-tea-500 text-white' : 'bg-red-500 text-white'}`}><CheckCircle size={16} /> <span className="text-sm font-bold">{message.text}</span></div>}

      <div className="premium-card relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-tea-600/10 text-tea-600"><MapPin size={22} /></div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedBlock.name}</h2>
              <HealthBadge status={records.find(r => r.record_type === 'INSPECTION')?.health_status || 'Good'} />
            </div>
            <p className="text-sm text-slate-500 font-medium">GIS Area: {toAcres(getBlockArea(selectedBlock))} ac • Variety: {selectedBlock.tea_variety || 'Clone Unspecified'}</p>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <button onClick={() => setSelectedBlock(null)} className="btn-secondary w-full py-2.5 text-[10px] font-black uppercase tracking-widest border-slate-200 flex items-center justify-center gap-2"><X size={14} /> Back to Overview</button>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setShowInspectionModal(true)} className="btn-primary py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-tea-500/20"><ClipboardCheck size={14} /> Audit</button>
              <button onClick={() => setShowTaskModal(true)} className="bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-500/10"><Calendar size={14} /> Task</button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Moisture', val: latestMetrics.soil_moisture, unit: '%', icon: Droplets, color: 'text-blue-500' },
          { label: 'pH', val: latestMetrics.soil_ph, unit: 'pH', icon: Gauge, color: 'text-purple-500' },
          { label: 'Leaf Health', val: latestMetrics.leaf_health, unit: '/10', icon: Leaf, color: 'text-emerald-500' },
          { label: 'Pests', val: latestMetrics.pest_pressure, unit: '/10', icon: AlertOctagon, color: 'text-red-500' },
          { label: 'Nitrogen', val: latestMetrics.nitrogen_level, unit: 'mg', icon: Beaker, color: 'text-amber-500' },
          { label: 'Yield', val: latestMetrics.tea_yield, unit: 'kg', icon: Sprout, color: 'text-tea-600' }
        ].map(m => (
          <div key={m.label} className="premium-card">
            <m.icon size={14} className={`${m.color} mb-2`} />
            <p className="text-2xl font-black">{m.val || '—'}<span className="text-[10px] text-slate-400 ml-1">{m.unit}</span></p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card border-t-4 border-tea-500">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2"><History size={16} className="text-tea-500" /> Unified Activity Journal</h3>
              <button onClick={() => setShowMetricsForm(!showMetricsForm)} className="btn-secondary px-4 py-2 text-[10px] font-black uppercase flex items-center gap-2">{showMetricsForm ? <X size={12} /> : <FlaskConical size={12} />} {showMetricsForm ? 'Close' : 'Log Lab Results'}</button>
            </div>
            {showMetricsForm && (
              <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {Object.keys(metricsForm).map(key => (
                    <div key={key} className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{key.replace(/_/g, ' ')}</label>
                      <input type="number" step="0.1" value={metricsForm[key]} onChange={e => setMetricsForm({...metricsForm, [key]: e.target.value})} className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-tea-500 outline-none transition-all" />
                    </div>
                  ))}
                </div>
                <button onClick={() => saveRecord('METRIC', metricsForm)} disabled={saving} className="btn-primary w-full py-4 font-black uppercase text-xs tracking-widest shadow-xl shadow-tea-500/20 flex items-center justify-center gap-2">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Record Telemetry</button>
              </div>
            )}
            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {records.map(record => (
                <div key={record.id} className="relative pl-10 group">
                  <div className={`absolute left-0 top-1 w-[24px] h-[24px] rounded-full border-4 border-white dark:border-slate-950 flex items-center justify-center shadow-sm ${record.record_type === 'METRIC' ? 'bg-blue-500' : record.record_type === 'TASK' ? 'bg-amber-500' : 'bg-tea-500'}`}>
                    {record.record_type === 'METRIC' ? <FlaskConical size={12} className="text-white" /> : record.record_type === 'TASK' ? <Clock size={12} className="text-white" /> : <ClipboardCheck size={12} className="text-white" />}
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{record.formatted_date}</p>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{record.record_type === 'TASK' ? record.task_title : record.record_type === 'INSPECTION' ? `Expert Audit: ${record.instructor_name}` : 'Field Observations Logged'}</h4>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingRecord(record)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-tea-600 transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => setDeletingId(record.id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {record.record_type === 'INSPECTION' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><History size={10} /> Observations</p>
                           <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{record.observations}</p>
                        </div>
                        <div className="p-3 bg-tea-50/30 dark:bg-tea-900/10 rounded-2xl border border-tea-100 dark:border-tea-900/20">
                           <p className="text-[9px] font-black text-tea-600 uppercase mb-2 flex items-center gap-1"><Sprout size={10} /> Expert Advice</p>
                           <p className="text-xs text-tea-800 dark:text-tea-400 font-bold leading-relaxed">{record.recommendations}</p>
                        </div>
                      </div>
                    )}
                    {record.record_type === 'TASK' && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{record.task_description}</p>
                         <div className="flex items-center gap-4 mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase"><Calendar size={12} className="text-tea-500" /> {record.task_due_date || 'N/A'}</div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase"><Activity size={12} className="text-amber-500" /> {record.task_status || 'Pending'}</div>
                         </div>
                      </div>
                    )}
                    {record.record_type === 'METRIC' && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                         {[
                           { l: 'Soil Moisture', v: record.soil_moisture, u: '%', c: 'text-blue-500' },
                           { l: 'Soil pH', v: record.soil_ph, u: '', c: 'text-purple-500' },
                           { l: 'Nitrogen (N)', v: record.nitrogen_level, u: 'mg', c: 'text-amber-500' },
                           { l: 'Last Yield', v: record.tea_yield, u: 'kg', c: 'text-tea-600' },
                         ].map(m => (
                           <div key={m.l} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.l}</p>
                             <p className={`text-sm font-black ${m.c}`}>{m.v || '—'}<span className="text-[9px] ml-1 opacity-60 font-medium">{m.u}</span></p>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="premium-card">
            <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-6"><ClipboardCheck size={16} className="text-tea-600" /> Upcoming Workload</h3>
            <div className="space-y-4">
              {records.filter(r => r.record_type === 'TASK' && r.task_status !== 'Completed').length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl"><CheckCircle size={24} className="text-slate-200 mx-auto mb-2" /><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Active Tasks</p></div>
              ) : (
                records.filter(r => r.record_type === 'TASK' && r.task_status !== 'Completed').map(task => (
                  <div key={task.id} className="group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <p className="text-sm font-black text-slate-800 dark:text-white leading-snug mb-3">{task.task_title}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg"><Calendar size={12} className="text-tea-500" /><span className="text-[10px] font-black text-slate-500">{task.task_due_date ? new Date(task.task_due_date).toLocaleDateString() : 'N/A'}</span></div>
                      <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${task.task_priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{task.task_priority}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {deletingId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-8 text-center space-y-4">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={40} className="text-red-600" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Delete Record?</h3>
              <p className="text-sm text-slate-500 font-medium">Permanent removal.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
              <button onClick={() => setDeletingId(null)} className="flex-1 py-4 text-xs font-black uppercase text-slate-500 font-bold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 text-white py-4 rounded-2xl text-xs font-black uppercase shadow-xl">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {editingRecord && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20"><Edit2 size={20} /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Edit Journal</h3></div></div>
              <button onClick={() => setEditingRecord(null)}><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {editingRecord.record_type === 'METRIC' && (
                <div className="grid grid-cols-2 gap-4">
                  {['soil_moisture', 'soil_ph', 'leaf_health', 'pest_pressure', 'plant_height', 'tea_yield', 'nitrogen_level', 'phosphorus_level', 'potassium_level', 'soil_temp', 'leaf_quality_score', 'plucking_cycle_days'].map(key => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">{key.replace(/_/g, ' ')}</label>
                      <input type="number" step="0.1" value={editingRecord[key] || ''} onChange={e => setEditingRecord({...editingRecord, [key]: e.target.value})} className="w-full px-4 py-2.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-800 font-bold" />
                    </div>
                  ))}
                </div>
              )}
              {editingRecord.record_type === 'TASK' && (
                <div className="space-y-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Title</label><input value={editingRecord.task_title || ''} onChange={e => setEditingRecord({...editingRecord, task_title: e.target.value})} className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Deadline</label><input type="date" value={editingRecord.task_due_date ? editingRecord.task_due_date.split('T')[0] : ''} onChange={e => setEditingRecord({...editingRecord, task_due_date: e.target.value})} className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold" /></div>
                    <div className="space-y-1.5 text-status-select">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Task Status</label>
                      <div className="relative group">
                         <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${editingRecord.task_status === 'Completed' ? 'bg-emerald-500' : editingRecord.task_status === 'In Progress' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                         <select value={editingRecord.task_status || ''} onChange={e => setEditingRecord({...editingRecord, task_status: e.target.value})} className="w-full pl-10 pr-5 py-3.5 text-sm font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 focus:border-tea-500 outline-none appearance-none cursor-pointer">
                           <option value="Pending">Pending</option><option value="In Progress">Working</option><option value="Completed">Finished</option>
                         </select>
                         <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 group-hover:text-tea-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Instructions</label><textarea rows={4} value={editingRecord.task_description || ''} onChange={e => setEditingRecord({...editingRecord, task_description: e.target.value})} className="w-full px-5 py-4 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl" /></div>
                </div>
              )}
              {editingRecord.record_type === 'INSPECTION' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Instructor</label><input value={editingRecord.instructor_name || ''} onChange={e => setEditingRecord({...editingRecord, instructor_name: e.target.value})} className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold" /></div>
                    <div className="space-y-1.5 text-status-select">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Health Status</label>
                      <div className="relative group">
                         <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${editingRecord.health_status === 'Critical' ? 'bg-red-500' : editingRecord.health_status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                         <select value={editingRecord.health_status || ''} onChange={e => setEditingRecord({...editingRecord, health_status: e.target.value})} className="w-full pl-10 pr-5 py-3.5 text-sm font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 focus:border-tea-500 outline-none appearance-none cursor-pointer">
                           <option value="Optimal">Optimal</option><option value="Good">Good</option><option value="Warning">Warning</option><option value="Critical">Critical</option>
                         </select>
                         <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 group-hover:text-tea-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Audit Observations</label><textarea rows={3} value={editingRecord.observations || ''} onChange={e => setEditingRecord({...editingRecord, observations: e.target.value})} className="w-full px-5 py-4 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-tea-600 uppercase ml-1">Recommendations</label><textarea rows={3} value={editingRecord.recommendations || ''} onChange={e => setEditingRecord({...editingRecord, recommendations: e.target.value})} className="w-full px-5 py-4 text-sm border-2 border-tea-100 dark:border-tea-900/30 bg-tea-50/10 rounded-2xl" /></div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4">
              <button onClick={() => setEditingRecord(null)} className="flex-1 py-4 font-black uppercase text-xs tracking-widest text-slate-500">Cancel</button>
              <button onClick={updateRecord} disabled={saving} className="flex-[2] btn-primary py-4 font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">{saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Update History</button>
            </div>
          </div>
        </div>
      )}

      {showInspectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-tea-600 text-white shadow-lg shadow-tea-500/20"><ClipboardCheck size={20} /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Record Field Inspection</h3></div></div>
              <button onClick={() => setShowInspectionModal(false)}><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Instructor Name</label><input placeholder="Full Name" value={inspectionForm.instructor_name} onChange={e => setInspectionForm({...inspectionForm, instructor_name: e.target.value})} className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 font-bold" /></div>
                 <div className="space-y-1.5 text-status-select">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Health Status</label>
                   <div className="relative group">
                     <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${inspectionForm.health_status === 'Critical' ? 'bg-red-500' : inspectionForm.health_status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                     <select value={inspectionForm.health_status} onChange={e => setInspectionForm({...inspectionForm, health_status: e.target.value})} className="w-full pl-10 pr-5 py-3.5 text-sm font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 focus:border-tea-500 outline-none appearance-none transition-all cursor-pointer">
                        <option value="Optimal">Optimal</option><option value="Good">Good</option><option value="Warning">Warning</option><option value="Critical">Critical</option>
                     </select>
                     <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 group-hover:text-tea-500 pointer-events-none" />
                   </div>
                 </div>
               </div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Observations</label><textarea rows={3} placeholder=" Ground findings..." value={inspectionForm.observations} onChange={e => setInspectionForm({...inspectionForm, observations: e.target.value})} className="w-full px-5 py-4 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl" /></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-tea-600 uppercase ml-1">Expert Recommendations</label><textarea rows={3} placeholder="Advice..." value={inspectionForm.recommendations} onChange={e => setInspectionForm({...inspectionForm, recommendations: e.target.value})} className="w-full px-5 py-4 text-sm border-2 border-tea-100 dark:border-tea-900/30 bg-tea-50/10 rounded-2xl font-medium" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
               <button onClick={() => saveRecord('INSPECTION', inspectionForm)} disabled={saving} className="btn-primary w-full py-4 font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">{saving ? <Loader2 size={18} className="animate-spin" /> : <ClipboardCheck size={18} />} Finalize Audit</button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50"><div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-slate-800 text-white shadow-lg shadow-slate-500/20"><Calendar size={20} /></div><div><h3 className="text-lg font-black uppercase tracking-tight">Schedule Task</h3></div></div><button onClick={() => setShowTaskModal(false)}><X size={20} /></button></div>
            <div className="p-8 space-y-5">
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Task Title</label><input placeholder="e.g., Fertilization" value={taskForm.task_title} onChange={e => setTaskForm({...taskForm, task_title: e.target.value})} className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Deadline</label><input type="date" value={taskForm.task_due_date} onChange={e => setTaskForm({...taskForm, task_due_date: e.target.value})} className="w-full px-5 py-3.5 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold" /></div>
                 <div className="space-y-1.5 text-status-select">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Priority</label>
                    <div className="relative group">
                       <select value={taskForm.task_priority} onChange={e => setTaskForm({...taskForm, task_priority: e.target.value})} className="w-full px-5 py-3.5 text-sm font-black border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800 focus:border-tea-500 outline-none appearance-none cursor-pointer">
                          <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
                       </select>
                       <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 group-hover:text-tea-500 pointer-events-none" />
                    </div>
                 </div>
               </div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase ml-1">Instructions</label><textarea rows={3} placeholder="Instructions..." value={taskForm.task_description} onChange={e => setTaskForm({...taskForm, task_description: e.target.value})} className="w-full px-5 py-4 text-sm border-2 border-slate-100 dark:border-slate-800 rounded-2xl" /></div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
               <button onClick={() => saveRecord('TASK', taskForm)} disabled={saving} className="bg-slate-800 text-white w-full py-4 rounded-2xl font-black uppercase text-xs shadow-xl flex items-center justify-center gap-3">{saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Issue Work Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getBlockArea = (block) => {
  if (!block) return 0;
  const dbArea = Number(block.area_hectares) || Number(block.area);
  if (dbArea) return dbArea;
  if (!block.polygon_coordinates) return 0;
  let latLngs = [];
  try {
    let polyData = block.polygon_coordinates;
    if (typeof polyData === 'string') polyData = JSON.parse(polyData);
    let rawCoords = null;
    if (polyData && polyData.type === 'Feature' && polyData.geometry?.type === 'Polygon') rawCoords = polyData.geometry.coordinates[0];
    else if (polyData && polyData.type === 'Polygon') rawCoords = polyData.coordinates[0];
    else if (Array.isArray(polyData)) rawCoords = polyData;
    if (rawCoords && rawCoords.length > 0) {
      latLngs = rawCoords.map(c => {
        if (c && typeof c === 'object' && 'lat' in c && ('lng' in c || 'lon' in c)) return [c.lat, c.lng || c.lon];
        if (Array.isArray(c) && c.length >= 2) return typeof c[0] === 'number' ? [c[1], c[0]] : null;
        return null;
      }).filter(Boolean);
    }
  } catch(e) { return 0; }
  if (latLngs.length < 3) return 0;
  let area = 0; const R = 6378137;
  for (let i = 0; i < latLngs.length; i++) {
    const p1 = latLngs[i], p2 = latLngs[(i + 1) % latLngs.length];
    const lat1 = p1[0] * Math.PI / 180, lng1 = p1[1] * Math.PI / 180, lat2 = p2[0] * Math.PI / 180, lng2 = p2[1] * Math.PI / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2) / 10000;
};
