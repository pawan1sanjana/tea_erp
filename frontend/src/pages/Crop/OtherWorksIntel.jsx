import React, { useState, useEffect } from 'react';
import { 
  Download, FileSpreadsheet, FileText, ChevronDown, Calendar, RefreshCcw, Banknote, CheckCircle,
  Search, TrendingUp, Map, Users, Loader2, ChevronLeft, ChevronRight, User, X, CheckCircle2, Edit2, Briefcase,
  Activity, Save, BadgePercent
} from 'lucide-react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const OtherWorksIntel = ({ isEmbedded = false }) => {
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
  const [lockedEntries, setLockedEntries] = useState({});
  const [dailySummary, setDailySummary] = useState([]);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [payOverrides, setPayOverrides] = useState({});
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [activeOverrideWorker, setActiveOverrideWorker] = useState(null);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  const dateStr = selectedDate.toLocaleDateString('sv-SE');
  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  useEffect(() => {
    fetchDayData();
  }, [dateStr]);

  const fetchDailyPerformance = async () => {
    try {
      const [y, m, d] = dateStr.split('-');
      const res = await apiClient.get(`/crop/other-works-performance?year=${y}&month=${m}&day=${d}`);
      if (res.success) setDailySummary(res.data);
    } catch (e) { console.error('Fetch performance error:', e); }
  };

  const fetchDayData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchOtherWorksLogs(), fetchDailyPerformance()]);
    } finally {
      setLoading(false);
    }
  };

  const autoGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const [y, m, d] = dateStr.split('-');
      const perfRes = await apiClient.get(`/crop/other-works-performance?year=${y}&month=${m}&day=${d}`);
      
      if (!perfRes.success || !perfRes.data) {
        alert('Failed to fetch other works performance data.');
        setGeneratingPayroll(false);
        return;
      }
      
      const musterRes = await apiClient.get(`/workforce/attendance-today?date=${dateStr}`);
      if (!musterRes.success || !musterRes.data) {
         alert('Failed to fetch attendance data.');
         setGeneratingPayroll(false);
         return;
      }

      const taskMuster = musterRes.data.filter(w => w.task === 'Other Works');
      if (taskMuster.length === 0) {
        alert('No other works muster found for this date.');
        setGeneratingPayroll(false);
        return;
      }

      const perfMap = {};
      perfRes.data.forEach(p => {
        perfMap[p.id] = parseFloat(p.total_units) || 0;
      });

      const baseWage = 1400;
      const target = 1.0;
      const rate = 1400; // Flat rate for over-units in other works for now

      const entries = taskMuster.map(w => {
        const units = perfMap[w.worker_internal_id] || 0;
        const multiplier = payOverrides[w.worker_internal_id] || 1.0;
        const isOverride = multiplier !== 1.0;

        let wage, bonus, over, eligible;
        if (isOverride) {
          wage = Math.round(baseWage * multiplier);
          bonus = 0;
          over = 0;
          eligible = multiplier >= 1.0;
        } else {
          over = Math.max(0, units - target);
          bonus = over * rate;
          eligible = units >= target;
          wage = eligible ? baseWage + bonus : Math.round((units / target) * baseWage);
        }

        return {
          worker_id: w.worker_internal_id,
          worker_epf: w.worker_id,
          worker_name: `${w.first_name} ${w.last_name}`,
          task: 'Other Works',
          units: units,
          over_units: over,
          bonus: bonus,
          wage: wage,
          eligible: eligible,
          pay_multiplier: multiplier
        };
      });

      await apiClient.post('/crop/payroll-batch', {
        batch_date: dateStr,
        task_type: 'Other Works',
        base_wage: baseWage,
        target_units: target,
        bonus_rate: rate,
        total_wage: entries.reduce((s, e) => s + e.wage, 0),
        total_units: entries.reduce((s, e) => s + e.units, 0),
        qualified_workers: entries.filter(e => e.eligible).length,
        override_workers: entries.filter(e => e.pay_multiplier !== 1.0).length,
        entries
      });

      alert('Other Works Payroll generated successfully.');
    } catch (e) { console.error(e); }
    finally { setGeneratingPayroll(false); }
  };

  const fetchOtherWorksLogs = async () => {
    try {
      const res = await apiClient.get(`/crop/other-works-logs?date=${dateStr}`);
      if (res.success) setBlocks(res.data);
    } catch (error) {
      console.error('Fetch other works logs error:', error);
    }
  };

  const fetchBlockWorkers = async (blockId) => {
    try {
      const res = await apiClient.get(`/crop/other-works-logs/assigned-workers?date=${dateStr}&block_id=${blockId}`);
      if (res.success) {
        const newLocked = { ...lockedEntries };
        const overrides = {};
        const workers = res.data.map(w => {
          const isLocked = (parseFloat(w.units_completed) > 0);
          if (isLocked) newLocked[`${blockId}_${w.id}`] = true;
          if (w.pay_multiplier && parseFloat(w.pay_multiplier) !== 1.0) {
            overrides[w.id] = parseFloat(w.pay_multiplier);
          }
          return w;
        });
        setPayOverrides(prev => ({ ...prev, ...overrides }));
        setLockedEntries(newLocked);
        setBlockWorkers(prev => ({ ...prev, [blockId]: workers }));
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
        w.id === workerId ? { ...w, [field]: value } : w
      )
    }));
  };

  const saveBlockLogs = async (blockId) => {
    setIsSaving(prev => ({ ...prev, [blockId]: true }));
    try {
      const entries = blockWorkers[blockId].map(w => ({
        worker_id: w.id,
        units_completed: parseFloat(w.units_completed) || 0,
        area_covered: parseFloat(w.area_covered) || 0,
        work_type: w.work_type || '',
        payment_method: w.payment_method || 'Daily Wage',
        pay_multiplier: payOverrides[w.id] || 1.0
      }));
      
      const res = await apiClient.post('/crop/other-works-logs/individual', {
        date: dateStr,
        block_id: blockId,
        entries
      });
      
      if (res.success) {
        await fetchDayData();
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
      'Units Completed': b.logs?.total_units || 0,
      'Area Covered (Ac)': b.logs?.total_area || 0
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Other_Works");
    XLSX.writeFile(workbook, `OtherWorks_Log_${dateStr}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`TeaERP Pro - Other Works Intelligence Registry`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${dayLabel}`, 14, 22);
    
    const tableData = blocks.map(b => [
      b.name,
      b.area_acres || '—',
      b.assigned_pax || 0,
      b.logs?.total_units || 0,
      b.logs?.total_area || 0
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Block', 'Block Area', 'Assigned Pax', 'Units Completed', 'Area Covered']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] } // Indigo
    });

    doc.save(`OtherWorks_Log_${dateStr}.pdf`);
    setShowExportOptions(false);
  };

  // Stats
  const totalUnits = blocks.reduce((acc, b) => acc + (parseFloat(b.logs?.total_units) || 0), 0);
  const totalArea = blocks.reduce((acc, b) => acc + (parseFloat(b.logs?.total_area) || 0), 0);
  const totalAssigned = blocks.reduce((acc, b) => acc + (b.assigned_pax || 0), 0);

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
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Other Works <span className="text-indigo-600">Intelligence</span></h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              General Estate Maintenance & Muster Registry
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
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
              >
                {generatingPayroll ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
                Auto Generate Payroll
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit shadow-sm bg-white dark:bg-slate-900"
              >
                <Download size={16} /> Export
              </button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                  <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors">
                    <FileSpreadsheet size={16} /> Excel Spreadsheet
                  </button>
                  <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <FileText size={16} /> PDF Document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card bg-indigo-600 text-white border-none shadow-xl shadow-indigo-600/20 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between opacity-80">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Units Completed</p>
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter">{totalUnits.toLocaleString()} <span className="text-xs not-italic uppercase ml-1 opacity-80">Units</span></h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Area Covered</p>
            <Map size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">{totalArea.toFixed(2)} <span className="text-xs not-italic uppercase ml-1 text-slate-400">Acres</span></h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Labor Force</p>
            <Users size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">{totalAssigned} <span className="text-xs not-italic uppercase ml-1 text-slate-400">PAX Deployed</span></h3>
          </div>
        </div>

        <div className="premium-card bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-6 border border-dashed border-slate-200 dark:border-slate-700">
           {dateStr === new Date().toLocaleDateString('sv-SE') ? (
             <>
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 animate-pulse">Status: Live</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Deployment Terminal Active</p>
             </>
           ) : (
             <>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: Archived</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Historical Record View Only</p>
             </>
           )}
        </div>
      </div>

      {!isEmbedded && (
        <div className="premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all">
                <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
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
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-0.5 opacity-80">{dayLabel.split(',')[0]}</p>
                </div>
                <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-indigo-600">
                  <ChevronRight size={22} />
                </button>
              </div>
            </div>
            <div className="flex gap-8 items-center">
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Output</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-outfit text-indigo-600">{totalUnits}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Productivity Summary */}
      <div className="premium-card p-0 overflow-hidden border-indigo-500/20">
        <button
          onClick={() => setShowDailySummary(!showDailySummary)}
          className="w-full text-left px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-indigo-100/40 dark:hover:bg-indigo-900/20"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white font-outfit tracking-tight leading-none mb-1">Daily Productivity Summary</h4>
              <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase">{dailySummary.length} Active Workers</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Output</p>
              <p className="text-xl font-black text-indigo-600 font-outfit leading-none">
                {dailySummary.reduce((s, w) => s + (parseFloat(w.total_units) || 0), 0).toFixed(1)} <span className="text-[10px] uppercase opacity-60">Units</span>
              </p>
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
                    <th className="px-8 py-5 text-center">Units Completed</th>
                    <th className="px-8 py-5 text-center">Area Covered (Ac)</th>
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
                  ) : dailySummary.map((worker, idx) => (
                    <tr key={worker.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-900/30">
                            {worker.photo ? (
                              <img src={worker.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-black text-indigo-600 text-xs uppercase">{worker.first_name?.[0] || 'W'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{worker.first_name} {worker.last_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Code: {worker.worker_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-black font-outfit text-indigo-600 italic">{(parseFloat(worker.total_units) || 0).toFixed(1)} Units</span>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="text-sm font-black font-outfit text-emerald-600 italic">{(parseFloat(worker.total_area) || 0).toFixed(2)} Ac</span>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-xl">
                          <CheckCircle2 size={12} className="text-indigo-500" />
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Synchronized</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
          <div className="h-64 flex flex-col items-center justify-center gap-4 text-indigo-500">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Synchronizing Intelligence...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {blocks.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((block, idx) => {
              const isExpanded = expandedBlocks[block.id];
              const workersInBlock = blockWorkers[block.id] || [];
              
              return (
                <div key={block.id || `block-${idx}`} className="premium-card p-0 overflow-hidden group hover:border-indigo-200 transition-all duration-300">
                  <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">{block.name}</h5>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.area_acres || '—'} Acres</span>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{block.assigned_pax} Assigned</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Units Completed</p>
                        <p className="text-2xl font-black text-indigo-600 font-outfit tracking-tighter italic leading-none">{(parseFloat(block.logs?.total_units) || 0).toFixed(1)} <span className="text-[10px] not-italic text-slate-400 uppercase">Units</span></p>
                      </div>
                      <button 
                        onClick={() => toggleBlockExpand(block.id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                          isExpanded 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
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
                        <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Individual Task Performance</h6>
                        <button 
                          onClick={() => saveBlockLogs(block.id)}
                          disabled={isSaving[block.id]}
                          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            saved[block.id] ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
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
                              <th className="px-6 py-4 text-center">Units Completed</th>
                              <th className="px-6 py-4 text-center">Payment Method</th>
                              <th className="px-6 py-4 text-center">Work Type</th>
                              <th className="px-6 py-4 text-center">Pay Rate</th>
                              <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {workersInBlock.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic opacity-40">
                                  Synchronizing personnel from Smart Muster...
                                </td>
                              </tr>
                            ) : (
                              workersInBlock.map((worker, wIdx) => {
                                const isLocked = !!lockedEntries[`${block.id}_${worker.id}`];
                                return (
                                <tr key={worker.id || `worker-${wIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors group">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center overflow-hidden border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-110 transition-transform">
                                        {worker.photo ? (
                                          <img src={worker.photo} alt={worker.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                          <span className="font-black text-indigo-600 text-xs uppercase">{worker.first_name[0]}{worker.last_name?.[0] || ''}</span>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{worker.first_name} {worker.last_name}</p>
                                          {worker.worker_type === 'Contract' && (
                                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-orange-500/20">Contract</span>
                                          )}
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
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {worker.worker_id} • {worker.worker_type || 'Permanent'}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative max-w-[120px] mx-auto">
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={worker.units_completed || ''} 
                                        disabled={isLocked}
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'units_completed', e.target.value)}
                                        className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 outline-none transition-all shadow-inner disabled:opacity-50"
                                        placeholder="0"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative max-w-[150px] mx-auto">
                                      <select 
                                        value={worker.payment_method || 'Daily Wage'} 
                                        disabled={isLocked}
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'payment_method', e.target.value)}
                                        className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-indigo-500 outline-none transition-all shadow-inner disabled:opacity-50"
                                      >
                                        <option value="Daily Wage">Daily Wage</option>
                                        <option value="Piece Rate">Piece Rate</option>
                                        <option value="Task Based">Task Based</option>
                                        <option value="Contract Fix">Contract Fix</option>
                                      </select>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="relative max-w-[150px] mx-auto">
                                      <input 
                                        type="text"
                                        value={worker.work_type || ''} 
                                        disabled={isLocked}
                                        onChange={(e) => handleWorkerInputChange(block.id, worker.id, 'work_type', e.target.value)}
                                        className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest focus:border-indigo-500 outline-none transition-all shadow-inner disabled:opacity-50"
                                        placeholder="E.g. Cleaning"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <button 
                                      onClick={() => {
                                        setActiveOverrideWorker({ id: worker.id, name: `${worker.first_name} ${worker.last_name}` });
                                        setShowOverrideModal(true);
                                      }}
                                      disabled={isLocked}
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
                                    {isLocked ? (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-xl">
                                        <CheckCircle2 size={12} className="text-indigo-500" />
                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Locked</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-end gap-2">
                                        <button 
                                          onClick={() => setIndividualModal({ worker, block_id: block.id })}
                                          className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                          title="Individual Performance Detail"
                                        >
                                          <Edit2 size={14} />
                                        </button>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic pr-3">Pending</span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                              })
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
        )}
      </div>

      {/* Individual Performance Modal */}
      {individualModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
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
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Units Completed</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.units_completed || ''}
                    onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'units_completed', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Work Type / Notes</label>
                  <input 
                    type="text"
                    value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.work_type || ''}
                    disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                    onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'work_type', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white disabled:opacity-50"
                    placeholder="Describe the specific work..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Payment Method</label>
                  <select 
                    value={blockWorkers[individualModal.block_id]?.find(w => w.id === individualModal.worker.id)?.payment_method || 'Daily Wage'}
                    disabled={!!lockedEntries[`${individualModal.block_id}_${individualModal.worker.id}`]}
                    onChange={(e) => handleWorkerInputChange(individualModal.block_id, individualModal.worker.id, 'payment_method', e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white disabled:opacity-50"
                  >
                    <option value="Daily Wage">Daily Wage</option>
                    <option value="Piece Rate">Piece Rate</option>
                    <option value="Task Based">Task Based</option>
                    <option value="Contract Fix">Contract Fix</option>
                  </select>
                </div>
              </div>
              
              <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                <div className="flex items-start gap-3">
                  <Activity size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-indigo-600/80 leading-relaxed uppercase tracking-wider">
                    Data entered here will be synchronized with the main registry once committed.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIndividualModal(null)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-95"
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

export default OtherWorksIntel;
