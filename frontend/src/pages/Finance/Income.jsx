import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Plus, RefreshCcw, AlertTriangle, Wallet, Search, Download, FileText, ChevronLeft, ChevronRight, User } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiClient } from '../../api/client';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function Income() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [income, setIncome] = useState([]);
  const [query, setQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(todayISO().slice(0, 7));
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [form, setForm] = useState({
    incomeDate: todayISO(),
    customer: '',
    category: '',
    amount: '',
    paymentMethod: 'Cash',
    reference: '',
    notes: '',
    incomeAccountId: '',
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [aRes, iRes] = await Promise.all([
        apiClient.get('/finance/accounts'),
        apiClient.get('/finance/income'),
      ]);
      if (aRes.success) {
        setAccounts(aRes.data.filter(a => a.isActive && a.type === 'income'));
        // Preselect first income account if exists
        const firstIncome = aRes.data.find(a => a.type === 'income');
        if (firstIncome && !form.incomeAccountId) {
          setForm(prev => ({ ...prev, incomeAccountId: String(firstIncome.id) }));
        }
      }
      if (iRes.success) setIncome(iRes.data);
    } catch (e) {
      setError(e.message || 'Failed to load income');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = income;
    if (monthFilter) {
      result = result.filter(i => i.incomeDate && i.incomeDate.startsWith(monthFilter));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter(i =>
        String(i.customer || '').toLowerCase().includes(q) ||
        String(i.category || '').toLowerCase().includes(q) ||
        String(i.reference || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [income, query, monthFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, monthFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalShown = filtered.reduce((s, i) => s + Number(i.amount || 0), 0);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        incomeAccountId: Number(form.incomeAccountId),
      };
      const res = await apiClient.post('/finance/income', payload);
      if (!res.success) throw new Error(res.error || 'Failed to save income');
      setForm(prev => ({
        ...prev,
        incomeDate: todayISO(),
        customer: '',
        category: '',
        amount: '',
        reference: '',
        notes: '',
      }));
      await load();
      setShowForm(false);
    } catch (e) {
      setError(e.message || 'Failed to save income');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Date', 'Customer', 'Category', 'Code', 'Account Code', 'Account Name', 'Amount'];
    const rows = filtered.map(i => [
      i.incomeDate ? i.incomeDate.slice(0, 10) : '',
      `"${(i.customer || '').replace(/"/g, '""')}"`,
      `"${(i.category || '').replace(/"/g, '""')}"`,
      `"${(i.reference || '').replace(/"/g, '""')}"`,
      `"${(i.incomeAccountCode || '').replace(/"/g, '""')}"`,
      `"${(i.incomeAccountName || '').replace(/"/g, '""')}"`,
      i.amount
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Income_Export_${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!filtered.length) return;
    const doc = new jsPDF('portrait');
    doc.setFontSize(14);
    doc.text(`Income Report (${todayISO()})`, 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Customer', 'Category', 'Code', 'Account', 'Amount']],
      body: filtered.map(i => [
        i.incomeDate ? i.incomeDate.slice(0, 10) : '—',
        i.customer || '—',
        i.category || '—',
        i.reference || '—',
        i.incomeAccountCode ? `${i.incomeAccountCode} ${i.incomeAccountName}` : '—',
        Number(i.amount).toFixed(2)
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 71, 42] }
    });
    
    doc.save(`Income_Report_${todayISO()}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Income Intelligence</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Capture Revenue Streams & Automated Journaling
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
          >
            <Plus size={16} /> Add Income
          </button>

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText size={16} /> PDF
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> CSV
          </button>

          <button
            onClick={load}
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCcw size={16} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="premium-card p-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Income Error</p>
            <p className="text-xs text-rose-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div className="premium-card p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1">
              <div className="relative w-full max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer, category, reference..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tea-500/30"
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <p className="text-[9px] font-black uppercase text-slate-400 whitespace-nowrap ml-2">Month View:</p>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-tea-500/30"
                />
                {monthFilter && (
                  <button onClick={() => setMonthFilter('')} className="text-[10px] uppercase font-bold text-slate-400 hover:text-rose-500 whitespace-nowrap px-2">
                    All
                  </button>
                )}
              </div>
            </div>
            <div className="text-right w-full md:w-auto">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Income (shown)</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">+{totalShown.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="premium-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Income Registry
            </h3>
            <span className="text-[9px] font-black bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {filtered.length} items
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">No income records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer / Category</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Account</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedData.map(i => (
                    <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="py-3 px-6 text-[11px] font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {i.incomeDate ? i.incomeDate.slice(0, 10) : '—'}
                      </td>
                      <td className="py-3 px-6">
                        <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{i.customer || '—'}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{i.category || 'Income'}</p>
                      </td>
                      <td className="py-3 px-6 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                        {i.reference || '—'}
                      </td>
                      <td className="py-3 px-6 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        {i.incomeAccountCode ? `${i.incomeAccountCode} ${i.incomeAccountName}` : '—'}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className="text-[11px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors inline-block">
                          {Number(i.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filtered.length > 0 && !loading && (
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
              <p className="text-xs font-bold text-slate-500">
                Showing <span className="text-slate-900 dark:text-white">{filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="text-slate-900 dark:text-white">{filtered.length}</span> entries
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            currentPage === page 
                              ? 'bg-tea-600 text-white shadow-md shadow-tea-600/20' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-slate-400 text-xs px-1">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-tea-600" /> New Income Record
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date</p>
                  <input
                    type="date"
                    value={form.incomeDate}
                    onChange={(e) => setForm(prev => ({ ...prev, incomeDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Amount</p>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Income Account</p>
                  <select
                    value={form.incomeAccountId}
                    onChange={(e) => setForm(prev => ({ ...prev, incomeAccountId: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="">Select income account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} • {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Customer / Payer</p>
                  <input
                    value={form.customer}
                    onChange={(e) => setForm(prev => ({ ...prev, customer: e.target.value }))}
                    placeholder="Customer name"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Category</p>
                  <input
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Tea Sale, Fertilizer, etc."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Payment Method</p>
                  <input
                    value={form.paymentMethod}
                    onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    placeholder="Cash / Bank / Cheque"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reference Number</p>
                  <input
                    value={form.reference}
                    onChange={(e) => setForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="e.g. INV-1001"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notes</p>
                  <input
                    value={form.notes}
                    onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Optional notes"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button
                onClick={save}
                disabled={saving || !form.incomeAccountId || !form.amount}
                className="mt-6 w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-tea-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                <Wallet size={18} /> {saving ? 'Saving...' : 'Record Income'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
