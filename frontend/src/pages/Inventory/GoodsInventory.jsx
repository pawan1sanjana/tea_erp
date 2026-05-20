import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Package, Search, Filter, ArrowRight, Truck, 
  Ruler, Maximize2, Download, Edit2, Trash2, Plus,
  ChevronLeft, ChevronRight, X, Save, Box,
  Loader2, Tag, ChevronDown, Sparkles, Layers, Activity, MapPin, Hotel, FileText, FileSpreadsheet,
  Wrench, Building2, Drill, ShieldCheck, TrendingUp, AlertCircle, CircleX, Calendar, DollarSign, RefreshCcw, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORIES = [
  "All", "Fertilizers & Chemicals", "Harvesting Tools", "Machinery Spares", 
  "Fuel & Lubricants", "Packaging Materials", "Safety Gear", "Nursery Supplies", "Factory Consumables"
];

export default function GoodsInventoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [suppliers, setSuppliers] = useState([]);

  // Modals States
  const [selectedItem, setSelectedItem] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stockForm, setStockForm] = useState({ increment: '', unit_price: '' });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchSuppliers();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/goods');
      if (response.success) setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch goods inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/suppliers');
      if (response.success) setSuppliers(response.data);
    } catch (error) {
       console.error("Suppliers load failed");
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setSaving(true);
      const response = await apiClient.patch(`/inventory/goods/${selectedItem.id}/stock`, {
          increment: Number(stockForm.increment),
          unit_price: Number(stockForm.unit_price) || selectedItem.unit_price
      });
      if (response.success) {
          setShowStockModal(false);
          setStockForm({ increment: '', unit_price: '' });
          fetchInventory();
      }
    } catch (error) {
       console.error("Failed to update stock");
    } finally {
       setSaving(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.put(`/inventory/goods/${editForm.id}`, editForm);
      if (response.success) {
        setShowEditModal(false);
        fetchInventory();
      }
    } catch (error) {
       console.error("Update failed");
    } finally {
       setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      setSaving(true);
      const response = await apiClient.delete(`/inventory/goods/${selectedItem.id}`);
      if (response.success) {
        setShowDeleteModal(false);
        fetchInventory();
      }
    } catch (error) {
       console.error("Delete failed");
    } finally {
       setSaving(false);
    }
  };

  const exportToExcel = () => {
    const tableData = filteredData.map(item => ({
      'Item Name': item.item_name,
      'SKU': item.sku,
      'Category': item.category,
      'Location': item.location,
      'Quantity': `${item.quantity} ${item.unit}`,
      'Unit Price': item.unit_price,
      'Stock Value': Number(item.quantity) * Number(item.unit_price)
    }));
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    XLSX.writeFile(wb, `Goods_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Goods Inventory Report', 14, 15);
    const tableData = filteredData.map(item => [
      item.item_name,
      item.sku,
      item.category,
      item.location,
      `${item.quantity} ${item.unit}`,
      item.unit_price
    ]);
    autoTable(doc, {
      head: [['Item Name', 'SKU', 'Category', 'Location', 'Quantity', 'Price']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [4, 120, 87] } // tea-700
    });
    doc.save(`Goods_Inventory_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportOptions(false);
  };

  const filteredData = inventory.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    const isLowStock = Number(item.quantity) <= Number(item.min_stock_level);
    const matchesStatus = filterStatus === 'All' || (filterStatus === 'Low' ? isLowStock : !isLowStock);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    totalItems: inventory.length,
    totalValue: inventory.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unit_price)), 0),
    lowStock: inventory.filter(i => Number(i.quantity) <= Number(i.min_stock_level)).length,
    categoriesCount: new Set(inventory.map(i => i.category)).size
  };

  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Plantation Resources</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Package size={14} className="text-tea-500" /> Strategic estate inventory: chemicals, tools, and factory inputs
          </p>
        </div>
        <div className="flex gap-3 relative">
          <button
            onClick={() => navigate('/inventory/goods/history')}
            className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
          >
            <History size={16} /> Audit Trail
          </button>
          <button
            onClick={() => navigate('/inventory/goods/issue')}
            className="flex items-center gap-2 px-5 py-3 border-2 border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all font-outfit"
          >
            <RefreshCcw size={16} /> Issue Items
          </button>
          <button
            onClick={() => navigate('/inventory/goods/new')}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tea-600/20 transition-all hover:scale-[1.02]"
          >
            <PlusCircle size={16} /> Register Item
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <Box size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Total SKUs</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats.totalItems}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <TrendingUp size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Asset Value</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              <span className="text-[10px] text-slate-400 font-bold mr-1">LKR</span>{(stats.totalValue / 1000).toFixed(1)}K
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <AlertCircle size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Low Stock</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats.lowStock}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <Layers size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Estate Segments</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{stats.categoriesCount}</h3>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search nomenclature, SKU..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-tea-500/10 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <button onClick={() => setFilterStatus('Low')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus==='Low' ? 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-200 dark:bg-slate-800/50'}`}>Critical Alerts</button>
             <button onClick={() => { setSearchTerm(''); setFilterCategory('All'); setFilterStatus('All'); }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-red-500 transition-colors">Clear</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left font-bold">Item Nomenclature</th>
                <th className="px-6 py-4 text-left font-bold">Category & Logistics</th>
                <th className="px-6 py-4 text-left font-bold">Stock metrics</th>
                <th className="px-6 py-4 text-left font-bold">Valuation</th>
                <th className="px-6 py-4 text-right font-bold tracking-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                   <td colSpan="5" className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-tea-500 animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing logistics grid...</p>
                   </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                   <td colSpan="5" className="py-24 text-center text-slate-400 italic font-medium uppercase text-[10px] tracking-widest opacity-60">
                      No strategic assets matching query
                   </td>
                </tr>
              ) : (
                currentEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-400/5 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm text-tea-600">
                           <Box size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.item_name}</p>
                          <p className="text-[9px] font-black text-tea-500 mt-0.5 uppercase tracking-widest">{item.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="w-fit text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700 block mb-1">
                          {item.category}
                       </span>
                       <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase truncate">
                          <MapPin size={10} className="text-slate-400" /> {item.location}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${Number(item.quantity) <= Number(item.min_stock_level) ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                          <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{item.quantity} {item.unit}</span>
                       </div>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">Min Threshold: {item.min_stock_level}</span>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">LKR {Number(item.unit_price).toLocaleString()}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">Per {item.unit}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={() => { setSelectedItem(item); setStockForm({ increment: '', unit_price: item.unit_price }); setShowStockModal(true); }}
                            className="p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-transparent hover:border-emerald-200/50 transition-all"
                            title="Quick Stock In"
                          >
                             <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => { setEditForm(item); setShowEditModal(true); }}
                            className="p-2.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-transparent hover:border-blue-200/50 transition-all"
                            title="Edit Record"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }}
                            className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 border border-transparent hover:border-red-200/50 transition-all"
                            title="Purge Record"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredData.length > 0 && (
          <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
             <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Showing <span className="text-slate-900 dark:text-white">{indexOfFirstEntry + 1}</span> - <span className="text-slate-900 dark:text-white">{Math.min(indexOfLastEntry, filteredData.length)}</span> OF <span className="text-slate-900 dark:text-white">{filteredData.length}</span> Logistic SKUs
             </p>
             <div className="flex gap-2">
               <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:border-tea-500 transition-all shadow-sm">
                 <ChevronLeft size={16} />
               </button>
               {[...Array(totalPages)].map((_, i) => (
                 <button key={i} onClick={() => paginate(i+1)} className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${currentPage === i+1 ? 'bg-tea-600 text-white shadow-lg shadow-tea-500/20' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-tea-500'}`}>
                   {i+1}
                 </button>
               ))}
               <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:border-tea-500 transition-all shadow-sm">
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        )}
      </div>

      {/* Modern Add Stock Modal */}
      {showStockModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowStockModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Stock Inflow</h3>
                  <p className="text-[10px] font-black text-tea-600 uppercase mt-1">Resource: {selectedItem?.item_name}</p>
                </div>
                <button onClick={() => setShowStockModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddStock} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity to Add</label>
                  <input 
                    type="number" required min="1" step="0.01"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all"
                    value={stockForm.increment} onChange={(e) => setStockForm({...stockForm, increment: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Update Unit Price (LKR)</label>
                  <input 
                    type="number" step="0.01" min="0" placeholder={selectedItem?.unit_price}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all"
                    value={stockForm.unit_price} onChange={(e) => setStockForm({...stockForm, unit_price: e.target.value})}
                  />
                </div>
                <button type="submit" disabled={saving} className="w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex gap-2 justify-center items-center">
                   {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Authorize update
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modern Full Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowEditModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Modify Asset Metadata</h3>
                  <p className="text-[10px] font-black text-tea-600 uppercase mt-1 tracking-widest">Target SKU: {editForm.sku}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleUpdateItem} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Nomenclature</label>
                      <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={editForm.item_name} onChange={(e)=>setEditForm({...editForm, item_name: e.target.value})} /></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Classification</label>
                      <select className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all appearance-none" value={editForm.category} onChange={(e)=>setEditForm({...editForm, category: e.target.value})}>
                         {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                      </select></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Location Deployment</label>
                      <input type="text" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={editForm.location} onChange={(e)=>setEditForm({...editForm, location: e.target.value})} /></div>
                   <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Unit Valuation (LKR)</label>
                      <input type="number" step="0.01" required className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={editForm.unit_price} onChange={(e)=>setEditForm({...editForm, unit_price: e.target.value})} /></div>
                </div>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <button type="button" onClick={()=>setShowEditModal(false)} className="py-4 border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px] rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                  <button type="submit" disabled={saving} className="py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl flex justify-center items-center gap-2">
                     {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Commit changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 animate-in zoom-in-95 duration-200 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200/50">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Purge Asset?</h2>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-3 mb-8 uppercase tracking-wider leading-relaxed">
                You are about to permanently remove <span className="text-red-500">"{selectedItem?.item_name}"</span> from the logistics vault. This action is final.
              </p>
              <div className="flex w-full gap-4">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                  Cancel
                </button>
                <button onClick={confirmDelete} disabled={saving}
                  className="flex-1 px-4 py-3.5 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Purge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
