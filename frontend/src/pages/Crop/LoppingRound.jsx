import React, { useState, useMemo, useEffect } from "react";
import { 
  Scissors, Calendar, BarChart3, Activity, Users,
  CheckCircle2, Target, Download, MapPin, 
  Search, ChevronRight, FileSpreadsheet, FileText, 
  ChevronDown, AlertCircle, RefreshCcw, Clock
} from 'lucide-react';
import { apiClient } from "../../api/client";
import * as XLSX from 'xlsx';

import { AGRONOMIC_CONFIG } from '../../config/agronomicConfig';

const LOPPING_INTERVAL_DAYS = AGRONOMIC_CONFIG.LOPPING.INTERVAL_DAYS;

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function LoppingRound() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [fields, setFields] = useState([]);
  const [fieldData, setFieldData] = useState({});
  const [totals, setTotals] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resBlocks, resYearLogs] = await Promise.all([
        apiClient.get('/crop/blocks'),
        apiClient.get(`/crop/lopping-logs/year?year=${year}`)
      ]);

      if (resBlocks.success) {
        const mappedFields = resBlocks.data.map(b => ({
          id: String(b.id),
          label: b.name,
          acres: (Number(b.area_hectares || 0) * 2.471).toFixed(2) + " Ac",
        }));
        setFields(mappedFields);
        if (mappedFields.length > 0 && !activeField) setActiveField(mappedFields[0].id);

        const logsByBlock = {};
        (resYearLogs.data || []).forEach(log => {
          const bId = String(log.block_id);
          if (!logsByBlock[bId]) logsByBlock[bId] = [];
          logsByBlock[bId].push(log);
        });

        const dataMap = {};
        const totalsMap = {};
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - LOPPING_INTERVAL_DAYS);

        mappedFields.forEach(f => {
          dataMap[f.id] = {};
          const logs = logsByBlock[f.id] || [];
          logs.sort((a, b) => new Date(b.date) - new Date(a.date));

          const blockAcres = parseFloat(f.acres) || 0;
          const tot = { id: f.id, area: 0, labours: 0, qty: 0, types: new Set(), latestRoundArea: 0, readinessArea: 0 };
          
          if (logs.length > 0) {
            const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
            const latestRoundLabel = logs[0].round_label || "Round 1";
            const latestRoundLogs = logs.filter(l => (l.round_label || "Round 1") === latestRoundLabel);
            const earliestDateOfLatestRound = [...latestRoundLogs].sort((a, b) => new Date(a.date) - new Date(b.date))[0].date;
            
            tot.earliestAppDate = sorted[0].date.split('T')[0];
            tot.lastAppDate = logs[0].date;
            tot.latestRoundStartDate = earliestDateOfLatestRound;
            
            const d1 = new Date(earliestDateOfLatestRound);
            d1.setDate(d1.getDate() + LOPPING_INTERVAL_DAYS);
            tot.nextDue = d1.toISOString().split('T')[0];

            const d2 = new Date(earliestDateOfLatestRound);
            d2.setDate(d2.getDate() + (LOPPING_INTERVAL_DAYS * 2));
            tot.nextNextDue = d2.toISOString().split('T')[0];

            const roundNum = parseInt(latestRoundLabel.replace('Round ', '')) || 1;
            tot.nextRoundLabel = `Round ${roundNum + 1}`;
            tot.latestRoundLabel = latestRoundLabel;
            
            logs.forEach(log => {
              const dateKey = log.date.split('T')[0];
              const logDate = new Date(log.date);
              
              dataMap[f.id][dateKey] = {
                type: log.type || 'Standard',
                round: log.round_label,
                area: Number(log.area) || 0,
                qty: Number(log.qty) || 0,
                labours: Number(log.labours) || 0
              };
              
              tot.area += Number(log.area) || 0;
              tot.qty += Number(log.qty) || 0;
              tot.labours += Number(log.labours) || 0;
              
              if (logDate >= cutoffDate) {
                tot.readinessArea += Number(log.area) || 0;
              }
              
              if (log.round_label === latestRoundLabel) {
                tot.latestRoundArea += Number(log.area) || 0;
              }
            });
            
            tot.readinessArea = Math.min(tot.readinessArea, blockAcres);
          }
          totalsMap[f.id] = tot;
        });

        setFieldData(dataMap);
        setTotals(totalsMap);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [year, month]);

  const getDueStatus = (fieldId) => {
    const tot = totals[fieldId];
    if (!tot || !tot.nextDue) return "none";
    const diff = Math.round((new Date(tot.nextDue) - now) / 86400000);
    if (diff < 0) return "overdue";
    if (diff <= 14) return "warn";
    return "ok";
  };

  const activeTotals = activeField && totals[activeField] ? totals[activeField] : { area: 0, labours: 0 };
  const activeFieldData = activeField && fieldData[activeField] ? fieldData[activeField] : {};

  const HUNDRED_TWENTY_DAYS = useMemo(() => {
    const range = [];
    const tot = totals[activeField] || {};
    const startStr = tot.earliestAppDate || `${year}-${String(month).padStart(2, '0')}-01`;
    const start = new Date(startStr);
    for (let i = 0; i < 120; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      range.push(d.toISOString().split('T')[0]);
    }
    return range;
  }, [year, month, activeField, totals]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
            Lopping Round <span className="text-rose-600">Monitor</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <RefreshCcw size={14} className="text-rose-500" />
            Shade tree management & branch lopping cycle tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={16} /> Export Data
            </button>
          </div>
        </div>
      </div>

      {/* ─── PREMIUM ANALYTICS SUMMARY ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Maintenance Readiness", 
            val: ((Object.values(totals).reduce((s,t) => s + (t.readinessArea || 0), 0) / Math.max(1, fields.reduce((s,f) => s + (parseFloat(f.acres)||0), 0))) * 100).toFixed(1), 
            unit: "%", 
            icon: Target, 
            color: "text-rose-500", 
            gradient: "from-rose-500/20 to-rose-500/5" 
          },
          { 
            label: "Yearly Coverage", 
            val: Object.values(totals).reduce((s,t) => s + (t.area || 0), 0).toFixed(1), 
            unit: "Acres", 
            icon: Activity, 
            color: "text-amber-500", 
            gradient: "from-amber-500/20 to-amber-500/5" 
          },
          { 
            label: "Labour Allocation", 
            val: (Object.values(totals).reduce((s,t) => s + (t.labours || 0), 0) / Math.max(1, fields.length)).toFixed(1), 
            unit: "pax/blk", 
            icon: Users, 
            color: "text-indigo-500", 
            gradient: "from-indigo-500/20 to-indigo-500/5" 
          },
          { 
            label: "Overdue Cycles", 
            val: fields.filter(f => getDueStatus(f.id) === 'overdue').length, 
            unit: "blocks", 
            icon: AlertCircle, 
            color: fields.filter(f => getDueStatus(f.id) === 'overdue').length > 0 ? "text-rose-500" : "text-rose-500", 
            gradient: fields.filter(f => getDueStatus(f.id) === 'overdue').length > 0 ? "from-rose-500/20 to-rose-500/5" : "from-rose-500/20 to-rose-500/5" 
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

      {/* Block-wise Summary Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <BarChart3 size={16} className="text-slate-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Field Lopping Status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fields.map(field => {
            const tot = totals[field.id] || {};
            const readinessArea = tot.readinessArea || 0;
            const totalAcres = parseFloat(field.acres) || 0;
            const status = getDueStatus(field.id);

            const colorClass = status === "overdue" ? "border-rose-500/30 bg-rose-500/5 shadow-rose-500/5" : status === "warn" ? "border-amber-500/30 bg-amber-500/5" : "border-rose-500/30 bg-rose-500/5";
            const dotClass = status === "overdue" ? "bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse" : status === "warn" ? "bg-amber-500" : "bg-rose-500";
            const textClass = status === "overdue" ? "text-rose-600" : status === "warn" ? "text-amber-600" : "text-rose-600";

            return (
              <div key={field.id} onClick={() => setActiveField(field.id)} className={`premium-card p-4 border-2 ${colorClass} transition-all hover:scale-[1.02] group cursor-pointer ${activeField === field.id ? 'ring-2 ring-rose-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="text-base font-black text-slate-900 dark:text-white font-outfit tracking-tight leading-none mb-1">{field.label}</h5>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{field.acres}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${dotClass}`}></div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Cycle</p>
                      <p className={`text-[11px] font-black font-outfit italic text-rose-600`}>
                        {tot.latestRoundLabel || "Round 1"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Next: {tot.nextRoundLabel || "Round 2"}</p>
                      <p className={`text-[11px] font-black font-outfit italic ${textClass}`}>
                        {tot.nextDue ? formatDate(tot.nextDue) : "Ready"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                      <span className="text-slate-400">Maintenance Progress</span>
                      <span className={`${readinessArea >= totalAcres && totalAcres > 0 ? 'text-emerald-500' : status === 'overdue' ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                        {totalAcres > 0 ? ((readinessArea / totalAcres) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          readinessArea >= totalAcres && totalAcres > 0 
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                            : status === 'overdue' 
                              ? 'bg-rose-500' 
                              : status === 'warn' 
                                ? 'bg-amber-500' 
                                : 'bg-rose-500'
                        }`} 
                        style={{ width: `${totalAcres > 0 ? ((readinessArea / totalAcres) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Operational Log */}
      <div className="grid grid-cols-1 gap-8">
        <div className="w-full">
          <div className="premium-card p-0 overflow-hidden border-2 border-rose-500/10">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white font-outfit leading-none mb-1">
                  {fields.find(f => f.id === activeField)?.label}
                </h2>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Lopping Application Lifecycle</p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Next Due</p>
                 <p className="text-sm font-black text-amber-600 font-outfit italic leading-none">
                   {totals[activeField]?.nextDue ? formatDate(totals[activeField].nextDue) : "Ready"} • {totals[activeField]?.nextRoundLabel || "Next Round"}
                 </p>
              </div>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/30 dark:bg-slate-900/10">
              {[0, 1, 2, 3].map(colIdx => (
                <div key={colIdx} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest w-16">Date</th>
                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Operation</th>
                        <th className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right w-16">Ac</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {HUNDRED_TWENTY_DAYS.slice(colIdx * 30, (colIdx + 1) * 30).map(dateKey => {
                        const d = new Date(dateKey);
                        const row = activeFieldData[dateKey];
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = dateKey === todayStr;
                        const isNextDue = totals[activeField]?.nextDue === dateKey;
                        
                        return (
                          <tr key={dateKey} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${row ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''} ${isNextDue ? 'ring-2 ring-inset ring-rose-500/50 bg-rose-500/5' : isToday ? 'bg-rose-500/5' : ''}`}>
                            <td className="px-3 py-2">
                               <div className="flex flex-col">
                                  <span className={`text-[10px] font-black uppercase tracking-tighter ${isNextDue ? 'text-rose-600' : isToday ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                  </span>
                                  {isToday && <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest leading-none">Today</span>}
                               </div>
                            </td>
                            <td className="px-3 py-2">
                              {row ? (
                                <div className="flex flex-col leading-none">
                                   <span className="text-[9px] font-black uppercase text-rose-600 truncate max-w-[80px]">
                                     {row.round || "Round 1"}
                                   </span>
                                   <span className="text-[8px] font-bold text-slate-400 truncate max-w-[80px]">{row.type}</span>
                                </div>
                              ) : isNextDue ? (
                                <div className="flex items-center gap-1">
                                   <Clock size={10} className="text-rose-500 animate-pulse" />
                                   <span className="text-[8px] font-black uppercase text-rose-600 italic tracking-tighter">
                                     Due {totals[activeField]?.nextRoundLabel || "Next"}
                                   </span>
                                </div>
                              ) : <span className="text-slate-200 dark:text-slate-800 text-[10px]">—</span>}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <span className={`text-[10px] font-black font-outfit ${row?.area ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-800'}`}>
                                {row?.area ? row.area.toFixed(1) : "—"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
