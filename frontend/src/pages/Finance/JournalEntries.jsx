import React, { useEffect, useMemo, useState, useRef } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCcw, 
  AlertTriangle, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CreditCard, 
  HandCoins, 
  FileText, 
  Download,
  ChevronDown,
  CheckCircle2,
  Activity
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiClient } from '../../api/client';

const todayISO = () => new Date().toISOString().slice(0, 10);
const f2 = (v, d = 2) => {
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return v < 0 ? `(${s})` : s;
};

export default function JournalEntries() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportRef = useRef(null);

  const [form, setForm] = useState({
    journalDate: todayISO(),
    reference: '',
    memo: '',
    lines: [
      { accountId: '', description: '', debit: 0, credit: 0 },
      { accountId: '', description: '', debit: 0, credit: 0 },
    ],
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [aRes, jRes] = await Promise.all([
        apiClient.get('/finance/accounts'),
        apiClient.get('/finance/journals'),
      ]);
      if (aRes.success) setAccounts(aRes.data.filter(a => a.isActive));
      if (jRes.success) setJournals(jRes.data);
    } catch (e) {
      setError(e.message || 'Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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

  const totals = useMemo(() => {
    const debit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return { debit, credit, delta: Math.abs(debit - credit) };
  }, [form.lines]);

  const recentStats = useMemo(() => {
    const totalDebit = journals.reduce((sum, j) => sum + Number(j.totalDebit || 0), 0);
    const totalCredit = journals.reduce((sum, j) => sum + Number(j.totalCredit || 0), 0);
    const count = journals.length;
    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = diff < 0.01;
    return { totalDebit, totalCredit, count, isBalanced, diff };
  }, [journals]);

  const addLine = () => {
    setForm(prev => ({ ...prev, lines: [...prev.lines, { accountId: '', description: '', debit: 0, credit: 0 }] }));
  };
  const removeLine = (idx) => {
    setForm(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };
  const updateLine = (idx, patch) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l))
    }));
  };

  const applyTemplate = (type) => {
    let newLines = [];
    const cashAcct = accounts.find(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))?.id || '';
    const payableAcct = accounts.find(a => a.type === 'liability' && a.name.toLowerCase().includes('payable'))?.id || '';
    const receivableAcct = accounts.find(a => a.type === 'asset' && a.name.toLowerCase().includes('receivable'))?.id || '';

    if (type === 'expense') {
      newLines = [
        { accountId: '', description: 'Operational Expense', debit: 0, credit: 0 },
        { accountId: cashAcct, description: 'Cash/Bank Payment', debit: 0, credit: 1 },
      ];
    } else if (type === 'income') {
      newLines = [
        { accountId: cashAcct, description: 'Cash/Bank Receipt', debit: 1, credit: 0 },
        { accountId: '', description: 'Revenue / Income', debit: 0, credit: 1 },
      ];
    } else if (type === 'debt_pay') {
      newLines = [
        { accountId: '', description: 'Expense Accrual', debit: 1, credit: 0 },
        { accountId: payableAcct, description: 'Debt to Pay (Liability)', debit: 0, credit: 1 },
      ];
    } else if (type === 'debt_recover') {
      newLines = [
        { accountId: receivableAcct, description: 'Debt to Recover (Asset)', debit: 1, credit: 0 },
        { accountId: '', description: 'Revenue Accrual', debit: 0, credit: 1 },
      ];
    } else if (type === 'settle_debt') {
      newLines = [
        { accountId: payableAcct, description: 'Settle Debt (Liability)', debit: 1, credit: 0 },
        { accountId: cashAcct, description: 'Cash/Bank Payment', debit: 0, credit: 1 },
      ];
    } else if (type === 'collect_debt') {
      newLines = [
        { accountId: cashAcct, description: 'Collect Debt (Receipt)', debit: 1, credit: 0 },
        { accountId: receivableAcct, description: 'Settle Receivable (Asset)', debit: 0, credit: 1 },
      ];
    }
    
    if (newLines.length > 0) {
      setForm(prev => ({ ...prev, lines: newLines }));
    }
  };

  const save = async () => {
    setError('');
    setSaving(true);
    try {
      const cleanLines = form.lines
        .map(l => ({
          accountId: l.accountId ? Number(l.accountId) : null,
          description: l.description,
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        }))
        .filter(l => l.accountId);

      const payload = {
        journalDate: form.journalDate,
        reference: form.reference,
        memo: form.memo,
        lines: cleanLines,
      };

      const res = await apiClient.post('/finance/journals', payload);
      if (!res.success) throw new Error(res.error || 'Failed to save journal');

      setForm({
        journalDate: todayISO(),
        reference: '',
        memo: '',
        lines: [
          { accountId: '', description: '', debit: 0, credit: 0 },
          { accountId: '', description: '', debit: 0, credit: 0 },
        ],
      });
      await load();
    } catch (e) {
      setError(e.message || 'Failed to save journal');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!journals.length) return;
    const headers = ['Date', 'Reference', 'Memo', 'Debit', 'Credit'];
    const rows = journals.map(j => [
      j.journalDate,
      `"${j.reference || `J-${j.id}`}"`,
      `"${(j.memo || '').replace(/"/g, '""')}"`,
      j.totalDebit,
      j.totalCredit
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Journal_Registry_${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
  };

  const exportPDF = () => {
    if (!journals.length) return;
    const doc = new jsPDF('portrait');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text('Journal Registry Report', 14, 15);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
    
    autoTable(doc, {
      startY: 28,
      head: [['Date', 'Reference', 'Memo', 'Debit', 'Credit']],
      body: journals.map(j => [
        j.journalDate,
        j.reference || `J-${j.id}`,
        j.memo || '—',
        Number(j.totalDebit).toFixed(2),
        Number(j.totalCredit).toFixed(2)
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 71, 42], fontStyle: 'bold' }
    });
    
    doc.save(`Journal_Registry_${todayISO()}.pdf`);
    setShowExportOptions(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* ── Premium Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic flex items-center gap-3">
            <BookOpen className="text-tea-600" size={32} />
            Journal Intelligence
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Double-Entry Posting & Financial Compliance Registry
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
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Finance Error</p>
            <p className="text-xs text-rose-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ── Dashboard Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Debits logged</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">LKR {f2(recentStats.totalDebit)}</h3>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
        </div>
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Credits logged</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">LKR {f2(recentStats.totalCredit)}</h3>
            <TrendingDown className="text-rose-500" size={20} />
          </div>
        </div>
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Registry Balance Check</p>
          <div className="flex items-center justify-between">
            <h3 className={`text-xl font-black font-outfit italic ${recentStats.isBalanced ? "text-emerald-600" : "text-rose-600"}`}>
              {recentStats.isBalanced ? "BALANCED" : `DIFF: LKR ${f2(recentStats.diff)}`}
            </h3>
            <CheckCircle2 className={recentStats.isBalanced ? "text-emerald-500" : "text-rose-500"} size={20} />
          </div>
        </div>
        <div className="premium-card">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Registry Journals</p>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">{recentStats.count} Records</h3>
            <Activity className="text-tea-500" size={20} />
          </div>
        </div>
      </div>

      {/* ── Smart Templates ── */}
      <div className="premium-card p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 border-none shadow-2xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_right,rgba(16,185,129,0.08),transparent)] pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center gap-6 z-10 relative">
          <div className="flex items-center gap-3 pr-6 lg:border-r lg:border-slate-800/80 shrink-0">
            <div className="p-3 bg-tea-500/10 text-tea-400 rounded-2xl border border-tea-500/20">
              <ArrowRightLeft size={22} />
            </div>
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Smart Templates</h3>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Select to Auto-Fill Lines</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'expense', label: 'Expense (Cash)', icon: <TrendingDown size={12} />, color: 'bg-rose-500/10 hover:bg-rose-600/20 text-rose-400 hover:text-white border-rose-500/20' },
              { id: 'income', label: 'Income (Cash)', icon: <TrendingUp size={12} />, color: 'bg-emerald-500/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-white border-emerald-500/20' },
              { id: 'debt_pay', label: 'Debt to Pay', icon: <CreditCard size={12} />, color: 'bg-amber-500/10 hover:bg-amber-600/20 text-amber-400 hover:text-white border-amber-500/20' },
              { id: 'debt_recover', label: 'Debt to Recover', icon: <HandCoins size={12} />, color: 'bg-blue-500/10 hover:bg-blue-600/20 text-blue-400 hover:text-white border-blue-500/20' },
              { id: 'settle_debt', label: 'Settle Debt', icon: <CreditCard size={12} />, color: 'bg-slate-500/10 hover:bg-slate-600/20 text-slate-400 hover:text-white border-slate-500/20' },
              { id: 'collect_debt', label: 'Collect Debt', icon: <HandCoins size={12} />, color: 'bg-indigo-500/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-white border-indigo-500/20' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${t.color}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Entry Creation Form ── */}
      <div className="space-y-6">
        <div className="premium-card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Journal Date</p>
              <input
                type="date"
                value={form.journalDate}
                onChange={(e) => setForm(prev => ({ ...prev, journalDate: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-tea-500 transition-colors"
              />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Reference</p>
              <input
                value={form.reference}
                onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                placeholder="e.g. JV-001"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-tea-500 transition-colors"
              />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Memo / Description</p>
              <input
                value={form.memo}
                onChange={(e) => setForm(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="Journal entry narrative"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-tea-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── Table: Journal Lines ── */}
        <div className="premium-card overflow-hidden p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Activity size={12} className="text-tea-600" /> Journal Entry Lines
            </h3>
            <button
              onClick={addLine}
              className="px-4 py-2 rounded-xl bg-tea-600 hover:bg-tea-700 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-tea-600/20"
            >
              <Plus size={12} /> Add row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/20">
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left pl-6">Account</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Description</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-36">Debit</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-36">Credit</th>
                  <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center w-16 pr-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                {form.lines.map((l, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/30 dark:hover:bg-slate-950/20 transition-colors">
                    <td className="px-4 py-3 pl-6">
                      <select
                        value={l.accountId}
                        onChange={(e) => updateLine(idx, { accountId: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-tea-500"
                      >
                        <option value="">Select account</option>
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.code} • {a.name} ({a.type.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={l.description}
                        onChange={(e) => updateLine(idx, { description: e.target.value })}
                        placeholder="Line description"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-tea-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={l.debit || ""}
                        onChange={(e) => updateLine(idx, { debit: e.target.value, credit: 0 })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[11px] font-black text-right text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-tea-500"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={l.credit || ""}
                        onChange={(e) => updateLine(idx, { credit: e.target.value, debit: 0 })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[11px] font-black text-right text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-1 focus:ring-tea-500"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3 text-center pr-6">
                      {form.lines.length > 2 && (
                        <button
                          onClick={() => removeLine(idx)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Debit</p>
                <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{f2(totals.debit)}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Total Credit</p>
                <p className="text-sm font-black text-slate-900 dark:text-white font-mono">{f2(totals.credit)}</p>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 hidden md:block" />
              <div>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Balance Check</p>
                <p className={`text-sm font-black font-mono ${totals.delta < 0.01 ? 'text-emerald-500 animate-pulse' : 'text-amber-500'}`}>
                  {totals.delta < 0.01 ? 'BALANCED' : `DIFF: LKR ${f2(totals.delta)}`}
                </p>
              </div>
            </div>
            
            <button
              onClick={save}
              disabled={saving || totals.delta > 0.009 || totals.debit === 0}
              className="w-full md:w-auto px-8 py-3.5 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-40 flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-950/20"
            >
              <Save size={16} /> {saving ? 'Processing...' : 'Post Journal'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Table: Recent Journals Registry ── */}
      <div className="premium-card overflow-hidden p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock size={12} className="text-tea-500" /> Recent Journals Registry
          </h3>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Showing Last 15 Entries</span>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : journals.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">No financial records found in registry</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/30 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Date</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Reference</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left">Memo / Narrative</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-36">Debit</th>
                  <th className="px-6 py-3.5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-36">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                {journals.slice(0, 15).map(j => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-3 text-[11px] font-black text-slate-700 dark:text-slate-400">{j.journalDate}</td>
                    <td className="px-6 py-3 text-[11px] font-bold text-tea-600 dark:text-tea-400 uppercase tracking-tight">{j.reference || `J-${j.id}`}</td>
                    <td className="px-6 py-3 text-[11px] text-slate-500 dark:text-slate-400 italic max-w-xs truncate">{j.memo || '—'}</td>
                    <td className="px-6 py-3 text-[11px] font-black text-emerald-600 dark:text-emerald-400 text-right font-mono">{f2(j.totalDebit)}</td>
                    <td className="px-6 py-3 text-[11px] font-black text-rose-600 dark:text-rose-400 text-right font-mono">{f2(j.totalCredit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
