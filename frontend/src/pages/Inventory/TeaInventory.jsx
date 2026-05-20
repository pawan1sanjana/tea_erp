import React, { useState, useEffect } from "react";
import { 
  Package, 
  Warehouse, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Activity, 
  Search, 
  Tag, 
  ArrowUpRight,
  ArrowDownRight,
  History,
  Settings2,
  ChevronRight,
  Filter,
  Layers,
  CircleDollarSign,
  Scale,
  PlusCircle
} from "lucide-react";
import { apiClient } from '../../api/client';

export default function TeaInventory() {
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFormData, setStockFormData] = useState({
    grade: "BOPF",
    size_grams: 500,
    quantity: 0,
    unit_price: ""
  });

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/tea-packets/stock');
      if (res.success) setStock(res.data);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/tea-packets/stock', stockFormData);
      if (res.success) {
        fetchStock();
        setStockFormData({ grade: "BOPF", size_grams: 500, quantity: 0, unit_price: "" });
      }
    } catch (error) {
      alert("Failed to update stock");
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm("Are you sure you want to remove this tea packet type?")) return;
    try {
      const res = await apiClient.delete(`/tea-packets/stock/${id}`);
      if (res.success) fetchStock();
    } catch (error) {
      alert("Failed to remove stock type");
    }
  };

  const totalValue = stock.reduce((acc, s) => acc + (s.current_stock * parseFloat(s.unit_price)), 0);
  const totalUnits = stock.reduce((acc, s) => acc + s.current_stock, 0);
  const lowStockCount = stock.filter(s => s.current_stock < 10).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Tea Packet Inventory</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 mt-1">
            <Warehouse size={12} className="text-tea-500" /> Strategic Stock Management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Last Audit</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1 uppercase">May 06, 2026</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-tea-600 shadow-sm">
            <Activity size={20} />
          </div>
        </div>
      </div>

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Warehouse size={64} className="text-tea-600" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Gross Stock Volume</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalUnits.toLocaleString()} <span className="text-xs text-slate-400 font-bold">Units</span></h3>
          <div className="mt-4 flex items-center gap-1.5 text-emerald-600">
            <ArrowUpRight size={14} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Healthy Capacity</span>
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CircleDollarSign size={64} className="text-amber-600" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Inventory Valuation</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Rs {totalValue.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-slate-400">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Current Market Rates</span>
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group border-rose-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle size={64} className="text-rose-600" />
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Replenishment Alerts</p>
          <h3 className={`text-2xl font-black ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
            {lowStockCount} <span className="text-xs text-slate-400 font-bold">Low Items</span>
          </h3>
          <div className="mt-4 flex items-center gap-1.5 text-rose-500">
            <Activity size={14} className={lowStockCount > 0 ? "animate-pulse" : ""} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{lowStockCount > 0 ? 'Action Required' : 'All Clear'}</span>
          </div>
        </div>

        <div className="premium-card relative overflow-hidden group bg-tea-600 border-none">
          <div className="absolute -bottom-2 -right-2 opacity-10">
            <Tag size={100} className="text-white rotate-12" />
          </div>
          <p className="text-[10px] text-tea-100 font-black uppercase tracking-widest mb-1">Stock Portfolio</p>
          <h3 className="text-2xl font-black text-white">{stock.length} <span className="text-xs text-tea-200 font-bold">Categories</span></h3>
          <p className="text-[10px] text-tea-200 mt-4 font-bold uppercase tracking-tight">Active Distribution Grades</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration Panel */}
        <div className="lg:col-span-1">
          <div className="premium-card sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-slate-900 text-white dark:bg-tea-600"><Plus size={20} /></div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Configure Assets</h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Add or update packet types</p>
              </div>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Packet Grade</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" required list="tea-grades"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black uppercase focus:ring-2 focus:ring-tea-500/20 outline-none transition-all"
                    placeholder="E.G. BOPF, DUST..."
                    value={stockFormData.grade}
                    onChange={(e) => setStockFormData({...stockFormData, grade: e.target.value.toUpperCase()})}
                  />
                  <datalist id="tea-grades">
                    <option value="BOPF" /><option value="BOP" /><option value="DUST" /><option value="OP" /><option value="SILVER TIPS" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Size (Grams)</label>
                  <div className="relative">
                    <Scale className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="number" required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black"
                      value={stockFormData.size_grams}
                      onChange={(e) => setStockFormData({...stockFormData, size_grams: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Restock Units</label>
                  <div className="relative">
                    <PlusCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="number" min="0" required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-black"
                      placeholder="Qty"
                      value={stockFormData.quantity}
                      onChange={(e) => setStockFormData({...stockFormData, quantity: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price Per Unit (Rs)</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-tea-600" size={16} />
                  <input 
                    type="number" step="0.01" required
                    className="w-full pl-11 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-black text-tea-600 focus:ring-4 focus:ring-tea-500/10 outline-none"
                    placeholder="0.00"
                    value={stockFormData.unit_price}
                    onChange={(e) => setStockFormData({...stockFormData, unit_price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-tea-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-tea-700 transition-all shadow-xl shadow-tea-600/20 active:scale-95"
              >
                Sync with Inventory
              </button>
            </form>
          </div>
        </div>

        {/* Right: Inventory Listing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search inventory grade..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-bold uppercase tracking-wider focus:ring-2 focus:ring-tea-500/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
               <div className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2">
                 <Filter size={12} className="text-slate-400" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sort: A-Z</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-tea-100 border-t-tea-600 rounded-full animate-spin"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Warehouse Data...</p>
              </div>
            ) : stock.filter(s => s.grade.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
              <div key={item.id} className="premium-card group hover:scale-[1.02] transition-all duration-300 relative border-slate-200/60 shadow-lg shadow-slate-100/50 bg-white dark:bg-slate-900">
                <button 
                  onClick={() => handleDeleteStock(item.id)}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="flex items-start gap-4 mb-6">
                  <div className={`p-4 rounded-2xl ${item.current_stock < 10 ? 'bg-rose-100 text-rose-600' : 'bg-tea-100 text-tea-600'} transition-colors`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none uppercase tracking-tighter">{item.grade}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{item.size_grams}g Standard Pack</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Available Stock</p>
                    <p className={`text-xl font-black ${item.current_stock < 10 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>{item.current_stock}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Asset Value</p>
                    <p className="text-xl font-black text-tea-600">Rs {parseFloat(item.unit_price).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
                  <div className="flex items-center gap-1.5">
                    <History size={12} className="text-slate-400" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Updated 2h ago</span>
                  </div>
                  <button className="text-[9px] font-black text-tea-600 uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loading && stock.length === 0 && (
            <div className="premium-card py-20 flex flex-col items-center justify-center text-slate-400 border-dashed">
              <Layers size={48} className="opacity-20 mb-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">No Inventory Data</h3>
              <p className="text-[10px] font-medium mt-1">Configure your first tea packet type to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
