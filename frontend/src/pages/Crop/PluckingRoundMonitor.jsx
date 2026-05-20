import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Leaf, Calendar, BarChart3, Activity, Users, Sprout,
  TrendingUp, CheckCircle2, Loader2, Target, Clock,
  ChevronLeft, ChevronRight, Save, X, AlertCircle,
  CalendarDays, MapPin, Gauge, MoreHorizontal,
  Download, FileSpreadsheet, FileText, ChevronDown
} from 'lucide-react';
import { apiClient } from "../../api/client";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLUCKING_INTERVAL_DAYS = 7;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function getDayLabel(year, month, day) {
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function PluckingRoundMonitor() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
  const [fields, setFields] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [inlineEntry, setInlineEntry] = useState(null); // { fieldId, date }
  const [inlineData, setInlineData] = useState({ pluckers: "", greenLeaf: "", acres: "" });
  const [saving, setSaving] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [resBlocks, resLogs] = await Promise.all([
          apiClient.get('/crop/blocks'),
          apiClient.get(`/crop/plucking-logs/month?year=${year}&month=${month}`)
        ]);

        if (resBlocks.success) {
          const mappedFields = resBlocks.data.map(b => ({
            id: b.id,
            name: b.name,
            acres: (Number(b.area_hectares || b.area || 0) * 2.471).toFixed(2),
            pluckings: [] // Will populate from logs
          }));

          if (resLogs.success) {
            // Group logs by block
            const logsByBlock = {};
            resLogs.data.forEach(log => {
              if (!logsByBlock[log.block_id]) logsByBlock[log.block_id] = [];
              const date = `${year}-${String(month).padStart(2, '0')}-${String(log.day).padStart(2, '0')}`;
              logsByBlock[log.block_id].push({
                date,
                day: log.day,
                pluckers: log.workers,
                greenLeaf: log.kg,
                acresCovered: Number(log.acres_covered || 0),
                pluckingAv: log.kg && log.workers ? (log.kg / log.workers).toFixed(1) : null
              });
            });

            // Assign logs to fields and calculate round numbers based on acreage
            mappedFields.forEach(f => {
              const fieldLogs = logsByBlock[f.id] || [];
              fieldLogs.sort((a, b) => a.date.localeCompare(b.date));

              let currentRound = 1;
              let roundStartDate = null;

              f.pluckings = fieldLogs.map((p, idx) => {
                if (idx === 0) {
                  roundStartDate = p.date;
                } else {
                  // If this plucking is >= 7 days from the current round start, it's a new round
                  const daysSinceStart = Math.round((new Date(p.date) - new Date(roundStartDate)) / 86400000);
                  if (daysSinceStart >= PLUCKING_INTERVAL_DAYS) {
                    currentRound++;
                    roundStartDate = p.date;
                  }
                }
                return { ...p, roundNo: currentRound };
              });
            });
          }

          setFields(mappedFields);
        }
      } catch (error) {
        console.error("Failed to load plucking data:", error);
        showToast("Error loading data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [year, month, showToast]);

  // ─── LOGIC ──────────────────────────────────────────────────────────────────
  const computeNextDue = (field, afterDate) => {
    const sorted = [...field.pluckings].sort((a, b) => a.date.localeCompare(b.date));
    const entriesBefore = sorted.filter(p => p.date <= afterDate);
    if (entriesBefore.length === 0) return null;

    const lastEntry = entriesBefore[entriesBefore.length - 1];
    const lastRoundNo = lastEntry.roundNo;

    // The first day this round started
    const firstOfRound = entriesBefore.find(p => p.roundNo === lastRoundNo);

    // Next round is due exactly 7 days after the START of the current round
    return addDays(firstOfRound.date, PLUCKING_INTERVAL_DAYS);
  };

  const getDueStatus = (field) => {
    if (field.pluckings.length === 0) return "none";
    const sorted = [...field.pluckings].sort((a, b) => a.date.localeCompare(b.date));
    const lastEntry = sorted[sorted.length - 1];
    const lastRoundNo = lastEntry.roundNo;

    // Find the first entry of the current active round
    const firstOfRound = sorted.find(p => p.roundNo === lastRoundNo);
    const next = addDays(firstOfRound.date, PLUCKING_INTERVAL_DAYS);

    const todayStr = now.toISOString().split("T")[0];
    const diff = Math.round((new Date(next) - new Date(todayStr)) / 86400000);

    if (diff < 0) return "overdue";
    if (diff <= 2) return "warn";
    return "ok";
  };

  const handleSave = async (fieldId, date) => {
    setSaving(true);
    try {
      const day = parseInt(date.split('-')[2]);
      const res = await apiClient.post('/crop/plucking-logs/entry', {
        block_id: fieldId,
        date: date,
        workers: Number(inlineData.pluckers),
        kg: Number(inlineData.greenLeaf),
        acres_covered: Number(inlineData.acres)
      });

      if (res.success) {
        // Update local state
        setFields(prev => prev.map(f => {
          if (f.id !== fieldId) return f;
          const existingIdx = f.pluckings.findIndex(p => p.date === date);
          const newEntry = {
            date,
            day,
            pluckers: Number(inlineData.pluckers),
            greenLeaf: Number(inlineData.greenLeaf),
            acresCovered: Number(inlineData.acres),
            pluckingAv: (Number(inlineData.greenLeaf) / Number(inlineData.pluckers)).toFixed(1)
          };

          let updatedPluckings;
          if (existingIdx >= 0) {
            updatedPluckings = [...f.pluckings];
            updatedPluckings[existingIdx] = { ...updatedPluckings[existingIdx], ...newEntry };
          } else {
            updatedPluckings = [...f.pluckings, newEntry].sort((a, b) => a.date.localeCompare(b.date));
          }

          // Re-calculate round numbers based on 7-day interval from start of round
          let currentRound = 1;
          let roundStartDate = null;

          updatedPluckings = updatedPluckings.map((p, idx) => {
            if (idx === 0) {
              roundStartDate = p.date;
            } else {
              const daysSinceStart = Math.round((new Date(p.date) - new Date(roundStartDate)) / 86400000);
              if (daysSinceStart >= PLUCKING_INTERVAL_DAYS) {
                currentRound++;
                roundStartDate = p.date;
              }
            }
            return { ...p, roundNo: currentRound };
          });

          return { ...f, pluckings: updatedPluckings };
        }));

        showToast("Log synchronized successfully");
        setInlineEntry(null);
        setInlineData({ pluckers: "", greenLeaf: "", acres: "" });
      }
    } catch (error) {
      console.error("Save failed:", error);
      showToast("Sync failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── EXPORT LOGIC ───────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const dataToExport = [];
    fields.forEach(f => {
      f.pluckings.forEach(p => {
        dataToExport.push({
          'Date': p.date,
          'Block': f.name,
          'Round': `R${p.roundNo}`,
          'Green Leaf (kg)': p.greenLeaf,
          'Pluckers': p.pluckers,
          'Acres Covered': p.acresCovered,
          'Efficiency (kg/pl)': p.pluckingAv
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plucking_Monitor");
    XLSX.writeFile(workbook, `Plucking_Monitor_${MONTHS[month - 1]}_${year}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text(`Plucking Round Monitor - ${MONTHS[month - 1]} ${year}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    const tableData = [];
    fields.forEach(f => {
      f.pluckings.forEach(p => {
        tableData.push([
          p.date,
          f.name,
          `R${p.roundNo}`,
          `${p.greenLeaf} kg`,
          p.pluckers,
          `${p.acresCovered} ac`,
          p.pluckingAv
        ]);
      });
    });

    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Block', 'Round', 'Green Leaf', 'Pluckers', 'Acres', 'Efficiency']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Tea Green
    });

    doc.save(`Plucking_Monitor_${MONTHS[month - 1]}_${year}.pdf`);
    setShowExportOptions(false);
  };

  // ─── DERIVED ────────────────────────────────────────────────────────────────
  const daysInMonthCount = getDaysInMonth(year, month);
  const calendarDays = Array.from({ length: daysInMonthCount }, (_, i) => i + 1);

  const stats = useMemo(() => {
    const targetFields = selectedBlockId ? fields.filter(f => f.id === selectedBlockId) : fields;
    const totalGL = targetFields.reduce((s, f) => s + f.pluckings.reduce((a, p) => a + Number(p.greenLeaf || 0), 0), 0);
    const totalWorkers = targetFields.reduce((s, f) => s + f.pluckings.reduce((a, p) => a + Number(p.pluckers || 0), 0), 0);
    const overdueCount = targetFields.filter(f => getDueStatus(f) === "overdue").length;
    const efficiency = totalWorkers > 0 ? (totalGL / totalWorkers).toFixed(1) : "0.0";

    return { totalGL, totalWorkers, overdueCount, efficiency };
  }, [fields, selectedBlockId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-tea-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse italic">Decoding Harvest Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-700 max-w-full px-2 md:px-4">

      {/* ─── PREMIUM HEADER ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
            Plucking Round <span className="text-tea-500">Monitor</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Activity size={14} className="text-tea-500" /> Operational Cycle Tracking & Master Calendar
          </p>
        </div>

        <div className="flex items-center gap-3">

          {/* Month Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-tea-200 dark:hover:border-tea-900/50 transition-all">

            <button
              onClick={() => setMonth(m => m === 1 ? (setYear(y => y - 1), 12) : m - 1)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-tea-600"
            >
              <ChevronLeft size={14} />
            </button>

            <div className="flex flex-col items-center min-w-[90px]">
              <span className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white font-outfit">
                {MONTHS[month - 1]} {year}
              </span>
            </div>

            <button
              onClick={() => setMonth(m => m === 12 ? (setYear(y => y + 1), 1) : m + 1)}
              className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-tea-600"
            >
              <ChevronRight size={14} />
            </button>

          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={13} /> Export
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-2xl z-[100] p-1.5 animate-in slide-in-from-top-2">

                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-tea-600 hover:bg-tea-50 dark:hover:bg-tea-900/20 rounded-lg transition-colors text-left"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>

                <button
                  onClick={exportToPDF}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
                >
                  <FileText size={14} /> PDF
                </button>

              </div>
            )}
          </div>

        </div>



      </div>

      {/* ─── PREMIUM ANALYTICS SUMMARY ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Monthly Harvest", val: stats.totalGL.toFixed(1), unit: "kg", icon: Sprout, color: "text-tea-500", gradient: "from-tea-500/20 to-tea-500/5" },
          { label: "Deployment Force", val: stats.totalWorkers, unit: "PAX", icon: Users, color: "text-indigo-500", gradient: "from-indigo-500/20 to-indigo-500/5" },
          { label: "Efficiency Rating", val: stats.efficiency, unit: "kg/pl", icon: Gauge, color: "text-amber-500", gradient: "from-amber-500/20 to-amber-500/5" },
          { label: "Cycle Overdue", val: stats.overdueCount, unit: "blocks", icon: AlertCircle, color: stats.overdueCount > 0 ? "text-rose-500" : "text-tea-500", gradient: stats.overdueCount > 0 ? "from-rose-500/20 to-rose-500/5" : "from-tea-500/20 to-tea-500/5" },
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

      {/* ─── ASSET SYNCHRONIZATION MONITOR ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {fields.map(f => {
          const status = getDueStatus(f);
          const lastP = f.pluckings[f.pluckings.length - 1];
          const nextDue = lastP ? addDays(lastP.date, PLUCKING_INTERVAL_DAYS) : null;

          const colorClass = status === "overdue" ? "border-rose-500/30 bg-rose-500/5 shadow-rose-500/5" : status === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-tea-500/30 bg-tea-500/5";
          const dotClass = status === "overdue" ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse" : status === "warn" ? "bg-amber-500" : "bg-tea-500";
          const textClass = status === "overdue" ? "text-rose-600" : status === "warn" ? "text-amber-600" : "text-tea-600";

          return (
            <div
              key={f.id}
              onClick={() => setSelectedBlockId(selectedBlockId === f.id ? null : f.id)}
              className={`premium-card p-2 border ${colorClass} transition-all hover:scale-[1.02] group cursor-pointer ${selectedBlockId === f.id ? 'ring-1 ring-tea-500 ring-offset-1 dark:ring-offset-slate-900 shadow-md' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h5 className="text-[11px] font-black text-slate-900 dark:text-white font-outfit tracking-tight leading-none truncate max-w-[80px]">{f.name}</h5>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{f.acres} AC</p>
                </div>
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotClass}`}></div>
              </div>

              <div className="flex justify-between items-end mt-2">
                <div className="space-y-0.5">
                  <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block leading-none">Next Due</span>
                  <span className={`text-[10px] font-black font-outfit italic tracking-tighter leading-none ${textClass}`}>
                    {nextDue ? formatDate(nextDue) : "Ready"}
                  </span>
                </div>
                <div className="text-right">
                   <p className={`text-[8px] font-black ${textClass} font-outfit italic tracking-tighter uppercase`}>
                      {status === "overdue" ? "OVERDUE" : status === "warn" ? "DUE" : "OK"}
                   </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── BLOCK-WISE 11x3 GRID ─── */}
      <div className="premium-card p-0 overflow-hidden border-none shadow-xl">
        {selectedBlockId && fields.some(f => f.id === selectedBlockId) ? (
          <>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/30 dark:bg-slate-900/10">
              {[0, 1, 2].map(colIdx => {
                const start = colIdx * 11;
                const days = calendarDays.slice(start, start + 11);
                const f = fields.find(field => field.id === selectedBlockId);

                return (
                  <div key={colIdx} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white border-b border-slate-800 shadow-sm">
                          <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest w-16">Day</th>
                          <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-center">Round</th>
                          <th className="px-3 py-2 text-[9px] font-black uppercase tracking-widest text-right w-20">Yield</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {days.map(day => {
                          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isToday = dateStr === now.toISOString().split("T")[0];
                          const dayLabel = getDayLabel(year, month, day);
                          const entry = f.pluckings.find(p => p.day === day);
                          const isDue = computeNextDue(f, addDays(dateStr, -1)) === dateStr;
                          const isInline = inlineEntry?.fieldId === f.id && inlineEntry?.date === dateStr;

                          return (
                            <tr key={day} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${entry ? 'bg-tea-500/5' : ''} ${isDue && !entry ? 'bg-amber-500/5' : ''} ${isToday ? 'bg-indigo-500/5' : ''}`}>
                              <td className="px-3 py-2">
                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-black uppercase tracking-tighter ${isToday ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {String(day).padStart(2, '0')} {dayLabel}
                                  </span>
                                  {isToday && <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none">Today</span>}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                {entry && !isInline ? (
                                  <span className={`px-1.5 py-0.5 bg-tea-500 text-white text-[8px] font-black rounded uppercase tracking-tighter italic`}>R{entry.roundNo}</span>
                                ) : isInline ? (
                                  <div className="flex items-center gap-1">
                                    <input type="number" placeholder="KG" value={inlineData.greenLeaf} onChange={e => setInlineData(d => ({ ...d, greenLeaf: e.target.value }))} className="w-10 text-[8px] p-1 border rounded" />
                                    <button onClick={() => handleSave(f.id, dateStr)} className="p-1 bg-tea-500 text-white rounded"><Save size={10} /></button>
                                  </div>
                                ) : isDue ? (
                                  <span className="text-[8px] font-black text-amber-600 uppercase">Due</span>
                                ) : <span className="text-slate-200 dark:text-slate-800 text-[10px]">—</span>}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {entry ? (
                                  <div className="flex flex-col items-end leading-none">
                                    <span className="text-[10px] font-black text-slate-900 dark:text-white font-outfit italic">{entry.greenLeaf}kg</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{entry.pluckers}PL</span>
                                  </div>
                                ) : <span className="text-slate-200 dark:text-slate-800 text-[10px]">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>

            {/* Monthly Total for Selected Block */}
            <div className="m-4 mt-2 p-5 bg-slate-950 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tea-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-tea-500/20 transition-all duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-tea-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Month Summary</p>
                </div>
                <h4 className="text-2xl font-black text-white font-outfit uppercase italic tracking-tighter leading-none">
                  {fields.find(f => f.id === selectedBlockId)?.name} <span className="text-tea-500">Total</span>
                </h4>
              </div>

              <div className="relative z-10 flex flex-wrap gap-x-12 gap-y-4">
                {[
                  { label: "Total Yield", val: fields.find(f => f.id === selectedBlockId)?.pluckings.reduce((s, p) => s + Number(p.greenLeaf || 0), 0).toFixed(1), unit: "kg", color: "text-tea-400" },
                  { label: "Total Labour", val: fields.find(f => f.id === selectedBlockId)?.pluckings.reduce((s, p) => s + Number(p.pluckers || 0), 0), unit: "PAX", color: "text-indigo-400" },
                  { label: "Avg Efficiency", val: (fields.find(f => f.id === selectedBlockId)?.pluckings.reduce((s, p) => s + Number(p.greenLeaf || 0), 0) / Math.max(1, fields.find(f => f.id === selectedBlockId)?.pluckings.reduce((s, p) => s + Number(p.pluckers || 0), 0))).toFixed(1), unit: "kg/pl", color: "text-sky-400" }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-start md:items-end">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-xl font-black ${stat.color} font-outfit italic leading-none`}>
                      {stat.val} <span className="text-[10px] not-italic text-slate-600 uppercase ml-0.5">{stat.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="p-20 text-center bg-slate-50 dark:bg-slate-900/10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase italic">No Block Selected</h3>
            <p className="text-sm text-slate-500 mt-2">Select a block from the Estate to Monitor plucking rounds.</p>
          </div>
        )}
      </div>

      {/* ─── GLOBAL TOAST ─── */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 border border-slate-700 dark:border-slate-200 glass-panel">
            <CheckCircle2 size={20} className="text-tea-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast}</span>
          </div>
        </div>
      )}

    </div>
  );
}

