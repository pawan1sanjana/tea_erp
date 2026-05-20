import React, { useEffect, useMemo, useState } from 'react';
import { Landmark, Plus, Search, Save, RefreshCcw, X, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiClient } from '../../api/client';

const ACCOUNT_TYPES = [
  { id: 'asset', label: 'Asset' },
  { id: 'liability', label: 'Liability' },
  { id: 'equity', label: 'Equity' },
  { id: 'income', label: 'Income' },
  { id: 'expense', label: 'Expense' },
];

export default function ChartOfAccounts() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [newAcct, setNewAcct] = useState({ code: '', name: '', type: 'expense', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/finance/accounts');
      if (res.success) setAccounts(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = accounts;

    if (activeTab === 'income') {
      list = accounts.filter(a => a.type === 'income');
    } else if (activeTab === 'expense') {
      list = accounts.filter(a => a.type === 'expense');
    } else if (activeTab === 'balance_sheet') {
      list = accounts.filter(a => ['asset', 'liability', 'equity'].includes(a.type));
    }

    if (!q) return list;
    return list.filter(a =>
      String(a.code).toLowerCase().includes(q) ||
      String(a.name).toLowerCase().includes(q) ||
      String(a.type).toLowerCase().includes(q)
    );
  }, [accounts, query, activeTab]);

  const create = async () => {
    if (!newAcct.code || !newAcct.name || !newAcct.type) return;
    setSaving(true);
    try {
      await apiClient.post('/finance/accounts', newAcct);
      setNewAcct({ code: '', name: '', type: 'expense', isActive: true });
      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const update = async (acct) => {
    setSaving(true);
    try {
      await apiClient.put(`/finance/accounts/${acct.id}`, {
        code: acct.code,
        name: acct.name,
        type: acct.type,
        isActive: acct.isActive
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!accounts.length) return;
    const headers = ['Code', 'Name', 'Type', 'Status'];
    const rows = accounts.map(a => [
      `"${a.code}"`,
      `"${a.name}"`,
      a.type.toUpperCase(),
      a.isActive ? 'ACTIVE' : 'INACTIVE'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Chart_of_Accounts.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!accounts.length) return;
    const doc = new jsPDF('portrait');
    doc.setFontSize(14);
    doc.text(`Chart of Accounts Registry`, 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Code', 'Account Name', 'Type', 'Status']],
      body: accounts.map(a => [
        a.code,
        a.name,
        a.type.toUpperCase(),
        a.isActive ? 'Active' : 'Inactive'
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 71, 42] }
    });
    
    doc.save(`Chart_of_Accounts.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Premium Header - Smaller Version */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic uppercase">Chart of Accounts</h1>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">
            Configure Financial Ledger Structure & Accounts Registry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileText size={16} /> PDF
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} /> CSV
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 hover:bg-tea-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
          >
            <Plus size={16} /> Add Account
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="premium-card p-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="relative flex-1 w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name, type..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tea-500/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl w-full md:w-auto">
            {[
              { id: 'all', label: 'All Accounts' },
              { id: 'balance_sheet', label: 'Balance Sheet' },
              { id: 'income', label: 'Income' },
              { id: 'expense', label: 'Expense' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-tea-600 dark:text-tea-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="premium-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Accounts
          </h3>
          <span className="text-[9px] font-black bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {filtered.length} shown
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((a) => (
              <div key={a.id} className="p-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <input
                  className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  value={a.code}
                  onChange={(e) => setAccounts(prev => prev.map(x => x.id === a.id ? { ...x, code: e.target.value } : x))}
                />
                <input
                  className="md:col-span-5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                  value={a.name}
                  onChange={(e) => setAccounts(prev => prev.map(x => x.id === a.id ? { ...x, name: e.target.value } : x))}
                />
                <div className="md:col-span-3 flex items-center gap-3">
                  <select
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                    value={a.type}
                    onChange={(e) => setAccounts(prev => prev.map(x => x.id === a.id ? { ...x, type: e.target.value } : x))}
                  >
                    {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <span className={`w-2 h-2 rounded-full ${
                    a.type === 'income' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                    a.type === 'expense' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                    'bg-slate-400'
                  }`} />
                </div>
                <div className="md:col-span-1 flex items-center justify-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(a.isActive)}
                      onChange={(e) => setAccounts(prev => prev.map(x => x.id === a.id ? { ...x, isActive: e.target.checked } : x))}
                    />
                    Active
                  </label>
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <button
                    onClick={() => update(a)}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-10 text-center text-slate-400">
                <p className="text-[10px] uppercase tracking-widest font-bold opacity-60">No accounts match your search</p>
              </div>
            )}
          </div>
        )}
      </div>
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-7 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-tea-500/10 text-tea-600 rounded-2xl">
                  <Plus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">New Account</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Chart of Accounts Registry</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl">
                <X size={22} />
              </button>
            </div>

            <div className="p-7 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Code</label>
                <input
                  value={newAcct.code}
                  onChange={(e) => setNewAcct(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. 5100"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Name</label>
                <input
                  value={newAcct.name}
                  onChange={(e) => setNewAcct(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Electricity Expense"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Account Type</label>
                <select
                  value={newAcct.type}
                  onChange={(e) => setNewAcct(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                >
                  {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              <button
                onClick={create}
                disabled={saving || !newAcct.code || !newAcct.name}
                className="w-full mt-4 py-4 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-tea-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save size={18} /> {saving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

