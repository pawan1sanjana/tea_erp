import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  ShieldCheck, Plus, Search, Filter, Clock, AlertCircle, FileText, 
  ArrowRight, Download, Edit3, Trash2, X, Save, Activity, 
  ChevronLeft, ChevronRight, Landmark, Building2, Hash, Receipt,
  CheckCircle2, AlertOctagon, Info, Loader2, FilePlus, Truck, Box,
  ChevronDown, Sparkles, Calendar
} from 'lucide-react';
import { apiClient } from '../../api/client';

export default function InsuranceManagement() {
  const [viewMode, setViewMode] = useState("insurance");
  const [activeTab, setActiveTab] = useState("vehicles");
  const [records, setRecords] = useState({ vehicles: [], assets: [], revenue: [] });
  const [filtered, setFiltered] = useState([]);
  const [stats, setStats] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryAssets, setInventoryAssets] = useState([]);
  const [formData, setFormData] = useState({
    license_number: '',
    fleet_id: '',
    asset_name: '',
    asset_code: '',
    policy_number: '',
    insurance_company: '',
    coverage_amount: '',
    premium_amount: '',
    expiry_date: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssetSelect = (e) => {
    const assetId = e.target.value;
    if (!assetId) return;
    const asset = inventoryAssets.find(a => a.id.toString() === assetId);
    if (asset) {
      if (viewMode === 'revenue' || activeTab === 'vehicles') {
        setFormData(prev => ({
          ...prev,
          license_number: asset.asset_name,
          fleet_id: asset.serial_number || `AST-${asset.id}`
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          asset_name: asset.asset_name,
          asset_code: asset.serial_number || `AST-${asset.id}`
        }));
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const type = viewMode === 'insurance' ? (activeTab === 'vehicles' ? 'vehicle' : 'asset') : 'revenue_license';
      const payload = { ...formData, type };
      
      let response;
      if (selectedRecord) {
        response = await apiClient.put(`/compliance/insurance/${selectedRecord.id}`, payload);
      } else {
        response = await apiClient.post('/compliance/insurance/add', payload);
      }

      if (response.success) {
        setShowAddModal(false);
        setFormData({
          license_number: '', fleet_id: '', asset_name: '', asset_code: '',
          policy_number: '', insurance_company: '', coverage_amount: '', premium_amount: '', expiry_date: ''
        });
        setSelectedRecord(null);
        fetchData();
      }
    } catch (error) {
      console.error('Save policy failed', error);
      alert('Failed to register insurance policy. Please check the network or server logs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVehicle = viewMode === "insurance" && activeTab === "vehicles";
  const isRevenue = viewMode === "revenue";

  useEffect(() => {
    fetchData();
  }, [activeTab, viewMode]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await apiClient.get('/inventory/physical');
        if (response.success) setInventoryAssets(response.data);
      } catch (err) {
        console.error('Failed to fetch inventory assets', err);
      }
    };
    fetchInventory();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let type = 'assets';
      if (viewMode === 'revenue') type = 'revenue';
      else if (activeTab === 'vehicles') type = 'vehicles';
      const [statsRes, listRes] = await Promise.all([
        apiClient.get(`/compliance/insurance/stats?type=${type}`),
        apiClient.get(`/compliance/insurance/list?type=${type}`)
      ]);
      
      if (statsRes.success) setStats(statsRes.data);
      if (listRes.success) {
        const dataKey = viewMode === 'revenue' ? 'revenue' : activeTab;
        setRecords(prev => ({ ...prev, [dataKey]: listRes.data }));
        setFiltered(listRes.data);
      }
    } catch (error) {
      console.error('Fetch data failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.delete(`/compliance/insurance/${recordToDelete.id}`);
      if (response.success) {
        setShowDeleteModal(false);
        setRecordToDelete(null);
        fetchData();
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (record) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const handleUpdate = (record) => {
    setSelectedRecord(record);
    setFormData({
      license_number: record.license_number || '',
      fleet_id: record.fleet_id || '',
      asset_name: record.asset_name || '',
      asset_code: record.asset_code || '',
      policy_number: record.policy_number,
      insurance_company: record.insurance_company,
      coverage_amount: record.coverage_amount,
      premium_amount: record.premium_amount,
      expiry_date: record.expiry_date ? record.expiry_date.split('T')[0] : ''
    });
    setShowAddModal(true);
  };

  useEffect(() => {
    const dataKey = viewMode === 'revenue' ? 'revenue' : activeTab;
    const filteredList = (records[dataKey] || []).filter(item => {
      const q = searchTerm.toLowerCase();
      const primary = (isVehicle || isRevenue) ? (item.license_number || '') : (item.asset_name || '');
      const secondary = (isVehicle || isRevenue) ? (item.fleet_id || '') : (item.asset_code || '');
      
      const matchesSearch = primary.toLowerCase().includes(q) || secondary.toLowerCase().includes(q);
      
      const daysUntil = (expiry) => {
        if (!expiry) return 999;
        const diff = new Date(expiry) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };
      
      const days = daysUntil(item.expiry_date);
      let status = 'valid';
      if (days < 0) status = 'expired';
      else if (days <= 30) status = 'expiring';
      
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    setFiltered(filteredList);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, records, activeTab, viewMode]);

  const getStatusBadge = (expiry) => {
    if (!expiry) return <span className="badge-slate">No Policy</span>;
    const diff = new Date(expiry) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-500/20">Expired</span>;
    if (days <= 30) return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">Renew Now</span>;
    return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Premium Header - Aligned with Common System Styles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">{isRevenue ? 'Revenue Licenses' : 'Insurance Registry'}</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-tea-500" /> Enterprise Risk & Compliance Audit Registry
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="px-5 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-tea-500/10 rounded-2xl flex items-center gap-5 shadow-lg shadow-tea-500/5 font-outfit hidden md:flex">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">TOTAL</span>
              <span className="text-lg font-black text-tea-600 tracking-wider mt-1 italic uppercase">{(records.vehicles?.length || 0) + (records.assets?.length || 0)}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">STATUS</span>
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
            </div>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-tea-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={16} /> {isRevenue ? 'New License' : 'New Policy'}
          </button>
        </div>
      </div>

      {/* Master View Toggle */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-full w-fit border border-slate-200 dark:border-slate-800 shadow-inner px-2">
        <button onClick={() => { setViewMode('insurance'); setActiveTab('vehicles'); }} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'insurance' ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <ShieldCheck size={16} /> Insurance Policies
        </button>
        <button onClick={() => setViewMode('revenue')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'revenue' ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
          <Receipt size={16} /> Revenue Licenses
        </button>
      </div>

      {/* Tabs Design - Aligned with Bio Assets */}
      {viewMode === 'insurance' && (
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
          {[
            { id: 'vehicles', label: 'Fleet Registry', icon: Truck },
            { id: 'assets', label: 'Physical Assets', icon: Box }
          ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
        </div>
      )}

      {/* Stat Cards - Bio Assets Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { title: 'Total Units', value: stats.total || 0, icon: Box, bg: 'bg-tea-100 dark:bg-tea-900/30', text: 'text-tea-600 dark:text-tea-400' },
          { title: isRevenue ? 'Valid Licenses' : 'Fully Insured', value: stats.insured || 0, icon: ShieldCheck, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
          { title: 'Expiring Soon', value: stats.expiring || 0, icon: Clock, bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
          { title: 'Critical Risk', value: stats.expired || 0, icon: AlertOctagon, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' }
        ].map((s, i) => (
          <div key={i} className="premium-card flex items-center gap-4 shadow-sm border-none group hover:scale-[1.02] transition-transform">
            <div className={`p-3 rounded-2xl ${s.bg} ${s.text}`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-none mb-1">{s.title}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">{s.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar - Bio Assets Style */}
      <div className="premium-card pt-6 pb-6 pr-6 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Universal Registry Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={`Search ${(isVehicle || isRevenue) ? 'License or Fleet ID' : 'Name or Asset Code'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="space-y-2 min-w-[200px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Registry Status</label>
            <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-tea-500 appearance-none shadow-sm"
              >
                <option value="all">All Registry Matches</option>
                <option value="valid">Active Polices</option>
                <option value="expiring">Expiring (30 Days)</option>
                <option value="expired">Critical Risk</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
             <Sparkles size={10} className="text-amber-500"/> Risk Chips:
           </span>
           <button 
             onClick={() => setStatusFilter('expiring')}
             className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter==='expiring' ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
           >
             Near Expiry
           </button>
           <button 
             onClick={() => setStatusFilter('expired')}
             className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter==='expired' ? 'bg-rose-100 text-rose-700 shadow-sm border border-rose-200' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
           >
             Critical Risk
           </button>
           {(statusFilter !== 'all' || searchTerm) && (
             <button 
               onClick={() => { setStatusFilter('all'); setSearchTerm(''); }}
               className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-1 ml-auto"
             >
               <X size={10}/> Clear
             </button>
           )}
        </div>
      </div>

      {/* Advanced Data Registry Table - Bio Assets Style */}
      <div className="premium-card overflow-hidden p-0 border-none shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                <th className="px-6 py-4 text-left font-bold">Target Identity</th>
                <th className="px-6 py-4 text-left font-bold">Policy Registry</th>
                <th className="px-6 py-4 text-left font-bold">Coverage (LKR)</th>
                <th className="px-6 py-4 text-center font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-8"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-full"></div></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-tea-500/10">
                          {(isVehicle || isRevenue) ? <Truck size={14} className="text-tea-600" /> : <Box size={14} className="text-tea-600" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm font-outfit italic">
                            {(isVehicle || isRevenue) ? item.license_number : item.asset_name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {(isVehicle || isRevenue) ? item.fleet_id : item.asset_code || 'ID: #'+item.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-tea-500" />
                        <span className="text-xs font-bold dark:text-white uppercase tracking-tighter">{item.policy_number || (isRevenue ? 'PENDING LICENSE' : 'PENDING RECORD')}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70">
                        {item.insurance_company || (isRevenue ? 'AUTHORITY NOT SET' : 'PROVIDER NOT SET')}
                      </p>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <Receipt size={14} className="text-emerald-500" />
                        <span className="text-xs font-black dark:text-white">{isRevenue ? 'N/A' : parseFloat(item.coverage_amount || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {isRevenue ? 'FEE: ' : 'PREMIUM: '}{parseFloat(item.premium_amount || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-6 py-6 text-center">
                      {getStatusBadge(item.expiry_date)}
                      <div className="flex items-center justify-center gap-1.5 mt-1.5">
                        <Calendar size={10} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleUpdate(item)}
                          className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all border border-transparent hover:border-blue-200/50"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(item)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all border border-transparent hover:border-red-200/50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <ShieldCheck size={48} className="text-slate-400 mb-3" />
                      <p className="text-xs font-black uppercase tracking-widest">No matching insurance records</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer - Bio Assets Style */}
        {!loading && filtered.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{(currentPage-1)*itemsPerPage + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(currentPage*itemsPerPage, filtered.length)}</span> OF <span className="text-slate-900 dark:text-white">{filtered.length}</span> Registry Matches
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 dark:hover:border-tea-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronLeft size={16} />
               </button>
               {[...Array(Math.ceil(filtered.length / itemsPerPage))].map((_, i) => (
                 <button 
                   key={i} onClick={() => setCurrentPage(i+1)}
                   className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-tea-600 dark:bg-tea-500 text-white shadow-lg shadow-tea-600/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-tea-500 dark:hover:border-tea-400 shadow-sm'}`}
                 >
                   {i+1}
                 </button>
               ))}
               <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filtered.length / itemsPerPage)))} disabled={currentPage === Math.ceil(filtered.length / itemsPerPage)}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 dark:hover:border-tea-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>
      
      {/* New Policy Registration Modal - Aligned & Condensed */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{isRevenue ? 'Register License' : 'Register Policy'}</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Compliance Audit Layer
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-8 space-y-5">
              <div className="space-y-4">
                {/* Inventory Source Selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-tea-600 uppercase tracking-widest ml-1">Source from Inventory</label>
                  <div className="relative">
                    <select 
                      onChange={handleAssetSelect}
                      className="w-full px-4 py-2.5 bg-tea-50 dark:bg-tea-900/20 border border-tea-100 dark:border-tea-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none appearance-none"
                    >
                      <option value="">-- Select Existing {(isVehicle || isRevenue) ? 'Vehicle' : 'Asset'} --</option>
                      {inventoryAssets
                        .filter(a => (viewMode === 'revenue' || activeTab === 'vehicles') ? a.asset_type === 'Vehicles' : a.asset_type !== 'Vehicles')
                        .map(asset => (
                          <option key={asset.id} value={asset.id}>{asset.asset_name} ({asset.serial_number || 'No Serial'})</option>
                        ))
                      }
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-tea-500 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(isVehicle || isRevenue) ? (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">License Plate</label>
                        <input 
                          type="text" name="license_number" value={formData.license_number} onChange={handleInputChange} required
                          placeholder="WP CAT-1234"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fleet ID</label>
                        <input 
                          type="text" name="fleet_id" value={formData.fleet_id} onChange={handleInputChange} required
                          placeholder="FL-9902"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                        <input 
                          type="text" name="asset_name" value={formData.asset_name} onChange={handleInputChange} required
                          placeholder="Generator A1"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Code</label>
                        <input 
                          type="text" name="asset_code" value={formData.asset_code} onChange={handleInputChange} required
                          placeholder="AS-CODE"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isRevenue ? 'License No' : 'Policy No'}</label>
                    <input 
                      type="text" name="policy_number" value={formData.policy_number} onChange={handleInputChange} required
                      placeholder={isRevenue ? 'LIC-0001' : 'POL-8821'}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isRevenue ? 'Authority' : 'Provider'}</label>
                    <input 
                      type="text" name="insurance_company" value={formData.insurance_company} onChange={handleInputChange} required
                      placeholder={isRevenue ? 'Provincial Council' : 'Allianz / SLIC'}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!isRevenue && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Coverage (LKR)</label>
                      <input 
                        type="number" name="coverage_amount" value={formData.coverage_amount} onChange={handleInputChange} required
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isRevenue ? 'License Fee (LKR)' : 'Premium (LKR)'}</label>
                    <input 
                      type="number" name="premium_amount" value={formData.premium_amount} onChange={handleInputChange} required
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{isRevenue ? 'License Expiry' : 'Policy Expiry'}</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange} required
                      className="w-full pl-12 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 bg-tea-600 hover:bg-tea-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-tea-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isRevenue ? 'Save License' : 'Save Policy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Bio Assets Style */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase italic tracking-tighter">Remove Policy?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                Permanently remove policy <span className="font-bold text-slate-900 dark:text-white">"{recordToDelete?.policy_number}"</span> from the audit registry?
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                  {isSubmitting ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
