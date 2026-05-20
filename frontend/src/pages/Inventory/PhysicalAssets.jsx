import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Calendar, AlertCircle, CheckCircle, 
  Search, Filter, ArrowRight, Truck, 
  Ruler, Maximize2, Download, Edit2, Trash2, 
  ChevronLeft, ChevronRight, X, Save, Box,
  Loader2, Tag, ChevronDown, Sparkles, Layers, Activity, MapPin, Leaf, Hotel, FileText, FileSpreadsheet,
  Wrench, Building2, Drill, Package, ShieldCheck, Zap, DollarSign, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PhysicalAssetsInventoryPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Smart Filter State
  const [filterType, setFilterType] = useState('All');
  const [filterCondition, setFilterCondition] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(8);
  
  // Action Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [incomeAccounts, setIncomeAccounts] = useState([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellData, setSellData] = useState({
    saleDate: new Date().toISOString().split('T')[0],
    buyer: '',
    amount: '',
    incomeAccountId: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchIncomeAccounts();
  }, []);

  const fetchIncomeAccounts = async () => {
    try {
      const response = await apiClient.get('/finance/accounts');
      if (response.success) {
        // Filter for income type accounts
        const incomeAccs = response.data.filter(acc => acc.type === 'income');
        setIncomeAccounts(incomeAccs);
        if (incomeAccs.length > 0) {
          setSellData(prev => ({ ...prev, incomeAccountId: incomeAccs[0].id }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch income accounts:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/physical');
      if (response.success) {
        setInventory(response.data);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setIsProcessing(true);
    try {
      const response = await apiClient.delete(`/inventory/physical/${selectedAsset.id}`);
      if (response.success) {
        setInventory(prev => prev.filter(item => item.id !== selectedAsset.id));
        setShowDeleteModal(false);
      }
    } catch (error) {
      alert('Failed to delete asset');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const response = await apiClient.put(`/inventory/physical/${selectedAsset.id}`, selectedAsset);
      if (response.success) {
        await fetchInventory();
        setShowEditModal(false);
      }
    } catch (error) {
      alert('Failed to update asset');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsProcessing(true);
    try {
      const response = await apiClient.post(`/inventory/physical/${selectedAsset.id}/sell`, sellData);
      if (response.success) {
        setInventory(prev => prev.filter(item => item.id !== selectedAsset.id));
        setShowSellModal(false);
        fetchInventory();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to sell asset');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : inventory;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(item => ({
      'ID': item.id,
      'Asset Name': item.asset_name,
      'Type': item.asset_type,
      'Serial Number': item.serial_number,
      'Location': item.location,
      'Condition': item.asset_condition,
      'Status': item.maintenance_status,
      'Valuation (LKR)': item.value,
      'Last Maintenance': item.last_maintenance_fmt,
      'Purchase Date': item.purchase_date_fmt
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Physical_Inventory");
    XLSX.writeFile(workbook, `Physical_Assets_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : inventory;
    const doc = new jsPDF('landscape');
    doc.text("TeaERP Pro - Physical Assets Inventory", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    
    const tableData = dataToExport.map(item => [
      item.id,
      item.asset_name,
      item.asset_type,
      item.location,
      item.asset_condition.toUpperCase(),
      item.maintenance_status.replace('_', ' ').toUpperCase(),
      `Rs. ${Number(item.value).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Name', 'Type', 'Location', 'Condition', 'Status', 'Value']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: [15, 23, 42] }
    });

    doc.save(`Physical_Assets_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportOptions(false);
  };

  // Smart Filtering Logic
  const filteredData = inventory.filter(item => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.asset_name?.toLowerCase().includes(searchLow) || '') ||
      (item.serial_number?.toLowerCase().includes(searchLow) || '') ||
      (item.location?.toLowerCase().includes(searchLow) || '');
    
    const matchesType = filterType === 'All' || item.asset_type === filterType;
    const matchesCondition = filterCondition === 'All' || item.asset_condition === filterCondition;
    const matchesStatus = filterStatus === 'All' || item.maintenance_status === filterStatus;
    
    return matchesSearch && matchesType && matchesCondition && matchesStatus;
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = {
    totalValue: inventory.reduce((a,c) => a + Number(c.value), 0),
    operationalCount: inventory.filter(i => i.maintenance_status === 'operational').length,
    criticalCount: inventory.filter(i => i.asset_condition === 'poor' || i.maintenance_status === 'under_repair').length
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Physical Inventory</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-indigo-500" /> Infrastructure, machinery and tactical estate assets
          </p>
        </div>
        <div className="flex gap-3 relative">
          <button
            onClick={() => navigate('/inventory/biological-audit')}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle size={16} /> Register Asset
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
            >
              <Download size={16} /> Export
            </button>
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                  <FileSpreadsheet size={16} /> Excel Spreadsheet
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
            <Package size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Total Assets</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{inventory.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Stock Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              <span className="text-xs mr-1 font-bold">LKR</span>{(stats.totalValue / 1000000).toFixed(1)}<span className="text-xs ml-1 font-bold">M</span>
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <Zap size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Operational</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.operationalCount}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Wrench size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Attention Req</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.criticalCount}</h3>
          </div>
        </div>
      </div>

      {/* Smart Filter Panel */}
      <div className="premium-card pt-6 pb-6 pr-6 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2 col-span-1 lg:col-span-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asset Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name, serial, or location..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Asset Category</label>
            <div className="relative">
              <select 
                value={filterType} onChange={(e) => {setFilterType(e.target.value); setCurrentPage(1);}}
                className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-indigo-500 appearance-none shadow-sm"
              >
                <option value="All">All Categories</option>
                <option value="Equipment">Equipment</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Buildings">Buildings</option>
                <option value="Tools">Tools</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Health Status</label>
            <div className="relative">
              <select 
                value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value); setCurrentPage(1);}}
                className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-indigo-500 appearance-none shadow-sm"
              >
                <option value="All">All Statuses</option>
                <option value="operational">Operational</option>
                <option value="maintenance_due">Service Due</option>
                <option value="under_repair">Repairing</option>
                <option value="retired">Retired</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card overflow-hidden p-0 border-collapse">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Tactical Inventory...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Search size={40} className="opacity-30 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No matching tactical assets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                  <th className="px-6 py-4 text-left font-bold">Asset Info</th>
                  <th className="px-6 py-4 text-left font-bold">Category & Location</th>
                  <th className="px-6 py-4 text-left font-bold">Condition</th>
                  <th className="px-6 py-4 text-left font-bold">Valuation</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                           {item.asset_type === 'Vehicles' ? <Truck size={18} className="text-red-500"/> : 
                            item.asset_type === 'Buildings' ? <Building2 size={18} className="text-purple-500"/> :
                            item.asset_type === 'Equipment' ? <Drill size={18} className="text-orange-500"/> :
                            <Wrench size={18} className="text-indigo-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.asset_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">SN: {item.serial_number}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-2 items-start">
                         <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
                           {item.asset_type}
                         </span>
                         <div className="flex items-center gap-1.5">
                           <MapPin size={12} className="text-slate-400"/>
                           <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{item.location}</span>
                         </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${
                             item.asset_condition === 'excellent' ? 'bg-emerald-500' :
                             item.asset_condition === 'good' ? 'bg-blue-500' :
                             item.asset_condition === 'fair' ? 'bg-amber-500' : 'bg-red-500'
                           }`}/>
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">{item.asset_condition}</span>
                         </div>
                         <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border block w-fit ${
                           item.maintenance_status === 'operational' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                           item.maintenance_status === 'maintenance_due' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                           'bg-red-50 text-red-600 border-red-100'
                         }`}>
                           {item.maintenance_status.replace('_', ' ')}
                         </span>
                       </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <p className="text-sm font-black text-slate-900 dark:text-white">Rs. {Number(item.value).toLocaleString()}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1">
                         <Calendar size={10}/> {item.purchase_date_fmt}
                       </p>
                    </td>
                     <td className="px-6 py-4 text-right whitespace-nowrap">
                       <div className="flex items-center gap-2 justify-end">
                         <button 
                           onClick={() => { setSelectedAsset(item); setShowSellModal(true); }}
                           className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-all border border-transparent hover:border-emerald-200/50"
                           title="Sell Asset"
                         >
                           <DollarSign size={15} />
                         </button>
                         <button 
                           onClick={() => { setSelectedAsset(item); setShowEditModal(true); }}
                           className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all border border-transparent hover:border-blue-200/50"
                         >
                           <Edit2 size={15} />
                         </button>
                         <button 
                           onClick={() => { setSelectedAsset(item); setShowDeleteModal(true); }}
                           className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all border border-transparent hover:border-red-200/50"
                         >
                           <Trash2 size={15} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
      {/* Pagination */}
      {!loading && filteredData.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{indexOfFirstEntry + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(indexOfLastEntry, filteredData.length)}</span> OF <span className="text-slate-900 dark:text-white">{filteredData.length}</span> Tactical Assets
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronLeft size={16} />
               </button>
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                   key={i} onClick={() => paginate(i+1)}
                   className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-500 dark:hover:border-indigo-400 shadow-sm'}`}
                 >
                   {i+1}
                 </button>
               ))}
               <button 
                 onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Asset?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                Permanently remove <span className="font-bold">"{selectedAsset?.asset_name}"</span>?
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">
                  {isProcessing ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
           <div className="glass-panel w-full max-w-2xl rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Edit Physical Data</h2>
                 <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleEdit} className="p-8">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Asset Nomenclature</label>
                         <input type="text" value={selectedAsset.asset_name} onChange={(e)=>setSelectedAsset({...selectedAsset, asset_name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Type</label>
                           <select value={selectedAsset.asset_type} onChange={(e)=>setSelectedAsset({...selectedAsset, asset_type: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none">
                              <option>Equipment</option>
                              <option>Vehicles</option>
                              <option>Buildings</option>
                              <option>Tools</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Asset Value</label>
                           <input type="number" value={selectedAsset.value} onChange={(e)=>setSelectedAsset({...selectedAsset, value: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all" />
                         </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Condition</label>
                           <select value={selectedAsset.asset_condition} onChange={(e)=>setSelectedAsset({...selectedAsset, asset_condition: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none">
                              <option value="excellent">Excellent</option>
                              <option value="good">Good</option>
                              <option value="fair">Fair</option>
                              <option value="poor">Poor</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Status</label>
                           <select value={selectedAsset.maintenance_status} onChange={(e)=>setSelectedAsset({...selectedAsset, maintenance_status: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all appearance-none">
                              <option value="operational">Operational</option>
                              <option value="maintenance_due">Service Due</option>
                              <option value="under_repair">Under Repair</option>
                              <option value="retired">Retired</option>
                           </select>
                         </div>
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Station/Location</label>
                         <input type="text" value={selectedAsset.location} onChange={(e)=>setSelectedAsset({...selectedAsset, location: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all" />
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-3 pt-4">
                    <button type="submit" disabled={isProcessing} className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                       {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                       Update Asset Data
                    </button>
                    <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-widest rounded-xl">Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
      {/* Sell Asset Modal */}
      {showSellModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-xl rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50/30 dark:bg-emerald-900/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-600">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Sell Physical Asset</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Record sale & Transfer to Income</p>
                  </div>
                </div>
                <button onClick={() => setShowSellModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <form onSubmit={handleSell} className="p-8 space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Asset</p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedAsset?.asset_name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial #</p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedAsset?.serial_number}</h4>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Sale Date</label>
                     <input 
                       type="date" 
                       required
                       value={sellData.saleDate}
                       onChange={(e) => setSellData({...sellData, saleDate: e.target.value})}
                       className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-emerald-500" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Purchasing Party</label>
                     <input 
                       type="text" 
                       required
                       placeholder="Enter buyer name..."
                       value={sellData.buyer}
                       onChange={(e) => setSellData({...sellData, buyer: e.target.value})}
                       className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all"
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Sale Amount (LKR)</label>
                     <div className="relative">
                       <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                         type="number" 
                         required
                         placeholder="0.00"
                         value={sellData.amount}
                         onChange={(e) => setSellData({...sellData, amount: e.target.value})}
                         className="w-full pl-12 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-emerald-500" 
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Income Ledger</label>
                     <div className="relative">
                       <select 
                         required
                         value={sellData.incomeAccountId}
                         onChange={(e) => setSellData({...sellData, incomeAccountId: e.target.value})}
                         className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-emerald-500 appearance-none pr-10"
                       >
                          {incomeAccounts.map(acc => (
                            <option key={acc.id} value={acc.id} className="bg-white dark:bg-slate-900">{acc.code} - {acc.name}</option>
                          ))}
                          {incomeAccounts.length === 0 && <option value="">No income accounts found</option>}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                     </div>
                   </div>
                   <div className="col-span-2 space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Transaction Notes</label>
                     <textarea 
                       rows="2"
                       placeholder="Disposal reason, transfer of ownership details..."
                       value={sellData.notes}
                       onChange={(e) => setSellData({...sellData, notes: e.target.value})}
                       className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-emerald-500 resize-none"
                     ></textarea>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                     type="submit" 
                     disabled={isProcessing} 
                     className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                   >
                     {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <DollarSign size={18}/>}
                     Confirm Disposal & Sale
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setShowSellModal(false)} 
                     className="flex-1 py-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all"
                   >
                     Cancel
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendingUp({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function CircleX({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
