import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Leaf, BarChart3, Users, ChevronLeft, ChevronRight, Activity, Clock,
  Save, CheckCircle2, CheckCircle, Settings, Loader2, TrendingUp, Layers, User, X,
  Download, FileSpreadsheet, FileText, ChevronDown, Droplets, FlaskConical,
  Scale, Beaker, AlertTriangle, Package, RefreshCcw, Banknote, BadgePercent
} from 'lucide-react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Constants ───────────────────────────────────────────────────────────────

const MANURE_TYPES = [
  { id: 't65',  label: 'T65',  unit: 'kg', color: 'bg-sky-400',     hex: '#38bdf8' },
  { id: 't200', label: 'T200', unit: 'kg', color: 'bg-amber-500',   hex: '#f59e0b' },
  { id: 't750', label: 'T750', unit: 'kg', color: 'bg-emerald-400', hex: '#34d399' },
  { id: 'u709', label: 'U709', unit: 'kg', color: 'bg-violet-400',  hex: '#a78bfa' },
  { id: 'u834', label: 'U834', unit: 'kg', color: 'bg-rose-400',    hex: '#fb7185' },
];

const APPLICATION_METHODS = ['Broadcast', 'Ring', 'Band', 'Foliar'];
const APPLICATION_ROUNDS  = [
  { id: 'round_1', label: 'Round 1', target: '06:00 – 10:00', active: true },
  { id: 'round_2', label: 'Round 2', target: '10:00 – 13:00', active: true },
  { id: 'round_3', label: 'Round 3', target: '13:00 – 16:00', active: false },
];

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ManureIntel = () => {
  const [selectedDate, setSelectedDate]       = useState(new Date());
  const [blocks, setBlocks]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [saving, setSaving]                   = useState({});
  const [saved, setSaved]                     = useState({});
  const [rounds, setRounds]                   = useState(APPLICATION_ROUNDS);
  const [inputs, setInputs]                   = useState({});
  const [expandedBlocks, setExpandedBlocks]   = useState({});
  const [blockWorkers, setBlockWorkers]       = useState({});
  const [savingBlock, setSavingBlock]         = useState({});
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [workerModal, setWorkerModal]         = useState(null);
  const [savingWorker, setSavingWorker]       = useState(false);
  const [lockedEntries, setLockedEntries]     = useState({});
  const [dailySummary, setDailySummary]       = useState([]);
  const [showDailySummary, setShowDailySummary] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('Round 1');
  const [payOverrides, setPayOverrides] = useState({});
  const [payOverrideModal, setPayOverrideModal] = useState(null); // { worker, block_id }

  const dateStr  = fmtDate(selectedDate);
  const isToday  = dateStr === fmtDate(new Date());
  const activeRounds = rounds.filter(r => r.active);
  const dayLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ─── Data fetch ──────────────────────────────────────────────────────────

  const fetchDailyPerformance = async (date) => {
    try {
      const [y, m, d] = date.split('-');
      const res = await apiClient.get(`/crop/manure-performance?year=${y}&month=${m}&day=${d}`);
      if (res.success) setDailySummary(res.data);
    } catch (e) { console.error('Fetch manure performance error:', e); }
  };

  const fetchDayData = useCallback(async (date) => {
    setLoading(true);
    try {
      const [logsRes] = await Promise.all([
        apiClient.get(`/crop/manure-logs?date=${date}`),
        fetchDailyPerformance(date),
      ]);
      if (logsRes.success) {
        const newInputs = {};
        logsRes.data.forEach(b => {
          rounds.forEach(r => {
            MANURE_TYPES.forEach(mt => {
              const key  = `${b.block_id}_${r.id}_${mt.id}`;
              const log  = b.logs?.[r.label]?.[mt.id];
              newInputs[key] = {
                qty:    log ? String(log.qty_kg) : '',
                method: log ? log.method : 'Broadcast',
                saved:  !!log,
              };
            });
          });
        });
        setInputs(newInputs);
        setBlocks(logsRes.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [rounds]);

  useEffect(() => { fetchDayData(dateStr); }, [dateStr]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const setInput = (blockId, roundId, manureId, field, value) => {
    const key = `${blockId}_${roundId}_${manureId}`;
    setInputs(p => ({ ...p, [key]: { ...p[key], [field]: value, saved: false } }));
  };

  const flashSaved = (key) => {
    setSaved(p => ({ ...p, [key]: true }));
    setTimeout(() => setSaved(p => { const n = { ...p }; delete n[key]; return n; }), 2500);
  };

  // ─── Save single entry ───────────────────────────────────────────────────

  const saveEntry = async (block, round, manureType) => {
    const key   = `${block.block_id}_${round.id}_${manureType.id}`;
    const entry = inputs[key] || {};
    const qty   = parseFloat(entry.qty) || 0;
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await apiClient.post('/crop/manure-logs', {
        block_id:      block.block_id,
        log_date:      dateStr,
        round_label:   round.label,
        manure_type:   manureType.id,
        qty_kg:        qty,
        method:        entry.method || 'Broadcast',
      });
      setInputs(p => ({ ...p, [key]: { ...p[key], saved: true } }));
      flashSaved(key);
    } catch (e) { console.error(e); }
    finally { setSaving(p => ({ ...p, [key]: false })); }
  };

  // ─── Worker expand ───────────────────────────────────────────────────────

  const toggleBlockExpand = async (blockId) => {
    const isOpen = !!expandedBlocks[blockId];
    setExpandedBlocks(p => ({ ...p, [blockId]: !isOpen }));
    if (!isOpen && !blockWorkers[blockId]) {
      try {
        const res = await apiClient.get(`/crop/manure-logs/block-workers?date=${dateStr}&block_id=${blockId}`);
        if (res.success) {
          const newLocked = { ...lockedEntries };
          const overrides = {};
          const workers = res.data.map(w => {
            let entry = { type: 't65', qty: '', area: '' };
            let isLocked = false;
            if (w.weights) {
              for (const key of Object.keys(w.weights)) {
                if (w.weights[key] && w.weights[key].qty) {
                  const parts = key.split('_');
                  const mt = parts[parts.length - 1];
                  entry = { type: mt, qty: w.weights[key].qty, area: w.weights[key].area || '' };
                  isLocked = true;
                  break;
                }
              }
            }
            if (isLocked) newLocked[`${blockId}_${w.id}`] = true;
            if (w.pay_multiplier && parseFloat(w.pay_multiplier) !== 1.0) {
              overrides[w.id] = parseFloat(w.pay_multiplier);
            }
            return { ...w, entry };
          });
          setPayOverrides(prev => ({ ...prev, ...overrides }));
          setLockedEntries(newLocked);
          setBlockWorkers(p => ({ ...p, [blockId]: workers }));
        }
      } catch (e) { console.error(e); }
    }
  };

  const setWorkerEntry = (blockId, workerId, field, value) => {
    setBlockWorkers(p => ({
      ...p,
      [blockId]: p[blockId].map(w =>
        w.id === workerId
          ? { ...w, entry: { ...w.entry, [field]: value } }
          : w
      )
    }));
  };

  const saveBlockWorkers = async (blockId) => {
    setSavingBlock(p => ({ ...p, [blockId]: true }));
    try {
      const payloadWorkers = blockWorkers[blockId].map(w => ({
        id: w.id,
        weights: {
          [`${selectedCycle}_${w.entry.type}`]: { qty: w.entry.qty, area: w.entry.area }
        },
        pay_multiplier: payOverrides[w.id] || 1.0
      }));
      const res = await apiClient.post('/crop/manure-logs/block-workers-save', {
        date:          dateStr,
        block_id:      blockId,
        workerWeights: payloadWorkers,
      });
      if (res.success) {
        await fetchDayData(dateStr);
        // Re-fetch workers to apply locks on newly committed records
        setBlockWorkers(p => { const n = { ...p }; delete n[blockId]; return n; });
        flashSaved(`block_${blockId}`);
      }
    } catch (e) { console.error(e); }
    finally { setSavingBlock(p => ({ ...p, [blockId]: false })); }
  };
  const setMultiplier = (workerId, multiplier) => {
    setPayOverrides(prev => {
      const next = { ...prev };
      if (multiplier === 1.0) {
        delete next[workerId];
      } else {
        next[multiplier] = multiplier; // Wait, workerId is the key
        next[workerId] = multiplier;
      }
      return next;
    });
    setPayOverrideModal(null);
  };

  // ─── Totals ──────────────────────────────────────────────────────────────

  const blockTotal = (blockId) =>
    activeRounds.reduce((s, r) =>
      s + MANURE_TYPES.reduce((si, mt) =>
        si + (parseFloat(inputs[`${blockId}_${r.id}_${mt.id}`]?.qty) || 0), 0), 0);

  const grandTotal = blocks.reduce((s, b) => s + blockTotal(b.block_id), 0);
  const totalWorkers = blocks.reduce((s, b) => s + (b.assigned_workers || 0), 0);

  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const autoGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const [y, m, d] = dateStr.split('-');
      const perfRes = await apiClient.get(`/crop/manure-performance?year=${y}&month=${m}&day=${d}`);
      
      if (!perfRes.success || !perfRes.data) {
        alert('Failed to fetch manure performance data.');
        setGeneratingPayroll(false);
        return;
      }
      
      const musterRes = await apiClient.get(`/workforce/attendance-today?date=${dateStr}`);
      if (!musterRes.success || !musterRes.data) {
         alert('Failed to fetch attendance data.');
         setGeneratingPayroll(false);
         return;
      }

      const manureMuster = musterRes.data.filter(w => w.task === 'Manure');
      if (manureMuster.length === 0) {
        alert('No manure muster found for this date.');
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

      const entries = manureMuster.map(w => {
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
          task: 'Manure',
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

      await apiClient.post('/crop/payroll-batch', {
        batch_date: dateStr,
        task_type: 'Manure',
        base_wage: baseWage,
        target_acres: target,
        bonus_rate: rate,
        total_wage: totalWage,
        total_area: totalValue,
        qualified_workers: entries.filter(e => e.eligible).length,
        override_workers: entries.filter(e => e.pay_multiplier !== 1.0).length,
        entries
      });

      alert('Manure Payroll generated and synchronized successfully.');
    } catch (e) { console.error(e); }
    finally { setGeneratingPayroll(false); }
  };

  // ─── Export ──────────────────────────────────────────────────────────────

  const exportToExcel = () => {
    const rows = [];
    blocks.forEach(b => {
      activeRounds.forEach(r => {
        MANURE_TYPES.forEach(mt => {
          const key = `${b.block_id}_${r.id}_${mt.id}`;
          rows.push({
            'Block':        b.block_name,
            'Area (Ac)':    b.area_acres || '—',
            'Round':        r.label,
            'Manure Type':  mt.label,
            'Qty (kg)':     inputs[key]?.qty || '0',
            'Method':       inputs[key]?.method || '—',
          });
        });
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Manure_Log');
    XLSX.writeFile(wb, `Manure_Log_${dateStr}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text('TeaERP Pro – Manure Application Registry', 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${dayLabel}`, 14, 22);
    const body = blocks.map(b => [
      b.block_name,
      b.assigned_workers || 0,
      ...activeRounds.map(r =>
        MANURE_TYPES.map(mt =>
          inputs[`${b.block_id}_${r.id}_${mt.id}`]?.qty || '0'
        ).join(' / ')
      ),
      blockTotal(b.block_id).toFixed(1),
    ]);
    autoTable(doc, {
      startY:     30,
      head:       [['Block', 'PAX', ...activeRounds.map(r => r.label), 'Total (kg)']],
      body,
      theme:      'grid',
      headStyles: { fillColor: [99, 102, 241] },
    });
  doc.save(`Manure_Log_${dateStr}.pdf`);
    setShowExportOptions(false);
  };

  const PayMultiplierModal = () => {
    if (!payOverrideModal) return null;
    const multipliers = [
      { label: 'Standard', val: 1.0, color: 'slate' },
      { label: '½ Pay', val: 0.5, color: 'amber' },
      { label: '1.5x Pay', val: 1.5, color: 'sky' },
      { label: 'Double Pay', val: 2.0, color: 'emerald' },
    ];
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center">
              <Banknote size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Pay Rate Override</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Personnel: {payOverrideModal.worker.name}
              </p>
            </div>
            <button onClick={() => setPayOverrideModal(null)} className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {multipliers.map(m => (
                <button
                  key={m.val}
                  onClick={() => setMultiplier(payOverrideModal.worker.id, m.val)}
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all group ${
                    (payOverrides[payOverrideModal.worker.id] || 1.0) === m.val
                      ? `bg-${m.color}-500/10 border-${m.color}-500 shadow-lg shadow-${m.color}-500/10`
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    (payOverrides[payOverrideModal.worker.id] || 1.0) === m.val ? `text-${m.color}-600` : 'text-slate-400'
                  }`}>{m.label}</span>
                  <span className={`text-xl font-black font-outfit ${(payOverrides[payOverrideModal.worker.id] || 1.0) === m.val ? `text-${m.color}-600` : 'text-slate-900 dark:text-white'}`}>
                    {m.val}x
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
              onClick={() => setPayOverrideModal(null)}
              className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  const location = useLocation();

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Manure Intelligence</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Precision Nutrient Application & Muster Registry
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
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
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
      <div className="space-y-6">

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card bg-emerald-600 text-white border-none shadow-xl shadow-emerald-600/20 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between opacity-80">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Application</p>
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter">
              {grandTotal.toLocaleString()} <span className="text-xs not-italic uppercase ml-1 opacity-80">KG Applied</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Efficiency Rate</p>
            <Activity size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">
              {(grandTotal / (totalWorkers || 1)).toFixed(1)} <span className="text-xs not-italic uppercase ml-1 text-slate-400">Avg KG/PAX</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Workforce Force</p>
            <Users size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">
              {totalWorkers} <span className="text-xs not-italic uppercase ml-1 text-slate-400">PAX Deployed</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-6 border border-dashed border-slate-200 dark:border-slate-700">
           {isToday ? (
             <>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 animate-pulse">Status: Live</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Application Terminal Active</p>
             </>
           ) : (
             <>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: Archived</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Historical Record View Only</p>
             </>
           )}
        </div>
      </div>

        {/* Manure Type Legend */}
        <div className="flex flex-wrap gap-2">
          {MANURE_TYPES.map(mt => (
            <div key={mt.id} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className={`w-2 h-2 rounded-full ${mt.color}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{mt.label}</span>
              <span className="text-[9px] font-bold text-slate-400">{mt.unit}</span>
            </div>
          ))}
        </div>

        {/* Daily Productivity Summary */}
        <div className="premium-card p-0 overflow-hidden border-indigo-500/20 shadow-indigo-500/5">
          <button
            onClick={() => setShowDailySummary(!showDailySummary)}
            className="w-full text-left px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <TrendingUp size={24} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white font-outfit tracking-tight leading-none mb-1">Daily Productivity Summary</h4>
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">{dailySummary.length} Active Workers</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Applied</p>
                <p className="text-xl font-black text-indigo-600 font-outfit leading-none">
                  {dailySummary.reduce((s, w) => s + (parseFloat(w.total_qty) || 0), 0).toFixed(1)} <span className="text-[10px] uppercase opacity-60">kg</span>
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
                      <th className="px-8 py-5 text-center">Total Applied (kg)</th>
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
                          <span className="text-sm font-black font-outfit text-indigo-600 italic">{(parseFloat(worker.total_qty) || 0).toFixed(1)} kg</span>
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

        {/* Block List */}
        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-indigo-500">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Loading block assignments...</p>
          </div>
        ) : blocks.filter(b => (b.assigned_workers || 0) > 0).length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
            <Package size={32} className="text-slate-300" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No blocks have workers assigned for manure application on this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.filter(b => (b.assigned_workers || 0) > 0).map(block => {
              const bTotal         = blockTotal(block.block_id);
              const assignedWorkers = block.assigned_workers || 0;

              return (
                <div key={block.block_id} className="premium-card p-0 overflow-hidden">

                  {/* Block Header */}
                  <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <Leaf size={20} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">{block.block_name}</h5>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {block.area_acres ? `${parseFloat(block.area_acres).toFixed(2)} Acres` : 'Area N/A'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{assignedWorkers} Assigned</span>
                          {block.fertilizer_types && block.fertilizer_types.length > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <div className="flex flex-wrap gap-1">
                                {block.fertilizer_types.map(ft => {
                                  const mt = MANURE_TYPES.find(m => m.id === ft);
                                  return mt ? (
                                    <span key={ft} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white ${mt.color}`}>
                                      {mt.label}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            </>
                          )}
                          {block.total_covered_area > 0 && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                {parseFloat(block.total_covered_area).toFixed(2)} Ac Covered
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Applied</p>
                        <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-outfit tracking-tighter italic leading-none">
                          {bTotal.toFixed(1)} <span className="text-[10px] not-italic text-slate-400 uppercase">kg</span>
                        </p>
                      </div>
                      <button
                        onClick={() => toggleBlockExpand(block.block_id)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${
                          expandedBlocks[block.block_id]
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {expandedBlocks[block.block_id] ? <User size={14} /> : <Users size={14} />}
                        {expandedBlocks[block.block_id] ? 'Hide Workers' : 'View Workers'}
                      </button>
                    </div>
                  </div>

                  {/* ── Expandable Worker Table ── */}
                  {expandedBlocks[block.block_id] && (
                    <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Individual Worker Contributions</h6>
                        <button
                          onClick={() => saveBlockWorkers(block.block_id)}
                          disabled={savingBlock[block.block_id]}
                          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            saved[`block_${block.block_id}`]
                              ? 'bg-emerald-500 text-white'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                          }`}
                        >
                          {savingBlock[block.block_id] ? <Loader2 size={12} className="animate-spin" /> : saved[`block_${block.block_id}`] ? <CheckCircle2 size={12} /> : <Save size={12} />}
                          {savingBlock[block.block_id] ? 'Committing...' : saved[`block_${block.block_id}`] ? 'Committed' : 'Commit All'}
                        </button>
                      </div>

                      {!blockWorkers[block.block_id] ? (
                        <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin text-indigo-500 opacity-50" /></div>
                      ) : blockWorkers[block.block_id].length === 0 ? (
                        <div className="py-8 text-center text-[10px] font-black text-slate-400 uppercase italic">No workers assigned to this block today</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4">Worker Profile</th>
                                <th className="px-6 py-4">Fertilizer Type</th>
                                <th className="px-6 py-4 text-center">Amount (kg)</th>
                                <th className="px-6 py-4 text-center">Covered Area (Acres)</th>
                                <th className="px-6 py-4 text-center">Pay Rate</th>
                                <th className="px-6 py-4 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {blockWorkers[block.block_id].map(worker => {
                                return (
                                  <tr key={worker.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm shrink-0 overflow-hidden">
                                          {worker.photo ? (
                                            <img
                                              src={worker.photo.startsWith('data:') ? worker.photo : `/api/uploads/${worker.photo}`}
                                              alt={worker.first_name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-[10px] font-black text-indigo-600 uppercase">
                                              {worker.first_name[0]}{worker.last_name[0]}
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{worker.first_name} {worker.last_name}</p>
                                            {payOverrides[worker.id] && (
                                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                payOverrides[worker.id] < 1 
                                                  ? 'bg-amber-500/15 border-amber-400/30 text-amber-600' 
                                                  : 'bg-indigo-500/15 border-indigo-400/30 text-indigo-600'
                                              }`}>
                                                <BadgePercent size={9} /> {payOverrides[worker.id]}x Pay
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {worker.worker_code || worker.id}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <select
                                        value={worker.entry?.type || 't65'}
                                        disabled={!isToday || !!lockedEntries[`${block.block_id}_${worker.id}`]}
                                        onChange={e => setWorkerEntry(block.block_id, worker.id, 'type', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-black text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 disabled:opacity-50"
                                      >
                                        {MANURE_TYPES.map(mt => (
                                          <option key={mt.id} value={mt.id}>{mt.label}</option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="relative max-w-[100px] mx-auto">
                                        <input
                                          type="number" step="0.1" min="0"
                                          value={worker.entry?.qty || ''}
                                          disabled={!isToday || !!lockedEntries[`${block.block_id}_${worker.id}`]}
                                          onChange={e => setWorkerEntry(block.block_id, worker.id, 'qty', e.target.value)}
                                          className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 outline-none transition-all shadow-sm disabled:opacity-40"
                                          placeholder="0.0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">kg</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="relative max-w-[100px] mx-auto">
                                        <input
                                          type="number" step="0.1" min="0"
                                          value={worker.entry?.area || ''}
                                          disabled={!isToday || !!lockedEntries[`${block.block_id}_${worker.id}`]}
                                          onChange={e => setWorkerEntry(block.block_id, worker.id, 'area', e.target.value)}
                                          className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/30 outline-none transition-all shadow-sm disabled:opacity-40"
                                          placeholder="0.0"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">Ac</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                      <button
                                        onClick={() => setPayOverrideModal({ worker: { id: worker.id, name: `${worker.first_name} ${worker.last_name}` }, block_id: block.block_id })}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                          payOverrides[worker.id]
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 hover:bg-indigo-700'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'
                                        }`}
                                      >
                                        <Banknote size={11} />
                                        {payOverrides[worker.id] ? `${payOverrides[worker.id]}x` : 'Std'}
                                      </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      {!!lockedEntries[`${block.block_id}_${worker.id}`] ? (
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-xl">
                                          <CheckCircle2 size={12} className="text-indigo-500" />
                                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Locked</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-end gap-2">
                                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Pending</span>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}


                </div>
              );
            })}
          </div>
        )}
      </div>
      <PayMultiplierModal />
    </div>
  );
};

export default ManureIntel;
