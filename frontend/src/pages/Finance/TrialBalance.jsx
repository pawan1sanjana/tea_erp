import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  RefreshCcw, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  Download,
  Scale,
  ChevronDown,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiClient } from '../../api/client';

const iso = (d) => d.toISOString().slice(0, 10);
const f2 = (v, d = 2) => {
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return v < 0 ? `(${s})` : s;
};

export default function TrialBalance() {
  const now = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(iso(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(iso(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
  const [monthFilter, setMonthFilter] = useState(iso(now).slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState({ data: [], totals: { debit: 0, credit: 0 } });
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportRef = useRef(null);

  const delta = Math.abs((report.totals?.debit || 0) - (report.totals?.credit || 0));
  const isBalanced = delta < 0.01;

  const load = async () => {
    setLoading(true);
    setError('');
    let queryFrom = from;
    let queryTo = to;
    
    if (monthFilter) {
      const year = parseInt(monthFilter.split('-')[0]);
      const month = parseInt(monthFilter.split('-')[1]);
      queryFrom = iso(new Date(year, month - 1, 1));
      queryTo = iso(new Date(year, month, 0));
    }

    try {
      const res = await apiClient.get(`/finance/reports/trial-balance?from=${queryFrom}&to=${queryTo}`);
      if (res.success) setReport(res);
      else setError(res.error || 'Failed to load report');
    } catch (e) {
      setError(e.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [monthFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const periodLabel = useMemo(() => {
    return monthFilter || `${from} to ${to}`;
  }, [monthFilter, from, to]);

  const exportCSV = () => {
    if (!report.data?.length) return;
    const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit', 'Balance'];
    const rows = report.data.map(r => [
      `"${r.code}"`,
      `"${r.name}"`,
      r.type.toUpperCase(),
      r.debit,
      r.credit,
      r.balance
    ]);
    const csvContent = [
      ['Report', 'Trial Balance Analysis'],
      ['Period', periodLabel],
      [],
      headers.join(','), 
      ...rows.map(r => r.join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Trial_Balance_${periodLabel.replace(/-/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
  };

  const exportPDF = () => {
    if (!report.data?.length) return;
    const doc = new jsPDF('portrait');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Trial Balance Report', 14, 15);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Period: ${periodLabel}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    autoTable(doc, {
      startY: 35,
      head: [['Code', 'Account Name', 'Type', 'Debit (LKR)', 'Credit (LKR)', 'Net Balance (LKR)']],
      body: report.data.map(r => [
        r.code,
        r.name,
        r.type.toUpperCase(),
        Number(r.debit) > 0 ? f2(r.debit) : '—',
        Number(r.credit) > 0 ? f2(r.credit) : '—',
        f2(r.balance)
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 71, 42], fontStyle: 'bold' }
    });
    
    doc.save(`Trial_Balance_${periodLabel.replace(/-/g, '_')}.pdf`);
    setShowExportOptions(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* ── Premium Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic flex items-center gap-3">
            <Scale className="text-tea-600" size={32} />
            Trial Balance Analysis
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Real-time Financial Position & Account Health Monitoring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* Combined Export Button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
            >
              <Download size={14} /> Export <ChevronDown size={12} className={`transition-transform duration-300 ${showExportOptions ? 'rotate-180' : ''}`} />
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={exportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <FileText size={16} className="text-rose-500" /> PDF Report
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download size={16} className="text-emerald-500" /> CSV Ledger
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="premium-card p-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Report Error</p>
            <p className="text-xs text-rose-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Dashboard Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Debits</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">LKR {f2(report.totals?.debit || 0)}</h3>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
        </div>
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Credits</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">LKR {f2(report.totals?.credit || 0)}</h3>
            <TrendingDown className="text-rose-500" size={20} />
          </div>
        </div>
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Ledger Discrepancy</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-black font-outfit italic ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
              LKR {f2(delta)}
            </h3>
            <AlertTriangle className={isBalanced ? "text-emerald-500/20" : "text-rose-500 animate-bounce"} size={20} />
          </div>
        </div>
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Ledger Status</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-black font-outfit italic ${isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
              {isBalanced ? "BALANCED" : "DISCREPANCY"}
            </h3>
            <CheckCircle2 className={isBalanced ? "text-emerald-500" : "text-rose-500"} size={20} />
          </div>
        </div>
      </div>

      {/* ── Filters Section ── */}
      <div className="premium-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full max-w-xs">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
              <Calendar size={12} /> Month View
            </p>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setFrom('');
                setTo('');
              }}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-tea-500 transition-colors"
            />
          </div>
          <div className="flex-1 w-full flex items-center gap-3">
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">From</p>
              <input
                type="date"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setMonthFilter(''); }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-tea-500 transition-colors"
              />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">To</p>
              <input
                type="date"
                value={to}
                onChange={(e) => { setTo(e.target.value); setMonthFilter(''); }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-tea-500 transition-colors"
              />
            </div>
          </div>
          <button
            onClick={load}
            className="px-6 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all shadow-lg shadow-tea-600/20"
          >
            Update Report
          </button>
        </div>
      </div>

      {/* ── Table Details ── */}
      <div className="premium-card overflow-hidden p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Activity size={12} className="text-tea-600" /> Account Details & Balances
          </h3>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">YTD Registry Analysis</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <table className="w-full border-collapse">
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left pl-6">Account</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Type</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Debit</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Credit</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right pr-6">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                {(report.data || []).map((r) => (
                  <tr key={r.accountId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors group">
                    <td className="px-6 py-3 pl-6">
                      <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.code} • {r.name}</p>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-[8px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${
                        r.type === 'asset' ? 'bg-blue-500/10 text-blue-500 dark:bg-blue-500/20' :
                        r.type === 'liability' ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20' :
                        r.type === 'income' ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20' :
                        r.type === 'expense' ? 'bg-rose-500/10 text-rose-500 dark:bg-rose-500/20' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-[11px] text-slate-900 dark:text-white">
                      {Number(r.debit) > 0 ? f2(r.debit) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-[11px] text-slate-900 dark:text-white">
                      {Number(r.credit) > 0 ? f2(r.credit) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-[11px] font-black text-slate-900 dark:text-white pr-6">
                      {f2(r.balance)}
                    </td>
                  </tr>
                ))}
                
                {/* ── Balanced Summary Total Row ── */}
                <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-t-2 border-slate-900 dark:border-slate-800">
                  <td className="px-6 py-3 font-black text-[10px] uppercase tracking-wider pl-6">Ledger Balance Summary</td>
                  <td></td>
                  <td className="px-6 py-3 text-right font-mono font-black text-[11px] text-slate-900 dark:text-white">{f2(report.totals?.debit || 0)}</td>
                  <td className="px-6 py-3 text-right font-mono font-black text-[11px] text-slate-900 dark:text-white">{f2(report.totals?.credit || 0)}</td>
                  <td className={`px-6 py-3 text-right font-mono font-black text-[11px] pr-6 ${isBalanced ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isBalanced ? "LKR 0.00" : `DIFF: LKR ${f2(delta)}`}
                  </td>
                </tr>

                {(report.data || []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-slate-400">
                      <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">No financial data found for this period</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
