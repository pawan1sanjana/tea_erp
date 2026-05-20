import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  ShieldCheck, Plus, Search, Filter, Clock, AlertCircle, 
  Users, Activity, Download, Edit3, Trash2, X, Save, 
  ChevronLeft, ChevronRight, CheckCircle2, Lock, Award,
  FileText, Landmark, Loader2, Landmark as Bank
} from 'lucide-react';
import { apiClient } from '../../api/client';

const TABS = [
  { key: "epf",      label: "EPF Registry",      icon: Lock, color: "tea" },
  { key: "etf",      label: "ETF Registry",      icon: Lock, color: "emerald" },
  { key: "gratuity", label: "Gratuity Fund", icon: Award, color: "amber" },
  { key: "other",    label: "HR Protocols",    icon: FileText, color: "sky" },
];

export default function LabourCompliance() {
  const [activeTab, setActiveTab] = useState("epf");
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/compliance/labour/list?type=${activeTab}`);
      if (response.success) {
        setRecords(response.data.records || []);
        setStats(response.data.stats || {});
        setFiltered(response.data.records || []);
      }
    } catch (error) {
      console.error('Fetch labour data failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filteredList = (records || []).filter(item => {
      const q = searchTerm.toLowerCase();
      return (item.worker_name || '').toLowerCase().includes(q) || 
             (item.worker_id || '').toLowerCase().includes(q);
    });
    setFiltered(filteredList);
    setCurrentPage(1);
  }, [searchTerm, records]);

  const currentTabInfo = TABS.find(t => t.key === activeTab);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Premium Header - Aligned with Common System Styles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Subsidies</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-tea-500" /> Government Support & Statutory Allocation Registry
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-tea-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} /> Register Entry
          </button>
        </div>
      </div>

      {/* Tabs Design */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-2 rounded-[2rem] w-fit border border-slate-200 dark:border-slate-800 shadow-inner">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-3 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.key 
                ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-xl shadow-slate-200/50 dark:shadow-none' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.key ? 'text-tea-600' : 'opacity-40'} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Enrolled', value: stats.total || 0, label: 'Full Workforce', icon: Users, color: 'tea' },
          { title: 'Verified Status', value: stats.verified || 0, label: 'Audit Confirmed', icon: CheckCircle2, color: 'emerald' },
          { title: 'Pending Audit', value: stats.pending || 0, label: 'Requires Action', icon: Clock, color: 'amber' },
          { title: 'Risk Alerts', value: stats.expiring || 0, label: 'Missing Data', icon: AlertCircle, color: 'rose' }
        ].map((s, i) => (
          <div key={i} className="premium-card p-6 group cursor-default">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{s.title}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter uppercase">{s.value}</h3>
                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">{s.label}</p>
              </div>
              <div className={`p-4 rounded-2xl bg-${s.color}-500/10 text-${s.color}-600 dark:text-${s.color}-400 group-hover:scale-110 transition-transform shadow-inner`}>
                <s.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="premium-card p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tea-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search Worker Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-tea-500 transition-all dark:text-white"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-tea-500 transition-all shadow-sm">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Advanced Data Registry Table */}
      <div className="premium-card overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Worker Identity</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Statutory Details</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Value/Contribution</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Audit Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-8 py-10"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage).map((item) => (
                  <tr key={item.id} className="hover:bg-tea-50/30 dark:hover:bg-tea-900/10 transition-colors group">
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-tea-100 dark:group-hover:bg-tea-900/40 group-hover:text-tea-600 transition-all">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-base font-outfit italic">
                            {item.worker_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            ID: {item.worker_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      {activeTab === 'gratuity' ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-amber-400" />
                            <span className="text-xs font-bold dark:text-white uppercase tracking-tighter">Joined: {item.joining_date}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">
                            Service: {item.years_service} Years
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-tea-500" />
                            <span className="text-xs font-black dark:text-white uppercase tracking-widest">{item.registration_number || 'PENDING'}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {activeTab.toUpperCase()} FUND REG
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-2">
                        {activeTab === 'gratuity' ? (
                          <span className="text-sm font-black dark:text-white italic tracking-tighter uppercase">LKR {parseFloat(item.gratuity_amount || 0).toLocaleString()}</span>
                        ) : (
                          <span className="text-sm font-black dark:text-white italic tracking-tighter uppercase">{item.contribution_rate || 0}% Rate</span>
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        STATUTORY ACCRUAL
                      </p>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        (item.verification_status === 'Verified' || item.status === 'Active') ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                        {item.verification_status || item.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-3 text-slate-400 hover:text-tea-600 hover:bg-tea-500/10 rounded-xl transition-all border border-transparent hover:border-tea-500/20">
                          <Edit3 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ShieldCheck size={64} className="text-slate-400 mb-4" />
                      <p className="text-xs font-black uppercase tracking-[0.3em]">No compliance records found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Logic */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900 dark:text-white">{Math.min(filtered.length, 10)}</span> of <span className="text-slate-900 dark:text-white">{filtered.length}</span> compliance entries
          </p>
          <div className="flex gap-2">
             <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-tea-500 transition-all shadow-sm">
                <ChevronLeft size={18} />
             </button>
             {[1].map(i => (
                <button key={i} className="w-10 h-10 flex items-center justify-center rounded-xl bg-tea-600 text-white font-black text-xs shadow-lg shadow-tea-600/20">
                  {i}
                </button>
             ))}
             <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-tea-500 transition-all shadow-sm">
                <ChevronRight size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
