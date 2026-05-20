import React, { useState, useEffect } from 'react';
import { 
  Scissors, Users, Search, Activity, Clock, CheckCircle, 
  Map, Layers, ChevronDown, Loader2, Calendar, ChevronLeft, 
  ChevronRight, Save, Download, FileSpreadsheet, FileText,
  TrendingUp, CheckCircle2, User, X, Settings, Edit2, AlertCircle, RefreshCcw, Banknote, BadgePercent
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PruningIntel() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [blockWorkers, setBlockWorkers] = useState({}); 
  const [lockedEntries, setLockedEntries] = useState({}); // { 'blockId_workerId': true }
  const [dailySummary, setDailySummary] = useState([]);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [isSaving, setIsSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [individualModal, setIndividualModal] = useState(null);
  const [payOverrides, setPayOverrides] = useState({});
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [activeOverrideWorker, setActiveOverrideWorker] = useState(null);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  const dateStr = selectedDate.toLocaleDateString('sv-SE');
  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const isToday = dateStr === new Date().toLocaleDateString('sv-SE');

  useEffect(() => {
    fetchDayData();
  }, [dateStr]);

  const fetchDayData = async () => {
    setLoading(true);
    try {
      const y = selectedDate.getFullYear();
      const m = selectedDate.getMonth() + 1;
      const d = selectedDate.getDate();

      const [resLogs, resSummary] = await Promise.all([
        apiClient.get(`/crop/pruning-logs?date=${dateStr}`),
        apiClient.get(`/crop/pruning-performance?year=${y}&month=${m}&day=${d}`)
      ]);

      if (resLogs.success) setBlocks(resLogs.data);
      if (resSummary.success) setDailySummary(resSummary.data);
    } catch (error) {
      console.error('Fetch pruning data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const autoGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const [y, m, d] = dateStr.split('-');
      const perfRes = await apiClient.get(`/crop/pruning-performance?year=${y}&month=${m}&day=${d}`);
      
      if (!perfRes.success || !perfRes.data) {
        alert('Failed to fetch pruning performance data.');
        setGeneratingPayroll(false);
        return;
      }
      
      const musterRes = await apiClient.get(`/workforce/attendance-today?date=${dateStr}`);
      if (!musterRes.success || !musterRes.data) {
         alert('Failed to fetch attendance data.');
         setGeneratingPayroll(false);
         return;
      }

      const taskMuster = musterRes.data.filter(w => w.task === 'Pruning');
      if (taskMuster.length === 0) {
        alert('No pruning muster found for this date.');
        setGeneratingPayroll(false);
        return;
      }

      const perfMap = {};
      perfRes.data.forEach(p => {
        perfMap[p.id] = parseFloat(p.total_area) || 0;
      });

      const baseWage = 1400;
      const target = 0.5;
      const rate = 500;

      const entries = taskMuster.map(w => {
        const area = perfMap[w.worker_internal_id] || 0;
        const multiplier = payOverrides[w.worker_internal_id] || 1.0;
        const isOverride = multiplier !== 1.0;

        let wage, bonus, over, eligible;
        if (isOverride) {
          wage = Math.round(baseWage * multiplier);
          bonus = 0;
          over = 0;
          eligible = multiplier >= 1.0;
        } else {
          over = Math.max(0, area - target);
          bonus = over * rate;
          eligible = area >= target;
          wage = eligible ? baseWage + bonus : Math.round((area / target) * baseWage);
        }

        return {
          worker_id: w.worker_internal_id,
          worker_epf: w.worker_id,
          worker_name: `${w.first_name} ${w.last_name}`,
          task: 'Pruning',
          acres: area,
          over_acres: over,
          bonus: bonus,
          wage: wage,
          eligible: eligible,
          pay_multiplier: multiplier
        };
      });

      await apiClient.post('/crop/payroll-batch', {
        batch_date: dateStr,
        task_type: 'Pruning',
        base_wage: baseWage,
        target_acres: target,
        bonus_rate: rate,
        total_wage: entries.reduce((s, e) => s + e.wage, 0),
        total_area: entries.reduce((s, e) => s + e.acres, 0),
        qualified_workers: entries.filter(e => e.eligible).length,
        override_workers: entries.filter(e => e.pay_multiplier !== 1.0).length,
        entries
      });

      alert('Pruning Payroll generated successfully.');
    } catch (e) { console.error(e); }
    finally { setGeneratingPayroll(false); }
  };

  const fetchBlockWorkers = async (blockId) => {
    try {
      const res = await apiClient.get(`/crop/pruning-logs/assigned-workers?date=${dateStr}&block_id=${blockId}`);
      if (res.success) {
        const newLocked = { ...lockedEntries };
        const overrides = {};
        res.data.forEach(w => {
          if (w.bushes_pruned > 0 || w.area_covered > 0) {
            newLocked[`${blockId}_${w.id}`] = true;
          }
          if (w.pay_multiplier && parseFloat(w.pay_multiplier) !== 1.0) {
            overrides[w.id] = parseFloat(w.pay_multiplier);
          }
        });
        setPayOverrides(prev => ({ ...prev, ...overrides }));
        setLockedEntries(newLocked);
        setBlockWorkers(prev => ({ ...prev, [blockId]: res.data }));
      }
    } catch (error) {
      console.error('Fetch block workers error:', error);
    }
  };

  const toggleBlockExpand = async (blockId) => {
    const isExpanded = !!expandedBlocks[blockId];
    if (!isExpanded && !blockWorkers[blockId]) {
      await fetchBlockWorkers(blockId);
    }
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !isExpanded }));
  };

  const handleWorkerInputChange = (blockId, workerId, field, value) => {
    // Prevent editing if locked
    if (lockedEntries[`${blockId}_${workerId}`] && isToday) return;

    setBlockWorkers(prev => ({
      ...prev,
      [blockId]: prev[blockId].map(w => 
        w.id === workerId ? { ...w, [field]: value } : w
      )
    }));
  };

  const saveBlockLogs = async (blockId) => {
    setIsSaving(prev => ({ ...prev, [blockId]: true }));
    try {
      const entries = blockWorkers[blockId].map(w => ({
        worker_id: w.id,
        bushes_pruned: parseInt(w.bushes_pruned) || 0,
        area_covered: parseFloat(w.area_covered) || 0,
        pay_multiplier: payOverrides[w.id] || 1.0
      }));
      
      const res = await apiClient.post('/crop/pruning-logs/individual', {
        date: dateStr,
        block_id: blockId,
        entries
      });
      
      if (res.success) {
        await fetchDayData(); // Refresh everything
        await fetchBlockWorkers(blockId); // Refresh locking status for this block
        setSaved(p => ({ ...p, [blockId]: true }));
        setTimeout(() => setSaved(p => ({ ...p, [blockId]: false })), 2500);
      }
    } catch (error) {
      console.error('Save block logs error:', error);
    } finally {
      setIsSaving(prev => ({ ...prev, [blockId]: false }));
    }
  };

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  // Export Handlers
  const exportToExcel = () => {
    const dataToExport = blocks.map(b => ({
      'Block Name': b.name,
      'Total Area (Ac)': b.area_acres || '—',
      'Assigned Pax': b.assigned_pax || 0,
      'Bushes Pruned': b.logs?.total_bushes || 0,
      'Area Covered (Ac)': b.logs?.total_area || 0,
      'Avg Bushes/Pax': b.assigned_pax > 0 ? ((b.logs?.total_bushes || 0) / b.assigned_pax).toFixed(1) : 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily_Pruning");
    XLSX.writeFile(workbook, `Pruning_Log_${dateStr}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`TeaERP Pro - Pruning Intelligence Registry`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${dayLabel}`, 14, 22);
    
    const tableData = blocks.map(b => [
      b.name,
      b.area_acres || '—',
      b.assigned_pax || 0,
      b.logs?.total_bushes || 0,
      b.logs?.total_area || 0,
      b.assigned_pax > 0 ? ((b.logs?.total_bushes || 0) / b.assigned_pax).toFixed(1) : 0
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Block', 'Block Area', 'Assigned Pax', 'Bushes Pruned', 'Area Covered', 'Productivity']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] }
    });

    doc.save(`Pruning_Log_${dateStr}.pdf`);
    setShowExportOptions(false);
  };

  // Stats
  const totalBushes = blocks.reduce((acc, b) => acc + (b.logs?.total_bushes || 0), 0);
  const totalArea = blocks.reduce((acc, b) => acc + (parseFloat(b.logs?.total_area) || 0), 0);
  const totalAssigned = blocks.reduce((acc, b) => acc + (b.assigned_pax || 0), 0);

  const PayMultiplierModal = () => {
    if (!showOverrideModal || !activeOverrideWorker) return null;
    const multipliers = [
      { label: 'Standard', val: 1.0, color: 'slate' },
      { label: '½ Pay', val: 0.5, color: 'amber' },
      { label: '1.5x Pay', val: 1.5, color: 'rose' },
      { label: 'Double Pay', val: 2.0, color: 'rose' },
    ];
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center">
              <Banknote size={24} className="text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Pay Rate Override</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                {activeOverrideWorker.name}
              </p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {multipliers.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    setPayOverrides(prev => ({ ...prev, [activeOverrideWorker.id]: opt.val }));
                    setShowOverrideModal(false);
                  }}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all group ${
                    (payOverrides[activeOverrideWorker.id] || 1.0) === opt.val
                      ? `bg-${opt.color}-500/10 border-${opt.color}-500 shadow-lg shadow-${opt.color}-500/10`
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    (payOverrides[activeOverrideWorker.id] || 1.0) === opt.val ? `text-${opt.color}-600` : 'text-slate-400'
                  }`}>{opt.label}</span>
                  <span className={`text-xl font-black font-outfit ${(payOverrides[activeOverrideWorker.id] || 1.0) === opt.val ? `text-${opt.color}-600` : 'text-slate-900 dark:text-white'}`}>
                    {opt.val}x
                  </span>
                </button>
              ))}
            </div>
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest text-center">
                Overrides bypass productivity targets and apply a fixed multiplier to the base daily wage.
              </p>
            </div>

            <button
              onClick={() => setShowOverrideModal(false)}
              className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Pruning <span className="text-emerald-600">Intelligence</span></h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Precision Bush Management & Muster Registry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <button
            onClick={() => fetchDayData()}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm group"
          >
            <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> Refresh
          </button>

          <button 
              onClick={autoGeneratePayroll}
              disabled={generatingPayroll}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20"
            >
              {generatingPayroll ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
              Auto Generate Payroll
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit shadow-sm bg-white dark:bg-slate-900"
            >
              <Download size={16} /> Export
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                  <FileSpreadsheet size={16} /> Excel Spreadsheet
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Settings size={16} /> Configure System
          </button>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card bg-emerald-600 text-white border-none shadow-xl shadow-emerald-600/20 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between opacity-80">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Bushes Today</p>
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter">{totalBushes.toLocaleString()} <span className="text-xs not-italic uppercase ml-1 opacity-80">Bushes</span></h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Area Coverage</p>
            <Activity size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">{totalArea.toFixed(2)} <span className="text-xs not-italic uppercase ml-1 text-slate-400">Acres</span></h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Pruning Force</p>
            <Users size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">{totalAssigned} <span className="text-xs not-italic uppercase ml-1 text-slate-400">PAX Deployed</span></h3>
          </div>
        </div>

        <div className="premium-card bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-6 border border-dashed border-slate-200 dark:border-slate-700">
           {isToday ? (
             <>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 animate-pulse">Status: Live</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Pruning Terminal Entry Active</p>
             </>
           ) : (
             <>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: Archived</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Historical Record View Only</p>
             </>
           )}
        </div>
      </div>

      {/* Pruning System Config Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowSettings(false)}
          />
          <div className="premium-card w-full max-w-sm relative z-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-400 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
                  <Settings size={18} className="text-rose-500 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-none">Pruning Config</h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Forestry Parameters</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Standard Pruning Cycle</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    defaultValue={5}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-rose-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Years</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Daily Bush Target</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    defaultValue={120}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-rose-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Bushes/Pax</span>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 mt-2 flex gap-3">
                 <AlertCircle size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
                 <p className="text-[10px] font-black text-rose-700 dark:text-rose-400 leading-relaxed uppercase tracking-wider">
                   These parameters define the default benchmarks for productivity analytics and cycle forecasting.
                 </p>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-3 bg-rose-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95"
            >
              Update Configuration
            </button>
          </div>
        </div>
      )}

      {/* Date Navigator */}
      <div className="premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-rose-200 dark:hover:border-rose-900/50 transition-all">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-600">
                <ChevronLeft size={22} />
              </button>
              
              <div className="flex flex-col items-center min-w-[180px]">
                <div className="relative">
                  <input 
                    type="date" 
                    value={dateStr}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="bg-transparent text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white outline-none cursor-pointer font-outfit"
                  />
                </div>
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mt-0.5 opacity-80">{dayLabel.split(',')[0]}</p>
              </div>

              <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-rose-600">
                <ChevronRight size={22} />
              </button>
            </div>
            {dateStr !== new Date().toLocaleDateString('sv-SE') && (
              <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2.5 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20">
                Back to Today
              </button>
            )}
          </div>
          
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Yield</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-rose-600">{totalBushes}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">Bushes</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Coverage</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-slate-900 dark:text-white">{totalArea.toFixed(2)}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">Acres</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Registry */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 w-full pl-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter deployment blocks..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent text-xs font-bold outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-rose-500">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Synchronizing Forestry Intelligence...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Worker Performance Summary Card */}
            <div className="premium-card p-0 overflow-hidden border-rose-500/20 shadow-rose-500/5">
              <button 
                onClick={() => setShowDailySummary(!showDailySummary)}
                className="w-full text-left px-8 py-6 bg-rose-50/50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-rose-100/50 dark:hover:bg-rose-900/20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-rose-500/10 rounded-2xl">
                    <Users size={20} className="text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">Daily Productivity Summary</h5>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Global individual worker output across all blocks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <Activity size={14} className="text-rose-500" />
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">{dailySummary.length} Active Workers</span>
                  </div>
                  <div className={`p-2 rounded-lg transition-transform duration-300 ${showDailySummary ? 'rotate-180 bg-rose-100 dark:bg-rose-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <ChevronDown size={18} className="text-rose-500" />
                  </div>
                </div>
              </button>

              {showDailySummary && (
                <div className="p-0 overflow-x-auto animate-in slide-in-from-top duration-300">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-4">Worker Profile</th>
                        <th className="px-4 py-4 text-center">Bushes Pruned</th>
                        <th className="px-4 py-4 text-center">Area (Acres)</th>
                        <th className="px-8 py-4 text-right">Avg Productivity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
                      {dailySummary.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-8 py-12">
                            <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                              <Users size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest">No pruning performance recorded for this date</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dailySummary.map(w => {
                          const bushes = parseInt(w.total_bushes) || 0;
                          const area = parseFloat(w.total_area) || 0;
                          
                          const photoUrl = w.photo 
                            ? (w.photo.startsWith('data:') ? w.photo : `/api/uploads/${w.photo}`)
                            : null;

                          const firstName = w.first_name || 'Worker';
                          const lastName = w.last_name || `#${w.id}`;
                          const initials = (firstName[0] || '?') + (lastName[0] || '?');

                          return (
                            <tr key={w.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/5 transition-colors">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-600/50">
                                    {photoUrl ? <img src={photoUrl} alt={firstName} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-slate-400 uppercase">{initials}</span>}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{firstName} {lastName}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">EPF: {w.worker_code || w.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-sm font-black text-slate-900 dark:text-white font-outfit">{bushes}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400 font-outfit">{area.toFixed(2)}</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-outfit italic">{bushes > 0 ? (bushes / (area || 1)).toFixed(1) : 0} b/ac</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
            {blocks.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <div className="premium-card h-64 flex flex-col items-center justify-center text-slate-400 border-dashed border-2 bg-slate-50 dark:bg-slate-900/50">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Users size={32} className="opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] italic">No Active Pruning Deployments</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Personnel have not been assigned to pruning tasks in today's muster</p>
                <Link 
                  to="/workforce" 
                  className="mt-6 px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 flex items-center gap-2"
                >
                  <Users size={14} /> Assign Workforce
                </Link>
              </div>
            ) : blocks.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((block, idx) => {
              const isExpanded = expandedBlocks[block.id];
              const workersInBlock = blockWorkers[block.id] || [];
              
              return (
                <div key={block.id || `block-${idx}`} className="premium-card p-0 overflow-hidden group hover:border-rose-200 transition-all duration-300">
                  <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Scissors size={20} className="text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">{block.name}</h5>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.area_acres || '—'} Acres</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{block.assigned_pax} Assigned</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Area Covered</p>
                        <p className="text-2xl font-black text-rose-600 font-outfit tracking-tighter italic leading-none">{(parseFloat(block.logs?.total_area) || 0).toFixed(2)} <span className="text-[10px] not-italic text-slate-400 uppercase">Acres</span></p>
                      </div>
                      <button 
                        onClick={() => toggleBlockExpand(block.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                          isExpanded 
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}>
                        {isExpanded ? <User size={14} /> : <Users size={14} />}
                        {isExpanded ? 'Hide Registry' : 'View Registry'}
                        <ChevronLeft size={14} className={`transition-transform duration-300 ${isExpanded ? '-rotate-90' : '-rotate-90'}`} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Individual Forestry Performance</h6>
                        <button 
                          onClick={() => saveBlockLogs(block.id)}
                          disabled={isSaving[block.id]}
                          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            saved[block.id] ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20'
                          }`}>
                          {isSaving[block.id] ? <Loader2 size={12} className="animate-spin" /> : saved[block.id] ? <CheckCircle2 size={12} /> : <Save size={12} />}
                          {isSaving[block.id] ? 'Committing...' : saved[block.id] ? 'Committed' : 'Commit All Registry'}
                        </button>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-900/50">
                              <th className="px-6 py-4">Worker Profile</th>
                              <th className="px-6 py-4 text-center">Bushes Pruned</th>
                              <th className="px-6 py-4 text-center">Area Covered (Ac)</th>
                              <th className="px-6 py-4 text-center">Pay Rate</th>
                              <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {workersInBlock.length === 0 ? (
                              <tr>
                                <td colSpan="4" className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">
                                  Synchronizing personnel from Smart Muster...
                                </td>
                              </tr>
                            ) : (
                              workersInBlock.map((worker, wIdx) => (
                                <tr key={worker.id || `worker-${wIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center overflow-hidden border border-rose-100 dark:border-rose-900/30 group-hover:scale-110 transition-transform">
                                        {worker.photo ? (
                                          <img src={worker.photo} alt={worker.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="font-black text-rose-600 text-xs uppercase">{worker.first_name[0]}{worker.last_name?.[0] || ''}</span>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{worker.first_name} {worker.last_name}</p>
                                          {(payOverrides[worker.id] || 1.0) !== 1.0 && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                              payOverrides[worker.id] < 1 
                                                ? 'bg-amber-500/15 border-amber-400/30 text-amber-600' 
                                                : 'bg-rose-500/15 border-rose-400/30 text-rose-600'
                                            }`}>
                                              <BadgePercent size={9} /> {payOverrides[worker.id]}x Pay
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {worker.worker_id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto">
                                      <input 
                                        type="number" 
                                        value={worker.bushes_pruned || ''} 
                                        disabled={!isToday || lockedEntries[`${block.id}_${worker.id}`]}
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'bushes_pruned', e.target.value)}
                                        className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/30 outline-none transition-all shadow-inner disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                                        placeholder="0"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={worker.area_covered || ''} 
                                        disabled={!isToday || lockedEntries[`${block.id}_${worker.id}`]}
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'area_covered', e.target.value)}
                                        className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:focus:ring-rose-900/30 outline-none transition-all shadow-inner disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800/50"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button 
                                      onClick={() => {
                                        setActiveOverrideWorker({ id: worker.id, name: `${worker.first_name} ${worker.last_name}` });
                                        setShowOverrideModal(true);
                                      }}
                                      disabled={!isToday || lockedEntries[`${block.id}_${worker.id}`]}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                        (payOverrides[worker.id] || 1.0) !== 1.0 
                                          ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25 hover:bg-rose-700' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:text-rose-600'
                                      }`}
                                    >
                                      <Banknote size={11} />
                                      {(payOverrides[worker.id] || 1.0) !== 1.0 ? `${(payOverrides[worker.id] || 1.0)}x` : 'Std'}
                                    </button>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button 
                                        onClick={() => setIndividualModal({ worker, block_id: block.id })}
                                        disabled={!isToday || lockedEntries[`${block.id}_${worker.id}`]}
                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                        title="Individual Performance Detail"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      {lockedEntries[`${block.id}_${worker.id}`] ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                                          <CheckCircle2 size={12} className="text-emerald-500" />
                                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Locked</span>
                                        </div>
                                      ) : (
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic pr-3">Pending</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

      {/* Individual Performance Modal */}
      {individualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 border border-rose-500/20">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Performance Detail</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {individualModal.worker.first_name} {individualModal.worker.last_name} • Block {blocks.find(b => b.id === individualModal.block_id)?.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIndividualModal(null)}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Bushes Pruned</label>
                  <input 
                    type="number"
                    disabled={!isToday || lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                    value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.bushes_pruned || ''}
                    onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'bushes_pruned', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-rose-500 transition-all dark:text-white disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Area Covered (Ac)</label>
                  <input 
                    type="number"
                    step="0.01"
                    disabled={!isToday || lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                    value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.area_covered || ''}
                    onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'area_covered', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-rose-500 transition-all dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                <div className="flex items-start gap-3">
                  <Activity size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-rose-600/80 leading-relaxed uppercase tracking-wider">
                    {lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`] ? 'This record is committed and locked for auditing.' : 'Data entered here will be synchronized with the main registry once committed.'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIndividualModal(null)}
                disabled={lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`] && isToday}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                Save Performance
              </button>
            </div>
          </div>
        </div>
      )}
      <PayMultiplierModal />
    </div>
  );
}
