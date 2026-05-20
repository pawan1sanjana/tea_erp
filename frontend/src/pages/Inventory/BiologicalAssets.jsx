import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Calendar, AlertCircle, CheckCircle, 
  Search, Filter, ArrowRight, TreeDeciduous, 
  Ruler, Maximize2, Download, Edit2, Trash2, 
  ChevronLeft, ChevronRight, X, Save, Box,
  Loader2, Tag, ChevronDown, Sparkles, Layers, Activity, MapPin, Leaf, Hotel, FileText, FileSpreadsheet, DollarSign, Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function BiologicalAssetsInventoryPage() {
  const navigate = useNavigate();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Smart Filter State
  const [filterSpecies, setFilterSpecies] = useState('All');
  const [filterHeight, setFilterHeight] = useState('All');
  const [filterGirth, setFilterGirth] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(8);
  
  // Action Modals State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [blocks, setBlocks] = useState([]);
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
    fetchBlocks();
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
      const response = await apiClient.get('/inventory/biological');
      if (response.success) {
        setInventory(response.data);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await apiClient.get('/crop/blocks');
      if (response.success) setBlocks(response.data);
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedAsset) return;
    setIsProcessing(true);
    try {
      const response = await apiClient.delete(`/inventory/biological/${selectedAsset.id}`);
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
    const payload = { ...selectedAsset, census_date: selectedAsset.date };
    try {
      const response = await apiClient.put(`/inventory/biological/${selectedAsset.id}`, payload);
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'block_id') {
       const block = blocks.find(b => b.id.toString() === value.toString());
       setSelectedAsset(prev => ({ ...prev, block_id: value, block_name: block ? block.name : '' }));
    } else {
       setSelectedAsset(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setIsProcessing(true);
    try {
      const response = await apiClient.post(`/inventory/biological/${selectedAsset.id}/sell`, sellData);
      if (response.success) {
        setInventory(prev => prev.filter(item => item.id !== selectedAsset.id));
        setShowSellModal(false);
        // Toast notification would be nice here, but let's stick to state for now
        fetchInventory(); // Refresh to be safe
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to sell asset');
    } finally {
      setIsProcessing(false);
    }
  };

  // EXPORT FUNCTIONS
  const exportToExcel = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : inventory;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport.map(item => ({
      'ID': item.id,
      'Estate': item.estate_name,
      'Division': item.division_name,
      'Sector/Block': item.block_name,
      'Tree Species': item.tree_species,
      'Height (ft)': item.height_ft,
      'Girth (in)': item.girth_in,
      'Height Grade': item.height_category,
      'Girth Grade': item.girth_category,
      'Last Census': item.date
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Forestry_Inventory");
    XLSX.writeFile(workbook, `Filtered_Biological_Assets_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const dataToExport = filteredData.length > 0 ? filteredData : inventory;
    const doc = new jsPDF('landscape');
    doc.text("TeaERP Pro - Biological Assets Inventory (Filtered)", 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);
    doc.text(`Applied Filters: ${searchTerm || 'None'} | ${filterSpecies} | ${filterHeight}`, 14, 27);
    
    const tableData = dataToExport.map(item => [
      item.id,
      item.estate_name,
      item.block_name,
      item.tree_species,
      `${item.height_ft} (${item.height_category})`,
      `${item.girth_in} (${item.girth_category})`,
      item.date
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['ID', 'Estate', 'Sector', 'Species', 'Height', 'Girth', 'Last Census']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: [30, 64, 175] }
    });

    doc.save(`Filtered_Biological_Assets_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportOptions(false);
  };

  // Smart Filtering Logic
  const filteredData = inventory.filter(item => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.tree_species?.toLowerCase().includes(searchLow) || '') ||
      (item.block_name?.toLowerCase().includes(searchLow) || '') ||
      (item.estate_name?.toLowerCase().includes(searchLow) || '') ||
      (item.division_name?.toLowerCase().includes(searchLow) || '');
    
    const matchesSpecies = filterSpecies === 'All' || item.tree_species.includes(filterSpecies);
    const matchesHeight = filterHeight === 'All' || item.height_category === filterHeight;
    const matchesGirth = filterGirth === 'All' || item.girth_category === filterGirth;
    
    return matchesSearch && matchesSpecies && matchesHeight && matchesGirth;
  });

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Derived Species List for Filter
  const uniqueSpecies = ['All', ...new Set(inventory.map(i => i.tree_species.split(' (')[0]).filter(Boolean))];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Biological Inventory</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <TreeDeciduous size={14} className="text-tea-500" /> Advanced biometric tracking and forestry stock management
          </p>
        </div>
        <div className="flex gap-3 relative">
          <button
            onClick={() => navigate('/inventory/biological-audit')}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tea-600/20 transition-all hover:scale-[1.02]"
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
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <Layers size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Total Trees</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{inventory.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Activity size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Avg Height</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {inventory.length > 0 ? (inventory.reduce((a,c)=>a+Number(c.height_ft),0)/inventory.length).toFixed(1) : '0.0'}
              <span className="text-[10px] text-slate-400 font-bold ml-1">ft</span>
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <MapPin size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Avg Girth</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {inventory.length > 0 ? (inventory.reduce((a,c)=>a+Number(c.girth_in),0)/inventory.length).toFixed(1) : '0.0'}
              <span className="text-[10px] text-slate-400 font-bold ml-1">in</span>
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30">
            <Leaf size={22} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Latest Data</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                {inventory[0]?.date ? new Date(inventory[0].date).toLocaleDateString(undefined, {month:'short', year:'numeric'}) : 'N/A'}
            </h3>
          </div>
        </div>
      </div>

      {/* Smart Filter Panel */}
      <div className="premium-card pt-6 pb-6 pr-6 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-dashed">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Universal Search</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search species, estate, sector..." 
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:border-tea-500 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="space-y-2 min-w-[140px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Species</label>
              <div className="relative">
                <select 
                  value={filterSpecies} onChange={(e) => {setFilterSpecies(e.target.value); setCurrentPage(1);}}
                  className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-tea-500 appearance-none shadow-sm"
                >
                  {uniqueSpecies.map(s => <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="space-y-2 min-w-[140px]">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Height Grade</label>
              <div className="relative">
                <select 
                  value={filterHeight} onChange={(e) => {setFilterHeight(e.target.value); setCurrentPage(1);}}
                  className="w-full pl-3 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-wider outline-none focus:border-tea-500 appearance-none shadow-sm"
                >
                  <option value="All" className="bg-white dark:bg-slate-900">All Heights</option>
                  <option value="Mature" className="bg-white dark:bg-slate-900">Mature</option>
                  <option value="Tall" className="bg-white dark:bg-slate-900">Tall</option>
                  <option value="Sapling" className="bg-white dark:bg-slate-900">Sapling</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
             <Sparkles size={10} className="text-amber-500"/> Smart Chips:
           </span>
           <button 
             onClick={() => { setFilterHeight('Tall'); setCurrentPage(1); }}
             className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterHeight==='Tall' ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
           >
             Tall Timber
           </button>
           <button 
             onClick={() => { setFilterSpecies('Teak'); setCurrentPage(1); }}
             className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterSpecies==='Teak' ? 'bg-tea-100 text-tea-700 shadow-sm border border-tea-200' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-700 hover:bg-slate-50'}`}
           >
             Teak Only
           </button>
           {(filterSpecies !== 'All' || filterHeight !== 'All' || filterGirth !== 'All' || searchTerm) && (
             <button 
               onClick={() => { setFilterSpecies('All'); setFilterHeight('All'); setFilterGirth('All'); setSearchTerm(''); }}
               className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-600 hover:bg-red-100 transition-all flex items-center gap-1 ml-auto"
             >
               <CircleX size={10}/> Clear Filters
             </button>
           )}
        </div>
      </div>

      {/* Main Table */}
      <div className="premium-card overflow-hidden p-0 border-collapse">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-tea-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Synchronizing Biometric Data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Search size={40} className="opacity-30 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No matching assets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                  <th className="px-3 py-2.5 text-left font-bold w-[100px]">Tree ID</th>
                  <th className="px-3 py-2.5 text-left font-bold">Estate / Division</th>
                  <th className="px-3 py-2.5 text-left font-bold">Sector / Block</th>
                  <th className="px-3 py-2.5 text-left font-bold min-w-[200px]">Species</th>
                  <th className="px-3 py-2.5 text-left font-bold min-w-[200px]">Biometrics</th>
                  <th className="px-3 py-2.5 text-left font-bold">Last Census</th>
                  <th className="px-3 py-2.5 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-tea-500/10">
                          <Tag size={13} className="text-tea-600 dark:text-tea-400" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">#{String(item.id).padStart(3, '0')}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                       <div className="flex items-center gap-2 mb-1">
                          <Hotel size={12} className="text-tea-500" />
                          <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.estate_name}</span>
                       </div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.division_name}</span>
                    </td>
                    <td className="px-3 py-2.5">
                       <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                         {item.block_name || item.block_id || 'Global Sector'}
                       </span>
                    </td>
                    <td className="px-3 py-2.5">
                       <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.tree_species}</p>
                       <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5">Forestry Stock</p>
                    </td>
                    <td className="px-3 py-2.5">
                       <div className="flex items-center gap-3">
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.height_ft} ft</span>
                           <span className="text-[9px] text-slate-400 font-black uppercase tracking-tight">{item.height_category}</span>
                         </div>
                         <span className="w-px h-6 bg-slate-100 dark:bg-slate-800"></span>
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.girth_in} in</span>
                           <span className="text-[9px] text-slate-400 font-black uppercase tracking-tight">{item.girth_category}</span>
                         </div>
                       </div>
                    </td>
                    <td className="px-3 py-2.5">
                       <div className="flex items-center gap-2">
                         <Calendar size={12} className="text-slate-400" />
                         <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                           {item.date ? new Date(item.date).toLocaleDateString() : 'Pending'}
                         </span>
                       </div>
                    </td>
                     <td className="px-3 py-2.5 text-right">
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
        
        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{indexOfFirstEntry + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(indexOfLastEntry, filteredData.length)}</span> OF <span className="text-slate-900 dark:text-white">{filteredData.length}</span> Assets
             </p>
             <div className="flex gap-2">
               <button 
                 onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 dark:hover:border-tea-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronLeft size={16} />
               </button>
               {[...Array(totalPages)].map((_, i) => (
                 <button 
                   key={i} onClick={() => paginate(i+1)}
                   className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-tea-600 dark:bg-tea-500 text-white shadow-lg shadow-tea-600/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-tea-500 dark:hover:border-tea-400 shadow-sm'}`}
                 >
                   {i+1}
                 </button>
               ))}
               <button 
                 onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                 className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-tea-500 dark:hover:border-tea-400 transition-all disabled:opacity-20 shadow-sm"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Asset?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                Permanently remove <span className="font-bold">"{selectedAsset?.tree_species}"</span>?
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
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Edit Biometric Data</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <form onSubmit={handleEdit} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Assigned Sector</label>
                     <div className="relative">
                       <select name="block_id" value={selectedAsset.block_id} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500 appearance-none pr-10">
                          {blocks.map(b => <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">{b.name}</option>)}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Tree Species</label>
                     <div className="relative">
                       <select name="tree_species" value={selectedAsset.tree_species} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500 appearance-none pr-10">
                         <option className="bg-white dark:bg-slate-900">Teak (Tectona grandis)</option>
                         <option className="bg-white dark:bg-slate-900">Mahogany</option>
                         <option className="bg-white dark:bg-slate-900">Eucalyptus</option>
                         <option className="bg-white dark:bg-slate-900">Rosewood</option>
                         <option className="bg-white dark:bg-slate-900">Sandalwood</option>
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                     </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4 col-span-2">
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Height (ft)</label>
                       <input type="number" step="0.1" name="height_ft" value={selectedAsset.height_ft} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Girth (in)</label>
                       <input type="number" step="0.1" name="girth_in" value={selectedAsset.girth_in} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Census Date</label>
                       <div className="relative">
                          <input type="date" name="date" value={selectedAsset.date || ''} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500" />
                       </div>
                     </div>
                   </div>
                </div>
                <div className="flex gap-3 pt-4">
                   <button type="submit" disabled={isProcessing} className="flex-[2] py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-tea-600/20 flex items-center justify-center gap-2">
                     {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                     Update Biometrics
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
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Sell Biological Asset</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Record sale & Transfer to Income</p>
                  </div>
                </div>
                <button onClick={() => setShowSellModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <form onSubmit={handleSell} className="p-8 space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Asset</p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedAsset?.tree_species}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</p>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">#{selectedAsset?.id}</h4>
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
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Buyer Name</label>
                     <input 
                       type="text" 
                       required
                       placeholder="Enter buyer details..."
                       value={sellData.buyer}
                       onChange={(e) => setSellData({...sellData, buyer: e.target.value})}
                       className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-emerald-500" 
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
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Income Account</label>
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
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ml-1">Internal Notes</label>
                     <textarea 
                       rows="2"
                       placeholder="Transaction details, reference numbers..."
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
                     Complete Sale
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

function CircleX({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
