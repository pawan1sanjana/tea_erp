import React, { useState, useEffect } from 'react';
import { 
  Leaf, Users, Search, Activity, Clock, CheckCircle, 
  Map, Layers, ChevronDown, Loader2, Calendar, ChevronLeft, 
  ChevronRight, Save, Download, FileSpreadsheet, FileText,
  TrendingUp, CheckCircle2, User, X, Settings, Edit2, AlertCircle,
  Shovel, MapPin, Package, Beaker, Banknote, RefreshCcw, BadgePercent
} from 'lucide-react';
import { apiClient } from "../../api/client";
import { AGRONOMIC_CONFIG } from "../../config/agronomicConfig";
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const WEED_TYPES = [
  { id: 'manual', label: 'Manual Weeding', color: 'bg-emerald-500', icon: <Leaf size={14}/> },
  { id: 'chemical', label: 'Chemical Control', color: 'bg-amber-500', icon: <Beaker size={14}/> },
  { id: 'mechanical', label: 'Mechanical', color: 'bg-indigo-500', icon: <Settings size={14}/> },
];

const COMMON_CHEMICALS = [
  'Glyphosate', 'Paraquat', 'Diuron', 'MCPA', 'Hexazinone', 'Other'
];

const WeedingIntel = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [blockWorkers, setBlockWorkers] = useState({}); 
  const [isSaving, setIsSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [individualModal, setIndividualModal] = useState(null);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const [dailySummary, setDailySummary] = useState([]);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [lockedEntries, setLockedEntries] = useState({});
  const [selectedRound, setSelectedRound] = useState('Round 1');
  const [payOverrides, setPayOverrides] = useState({});
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [activeOverrideWorker, setActiveOverrideWorker] = useState(null);

  const dateStr = selectedDate.toLocaleDateString('sv-SE');
  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  useEffect(() => {
    fetchDayData();
  }, [dateStr]);

  const fetchDayData = async () => {
    await Promise.all([
      fetchWeedingLogs(),
      fetchDailyPerformance()
    ]);
  };

  const fetchDailyPerformance = async () => {
    try {
      const [y, m, d] = dateStr.split('-');
      const res = await apiClient.get(`/crop/weeding-performance?year=${y}&month=${m}&day=${d}`);
      if (res.success) {
        setDailySummary(res.data);
      }
    } catch (error) {
      console.error('Fetch daily performance error:', error);
    }
  };

  const fetchWeedingLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/crop/weeding-logs/assignments?date=${dateStr}`);
      if (res.success) {
        setBlocks(res.data.map(b => ({
            ...b,
            id: b.block_id, // Normalize for expand logic
            name: b.block_name,
            total_area: parseFloat(b.total_covered_area || b.logs?.total_area || 0),
            assigned_pax: b.assigned_pax || b.assigned_workers || 0
        })));
      }
    } catch (error) {
      console.error('Fetch weeding logs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockWorkers = async (blockId) => {
    try {
      const res = await apiClient.get(`/crop/weeding-logs/block-workers?date=${dateStr}&block_id=${blockId}`);
      if (res.success) {
        const newLocked = { ...lockedEntries };
        const overrides = {};
        const workers = res.data.map(w => {
            // Robust check for logs (either nested or flattened)
            const logData = w.logs || w;
            const hasArea = parseFloat(logData.area) > 0 || parseFloat(w.area_covered) > 0;
            const isLocked = !!hasArea;
            
            if (isLocked) {
              newLocked[`${blockId}_${w.id}`] = true;
            }
            if (w.pay_multiplier && parseFloat(w.pay_multiplier) !== 1.0) {
              overrides[w.id] = parseFloat(w.pay_multiplier);
            }
            
            return {
              ...w,
              entry: { 
                type: logData.type || 'manual', 
                area: logData.area || w.area_covered || '',
                chem_type: logData.chem_type || '',
                chem_qty: logData.chem_qty || ''
              }
            };
          });
        setPayOverrides(prev => ({ ...prev, ...overrides }));
        setLockedEntries(newLocked);
        setBlockWorkers(prev => ({
          ...prev,
          [blockId]: workers
        }));
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
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !isExpanded
    }));
  };

  const handleWorkerInputChange = (blockId, workerId, field, value) => {
    setBlockWorkers(prev => ({
      ...prev,
      [blockId]: prev[blockId].map(w => 
        w.id === workerId ? { ...w, entry: { ...w.entry, [field]: value } } : w
      )
    }));
  };

  const saveBlockLogs = async (blockId) => {
    setIsSaving(prev => ({ ...prev, [blockId]: true }));
    try {
      const payloadWorkers = blockWorkers[blockId].filter(w => w.entry.area).map(w => ({
        id: w.id,
        entry: w.entry,
        pay_multiplier: payOverrides[w.id] || 1.0
      }));
      
      const res = await apiClient.post('/crop/weeding-logs/block-workers-save', {
        date: dateStr,
        block_id: blockId,
        round_label: selectedRound,
        workerWeights: payloadWorkers,
      });
      
      if (res.success) {
        await fetchDayData();
        // Clear cache so re-expand re-fetches & re-applies locks
        setBlockWorkers(p => { const n = { ...p }; delete n[blockId]; return n; });
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
      'Area Covered (Ac)': b.total_area || 0,
      'Productivity': b.assigned_pax > 0 ? ((b.total_area || 0) / b.assigned_pax).toFixed(2) : 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily_Weeding");
    XLSX.writeFile(workbook, `Weeding_Log_${dateStr}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`TeaERP Pro - Weeding Intelligence Registry`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${dayLabel}`, 14, 22);
    
    const tableData = blocks.map(b => [
      b.name,
      b.area_acres || '—',
      b.assigned_workers || 0,
      b.total_area.toFixed(2),
      b.assigned_workers > 0 ? ((b.total_area || 0) / b.assigned_workers).toFixed(2) : 0
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Block', 'Block Area', 'Assigned Pax', 'Area Covered', 'Productivity']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    doc.save(`Weeding_Log_${dateStr}.pdf`);
    setShowExportOptions(false);
  };

  const autoGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const [y, m, d] = dateStr.split('-');
      const perfRes = await apiClient.get(`/crop/weeding-performance?year=${y}&month=${m}&day=${d}`);
      
      if (!perfRes.success || !perfRes.data) {
        alert('Failed to fetch weeding performance data.');
        setGeneratingPayroll(false);
        return;
      }
      
      const musterRes = await apiClient.get(`/workforce/attendance-today?date=${dateStr}`);
      if (!musterRes.success || !musterRes.data) {
         alert('Failed to fetch attendance data.');
         setGeneratingPayroll(false);
         return;
      }

      const weedingMuster = musterRes.data.filter(w => w.task === 'Weeding');
      if (weedingMuster.length === 0) {
        alert('No weeding muster found for this date.');
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

      const entries = weedingMuster.map(w => {
        const area = perfMap[w.worker_internal_id] || 0;
        const multiplier = payOverrides[w.worker_internal_id] || 1.0;
        const isOverride = multiplier !== 1.0;
        const over = Math.max(0, area - target);
        const bonus = isOverride ? 0 : (over * rate);
        const eligible = isOverride || (area >= target);
        let wage = isOverride 
          ? Math.round(baseWage * multiplier)
          : (eligible ? baseWage + bonus : Math.round((area / target) * baseWage));

        return {
          worker_id: w.worker_internal_id,
          worker_epf: w.worker_id,
          worker_name: `${w.first_name} ${w.last_name}`,
          task: 'Weeding',
          acres: area,
          over_acres: over,
          bonus: bonus,
          wage: wage,
          eligible: eligible,
          pay_multiplier: multiplier
        };
      });

      const totalValue = entries.reduce((s, e) => s + e.acres, 0);
      const totalWage = entries.reduce((s, e) => s + e.wage, 0);
      const qualified = entries.filter(e => e.eligible).length;
      const overrideCount = entries.filter(e => e.pay_multiplier !== 1.0).length;

      const payload = {
        batch_date: dateStr,
        task_type: 'Weeding',
        base_wage: baseWage,
        target_acres: target,
        bonus_rate: rate,
        total_wage: totalWage,
        total_area: totalValue,
        qualified_workers: qualified,
        override_workers: overrideCount,
        entries: entries
      };

      const saveRes = await apiClient.post('/payrall/batch', payload);
      if (saveRes.success) {
        alert(`Payroll successfully generated for Weeding!${overrideCount > 0 ? `\n${overrideCount} worker(s) processed with pay overrides.` : ''}`);
      } else {
        alert('Failed to save payroll batch.');
      }
    } catch (error) {
      console.error('Payroll generation error:', error);
      alert('An error occurred during payroll generation.');
    } finally {
      setGeneratingPayroll(false);
    }
  };

  // Stats
  const grandTotalArea = blocks.reduce((acc, b) => acc + (parseFloat(b.total_area) || 0), 0);
  const totalAssigned = blocks.reduce((acc, b) => acc + (parseInt(b.assigned_pax) || 0), 0);

  const PayMultiplierModal = () => {
    if (!showOverrideModal || !activeOverrideWorker) return null;
    const multipliers = [
      { label: 'Standard', val: 1.0, color: 'slate' },
      { label: '½ Pay', val: 0.5, color: 'amber' },
      { label: '1.5x Pay', val: 1.5, color: 'indigo' },
      { label: 'Double Pay', val: 2.0, color: 'rose' },
    ];
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
              <Banknote size={24} className="text-indigo-600" />
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
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Weeding <span className="text-emerald-600">Intelligence</span></h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Shovel size={14} className="text-emerald-500" /> Vegetation control & field preparation auditing dashboard
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <button
            onClick={() => fetchDayData(dateStr)}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm group"
          >
            <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> Refresh
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
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={autoGeneratePayroll}
            disabled={generatingPayroll}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20"
          >
            {generatingPayroll ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
            Auto Generate Payroll
          </button>
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
            <p className="text-[10px] font-black uppercase tracking-widest">Total Coverage Today</p>
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter">{grandTotalArea.toFixed(2)} <span className="text-xs not-italic uppercase ml-1 opacity-80">Acres</span></h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Force Deployed</p>
            <Users size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">{totalAssigned} <span className="text-xs not-italic uppercase ml-1 text-slate-400">PAX</span></h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Efficiency</p>
            <Activity size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">{totalAssigned > 0 ? (grandTotalArea / totalAssigned).toFixed(2) : '0.00'} <span className="text-xs not-italic uppercase ml-1 text-slate-400">Ac/Pax</span></h3>
          </div>
        </div>

        <div className="premium-card bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-6 border border-dashed border-slate-200 dark:border-slate-700">
           {dateStr === new Date().toLocaleDateString('sv-SE') ? (
             <>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 animate-pulse">Status: Live</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Deployment Terminal Entry Active</p>
             </>
           ) : (
             <>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: Archived</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Historical Record View Only</p>
             </>
           )}
        </div>
      </div>

      {/* Weeding System Config Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowSettings(false)}
          />
          <div className="premium-card w-full max-w-sm relative z-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-400 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl">
                  <Settings size={18} className="text-emerald-500 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-none">Weeding Config</h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Vegetation Parameters</p>
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
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Standard Weeding Cycle</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    defaultValue={AGRONOMIC_CONFIG.WEEDING.INTERVAL_DAYS}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-emerald-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Days</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Daily Coverage Target</label>
                <div className="relative group">
                  <input 
                    type="number" 
                    defaultValue={0.25}
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-emerald-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Acres/Pax</span>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mt-2 flex gap-3">
                 <AlertCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                 <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 leading-relaxed uppercase tracking-wider">
                   These parameters define the default benchmarks for productivity analytics and cycle forecasting.
                 </p>
              </div>
            </div>

            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
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
            <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all">
              <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-emerald-600">
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
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5 opacity-80">{dayLabel.split(',')[0]}</p>
              </div>

              <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-emerald-600">
                <ChevronRight size={22} />
              </button>
            </div>
            <div className="flex flex-col items-center min-w-[120px]">
              <div className="relative w-full">
                <select 
                  value={selectedRound}
                  onChange={(e) => setSelectedRound(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  {['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Select Cycle</p>
            </div>
            {dateStr !== new Date().toLocaleDateString('sv-SE') && (
              <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                Back to Today
              </button>
            )}
          </div>
          
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Coverage</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-emerald-600">{grandTotalArea.toFixed(2)}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">Acres</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Workforce</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black font-outfit text-slate-900 dark:text-white">{totalAssigned}</span>
                <span className="text-[9px] font-black text-slate-400 uppercase">PAX</span>
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
          <div className="flex gap-2 pr-2">
            {WEED_TYPES.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.color}`}></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{t.label}</span>
                </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-emerald-500">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Synchronizing Vegetation Intelligence...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Worker Performance Summary Card */}
            <div className="premium-card p-0 overflow-hidden border-emerald-500/20 shadow-emerald-500/5">
              <button 
                onClick={() => setShowDailySummary(!showDailySummary)}
                className="w-full text-left px-8 py-6 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white font-outfit tracking-tight leading-none mb-1">Daily Productivity Summary</h4>
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">{dailySummary.length} Active Workers</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Coverage</p>
                    <p className="text-xl font-black text-emerald-600 font-outfit leading-none">{dailySummary.reduce((s,w) => s + (parseFloat(w.total_area)||0), 0).toFixed(2)} <span className="text-[10px] uppercase opacity-60">Acres</span></p>
                  </div>
                  <ChevronDown className={`text-slate-400 transition-transform duration-500 ${showDailySummary ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showDailySummary && (
                <div className="p-8 animate-in slide-in-from-top duration-500">
                  <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                          <th className="px-8 py-5">Personnel Detail</th>
                          <th className="px-8 py-5 text-center">Total Covered (Ac)</th>
                          <th className="px-8 py-5 text-center">Days Worked</th>
                          <th className="px-8 py-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {dailySummary.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-8 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40 italic">
                              No performance data aggregated for this date
                            </td>
                          </tr>
                        ) : (
                          dailySummary.map((worker, sIdx) => (
                            <tr key={worker.id || sIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center overflow-hidden border border-emerald-100 dark:border-emerald-900/30">
                                    {worker.photo ? (
                                      <img src={worker.photo} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="font-black text-emerald-600 text-xs uppercase">{worker.first_name?.[0] || 'W'}</span>
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{worker.first_name} {worker.last_name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Code: {worker.worker_code}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className="text-sm font-black font-outfit text-emerald-600 italic">{(parseFloat(worker.total_area) || 0).toFixed(2)} Ac</span>
                              </td>
                              <td className="px-8 py-4 text-center">
                                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{worker.days_worked || 1} Day</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl">
                                  <CheckCircle2 size={12} className="text-emerald-500" />
                                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Synchronized</span>
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

            <div className="grid grid-cols-1 gap-4">
            {blocks.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
              <div className="premium-card h-64 flex flex-col items-center justify-center text-slate-400 border-dashed border-2 bg-slate-50 dark:bg-slate-900/50">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Users size={32} className="opacity-20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] italic">No Active Weeding Deployments</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Personnel have not been assigned to weeding tasks in today's muster</p>
                <Link 
                  to="/workforce" 
                  className="mt-6 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Users size={14} /> Assign Workforce
                </Link>
              </div>
            ) : blocks.filter(b => (b.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((block, idx) => {
              const isExpanded = expandedBlocks[block.id];
              const workersInBlock = blockWorkers[block.id] || [];
              
              return (
                <div key={block.id || `block-${idx}`} className="premium-card p-0 overflow-hidden group hover:border-emerald-200 transition-all duration-300">
                  <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Shovel size={20} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">{block.name}</h5>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.area_acres || '—'} Acres</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{block.assigned_pax} Assigned</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Area Covered</p>
                        <p className="text-2xl font-black text-emerald-600 font-outfit tracking-tighter italic leading-none">{(parseFloat(block.total_area) || 0).toFixed(2)} <span className="text-[10px] not-italic text-slate-400 uppercase">Acres</span></p>
                      </div>
                      <button 
                        onClick={() => toggleBlockExpand(block.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                          isExpanded 
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
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
                        <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Individual Weeding Performance</h6>
                        <button 
                          onClick={() => saveBlockLogs(block.id)}
                          disabled={isSaving[block.id]}
                          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            saved[block.id] ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
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
                              <th className="px-6 py-4 text-center">Type</th>
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
                                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center overflow-hidden border border-emerald-100 dark:border-emerald-900/30 group-hover:scale-110 transition-transform">
                                        {worker.photo ? (
                                          <img src={worker.photo} alt={worker.first_name || worker.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="font-black text-emerald-600 text-xs uppercase">{(worker.first_name || worker.name)?.[0] || 'W'}</span>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{worker.first_name || worker.name} {worker.last_name || ''}</p>
                                          {(payOverrides[worker.id] || 1.0) !== 1.0 && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                              payOverrides[worker.id] < 1 
                                                ? 'bg-amber-500/15 border-amber-400/30 text-amber-600' 
                                                : 'bg-indigo-500/15 border-indigo-400/30 text-indigo-600'
                                            }`}>
                                              <BadgePercent size={9} /> {payOverrides[worker.id]}x Pay
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {worker.id}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     <select
                                        value={worker.entry.type}
                                        disabled={!!lockedEntries[`${block.id}_${worker.id}`]}
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'type', e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase tracking-widest px-2 py-1 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                                     >
                                       {WEED_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                     </select>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        disabled={!!lockedEntries[`${block.id}_${worker.id}`]}
                                        value={worker.entry.area || ''} 
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'area', e.target.value)}
                                        className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/30 outline-none transition-all shadow-inner disabled:opacity-50"
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button 
                                      onClick={() => {
                                        setActiveOverrideWorker({ id: worker.id, name: worker.first_name || worker.name });
                                        setShowOverrideModal(true);
                                      }}
                                      disabled={!!lockedEntries[`${block.id}_${worker.id}`]}
                                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                        (payOverrides[worker.id] || 1.0) !== 1.0 
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 hover:bg-indigo-700' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'
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
                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all"
                                        title="Individual Performance Detail"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      {!!lockedEntries[`${block.id}_${worker.id}`] ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-xl">
                                          <CheckCircle2 size={12} className="text-indigo-500" />
                                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Locked</span>
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
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Performance Detail</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {individualModal.worker.first_name || individualModal.worker.name} {individualModal.worker.last_name || ''} • Block {blocks.find(b => b.id === individualModal.block_id)?.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIndividualModal(null)}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Weeding Type</label>
                   <select
                        value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.entry.type || 'manual'}
                        disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                        onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'type', e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white disabled:opacity-50"
                     >
                       {WEED_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                     </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Area Covered (Ac)</label>
                  <input 
                    type="number"
                    step="0.01"
                    disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                    value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.entry.area || ''}
                    onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'area', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-emerald-500 transition-all dark:text-white disabled:opacity-50"
                  />
                </div>
              </div>

              {blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.entry.type === 'chemical' && (
                  <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-300">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Chemical</label>
                        <select
                             disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                             value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.entry.chem_type || ''}
                             onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'chem_type', e.target.value)}
                             className="w-full p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl text-sm font-bold outline-none focus:border-amber-500 transition-all dark:text-white disabled:opacity-50"
                        >
                             <option value="">Select Chemical</option>
                             {COMMON_CHEMICALS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Quantity (Lit)</label>
                        <input 
                            type="number"
                            disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                            value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.entry.chem_qty || ''}
                            onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'chem_qty', e.target.value)}
                            className="w-full p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl text-sm font-bold outline-none focus:border-amber-500 transition-all dark:text-white disabled:opacity-50"
                        />
                     </div>
                  </div>
              )}
              
              <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                <div className="flex items-start gap-3">
                  <Activity size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-emerald-600/80 leading-relaxed uppercase tracking-wider">
                    {!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`] ? 'This record is committed and locked for auditing.' : 'Data entered here will be synchronized with the main registry once committed.'}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIndividualModal(null)}
                disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
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
};

export default WeedingIntel;
