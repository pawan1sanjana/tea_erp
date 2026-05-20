import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FileText, 
  Edit2,
  TreePine,
  DollarSign,
  Briefcase,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { apiClient } from '../../api/client';

const DEFAULT_RATE = 85;

const PLOTS = ["Plot A", "Plot B", "Plot C", "Plot D", "Plot E"];
const GRADES = ["Premium", "Standard", "Export"];
const HARVESTERS = ["Suresh K.", "Nimal P.", "Ranjith S.", "Kamal D.", "Priya M."];

const gradeColors = {
  Premium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  Standard: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  Export: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
};

const fmt = (n) => `Rs. ${Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const emptyForm = { date: "", plot: "", trees: "", nuts: "", grade: "Standard", harvester: "", notes: "", rate: DEFAULT_RATE, paid: false };

export default function CoconutHarvest() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ plot: "", grade: "", harvester: "", paid: "", date: "" });
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("records");
  const [defaultRate, setDefaultRate] = useState(DEFAULT_RATE);
  const [showRateModal, setShowRateModal] = useState(false);
  const [tempRate, setTempRate] = useState(DEFAULT_RATE);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/coconut/harvests');
      if (res.success) {
        setRecords(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch harvest records:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const payment = (rec) => rec.trees * rec.rate;

  const filtered = useMemo(() => {
    let r = records.filter(rec =>
      (!filter.date || rec.date === filter.date) &&
      (!filter.plot || rec.plot === filter.plot) &&
      (!filter.grade || rec.grade === filter.grade) &&
      (!filter.harvester || rec.harvester === filter.harvester) &&
      (filter.paid === "" || String(rec.paid) === filter.paid) &&
      (!search || [rec.date, rec.plot, rec.harvester, rec.notes, String(rec.nuts), rec.grade]
        .join(" ").toLowerCase().includes(search.toLowerCase()))
    );
    r = [...r].sort((a, b) => {
      let av = sort.key === "payment" ? payment(a) : a[sort.key];
      let bv = sort.key === "payment" ? payment(b) : b[sort.key];
      if (typeof av === "string") av = av.toLowerCase(), bv = bv.toLowerCase();
      return sort.dir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [records, filter, sort, search]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const stats = useMemo(() => {
    const totalNuts = records.reduce((s, r) => s + Number(r.nuts), 0);
    const totalPayable = records.reduce((s, r) => s + payment(r), 0);
    const totalPaid = records.filter(r => r.paid).reduce((s, r) => s + payment(r), 0);
    const totalUnpaid = totalPayable - totalPaid;
    return { totalNuts, totalPayable, totalPaid, totalUnpaid, sessions: records.length };
  }, [records]);

  const harvesterSummary = useMemo(() => {
    const map = {};
    records.forEach(r => {
      if (!map[r.harvester]) map[r.harvester] = { sessions: 0, trees: 0, nuts: 0, earned: 0, paid: 0, unpaid: 0 };
      const p = payment(r);
      map[r.harvester].sessions++;
      map[r.harvester].trees += r.trees;
      map[r.harvester].nuts += r.nuts;
      map[r.harvester].earned += p;
      if (r.paid) map[r.harvester].paid += p;
      else map[r.harvester].unpaid += p;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.earned - a.earned);
  }, [records]);

  const handleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }));

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.date || !form.plot || !form.trees || !form.nuts || !form.harvester) return;
    const rec = { ...form, trees: Number(form.trees), nuts: Number(form.nuts), rate: Number(form.rate) || defaultRate };
    
    try {
      if (editId !== null) {
        const res = await apiClient.put(`/coconut/harvests/${editId}`, rec);
        if (res.success) {
          setRecords(rs => rs.map(r => r.id === editId ? { ...rec, id: editId } : r));
        }
      } else {
        const res = await apiClient.post('/coconut/harvests', rec);
        if (res.success) fetchData();
      }
      setForm({ ...emptyForm, rate: defaultRate }); 
      setShowForm(false);
      setEditId(null);
    } catch (error) {
      console.error('Failed to save record:', error);
    }
  };

  const togglePaid = async (rec) => {
    try {
      const newPaidStatus = !rec.paid;
      const res = await apiClient.put(`/coconut/harvests/${rec.id}/toggle-paid`, { paid: newPaidStatus });
      if (res.success) {
        setRecords(rs => rs.map(r => r.id === rec.id ? { ...r, paid: newPaidStatus } : r));
      }
    } catch (error) {
      console.error('Failed to toggle paid status:', error);
    }
  };

  const markAllPaid = async (harvester) => {
    try {
      const res = await apiClient.put('/coconut/harvests/mark-all-paid', { harvester });
      if (res.success) {
        setRecords(rs => rs.map(r => r.harvester === harvester ? { ...r, paid: true } : r));
      }
    } catch (error) {
      console.error('Failed to mark all as paid:', error);
    }
  };

  const startEdit = (rec) => { setForm({ ...rec }); setEditId(rec.id); setShowForm(true); };
  const confirmDelete = async () => {
    try {
      const res = await apiClient.delete(`/coconut/harvests/${deleteId}`);
      if (res.success) {
        setRecords(rs => rs.filter(r => r.id !== deleteId));
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
    } finally {
      setDeleteId(null);
    }
  };

  const SortArrow = ({ k }) => sort.key === k
    ? <span className="text-emerald-500 ml-1">{sort.dir === "asc" ? "↑" : "↓"}</span>
    : <span className="text-slate-300 dark:text-slate-600 ml-1">↕</span>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight flex items-center gap-3">
            Coconut <span className="text-emerald-600">Harvest</span> Ledger
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1 uppercase tracking-widest text-[10px]">
            <TreePine size={14} className="text-emerald-600" />
            Estate Record Keeping & Payments
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
          <button 
            onClick={() => { setTempRate(defaultRate); setShowRateModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Settings size={16} /> Rate: Rs.{defaultRate}
          </button>
          <button 
            onClick={() => { setForm({ ...emptyForm, rate: defaultRate }); setEditId(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/30"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Nuts", value: stats.totalNuts.toLocaleString(), icon: <TreePine size={20} />, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
          { label: "Sessions", value: stats.sessions, icon: <FileText size={20} />, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Total Payable", value: fmt(stats.totalPayable), icon: <DollarSign size={20} />, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
          { label: "Total Paid", value: fmt(stats.totalPaid), icon: <CheckCircle2 size={20} />, color: "text-teal-600", bg: "bg-teal-100 dark:bg-teal-900/30" },
          { label: "Outstanding", value: fmt(stats.totalUnpaid), icon: <Clock size={20} />, color: stats.totalUnpaid > 0 ? "text-rose-600" : "text-slate-500", bg: stats.totalUnpaid > 0 ? "bg-rose-100 dark:bg-rose-900/30" : "bg-slate-100 dark:bg-slate-800" },
        ].map(s => (
          <div key={s.label} className="premium-card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg} ${s.color}`}>
              {s.icon}
            </div>
            <p className={`text-xl font-black truncate ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setTab("records")} 
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${tab === 'records' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <div className="flex items-center gap-2"><FileText size={16}/> Harvest Records</div>
        </button>
        <button 
          onClick={() => setTab("payments")} 
          className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${tab === 'payments' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          <div className="flex items-center gap-2"><CreditCard size={16}/> Payments</div>
        </button>
      </div>

      {/* RECORDS TAB */}
      {tab === "records" && (
        <div className="premium-card p-0 overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                placeholder="Search records..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>
            <input 
              type="date"
              value={filter.date}
              onChange={e => setFilter(f => ({ ...f, date: e.target.value }))}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <select value={filter.plot} onChange={e => setFilter(f => ({ ...f, plot: e.target.value }))} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Plots</option>{PLOTS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={filter.grade} onChange={e => setFilter(f => ({ ...f, grade: e.target.value }))} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Grades</option>{GRADES.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={filter.harvester} onChange={e => setFilter(f => ({ ...f, harvester: e.target.value }))} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Harvesters</option>{HARVESTERS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select value={filter.paid} onChange={e => setFilter(f => ({ ...f, paid: e.target.value }))} className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option value="">All Status</option>
              <option value="false">Unpaid</option>
              <option value="true">Paid</option>
            </select>
            {(filter.date || filter.plot || filter.grade || filter.harvester || filter.paid !== "" || search) && (
              <button onClick={() => { setFilter({ plot: "", grade: "", harvester: "", paid: "", date: "" }); setSearch(""); }} className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">Clear Filters</button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500 font-black border-b border-slate-200 dark:border-slate-700">
                  {[["date","Date"],["plot","Plot"],["trees","Trees"],["nuts","Nuts"],["grade","Grade"],["harvester","Harvester"],["rate","Rate/Tree"],["payment","Payment"]].map(([k,l]) => (
                    <th key={k} onClick={() => handleSort(k)} className={`px-4 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${["trees","nuts","rate","payment"].includes(k) ? "text-right" : ""}`}>
                      {l}<SortArrow k={k} />
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center">
                      <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-slate-500 font-medium">Loading records...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-500 font-medium">No records found matching criteria.</td></tr>
                ) : (
                  paginated.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{rec.date}</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">{rec.plot}</span></td>
                    <td className="px-4 py-3 text-right font-medium">{rec.trees}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">{rec.nuts.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${gradeColors[rec.grade]}`}>{rec.grade}</span></td>
                    <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">{rec.harvester}</td>
                    <td className="px-4 py-3 text-right text-slate-500">Rs.{rec.rate}</td>
                    <td className="px-4 py-3 text-right font-black text-amber-600">{(payment(rec)).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => togglePaid(rec)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${rec.paid ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800' : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:border-amber-800'}`}>
                        {rec.paid ? "Paid" : "Unpaid"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(rec)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteId(rec.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center text-xs text-slate-500 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-4">
               <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} records</span>
               <div className="flex gap-4">
                 <span>Total: <span className="text-amber-600">{(filtered.reduce((s, r) => s + payment(r), 0)).toLocaleString()}</span></span>
                 <span>Paid: <span className="text-emerald-600">{(filtered.filter(r => r.paid).reduce((s, r) => s + payment(r), 0)).toLocaleString()}</span></span>
               </div>
            </div>
            {totalPages > 1 && (
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                 >
                   <ChevronLeft size={16} />
                 </button>
                 <span className="px-4">Page {currentPage} of {totalPages}</span>
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages}
                   className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"
                 >
                   <ChevronRight size={16} />
                 </button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* PAYMENTS TAB */}
      {tab === "payments" && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex gap-3 text-sm font-medium">
            <AlertCircle size={20} className="shrink-0" />
            <p>Payment is calculated as <b>Trees × Rate per Tree</b>. You can toggle payment status on individual sessions or click "Mark All Paid" to settle an entire balance at once.</p>
          </div>

          <div className="grid gap-6">
            {harvesterSummary.map(h => (
              <div key={h.name} className="premium-card p-0 overflow-hidden">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center font-black text-xl">
                      {h.name[0]}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 dark:text-white">{h.name}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{h.sessions} Sessions • {h.trees} Trees • {h.nuts.toLocaleString()} Nuts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earned</p>
                      <p className="font-black text-amber-600 text-lg">{fmt(h.earned)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</p>
                      <p className="font-black text-emerald-600 text-lg">{fmt(h.paid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outstanding</p>
                      <p className={`font-black text-lg ${h.unpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{fmt(h.unpaid)}</p>
                    </div>
                    {h.unpaid > 0 && (
                      <button onClick={() => markAllPaid(h.name)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                        <CheckCircle2 size={16} /> Settle Balance
                      </button>
                    )}
                  </div>
                </div>

                <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${h.earned > 0 ? (h.paid / h.earned) * 100 : 0}%` }} />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-widest text-slate-400 font-black">
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3 text-left">Plot</th>
                        <th className="px-5 py-3 text-right">Trees</th>
                        <th className="px-5 py-3 text-right">Rate/Tree</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {records.filter(r => r.harvester === h.name).sort((a, b) => a.date < b.date ? 1 : -1).map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-5 py-3 font-bold">{rec.date}</td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{rec.plot}</td>
                          <td className="px-5 py-3 text-right">{rec.trees}</td>
                          <td className="px-5 py-3 text-right text-slate-400">Rs.{rec.rate}</td>
                          <td className="px-5 py-3 text-right font-black text-amber-600">{(payment(rec)).toLocaleString()}</td>
                          <td className="px-5 py-3 text-center">
                            <button onClick={() => togglePaid(rec)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${rec.paid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {rec.paid ? "Paid" : "Unpaid"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {harvesterSummary.length === 0 && (
              <div className="text-center p-12 text-slate-500 font-medium bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                No payment records yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200 dark:border-slate-800">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TreePine size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editId ? "Edit Harvest Record" : "New Harvest Entry"}</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Coconut Operations</p>
                </div>
              </div>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date *</label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Plot *</label>
                  <select required value={form.plot} onChange={e => setForm({...form, plot: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Select plot</option>{PLOTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trees Climbed *</label>
                  <input type="number" min="1" required placeholder="e.g. 30" value={form.trees} onChange={e => setForm({...form, trees: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nuts Harvested *</label>
                  <input type="number" min="1" required placeholder="e.g. 240" value={form.nuts} onChange={e => setForm({...form, nuts: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Grade</label>
                  <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20">
                    {GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harvester *</label>
                  <select required value={form.harvester} onChange={e => setForm({...form, harvester: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20">
                    <option value="">Select harvester</option>{HARVESTERS.map(h => <option key={h}>{h}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate per Tree (Rs.) *</label>
                  <input type="number" min="1" required value={form.rate} onChange={e => setForm({...form, rate: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Payment (Calculated)</label>
                  <div className="w-full px-4 py-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl text-lg font-black text-amber-600 flex items-center">
                    {form.trees && form.rate ? fmt(Number(form.trees) * Number(form.rate)) : "—"}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Notes</label>
                  <input placeholder="Optional notes…" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                </div>
                
                <div className="md:col-span-2 mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center gap-3 cursor-pointer select-none" onClick={() => setForm({...form, paid: !form.paid})}>
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${form.paid ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    {form.paid && <Check size={14} className="text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-800 dark:text-white">Mark as Paid immediately</p>
                    <p className="text-xs text-slate-500">Record will be marked as settled upon creation</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => { setShowForm(false); setEditId(null); }} className="px-6 py-4 rounded-2xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 uppercase tracking-widest transition-all">Cancel</button>
                <button type="submit" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2">
                  <CheckCircle2 size={18} /> {editId ? "Save Changes" : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Modal */}
      {showRateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2"><Settings size={18} className="text-emerald-500"/> Default Rate</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate (Rs. per tree)</label>
                <input type="number" min="1" value={tempRate} onChange={e => setTempRate(Number(e.target.value))} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <p className="text-xs text-slate-500">Sets the pre-filled default for new entries. Each entry can still have its own custom rate.</p>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setShowRateModal(false)} className="px-6 py-3 rounded-xl font-bold text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-widest">Cancel</button>
              <button onClick={() => { setDefaultRate(tempRate); setShowRateModal(false); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20">Save Rate</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95 border border-rose-100 dark:border-rose-900/30">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} className="text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Delete Record?</h3>
            <p className="text-slate-500 mb-8">This action cannot be undone. This record will be permanently removed from the ledger.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 transition-colors uppercase tracking-widest">Cancel</button>
              <button onClick={confirmDelete} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-rose-500/20 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
