import React, { useState, useEffect, useMemo } from 'react';
import {
  Banknote, Factory, CheckCircle2, Package,
  AlertCircle, Plus, X, Save, RefreshCcw, Search,
  FileText, Scale, Wallet, ArrowDownToLine, Sprout, Download
} from 'lucide-react';
import { apiClient } from '../../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const todayISO = () => new Date().toISOString().slice(0, 10);

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  partial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export default function LeafIncome() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState(todayISO().slice(0, 7));
  const [viewType, setViewType] = useState('month'); // 'month' or 'year'
  const [yearFilter, setYearFilter] = useState(todayISO().slice(0, 4));

  /* Intake summary pulled from factory_intake_logs */
  const [intakeSummary, setIntakeSummary] = useState({ totalEarnings: 0, totalNet: 0 });

  const [form, setForm] = useState({
    paymentDate: todayISO(),
    periodFrom: '',
    periodTo: '',
    ratePerKg: '',
    totalKg: '',
    grossEarnings: '',
    teaAdvance: '',
    fertilizerAdvance: '',
    otherDeductions: '',
    deductions: '',
    netPayable: '',
    amountPaid: '',
    paymentMode: 'Bank Transfer',
    referenceNo: '',
    status: 'pending',
    remarks: '',
  });

  /* ─── loaders ─── */
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      let params = '';
      if (viewType === 'month') {
        const [y, m] = monthFilter.split('-');
        params = `year=${y}&month=${m}`;
      } else {
        params = `year=${yearFilter}`;
      }
      
      const [pRes, iRes] = await Promise.all([
        apiClient.get(`/finance/leaf-income?${params}`),
        apiClient.get(`/crop/factory-intakes?${params}`),
      ]);
      if (pRes.success) setRecords(pRes.data || []);
      if (iRes.success && iRes.data) {
        const totalEarnings = iRes.data.reduce((s, r) => s + parseFloat(r.earnings || 0), 0);
        const totalNet = iRes.data.reduce((s, r) => s + parseFloat(r.net_weight || 0), 0);
        setIntakeSummary({ totalEarnings, totalNet });
      }
    } catch (e) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [monthFilter, yearFilter, viewType]);

  /* auto-compute deductions and net payable */
  useEffect(() => {
    const rate = parseFloat(form.ratePerKg) || 0;
    const kg = parseFloat(form.totalKg) || 0;
    const computedGross = rate * kg;
    const gross = (rate > 0 && kg > 0) ? computedGross : (parseFloat(form.grossEarnings) || 0);

    const tea = parseFloat(form.teaAdvance) || 0;
    const fert = parseFloat(form.fertilizerAdvance) || 0;
    const other = parseFloat(form.otherDeductions) || 0;
    const totalDed = tea + fert + other;
    
    setForm(prev => {
      const newGross = (rate > 0 && kg > 0) ? computedGross.toFixed(2) : prev.grossEarnings;
      const newDed = totalDed.toFixed(2);
      const newNet = Math.max(0, gross - totalDed).toFixed(2);
      
      if (prev.grossEarnings === newGross && prev.deductions === newDed && prev.netPayable === newNet) {
        return prev;
      }
      return {
        ...prev,
        grossEarnings: newGross,
        deductions: newDed,
        netPayable: newNet,
      };
    });
  }, [form.ratePerKg, form.totalKg, form.grossEarnings, form.teaAdvance, form.fertilizerAdvance, form.otherDeductions]);

  /* pre-fill gross from intake summary when modal opens */
  const openModal = () => {
    const defaultTotalKg = intakeSummary.totalNet > 0 ? intakeSummary.totalNet.toFixed(2) : '';
    const defaultGross = intakeSummary.totalEarnings > 0 ? intakeSummary.totalEarnings.toFixed(2) : '';
    const defaultRate = intakeSummary.totalNet > 0 ? (intakeSummary.totalEarnings / intakeSummary.totalNet).toFixed(2) : '';
    setForm(prev => ({
      ...prev,
      totalKg: defaultTotalKg,
      ratePerKg: defaultRate,
      grossEarnings: defaultGross,
      periodFrom: monthFilter + '-01',
      periodTo: new Date(monthFilter.split('-')[0], monthFilter.split('-')[1], 0)
        .toISOString().slice(0, 10),
    }));
    setShowModal(true);
  };

  /* ─── save ─── */
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        ratePerKg: parseFloat(form.ratePerKg) || 0,
        totalKg: parseFloat(form.totalKg) || 0,
        grossEarnings: parseFloat(form.grossEarnings) || 0,
        teaAdvance: parseFloat(form.teaAdvance) || 0,
        fertilizerAdvance: parseFloat(form.fertilizerAdvance) || 0,
        otherDeductions: parseFloat(form.otherDeductions) || 0,
        deductions: parseFloat(form.deductions) || 0,
        netPayable: parseFloat(form.netPayable) || 0,
        amountPaid: parseFloat(form.amountPaid) || 0,
      };
      const res = await apiClient.post('/finance/leaf-income', payload);
      if (!res.success) throw new Error(res.error || 'Save failed');
      setSuccess('Payment record saved successfully.');
      setTimeout(() => setSuccess(''), 3500);
      setShowModal(false);
      setForm({
        paymentDate: todayISO(), periodFrom: '', periodTo: '',
        ratePerKg: '', totalKg: '',
        grossEarnings: '', teaAdvance: '', fertilizerAdvance: '',
        otherDeductions: '', deductions: '', netPayable: '',
        amountPaid: '', paymentMode: 'Bank Transfer', referenceNo: '',
        status: 'pending', remarks: '',
      });
      await load();
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!records.length) return;
    const headers = ['Date', 'Period From', 'Period To', 'Gross', 'Net Payable', 'Paid', 'Mode', 'Ref', 'Status'];
    const rows = records.map(r => [
      r.payment_date ? r.payment_date.slice(0, 10) : '',
      r.period_from ? r.period_from.slice(0, 10) : '',
      r.period_to ? r.period_to.slice(0, 10) : '',
      r.gross_earnings,
      r.net_payable,
      r.amount_paid,
      `"${r.payment_mode}"`,
      `"${r.reference_no}"`,
      r.status.toUpperCase()
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Leaf_Income_Report_${monthFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!records.length) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(14);
    doc.text(`Leaf Income Intelligence Report (${monthFilter})`, 14, 15);
    
    autoTable(doc, {
      startY: 20,
      head: [['Date', 'Period', 'Gross', 'Tea Adv', 'Fert Adv', 'Other', 'Net Payable', 'Paid', 'Status']],
      body: records.map(r => [
        r.payment_date ? r.payment_date.slice(0, 10) : '—',
        `${r.period_from ? r.period_from.slice(2, 10) : ''} to ${r.period_to ? r.period_to.slice(2, 10) : ''}`,
        Number(r.gross_earnings).toFixed(2),
        Number(r.tea_advance).toFixed(2),
        Number(r.fertilizer_advance).toFixed(2),
        Number(r.other_deductions).toFixed(2),
        Number(r.net_payable).toFixed(2),
        Number(r.amount_paid).toFixed(2),
        r.status.toUpperCase()
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 71, 42] }
    });
    
    doc.save(`Leaf_Income_Report_${monthFilter}.pdf`);
  };

  /* ─── derived stats ─── */
  const totalPaid = records.reduce((s, r) => s + parseFloat(r.amount_paid || 0), 0);
  const totalPayable = records.reduce((s, r) => s + parseFloat(r.net_payable || 0), 0);
  const outstanding = totalPayable - totalPaid;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return records;
    return records.filter(r =>
      (r.reference_no || '').toLowerCase().includes(q) ||
      (r.payment_mode || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q)
    );
  }, [records, query]);

  const inp = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Leaf Income Intelligence</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Factory Leaf Income & Operational Payout Registry
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 relative">
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewType('month')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'month' ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm' : 'text-slate-400'}`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('year')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'year' ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm' : 'text-slate-400'}`}
            >
              Year
            </button>
          </div>

          {viewType === 'month' ? (
            <input
              type="month"
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
            />
          ) : (
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm outline-none"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
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
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
          >
            <Plus size={16} /> Record Payment
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
          <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Factory Earnings (Month)', value: `Rs. ${intakeSummary.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Factory, color: 'text-tea-500', bg: 'bg-tea-50 dark:bg-tea-900/20' },
          { label: 'Total Net Payable', value: `Rs. ${totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Scale, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Total Paid', value: `Rs. ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Outstanding Balance', value: `Rs. ${outstanding.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Banknote, color: outstanding > 0 ? 'text-amber-500' : 'text-emerald-500', bg: outstanding > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
        ].map((s, i) => (
          <div key={i} className="premium-card relative overflow-hidden group">
            <s.icon className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${s.color}`} size={100} />
            <div className={`inline-flex p-2 rounded-xl mb-3 ${s.bg}`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
            <p className={`text-lg font-black font-outfit italic tracking-tight ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-tea-500" />
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Payment Records</h3>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-tea-50 dark:bg-tea-900/20 text-tea-600 dark:text-tea-400 uppercase tracking-wider">{filtered.length} entries</span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search reference, mode, status..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-tea-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-500 rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Period</th>
                  <th className="px-5 py-4 text-right">Total KG</th>
                  <th className="px-5 py-4 text-right">Rate/KG</th>
                  <th className="px-5 py-4 text-right">Gross (LKR)</th>
                  <th className="px-5 py-4 text-right">Tea Adv.</th>
                  <th className="px-5 py-4 text-right">Fert. Adv.</th>
                  <th className="px-5 py-4 text-right">Other Ded.</th>
                  <th className="px-5 py-4 text-right">Net Payable (LKR)</th>
                  <th className="px-5 py-4 text-right">Paid (LKR)</th>
                  <th className="px-5 py-4">Mode</th>
                  <th className="px-5 py-4">Ref #</th>
                  <th className="px-5 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((r, i) => (
                  <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.payment_date ? r.payment_date.slice(0, 10) : '—'}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                      {r.period_from ? r.period_from.slice(0, 10) : ''} → {r.period_to ? r.period_to.slice(0, 10) : ''}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-600 dark:text-slate-300 text-xs">{r.total_kg ? parseFloat(r.total_kg).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-600 dark:text-slate-300 text-xs">{r.rate_per_kg ? parseFloat(r.rate_per_kg).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="px-5 py-4 text-right font-bold text-slate-600 dark:text-slate-300 text-xs">{parseFloat(r.gross_earnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-right font-bold text-amber-600 dark:text-amber-400 text-xs">{parseFloat(r.tea_advance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-right font-bold text-lime-600 dark:text-lime-400 text-xs">{parseFloat(r.fertilizer_advance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-right font-bold text-rose-500 text-xs">{parseFloat(r.other_deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-right font-black text-tea-600 dark:text-tea-400 text-sm">{parseFloat(r.net_payable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 text-sm">{parseFloat(r.amount_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-5 py-4 text-[10px] font-bold text-slate-500">{r.payment_mode || '—'}</td>
                    <td className="px-5 py-4 text-[10px] font-mono text-slate-500">{r.reference_no || '—'}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status] || STATUS_STYLES.pending}`}>
                        {r.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-6 py-14 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic opacity-50">
                      No leaf income records for this period
                    </td>
                  </tr>
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300" colSpan={2}>Totals</td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">
                      {filtered.reduce((s, r) => s + parseFloat(r.total_kg || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">
                      —
                    </td>
                    <td className="px-5 py-4 text-right text-slate-600 dark:text-slate-300">
                      {filtered.reduce((s, r) => s + parseFloat(r.gross_earnings || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-amber-600 dark:text-amber-400">
                      {filtered.reduce((s, r) => s + parseFloat(r.tea_advance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-lime-600 dark:text-lime-400">
                      {filtered.reduce((s, r) => s + parseFloat(r.fertilizer_advance || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-rose-500">
                      {filtered.reduce((s, r) => s + parseFloat(r.other_deductions || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-tea-600 dark:text-tea-400">
                      {totalPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right text-emerald-600 dark:text-emerald-400">
                      {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td colSpan={3} className="px-5 py-4 text-right text-amber-600 dark:text-amber-400">
                      Outstanding: {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* ── Record Payment Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh]">

            {/* Modal Header */}
            <div className="p-7 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-tea-500/10 text-tea-600 rounded-2xl">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Record Leaf Income</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Factory → Estate Settlement</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-xl">
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-7 space-y-5">

              {/* Factory Earnings Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-tea-900 to-slate-900 border border-tea-800/50 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-tea-400 mb-1">Factory Intake Earnings (Month)</p>
                  <p className="text-2xl font-black text-white font-outfit italic">
                    Rs. {intakeSummary.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Net Weight</p>
                  <p className="text-lg font-black text-tea-400 font-outfit italic">
                    {intakeSummary.totalNet.toLocaleString('en-US', { minimumFractionDigits: 1 })} KG
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Date</label>
                  <input type="date" className={inp} value={form.paymentDate}
                    onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Mode</label>
                  <select className={inp} value={form.paymentMode}
                    onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}>
                    {['Bank Transfer', 'Cheque', 'Cash', 'NEFT / RTGS', 'Online'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Period From</label>
                  <input type="date" className={inp} value={form.periodFrom}
                    onChange={e => setForm(p => ({ ...p, periodFrom: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Period To</label>
                  <input type="date" className={inp} value={form.periodTo}
                    onChange={e => setForm(p => ({ ...p, periodTo: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total KG</label>
                  <input type="number" className={inp} placeholder="0.00" value={form.totalKg}
                    onChange={e => setForm(p => ({ ...p, totalKg: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rate per KG (LKR)</label>
                  <input type="number" className={inp} placeholder="0.00" value={form.ratePerKg}
                    onChange={e => setForm(p => ({ ...p, ratePerKg: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gross Earnings (LKR) — Auto-calculated</label>
                  <input type="number" className={inp} placeholder="0.00" value={form.grossEarnings}
                    onChange={e => setForm(p => ({ ...p, grossEarnings: e.target.value }))} />
                </div>

                {/* Deduction breakdown section */}
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">Deduction Breakdown</p>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Package size={11} /> Tea Advance (LKR)
                  </label>
                  <input type="number" className={inp} placeholder="0.00" value={form.teaAdvance}
                    onChange={e => setForm(p => ({ ...p, teaAdvance: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-lime-600 dark:text-lime-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Sprout size={11} /> Fertilizer Advance (LKR)
                  </label>
                  <input type="number" className={inp} placeholder="0.00" value={form.fertilizerAdvance}
                    onChange={e => setForm(p => ({ ...p, fertilizerAdvance: e.target.value }))} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Other Deductions (LKR)</label>
                  <input type="number" className={inp} placeholder="0.00" value={form.otherDeductions}
                    onChange={e => setForm(p => ({ ...p, otherDeductions: e.target.value }))} />
                </div>

                {/* Total deductions display */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-0.5">Total Deductions</p>
                    <p className="text-[9px] font-bold text-slate-400">Tea Adv. + Fertilizer Adv. + Other</p>
                  </div>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-outfit italic">Rs. {parseFloat(form.deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>

                {/* Net payable - readonly computed */}
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Payable (LKR) — Auto-calculated</label>
                  <div className="px-4 py-3 rounded-xl bg-tea-50 dark:bg-tea-900/20 border border-tea-200 dark:border-tea-800 text-xl font-black text-tea-700 dark:text-tea-400 font-outfit italic">
                    Rs. {parseFloat(form.netPayable || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount Paid (LKR)</label>
                  <input type="number" className={inp} placeholder="0.00" value={form.amountPaid}
                    onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reference / Cheque #</label>
                  <input type="text" className={inp} placeholder="Ref or cheque number" value={form.referenceNo}
                    onChange={e => setForm(p => ({ ...p, referenceNo: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</label>
                  <select className={inp} value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks</label>
                  <textarea className={inp + ' min-h-[70px] resize-none'} placeholder="Optional remarks..."
                    value={form.remarks} onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <AlertCircle size={14} className="text-rose-500 shrink-0" />
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-7 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={save}
                disabled={saving || !form.grossEarnings || !form.paymentDate}
                className="w-full py-4 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-tea-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Income Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
