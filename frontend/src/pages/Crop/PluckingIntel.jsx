import React, { useState, useEffect, useCallback } from 'react';
import {
  Download, FileSpreadsheet, FileText, ChevronDown, Calendar, RefreshCcw, Banknote, CheckCircle,
  Settings, TrendingUp, Activity, Users, User, X, ChevronLeft, ChevronRight, Loader2, Save, CheckCircle2,
  Sprout, Layers, AlertCircle, BadgePercent
} from 'lucide-react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DEFAULT_INTERVALS = [
  { id: 'morning', label: 'Morning', time: '06:00 – 09:00', active: true },
  { id: 'midday', label: 'Midday', time: '09:00 – 12:00', active: true },
  { id: 'afternoon', label: 'Afternoon', time: '12:00 – 15:00', active: true },
  { id: 'evening', label: 'Evening', time: '15:00 – 18:00', active: true },
];

function pad(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function PluckingIntel() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [intervals, setIntervals] = useState(DEFAULT_INTERVALS);
  const [showSettings, setShowSettings] = useState(false);
  const [inputs, setInputs] = useState({}); // { blockId_intervalId: { kg, workers } }
  const [individualModal, setIndividualModal] = useState(null); // { block, iv, workers }
  const [expandedBlocks, setExpandedBlocks] = useState({}); // { blockId: boolean }
  const [lockedWeights, setLockedWeights] = useState({}); // { 'blockId_workerId_intervalLabel': true }
  const [blockWorkers, setBlockWorkers] = useState({}); // { blockId: [ { id, first_name, weights: { ... } } ] }
  const [savingIndividual, setSavingIndividual] = useState(false);
  const [savingBlockWeights, setSavingBlockWeights] = useState({}); // { blockId: boolean }
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [payOverrides, setPayOverrides] = useState({});
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [activeOverrideWorker, setActiveOverrideWorker] = useState(null);

  const dateStr = fmtDate(selectedDate);
  const isToday = dateStr === fmtDate(new Date());

  const activeIntervals = intervals.filter(iv => iv.active);

  const [dailySummary, setDailySummary] = useState([]);
  const [showDailySummary, setShowDailySummary] = useState(false);

  const fetchDayData = useCallback(async (date) => {
    setLoading(true);
    try {
      const y = parseInt(date.split('-')[0]);
      const m = parseInt(date.split('-')[1]);
      const d = parseInt(date.split('-')[2]);

      const [resLogs, resSummary] = await Promise.all([
        apiClient.get(`/crop/plucking-logs?date=${date}`),
        apiClient.get(`/crop/plucker-performance?year=${y}&month=${m}&day=${d}`)
      ]);

      if (resLogs.success) {
        const newInputs = {};
        resLogs.data.forEach(b => {
          intervals.forEach(iv => {
            const key = `${b.block_id}_${iv.id}`;
            const log = b.logs?.[iv.label];
            newInputs[key] = {
              kg: log ? String(log.green_leaf_kg) : '',
              workers: log ? String(log.worker_count) : String(b.assigned_workers || 0),
              saved: !!log,
            };
          });
        });
        setInputs(newInputs);
        setBlocks(resLogs.data);
      }

      if (resSummary.success) {
        setDailySummary(resSummary.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [intervals]);

  useEffect(() => { fetchDayData(dateStr); }, [dateStr]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const setInput = (blockId, ivId, field, value) => {
    const key = `${blockId}_${ivId}`;
    setInputs(p => ({ ...p, [key]: { ...p[key], [field]: value, saved: false } }));
  };

  const saveEntry = async (block, iv) => {
    const key = `${block.block_id}_${iv.id}`;
    const entry = inputs[key] || {};
    const kg = parseFloat(entry.kg) || 0;
    const workers = parseInt(entry.workers) || 0;
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await apiClient.post('/crop/plucking-logs', {
        block_id: block.block_id,
        log_date: dateStr,
        interval_label: iv.label,
        green_leaf_kg: kg,
        worker_count: workers,
      });
      setInputs(p => ({ ...p, [key]: { ...p[key], saved: true } }));
      setSaved(p => ({ ...p, [key]: true }));
      setTimeout(() => setSaved(p => { const n = { ...p }; delete n[key]; return n; }), 2500);
    } catch (e) { console.error(e); }
    finally { setSaving(p => ({ ...p, [key]: false })); }
  };

  const openIndividualModal = async (block, iv) => {
    try {
      const res = await apiClient.get(`/crop/plucking-logs/assigned-workers?date=${dateStr}&block_id=${block.block_id}&interval_label=${iv.label}`);
      if (res.success) {
        // Track which weights were already present (locked)
        const newLocked = { ...lockedWeights };
        res.data.forEach(w => {
          if (w.kg > 0) {
            newLocked[`${block.block_id}_${w.id}_${iv.label}`] = true;
          }
        });
        setLockedWeights(newLocked);
        setIndividualModal({ block, iv, workers: res.data });
      }
    } catch (e) { console.error(e); }
  };

  const saveIndividual = async () => {
    if (!individualModal) return;
    setSavingIndividual(true);
    try {
      const res = await apiClient.post('/crop/plucking-logs/individual', {
        date: dateStr,
        block_id: individualModal.block.block_id,
        interval_label: individualModal.iv.label,
        entries: individualModal.workers.map(w => ({ worker_id: w.id, kg: parseFloat(w.kg) || 0 }))
      });

      if (res.success) {
        // Lock these records
        const newLocked = { ...lockedWeights };
        individualModal.workers.forEach(w => {
          if (parseFloat(w.kg) > 0) {
            newLocked[`${individualModal.block.block_id}_${w.id}_${individualModal.iv.label}`] = true;
          }
        });
        setLockedWeights(newLocked);

        // Update main inputs with the new total
        const key = `${individualModal.block.block_id}_${individualModal.iv.id}`;
        setInputs(p => ({
          ...p,
          [key]: {
            ...p[key],
            kg: String(res.totalKg),
            workers: String(individualModal.workers.length),
            saved: true
          }
        }));
        setIndividualModal(null);
        setSaved(p => ({ ...p, [key]: true }));
        setTimeout(() => setSaved(p => { const n = { ...p }; delete n[key]; return n; }), 2500);
      }
    } catch (e) { console.error(e); }
    finally { setSavingIndividual(false); }
  };

  const toggleBlockExpand = async (blockId) => {
    const isExpanded = !!expandedBlocks[blockId];
    setExpandedBlocks(p => ({ ...p, [blockId]: !isExpanded }));

    if (!isExpanded && !blockWorkers[blockId]) {
      // Fetch workers if not already fetched
      try {
        const res = await apiClient.get(`/crop/plucking-logs/block-workers-full?date=${dateStr}&block_id=${blockId}`);
        if (res.success) {
          // Identify locked weights
          const newLocked = { ...lockedWeights };
          const overrides = {};
          res.data.forEach(w => {
            Object.entries(w.weights || {}).forEach(([ivLabel, kg]) => {
              if (parseFloat(kg) > 0) {
                newLocked[`${blockId}_${w.id}_${ivLabel}`] = true;
              }
            });
            if (w.pay_multiplier && parseFloat(w.pay_multiplier) !== 1.0) {
              overrides[w.id] = parseFloat(w.pay_multiplier);
            }
          });
          setPayOverrides(prev => ({ ...prev, ...overrides }));
          setLockedWeights(newLocked);
          setBlockWorkers(p => ({ ...p, [blockId]: res.data }));
        }
      } catch (e) { console.error(e); }
    }
  };

  const setWorkerWeight = (blockId, workerId, intervalLabel, value) => {
    setBlockWorkers(p => ({
      ...p,
      [blockId]: p[blockId].map(w =>
        w.id === workerId
          ? { ...w, weights: { ...w.weights, [intervalLabel]: value } }
          : w
      )
    }));
  };

  const saveBlockWeights = async (blockId) => {
    setSavingBlockWeights(p => ({ ...p, [blockId]: true }));
    try {
      const workers = blockWorkers[blockId].map(w => ({
        ...w,
        pay_multiplier: payOverrides[w.id] || 1.0
      }));
      const res = await apiClient.post('/crop/plucking-logs/block-workers-save', {
        date: dateStr,
        block_id: blockId,
        workerWeights: workers
      });
      if (res.success) {
        // Lock all entries that were saved
        const newLocked = { ...lockedWeights };
        workers.forEach(w => {
          Object.entries(w.weights || {}).forEach(([ivLabel, kg]) => {
            if (parseFloat(kg) > 0) {
              newLocked[`${blockId}_${w.id}_${ivLabel}`] = true;
            }
          });
        });
        setLockedWeights(newLocked);

        // Refresh day data to update totals
        fetchDayData(dateStr);
        setSaved(p => ({ ...p, [`block_${blockId}`]: true }));
        setTimeout(() => setSaved(p => { const n = { ...p }; delete n[`block_${blockId}`]; return n; }), 2500);
      }
    } catch (e) { console.error(e); }
    finally { setSavingBlockWeights(p => ({ ...p, [blockId]: false })); }
  };
  const [generatingPayroll, setGeneratingPayroll] = useState(false);
  const autoGeneratePayroll = async () => {
    setGeneratingPayroll(true);
    try {
      const [y, m, d] = dateStr.split('-');
      const perfRes = await apiClient.get(`/crop/plucker-performance?year=${y}&month=${m}&day=${d}`);

      if (!perfRes.success || !perfRes.data) {
        alert('Failed to fetch plucking performance data.');
        setGeneratingPayroll(false);
        return;
      }

      const musterRes = await apiClient.get(`/workforce/attendance-today?date=${dateStr}`);
      if (!musterRes.success || !musterRes.data) {
        alert('Failed to fetch attendance data.');
        setGeneratingPayroll(false);
        return;
      }

      const pluckingMuster = musterRes.data.filter(w => w.task === 'Plucking');
      if (pluckingMuster.length === 0) {
        alert('No plucking muster found for this date.');
        setGeneratingPayroll(false);
        return;
      }

      const perfMap = {};
      perfRes.data.forEach(p => {
        perfMap[p.id] = parseFloat(p.total_kg) || 0;
      });

      const baseWage = 1400;
      const target = 18;
      const rate = 45;

      const entries = pluckingMuster.map(w => {
        const kg = perfMap[w.worker_internal_id] || 0;
        const multiplier = payOverrides[w.worker_internal_id] || 1.0;
        const isOverride = multiplier !== 1.0;

        let wage, bonus, over, eligible;
        if (isOverride) {
          wage = Math.round(baseWage * multiplier);
          bonus = 0;
          over = 0;
          eligible = multiplier >= 1.0;
        } else {
          over = Math.max(0, kg - target);
          bonus = over * rate;
          eligible = kg >= target;
          wage = eligible ? baseWage + bonus : Math.round((kg / target) * baseWage);
        }

        return {
          worker_id: w.worker_internal_id,
          worker_epf: w.worker_id,
          worker_name: `${w.first_name} ${w.last_name}`,
          task: 'Plucking',
          kg: kg,
          over_kg: over,
          bonus: bonus,
          wage: wage,
          eligible: eligible,
          pay_multiplier: multiplier
        };
      });

      const totalValue = entries.reduce((s, e) => s + e.kg, 0);
      const totalWage = entries.reduce((s, e) => s + e.wage, 0);

      await apiClient.post('/crop/payroll-batch', {
        batch_date: dateStr,
        task_type: 'Plucking',
        base_wage: baseWage,
        target_kg: target,
        bonus_rate: rate,
        total_wage: totalWage,
        total_kg: totalValue,
        qualified_workers: entries.filter(e => e.eligible).length,
        override_workers: entries.filter(e => e.pay_multiplier !== 1.0).length,
        entries
      });

      alert('Plucking Payroll generated and synchronized successfully.');
    } catch (e) { console.error(e); }
    finally { setGeneratingPayroll(false); }
  };
  const exportToExcel = () => {
    const dataToExport = blocks.map(b => ({
      'Block Name': b.block_name,
      'Area (Ac)': b.area_acres || '—',
      'Assigned': b.assigned_workers || 0,
      'Morning (kg)': inputs[`${b.block_id}_morning`]?.kg || '0',
      'Midday (kg)': inputs[`${b.block_id}_midday`]?.kg || '0',
      'Afternoon (kg)': inputs[`${b.block_id}_afternoon`]?.kg || '0',
      'Evening (kg)': inputs[`${b.block_id}_evening`]?.kg || '0',
      'Total (kg)': intervals.reduce((s, iv) => s + (parseFloat(inputs[`${b.block_id}_${iv.id}`]?.kg) || 0), 0)
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily_Plucking");
    XLSX.writeFile(workbook, `Plucking_Log_${dateStr}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text(`TeaERP Pro - Plucking Intelligence Registry`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date: ${dayLabel}`, 14, 22);

    const tableData = blocks.map(b => [
      b.block_name,
      b.assigned_workers || 0,
      inputs[`${b.block_id}_morning`]?.kg || '0',
      inputs[`${b.block_id}_midday`]?.kg || '0',
      inputs[`${b.block_id}_afternoon`]?.kg || '0',
      inputs[`${b.block_id}_evening`]?.kg || '0',
      intervals.reduce((s, iv) => s + (parseFloat(inputs[`${b.block_id}_${iv.id}`]?.kg) || 0), 0).toFixed(1)
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Block', 'Pax', 'Morning', 'Midday', 'Afternoon', 'Evening', 'Total (kg)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [39, 139, 84] }
    });

    doc.save(`Plucking_Log_${dateStr}.pdf`);
    setShowExportOptions(false);
  };

  const PayMultiplierModal = () => {
    if (!showOverrideModal || !activeOverrideWorker) return null;
    const multipliers = [
      { label: 'Standard', val: 1.0, color: 'slate' },
      { label: '½ Pay', val: 0.5, color: 'amber' },
      { label: '1.5x Pay', val: 1.5, color: 'tea' },
      { label: 'Double Pay', val: 2.0, color: 'rose' },
    ];
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
          <div className="p-6 bg-tea-50 dark:bg-tea-900/20 border-b border-tea-100 dark:border-tea-900/30 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-tea-500/15 flex items-center justify-center">
              <Banknote size={24} className="text-tea-600" />
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
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all group ${(payOverrides[activeOverrideWorker.id] || 1.0) === opt.val
                      ? `bg-${opt.color}-500/10 border-${opt.color}-500 shadow-lg shadow-${opt.color}-500/10`
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                    }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${(payOverrides[activeOverrideWorker.id] || 1.0) === opt.val ? `text-${opt.color}-600` : 'text-slate-400'
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

  const dayLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const totalKgToday = blocks.reduce((s, b) => {
    return s + activeIntervals.reduce((si, iv) => {
      const v = parseFloat(inputs[`${b.block_id}_${iv.id}`]?.kg) || 0;
      return si + v;
    }, 0);
  }, 0);
  const totalWorkersToday = blocks.reduce((s, b) => {
    const maxW = activeIntervals.length > 0
      ? Math.max(...activeIntervals.map(iv => parseInt(inputs[`${b.block_id}_${iv.id}`]?.workers) || 0))
      : 0;
    return s + maxW;
  }, 0);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Plucking Intelligence</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Precision Yield Analytics & Lifecycle Registry
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
            onClick={() => {/* Trigger Payroll Generation Logic if exists or standard logic */ }}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
          >
            <Banknote size={16} />
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
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-tea-600 hover:bg-tea-50 dark:hover:bg-tea-900/20 rounded-xl transition-colors">
                  <FileSpreadsheet size={16} /> Excel Spreadsheet
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
            <Settings size={16} /> Configure System
          </button>
        </div>
      </div>

      {/* Interval Config Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowSettings(false)}
          />
          <div className="premium-card w-full max-w-sm relative z-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-400 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-tea-50 dark:bg-tea-900/30 rounded-2xl">
                  <Settings size={18} className="text-tea-500 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-none">Harvesting Config</h2>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Daily Intervals</p>
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
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Active Weighing Intervals</label>
                <div className="grid grid-cols-1 gap-2">
                  {intervals.map(iv => (
                    <button
                      key={iv.id}
                      onClick={() => {
                        setIntervals(prev => prev.map(item =>
                          item.id === iv.id ? { ...item, active: !item.active } : item
                        ));
                      }}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all ${iv.active
                          ? 'bg-tea-500/10 border-tea-500 text-tea-600 dark:text-tea-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400'
                        }`}
                    >
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest">{iv.label}</p>
                        <p className="text-[8px] font-bold opacity-60 uppercase">{iv.time}</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${iv.active ? 'bg-tea-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${iv.active ? 'left-6' : 'left-1'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-2 flex gap-3">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-wider">
                  Disabling an interval will hide it from the registry and analytics for this session.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-3 bg-tea-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-tea-700 transition-all shadow-xl shadow-tea-600/20 active:scale-95"
            >
              Update Configuration
            </button>
          </div>
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card bg-tea-600 text-white border-none shadow-xl shadow-tea-600/20 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between opacity-80">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Green Leaf</p>
            <TrendingUp size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter">
              {totalKgToday.toLocaleString()} <span className="text-xs not-italic uppercase ml-1 opacity-80">KG Collected</span>
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
              {(totalKgToday / (totalWorkersToday || 1)).toFixed(1)} <span className="text-xs not-italic uppercase ml-1 text-slate-400">Avg KG/PAX</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <p className="text-[10px] font-black uppercase tracking-widest">Workforce Today</p>
            <Users size={20} />
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">
              {totalWorkersToday} <span className="text-xs not-italic uppercase ml-1 text-slate-400">PAX Deployed</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-center items-center p-6 border border-dashed border-slate-200 dark:border-slate-700">
          {isToday ? (
            <>
              <p className="text-[10px] font-black text-tea-500 uppercase tracking-widest mb-1 animate-pulse">Status: Live</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Live Harvesting Terminal Active</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status: Archived</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Historical Record View Only</p>
            </>
          )}
        </div>
      </div>

      {/* Date Navigator (Removed Tabs) */}

      {/* ── DAY ENTRY ── */}
      <div className="space-y-6">
        {/* Simplified Date Navigator */}
        <div className="premium-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-tea-200 dark:hover:border-tea-900/50 transition-all">
                <button onClick={() => changeDate(-1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-tea-600">
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
                  <p className="text-[9px] font-black text-tea-500 uppercase tracking-[0.2em] mt-0.5 opacity-80">{dayLabel.split(',')[0]}</p>
                </div>

                <button onClick={() => changeDate(1)} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-tea-600">
                  <ChevronRight size={22} />
                </button>
              </div>
              {!isToday && (
                <button onClick={() => setSelectedDate(new Date())} className="px-4 py-2.5 bg-tea-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-tea-600 transition-all shadow-lg shadow-tea-500/20">
                  Back to Today
                </button>
              )}
            </div>

            <div className="flex gap-8 items-center">
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Yield</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-outfit text-tea-600">{totalKgToday.toFixed(1)}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">kg</span>
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800"></div>
              <div className="flex flex-col items-end">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Muster</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-outfit text-slate-900 dark:text-white">{totalWorkersToday}</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase">PAX</span>
                </div>
              </div>
            </div>
          </div>
          {!isToday && (
            <div className="mt-3 py-2 px-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 rounded-xl flex items-center gap-2 justify-center">
              <Settings size={12} className="text-amber-500 animate-pulse" />
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-[0.1em]">Archived Record: Data entry restricted to current day only</span>
            </div>
          )}
        </div>

        {/* Interval Legend */}
        <div className="flex flex-wrap gap-2">
          {activeIntervals.map((iv, i) => (
            <div key={iv.id} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className={`w-2 h-2 rounded-full ${['bg-amber-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400'][i]}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{iv.label}</span>
              <span className="text-[9px] font-bold text-slate-400">{iv.time}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-tea-500">
            <Loader2 className="animate-spin" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Loading muster assignments...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Daily Worker Performance Summary Card */}
            <div className="premium-card p-0 overflow-hidden border-indigo-500/20 shadow-indigo-500/5">
              <button
                onClick={() => setShowDailySummary(!showDailySummary)}
                className="w-full text-left px-8 py-6 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">Daily Productivity Summary</h5>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global individual worker output across all blocks</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                    <Activity size={14} className="text-indigo-500" />
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">{dailySummary.length} Active Workers</span>
                  </div>
                  <div className={`p-2 rounded-lg transition-transform duration-300 ${showDailySummary ? 'rotate-180 bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <ChevronDown size={18} className="text-indigo-500" />
                  </div>
                </div>
              </button>

              {showDailySummary && (
                <div className="p-0 overflow-x-auto animate-in slide-in-from-top duration-300">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-3">Worker Profile</th>
                        {activeIntervals.map(iv => <th key={iv.id} className="px-2 py-3 text-center">{iv.label}</th>)}
                        <th className="px-4 py-3 text-right">Daily Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/20">
                      {dailySummary.length === 0 ? (
                        <tr>
                          <td colSpan={activeIntervals.length + 2} className="px-8 py-12 text-center">
                            <div className="flex flex-col items-center gap-2 opacity-40">
                              <Users size={32} />
                              <p className="text-[10px] font-black uppercase tracking-widest">No plucking performance recorded for this date</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dailySummary.map(w => {
                          const morningVal = parseFloat(w.morning_kg) || 0;
                          const middayVal = parseFloat(w.midday_kg) || 0;
                          const afternoonVal = parseFloat(w.afternoon_kg) || 0;
                          const eveningVal = parseFloat(w.evening_kg) || 0;
                          const totalVal = parseFloat(w.total_kg) || 0;

                          const photoUrl = w.photo
                            ? (w.photo.startsWith('data:') ? w.photo : `/api/uploads/${w.photo}`)
                            : null;

                          const firstName = w.first_name || 'Worker';
                          const lastName = w.last_name || `#${w.id}`;
                          const initials = (firstName[0] || '?') + (lastName[0] || '?');

                          return (
                            <tr key={w.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/5 transition-colors">
                              <td className="px-4 py-2">
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
                              {activeIntervals.map(iv => {
                                let val = 0;
                                if (iv.id === 'morning') val = morningVal;
                                else if (iv.id === 'midday') val = middayVal;
                                else if (iv.id === 'afternoon') val = afternoonVal;
                                else if (iv.id === 'evening') val = eveningVal;

                                return (
                                  <td key={iv.id} className="px-2 py-2 text-center">
                                    <span className={`text-xs font-black ${val > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                                      {val.toFixed(1)}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className="px-4 py-2 text-right">
                                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-outfit italic">{totalVal.toFixed(1)} kg</span>
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

            {/* Original Block Sections */}
            {blocks.filter(b => (b.assigned_workers || 0) > 0).length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Layers size={32} className="text-slate-300" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No blocks have workers assigned for plucking on this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.filter(b => (b.assigned_workers || 0) > 0).map(block => {
                  const blockTotal = activeIntervals.reduce((s, iv) => s + (parseFloat(inputs[`${block.block_id}_${iv.id}`]?.kg) || 0), 0);
                  const assignedWorkers = block.assigned_workers || 0;
                  return (
                    <div key={block.block_id} className="premium-card p-0 overflow-hidden">
                      {/* Block Header */}
                      <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-tea-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                            <Sprout size={20} className="text-tea-600 dark:text-tea-400" />
                          </div>
                          <div>
                            <h5 className="font-black text-slate-900 dark:text-white text-lg font-outfit tracking-tight leading-none mb-1.5">{block.block_name}</h5>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{block.area_acres ? `${parseFloat(block.area_acres).toFixed(2)} Acres` : 'Area N/A'}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{assignedWorkers} Assigned</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Harvested</p>
                            <p className="text-2xl font-black text-tea-600 dark:text-tea-400 font-outfit tracking-tighter italic leading-none">{blockTotal.toFixed(1)} <span className="text-[10px] not-italic text-slate-400 uppercase">kg</span></p>
                          </div>
                          <button
                            onClick={() => toggleBlockExpand(block.block_id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${expandedBlocks[block.block_id]
                              ? 'bg-tea-600 text-white shadow-lg shadow-tea-600/20'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                              }`}>
                            {expandedBlocks[block.block_id] ? <User size={14} /> : <Users size={14} />}
                            {expandedBlocks[block.block_id] ? 'Hide Workers' : 'View Workers'}
                            <ChevronLeft size={14} className={`transition-transform duration-300 ${expandedBlocks[block.block_id] ? '-rotate-90' : '-rotate-90'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Individual Entry Section */}
                      {expandedBlocks[block.block_id] && (
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top duration-300">
                          <div className="flex items-center justify-between mb-4">
                            <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Individual Worker Performance</h6>
                            <button
                              onClick={() => saveBlockWeights(block.block_id)}
                              disabled={savingBlockWeights[block.block_id]}
                              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${saved[`block_${block.block_id}`] ? 'bg-emerald-500 text-white' : 'bg-tea-600 text-white hover:bg-tea-700 shadow-lg shadow-tea-600/20'
                                }`}>
                              {savingBlockWeights[block.block_id] ? <Loader2 size={12} className="animate-spin" /> : saved[`block_${block.block_id}`] ? <CheckCircle2 size={12} /> : <Save size={12} />}
                              {savingBlockWeights[block.block_id] ? 'Committing...' : saved[`block_${block.block_id}`] ? 'Committed' : 'Commit All Weights'}
                            </button>
                          </div>

                          {!blockWorkers[block.block_id] ? (
                            <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin text-tea-500 opacity-50" /></div>
                          ) : blockWorkers[block.block_id].length === 0 ? (
                            <div className="py-8 text-center text-[10px] font-black text-slate-400 uppercase italic">No workers assigned to this block today</div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-900/50">
                                  <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-4 py-3">Worker Profile</th>
                                    {activeIntervals.map(iv => <th key={iv.id} className="px-2 py-3 text-center">{iv.label}</th>)}
                                    <th className="px-4 py-3 text-center">Pay Rate</th>
                                    <th className="px-4 py-3 text-right">Block Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {blockWorkers[block.block_id].map(worker => {
                                    const rowTotal = activeIntervals.reduce((s, iv) => s + (parseFloat(worker.weights[iv.label]) || 0), 0);
                                    return (
                                      <tr key={worker.id} className="hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                        <td className="px-4 py-2">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200/50 dark:border-slate-600/50 group-hover:scale-110 transition-transform">
                                              {worker.photo ? (
                                                <img src={worker.photo} alt={worker.first_name} className="w-full h-full object-cover" />
                                              ) : (
                                                <span className="text-[10px] font-black text-slate-500 uppercase">{worker.first_name[0]}{worker.last_name[0]}</span>
                                              )}
                                            </div>

                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{worker.first_name} {worker.last_name}</p>
                                                {(payOverrides[worker.id] || 1.0) !== 1.0 && (
                                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[8px] font-black uppercase tracking-widest ${payOverrides[worker.id] < 1
                                                      ? 'bg-amber-500/15 border-amber-400/30 text-amber-600'
                                                      : 'bg-tea-500/15 border-tea-400/30 text-tea-600'
                                                    }`}>
                                                    <BadgePercent size={9} /> {payOverrides[worker.id]}x Pay
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Employee ID: {worker.id}</p>
                                            </div>
                                          </div>
                                        </td>
                                        {activeIntervals.map(iv => (
                                          <td key={iv.id} className="px-2 py-2">
                                            <div className="relative max-w-[80px] mx-auto">
                                              <input
                                                type="number" step="0.1"
                                                value={worker.weights[iv.label] || ''}
                                                disabled={!isToday || lockedWeights[`${block.block_id}_${worker.id}_${iv.label}`]}
                                                onChange={(e) => setWorkerWeight(block.block_id, worker.id, iv.label, e.target.value)}
                                                className="w-full text-center py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:border-tea-500 focus:ring-2 focus:ring-tea-200 dark:focus:ring-tea-900/30 outline-none transition-all shadow-sm disabled:opacity-40 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                                                placeholder="0.0"
                                              />
                                            </div>
                                          </td>
                                        ))}
                                        <td className="px-4 py-2 text-center">
                                          <button
                                            onClick={() => {
                                              setActiveOverrideWorker({ id: worker.id, name: `${worker.first_name} ${worker.last_name}` });
                                              setShowOverrideModal(true);
                                            }}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${(payOverrides[worker.id] || 1.0) !== 1.0
                                                ? 'bg-tea-600 text-white border-tea-600 shadow-md shadow-tea-600/25 hover:bg-tea-700'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-tea-400 hover:text-tea-600'
                                              }`}
                                          >
                                            <Banknote size={11} />
                                            {(payOverrides[worker.id] || 1.0) !== 1.0 ? `${(payOverrides[worker.id] || 1.0)}x` : 'Std'}
                                          </button>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            <p className="text-sm font-black text-slate-900 dark:text-white font-outfit">{rowTotal.toFixed(1)} <span className="text-[10px] text-slate-400 uppercase">kg</span></p>
                                          </div>
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

                      {/* Interval Rows */}
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeIntervals.length > 2 ? 'xl:grid-cols-4' : 'xl:grid-cols-2'} divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800`}>
                        {activeIntervals.map((iv, i) => {
                          const key = `${block.block_id}_${iv.id}`;
                          const entry = inputs[key] || { kg: '', workers: String(assignedWorkers) };
                          const isSaving = saving[key];
                          const isSaved = saved[key];
                          const dotColors = ['bg-amber-400', 'bg-sky-400', 'bg-emerald-400', 'bg-violet-400'];
                          return (
                            <div key={iv.id} className="p-5 space-y-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${dotColors[i]}`}></div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{iv.label}</p>
                                  <p className="text-[9px] font-bold text-slate-400">{iv.time}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Green Leaf (kg)</label>
                                    <span className="text-[8px] font-black text-tea-600 bg-tea-50 dark:bg-tea-900/30 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Automatic</span>
                                  </div>
                                  <div className="relative group">
                                    <input type="text" readOnly
                                      value={entry.kg ? `${parseFloat(entry.kg).toFixed(1)}` : '0.0'}
                                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-black text-slate-900 dark:text-white outline-none cursor-default transition-all" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      <TrendingUp size={14} className="text-tea-500 opacity-50" />
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Active Pluckers</label>
                                  <div className="relative">
                                    <input type="text" readOnly
                                      value={entry.workers || '0'}
                                      className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 outline-none cursor-default" />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                      <Users size={14} className="text-slate-400 opacity-50" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Individual Entry Modal */}
      {individualModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic flex items-center gap-2">
                  <User size={20} className="text-tea-500" /> Individual Plucking
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {individualModal.block.block_name} · {individualModal.iv.label}
                </p>
              </div>
              <button onClick={() => setIndividualModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {individualModal.workers.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Users size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No pluckers assigned in muster</p>
                </div>
              ) : (
                individualModal.workers.map((worker, idx) => (
                  <div key={worker.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl group hover:border-tea-500/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-tea-500/10 flex items-center justify-center overflow-hidden border border-tea-100 dark:border-tea-900/30">
                        {worker.photo ? (
                          <img src={worker.photo} alt={worker.first_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-black text-tea-600 uppercase">{worker.first_name[0]}{worker.last_name[0]}</span>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase">{worker.first_name} {worker.last_name}</p>
                        <p className="text-[9px] font-bold text-slate-400">#{worker.worker_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setActiveOverrideWorker({ id: worker.id, name: `${worker.first_name} ${worker.last_name}` });
                          setShowOverrideModal(true);
                        }}
                        className={`p-2.5 rounded-xl transition-all ${(payOverrides[worker.id] || 1.0) !== 1.0
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        title="Manual Pay Rate Override"
                      >
                        <Banknote size={16} />
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={worker.kg || ''}
                        disabled={!isToday || lockedWeights[`${individualModal.block.block_id}_${worker.id}_${individualModal.iv.label}`]}
                        onChange={(e) => {
                          const val = e.target.value;
                          setIndividualModal(p => ({
                            ...p,
                            workers: p.workers.map((w, i) => i === idx ? { ...w, kg: val } : w)
                          }));
                        }}
                        className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-right text-sm font-black text-tea-600 outline-none focus:ring-2 focus:ring-tea-500/20 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50"
                        placeholder="0.0"
                      />
                      <span className="text-[10px] font-black text-slate-400 uppercase">kg</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col gap-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total for interval</span>
                <span className="text-xl font-black text-tea-600 font-outfit italic">
                  {individualModal.workers.reduce((s, w) => s + (parseFloat(w.kg) || 0), 0).toFixed(1)} kg
                </span>
              </div>
              <button
                onClick={saveIndividual}
                disabled={savingIndividual || individualModal.workers.length === 0 || !isToday}
                className="w-full py-4 bg-tea-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-tea-500/30 hover:bg-tea-600 transition-all disabled:opacity-40">
                {savingIndividual ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingIndividual ? 'Processing...' : 'Commit Individual Records'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PayMultiplierModal />
    </div>
  );
}
