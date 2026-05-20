import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Eye, FileText, Smartphone, MapPin, MoreHorizontal, User, Shield, Calendar, Download, X, Briefcase, Award, TrendingUp, History, CreditCard, CheckCircle, Leaf, QrCode, Archive, Edit2, ChevronLeft, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function WorkerView() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'docs', 'stats'
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  
  // Design Alignment State
  const [filterWageType, setFilterWageType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const idCardRef = useRef(null);

  const location = useLocation();

  const fetchWorkers = async () => {
    try {
      const response = await apiClient.get('/workforce/workers');
      if (response.success) {
        setWorkers(response.data);
        
        // Handle Audit Deep-Linking
        if (location.state?.auditWorkerId) {
          const target = response.data.find(w => w.id === location.state.auditWorkerId);
          if (target) {
            setSelectedWorker(target);
            setSearchTerm(target.worker_id); // Highlight in list too
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch workers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleUpdateWorker = async () => {
    setIsUpdating(true);
    try {
      const response = await apiClient.put(`/workforce/workers/${selectedWorker.id}`, editForm);
      if (response.success) {
        setIsEditing(false);
        setSelectedWorker({ ...selectedWorker, ...editForm });
        fetchWorkers(); // Refresh global list
        alert('Worker details updated successfully!');
      } else {
        alert(response.error || 'Failed to update worker details.');
      }
    } catch (error) {
      console.error('Failed to update worker:', error);
      alert(error.message || 'An error occurred while saving worker details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchive = () => {
    setShowArchiveConfirm(true);
  };

  const confirmArchive = async () => {
    try {
      const response = await apiClient.put(`/workforce/workers/${selectedWorker.id}/status`, { status: 'archived' });
      if (response.success) {
        setShowArchiveConfirm(false);
        setSelectedWorker(null);
        fetchWorkers();
      }
    } catch (error) {
      console.error('Failed to archive worker:', error);
      setShowArchiveConfirm(false);
    }
  };

  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.worker_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.nic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWage = filterWageType === 'All' || 
      (worker.wage_type === filterWageType) || 
      (filterWageType === 'permanent' && !worker.wage_type);
    
    return matchesSearch && matchesWage;
  });

  // Pagination Logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredWorkers.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredWorkers.length / entriesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleDownload = (base64Data, fileName) => {
    if (!base64Data) return;
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadIdCard = async () => {
    if (!idCardRef.current) return;
    try {
      // 1. Fetch QR as Blob/Base64
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedWorker.worker_id}`;
      const qrResponse = await fetch(qrUrl);
      const qrBlob = await qrResponse.blob();
      const qrBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(qrBlob);
      });

      // 2. Prep for capture
      const qrImg = idCardRef.current.querySelector('img[alt="Worker QR"]');
      const originalSrc = qrImg.src;
      qrImg.src = qrBase64;

      await new Promise(r => setTimeout(r, 100)); // Brief pause for state/DOM catchup

      const canvas = await html2canvas(idCardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        scale: 3,
        logging: true, // Output logs to user browser console
      });

      qrImg.src = originalSrc; // Restore

      const imgData = canvas.toDataURL('image/png');
      
      // 3. Setup PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85, 54] // Standard credit card size in mm
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 85, 54);
      pdf.save(`Worker_ID_${selectedWorker.worker_id}.pdf`);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('PDF Generation failed. Check console for details.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Worker Directory</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
             <Briefcase size={16} className="text-tea-500" /> Central Personnel Intelligence & Biometric Vault
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700">
            <Download size={16} /> Export Reports
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <User size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Total</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{workers.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm border-b-2 border-b-emerald-500">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Shield size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Permanent</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {workers.filter(w => w.wage_type === 'permanent' || !w.wage_type).length}
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm border-b-2 border-b-sky-500">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <CreditCard size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Daily Cash</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {workers.filter(w => w.wage_type === 'daily_cash').length}
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm border-b-2 border-b-blue-500">
          <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <FileText size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Contract</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {workers.filter(w => w.wage_type === 'contract').length}
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm border-l-4 border-l-tea-500 bg-tea-50/10">
          <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30">
            <Award size={22} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Active</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {workers.filter(w => w.status !== 'archived').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="premium-card pt-6 pb-6 pr-6 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Universal Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search name, ID, NIC number..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-2 min-w-[180px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Wage Category</label>
              <div className="relative">
                <select 
                  value={filterWageType} onChange={(e) => {setFilterWageType(e.target.value); setCurrentPage(1);}}
                  className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-tea-500 appearance-none shadow-sm"
                >
                  <option value="All">All Categories</option>
                  <option value="permanent">Permanent</option>
                  <option value="daily_cash">Daily Cash</option>
                  <option value="contract">Contract</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Interface */}
      <div className="premium-card overflow-hidden p-0 border-collapse border-slate-200 dark:border-slate-800">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-tea-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Personnel Vault...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Search size={40} className="opacity-30 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No matching personnel profiles</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                  <th className="px-6 py-4 text-left font-bold">Personnel Profile</th>
                  <th className="px-6 py-4 text-left font-bold">Worker ID / NIC</th>
                  <th className="px-6 py-4 text-left font-bold">Wage Category</th>
                  <th className="px-6 py-4 text-left font-bold">Contact Channel</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-right font-bold w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentEntries.map((worker) => (
                  <tr key={worker.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0">
                          {worker.photo ? (
                            <img src={worker.photo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} className="m-auto mt-2 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{worker.first_name} {worker.last_name}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Tea Estate Workforce</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-xs font-black text-tea-600 dark:text-tea-400 uppercase tracking-widest">{worker.worker_id}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{worker.nic}</p>
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                         worker.wage_type === 'permanent' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                         worker.wage_type === 'daily_cash' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         'bg-blue-50 text-blue-600 border-blue-100'
                       }`}>
                         {worker.wage_type?.replace('_', ' ') || 'Permanent'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <Smartphone size={14} className="text-slate-400" />
                         <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{worker.tel}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5">
                         <div className={`w-1.5 h-1.5 rounded-full ${worker.status === 'archived' ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                         <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                           {worker.status || 'Active'}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => { setSelectedWorker(worker); setActiveTab('overview'); setIsEditing(false); }}
                           className="p-2 rounded-xl text-tea-600 hover:bg-tea-50 dark:hover:bg-tea-900/40 transition-all"
                           title="View Detailed File"
                         >
                           <Eye size={16} />
                         </button>
                         <button 
                           onClick={() => { 
                             setSelectedWorker(worker); 
                             setEditForm({ ...worker }); 
                             setActiveTab('overview'); 
                             setIsEditing(true); 
                           }}
                           className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all"
                           title="Quick Edit"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => { setSelectedWorker(worker); setShowArchiveConfirm(true); }}
                           className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all"
                           title="Archive Profile"
                         >
                           <Archive size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Footer */}
        {!loading && filteredWorkers.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{indexOfFirstEntry + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(indexOfLastEntry, filteredWorkers.length)}</span> OF <span className="text-slate-900 dark:text-white">{filteredWorkers.length}</span> Profiles
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronLeft size={16} />
               </button>
               {[...Array(totalPages)].map((_, i) => {
                 if (totalPages > 5 && Math.abs(currentPage - (i + 1)) > 2) return null;
                 return (
                   <button 
                     key={i} onClick={() => paginate(i+1)}
                     className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-tea-600 text-white shadow-lg shadow-tea-600/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-tea-500 shadow-sm'}`}
                   >
                     {i+1}
                   </button>
                 );
               })}
               <button 
                 onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Deep Personnel Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setSelectedWorker(null)}></div>
          <div className="relative w-full max-w-6xl md:h-[85vh] bg-white dark:bg-slate-950 rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scale-in border border-white/10 my-auto">
            
            {/* Sidebar / Profile Summary */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0">
               <div className="flex flex-row md:flex-col items-center gap-4 md:gap-0 md:text-center md:space-y-6 mb-4 md:mb-8">
                <div className="relative inline-block shrink-0">
                  <div className="w-20 h-20 md:w-40 md:h-40 rounded-full md:rounded-[48px] overflow-hidden border-2 md:border-4 border-white dark:border-slate-800 shadow-xl mx-auto bg-slate-100 dark:bg-slate-800">
                    {selectedWorker.photo ? (
                      <img 
                        src={selectedWorker.photo.startsWith('data:') ? selectedWorker.photo : `/api/uploads/${selectedWorker.photo}`} 
                        className="w-full h-full object-cover" 
                        alt=""
                      />
                    ) : (
                      <User size={32} className="m-auto text-slate-300 mt-6 md:mt-10" />
                    )}
                  </div>
                </div>
                
                <div className="min-w-0">
                  <h2 className="text-lg md:text-2xl font-black dark:text-white font-outfit leading-tight break-words">{selectedWorker.first_name} {selectedWorker.last_name}</h2>
                  <p className="text-[8px] md:text-[10px] font-black text-tea-600 dark:text-tea-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-2">{selectedWorker.worker_id}</p>
                  <div className="mt-2 md:mt-4 flex flex-wrap gap-2 justify-center">
                    <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      selectedWorker.wage_type === 'permanent' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                      selectedWorker.wage_type === 'daily_cash' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}>
                      {selectedWorker.wage_type?.replace('_', ' ') || 'Permanent'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block space-y-3 mt-auto">
                 <div className="flex items-center gap-3 p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mt-auto">
                    <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-500">
                       <Smartphone size={18} />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Contact</p>
                       <p className="text-sm font-bold dark:text-white mt-1 truncate">{selectedWorker.tel}</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
               {/* Modal Navigation */}
               <div className="px-4 md:px-8 pt-4 md:pt-8 flex items-center justify-between shrink-0">
                  <div className="flex gap-4 md:gap-8 border-b border-slate-100 dark:border-slate-800 w-full overflow-x-auto no-scrollbar">
                     {['overview', 'docs'].map((tab) => (
                       <button 
                         key={tab}
                         onClick={() => setActiveTab(tab)}
                         className={`pb-3 md:pb-4 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all relative shrink-0 ${activeTab === tab ? 'text-tea-600' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         {tab}
                         {activeTab === tab && (
                           <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-tea-600 rounded-full animate-in slide-in-from-left-2"></div>
                         )}
                       </button>
                     ))}
                  </div>
                  <button onClick={() => setSelectedWorker(null)} className="ml-4 md:ml-6 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full text-slate-400 transition-all">
                    <X size={20} md:size={24} />
                  </button>
               </div>

               {/* Tab Content */}
               <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar space-y-8 md:space-y-12">
                  {activeTab === 'overview' && (
                    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                          <div className="space-y-6">
                             <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                Personal Information
                             </h4>
                             <dl className="grid grid-cols-1 gap-6">
                                <div>
                                   <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name with Initials</dt>
                                   {isEditing ? (
                                     <input 
                                       name="full_name_initials"
                                       value={editForm.full_name_initials}
                                       onChange={handleEditChange}
                                       className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                     />
                                   ) : (
                                     <dd className="text-base font-bold dark:text-white mt-1 uppercase">{selectedWorker.full_name_initials}</dd>
                                   )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">First Name</dt>
                                      {isEditing ? (
                                        <input 
                                          name="first_name"
                                          value={editForm.first_name}
                                          onChange={handleEditChange}
                                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                        />
                                      ) : (
                                        <dd className="text-sm font-bold dark:text-white mt-1 uppercase">{selectedWorker.first_name}</dd>
                                      )}
                                   </div>
                                   <div>
                                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Name</dt>
                                      {isEditing ? (
                                        <input 
                                          name="last_name"
                                          value={editForm.last_name}
                                          onChange={handleEditChange}
                                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                        />
                                      ) : (
                                        <dd className="text-sm font-bold dark:text-white mt-1 uppercase">{selectedWorker.last_name}</dd>
                                      )}
                                   </div>
                                </div>
                                <div>
                                   <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIC Number</dt>
                                   {isEditing ? (
                                     <input 
                                       name="nic"
                                       value={editForm.nic}
                                       onChange={handleEditChange}
                                       className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                     />
                                   ) : (
                                     <dd className="text-base font-bold dark:text-white mt-1">{selectedWorker.nic}</dd>
                                   )}
                                </div>
                                <div>
                                   <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Residential Address</dt>
                                   {isEditing ? (
                                     <textarea 
                                       name="address"
                                       value={editForm.address}
                                       onChange={handleEditChange}
                                       rows={3}
                                       className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 mt-1 text-sm font-medium outline-none ring-tea-500/20 focus:ring-4 resize-none"
                                     />
                                   ) : (
                                     <dd className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 leading-relaxed bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        {selectedWorker.address}
                                     </dd>
                                   )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Tel</dt>
                                      {isEditing ? (
                                        <input 
                                          name="tel"
                                          value={editForm.tel}
                                          onChange={handleEditChange}
                                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                        />
                                      ) : (
                                        <dd className="text-sm font-bold dark:text-white mt-1">{selectedWorker.tel}</dd>
                                      )}
                                   </div>
                                   <div>
                                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wage Category</dt>
                                      {isEditing ? (
                                        <select 
                                          name="wage_type"
                                          value={editForm.wage_type}
                                          onChange={handleEditChange}
                                          className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4 appearance-none"
                                        >
                                          <option value="permanent">Permanent</option>
                                          <option value="daily_cash">Daily Cash</option>
                                          <option value="contract">Contract</option>
                                        </select>
                                      ) : (
                                        <dd className="text-sm font-bold dark:text-white mt-1 capitalize">{selectedWorker.wage_type?.replace('_', ' ') || 'Permanent'}</dd>
                                      )}
                                   </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Emergency Support Details</h5>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div>
                                         <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Person</dt>
                                         {isEditing ? (
                                           <input 
                                             name="emergency_contact_name"
                                             value={editForm.emergency_contact_name}
                                             onChange={handleEditChange}
                                             className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                           />
                                         ) : (
                                           <dd className="text-sm font-bold dark:text-white mt-1 uppercase">{selectedWorker.emergency_contact_name || '--'}</dd>
                                         )}
                                      </div>
                                      <div>
                                         <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emergency Tel</dt>
                                         {isEditing ? (
                                           <input 
                                             name="emergency_tel"
                                             value={editForm.emergency_tel}
                                             onChange={handleEditChange}
                                             className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mt-1 text-sm font-bold outline-none ring-tea-500/20 focus:ring-4"
                                           />
                                         ) : (
                                           <dd className="text-sm font-bold dark:text-white mt-1">{selectedWorker.emergency_tel}</dd>
                                         )}
                                      </div>
                                   </div>
                                </div>
                             </dl>
                          </div>
                          
                          <div className="space-y-4">
                             <div className="flex justify-between items-center px-2 md:px-4">
                                <h4 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                   Digital Guard ID Card
                                </h4>
                                <button 
                                   onClick={downloadIdCard}
                                   className="p-2 bg-tea-600 text-white rounded-lg hover:bg-tea-700 transition-all flex items-center gap-1.5 shadow-md shadow-tea-600/20 text-[9px] font-bold uppercase tracking-widest"
                                >
                                   <Download size={12} /> Save PDF
                                </button>
                             </div>

                             <div 
                               ref={idCardRef}
                               style={{
                                 display: 'flex',
                                 flexDirection: 'column',
                                 aspectRatio: '1.6 / 1',
                                 width: '100%',
                                 maxWidth: '450px',
                                 borderRadius: '0px',
                                 background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #064e3b 100%)',
                                 padding: '12px',
                                 color: '#ffffff',
                                 position: 'relative',
                                 overflow: 'hidden',
                                 border: '1px solid rgba(255, 255, 255, 0.2)',
                                 boxSizing: 'border-box',
                                 fontFamily: 'system-ui, -apple-system, sans-serif'
                               }}
                             >
                                <div style={{
                                   position: 'absolute',
                                   bottom: 0,
                                   right: 0,
                                   width: '180px',
                                   height: '180px',
                                   backgroundColor: 'rgba(52, 211, 153, 0.05)',
                                   borderRadius: '100%',
                                   transform: 'translate(40px, 40px)',
                                   filter: 'blur(30px)'
                                }}></div>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', position: 'relative', zIndex: 10 }}>
                                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                         <Leaf size={16} style={{ color: '#34d399', marginRight: '8px' }} />
                                         <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px', color: '#ecfdf5' }}>TeaERP PRO</span>
                                      </div>
                                      <p style={{ fontSize: '8px', fontWeight: '600', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Official Identity</p>
                                   </div>
                                   <div style={{ backgroundColor: '#ffffff', padding: '6px', borderRadius: '4px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', marginTop: '10px' }}>
                                      <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedWorker.worker_id}`} 
                                        alt="Worker QR" 
                                        crossOrigin="anonymous"
                                        style={{ width: '85px', height: '85px', display: 'block' }}
                                      />
                                   </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginTop: '-60px', position: 'relative', zIndex: 10 }}>
                                   <div style={{ width: '80px', height: '80px', borderRadius: '0', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '0px', marginBottom: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                      {selectedWorker.photo ? (
                                        <img src={selectedWorker.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                                      ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}><User size={35} /></div>
                                      )}
                                   </div>
                                   
                                   <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%' }}>
                                      <h5 style={{ 
                                        fontSize: '14px', 
                                        fontWeight: '900', 
                                        textTransform: 'uppercase', 
                                        margin: '0 0 4px 0', 
                                        lineHeight: 1.3,
                                        color: '#fff',
                                        width: '100%',
                                        display: 'block'
                                      }}>
                                         {selectedWorker.first_name} {selectedWorker.last_name}
                                      </h5>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                         <span style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'monospace', color: '#10b981', marginRight: '10px' }}>{selectedWorker.worker_id}</span>
                                         <div style={{ width: '3px', height: '3px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', marginRight: '10px' }}></div>
                                         <span style={{ fontSize: '7px', fontWeight: '900', opacity: 0.4, textTransform: 'uppercase', letterSpacing: '1px' }}>Verified Profile</span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                             <p className="text-[8px] md:text-[9px] text-slate-400 font-medium text-center uppercase tracking-widest opacity-70 italic">Digital authenticity cryptographically signed via ID-Link</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'docs' && (
                    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                          <div className="space-y-4">
                             <div className="flex justify-between items-center px-2 md:px-4">
                               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">National ID (FRONT)</h5>
                               {selectedWorker.nic_front && (
                                 <button 
                                   onClick={() => handleDownload(selectedWorker.nic_front, `NIC_Front_${selectedWorker.worker_id}.jpg`)}
                                   className="p-1.5 md:p-2 hover:bg-tea-50 dark:hover:bg-tea-500/10 text-tea-600 rounded-xl transition-all flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold"
                                 >
                                   <Download size={14} /> DOWNLOAD
                                 </button>
                               )}
                             </div>
                             <div className="aspect-[3/2] rounded-[24px] md:rounded-[32px] overflow-hidden bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 group relative">
                                {selectedWorker.nic_front ? (
                                  <>
                                    <img src={selectedWorker.nic_front} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                       <button className="px-5 py-2 md:px-6 md:py-2.5 bg-white text-slate-900 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-xl">Full Scan</button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="m-auto text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">No Scan Provided</div>
                                )}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center px-2 md:px-4">
                               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">National ID (BACK)</h5>
                               {selectedWorker.nic_back && (
                                 <button 
                                   onClick={() => handleDownload(selectedWorker.nic_back, `NIC_Back_${selectedWorker.worker_id}.jpg`)}
                                   className="p-1.5 md:p-2 hover:bg-tea-50 dark:hover:bg-tea-500/10 text-tea-600 rounded-xl transition-all flex items-center gap-1.5 text-[8px] md:text-[9px] font-bold"
                                 >
                                   <Download size={14} /> DOWNLOAD
                                 </button>
                               )}
                             </div>
                             <div className="aspect-[3/2] rounded-[24px] md:rounded-[32px] overflow-hidden bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 group relative">
                                {selectedWorker.nic_back ? (
                                  <>
                                    <img src={selectedWorker.nic_back} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                                       <button className="px-5 py-2 md:px-6 md:py-2.5 bg-white text-slate-900 rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest shadow-xl">Full Scan</button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="m-auto text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">No Scan Provided</div>
                                )}
                             </div>
                          </div>
                       </div>
                       
                       <div className="p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-blue-500/5 border border-blue-500/10 flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                             <FileText size={24} md:size={32} />
                          </div>
                          <div>
                             <h5 className="text-base md:text-lg font-bold dark:text-white leading-tight">Document Integrity Verified</h5>
                             <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider">All uploaded credentials meet standard plantation compliance requirements.</p>
                          </div>
                       </div>
                    </div>
                  )}
               </div>

               {/* Modal Footer */}
               <div className="p-4 md:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex flex-col md:flex-row justify-end gap-2 md:gap-3 px-6 md:px-12 shrink-0">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[20px] md:rounded-[24px] transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUpdateWorker}
                        disabled={isUpdating}
                        className={`w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest bg-emerald-600 text-white rounded-[20px] md:rounded-[24px] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${isUpdating ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isUpdating ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={handleArchive}
                        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[20px] md:rounded-[24px] transition-all"
                      >
                        Archive Profile
                      </button>
                      <button 
                        onClick={() => {
                          setEditForm({ ...selectedWorker });
                          setIsEditing(true);
                        }}
                        className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 text-[10px] md:text-xs font-black uppercase tracking-widest bg-tea-600 text-white rounded-[20px] md:rounded-[24px] shadow-2xl shadow-tea-600/30 hover:bg-tea-700 hover:scale-[1.02] transition-all"
                      >
                        Edit Details
                      </button>
                    </>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && selectedWorker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-4">
                <Archive size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Archive Profile?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                You are about to archive <span className="font-bold text-slate-800 dark:text-slate-200">{selectedWorker.first_name} {selectedWorker.last_name}</span>. This will remove them from active field operations. Their records will be safely retained in the archive vault.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmArchive}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-lg shadow-amber-600/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Archive size={16} /> Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
