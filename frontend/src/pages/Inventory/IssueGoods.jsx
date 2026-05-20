import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlusCircle, Package, Search, Filter, ArrowRight, Truck, 
  Ruler, Maximize2, Download, Edit2, Trash2, Plus, ArrowLeft,
  ChevronLeft, ChevronRight, X, Save, Box, Scan, QrCode,
  Loader2, Tag, ChevronDown, Sparkles, Layers, Activity, MapPin, 
  CheckCircle2, Printer, RefreshCcw, Send, AlertCircle, FileText, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

/* ─── Tiny QR placeholder (renders a simple SVG QR-like grid for demo) ─── */
function QRPlaceholder({ text, size = 60 }) {
  return (
    <div className="bg-white p-1 rounded-lg shadow-inner">
      <svg width={size} height={size} viewBox="0 0 10 10" style={{ imageRendering: "pixelated" }} className="rounded-sm">
        <rect width="10" height="10" fill="white" />
        <rect x="1" y="1" width="3" height="3" fill="#1e293b" />
        <rect x="1.5" y="1.5" width="2" height="2" fill="white" />
        <rect x="2" y="2" width="1" height="1" fill="#1e293b" />
        <rect x="6" y="1" width="3" height="3" fill="#1e293b" />
        <rect x="6.5" y="1.5" width="2" height="2" fill="white" />
        <rect x="7" y="2" width="1" height="1" fill="#1e293b" />
        <rect x="1" y="6" width="3" height="3" fill="#1e293b" />
        <rect x="1.5" y="6.5" width="2" height="2" fill="white" />
        <rect x="2" y="7" width="1" height="1" fill="#1e293b" />
        {[5,6,7,8].map(x => [5,6,7,8].map(y =>
          (x + y) % 2 === 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="0.8" height="0.8" fill="#1e293b" /> : null
        ))}
      </svg>
    </div>
  );
}

export default function IssueGoods() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [issuedData, setIssuedData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Form States for Step 2
  const [issueForm, setIssueForm] = useState({
    quantity: 1,
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchInventory();
    fetchBlocks();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/inventory/goods');
      if (response.success) setAllItems(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await apiClient.get('/crop/blocks');
      if (response.success) setBlocks(response.data);
    } catch (error) {
       console.error("Failed to fetch blocks");
    }
  };

  const handleQrScan = (val) => {
    setQrInput(val);
    const found = allItems.find(it => it.sku.toLowerCase() === val.toLowerCase());
    if (found) {
      setSelectedItem(found);
      setStep(2);
      setQrInput('');
    }
  };

  const handleConfirmIssue = async (e) => {
    e.preventDefault();
    if (issueForm.quantity > selectedItem.quantity) return;
    try {
      setIsProcessing(true);
      const response = await apiClient.post(`/inventory/goods/${selectedItem.id}/issue`, issueForm);
      if (response.success) {
        setIssuedData({
          item: selectedItem,
          qty: issueForm.quantity,
          ref: issueForm.reference,
          date: new Date().toLocaleString(),
          remaining: selectedItem.quantity - issueForm.quantity
        });
        setStep(3);
      }
    } catch (error) {
       console.error("Issuance failed");
    } finally {
       setIsProcessing(false);
    }
  };

  const filteredItems = (searchTerm ? allItems.filter(it => 
    it.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    it.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) : allItems).filter(it => it.quantity > 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <header className="flex items-center gap-6">
        <button 
          onClick={() => navigate('/inventory/goods')}
          className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 hover:text-tea-500 shadow-sm transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-outfit">Issue Items</h1>
          <div className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1 italic">
             <span className="w-2 h-2 rounded-full bg-orange-500" /> Authorized stock issuance and strategic resource deployment
          </div>
        </div>
      </header>

      {/* Step Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          { step: 1, label: 'Identify Item', icon: Scan },
          { step: 2, label: 'Issue Details', icon: FileText },
          { step: 3, label: 'Confirmation', icon: CheckCircle2 }
        ].map((t) => (
          <button 
            key={t.step}
            onClick={() => step > t.step && setStep(t.step)}
            disabled={step < t.step}
            className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl transition-all ${step === t.step ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm' : 'text-slate-400 opacity-60 cursor-default'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${step === t.step ? 'bg-tea-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
              {t.step}
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="animate-in slide-in-from-bottom-4 duration-300">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scanner Card */}
            <div className="premium-card bg-slate-900 border-none group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-tea-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-tea-500/30 transition-all duration-700" />
               <div className="p-8 relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                      <Scan size={24} className="text-white animate-pulse" />
                    </div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">Smart Scanner</h2>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / QR Deployment</label>
                    <input 
                      type="text" autoFocus
                      value={qrInput} onChange={(e) => handleQrScan(e.target.value)}
                      placeholder="Scan SKU bar here..."
                      className="w-full px-6 py-4 bg-white/5 border-2 border-white/10 focus:border-tea-500 rounded-2xl text-white font-bold outline-none transition-all placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optical Sync Active</span>
                  </div>
               </div>
            </div>

            {/* Manual Selection */}
            <div className="premium-card p-8">
               <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Layers size={18} className="text-tea-500" /> Manual Select
               </h2>
               <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search terminology..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-tea-500/10 outline-none transition-all"
                    value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {loading ? (
                    <div className="py-12 text-center text-slate-400 uppercase text-[10px] font-black animate-pulse">Initializing Assets...</div>
                  ) : filteredItems.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 italic">No available items found</div>
                  ) : filteredItems.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setStep(2); }}
                      className="w-full p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-tea-500/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between text-left group"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{item.item_name}</p>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mt-0.5">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-tea-600 uppercase">{item.quantity} {item.unit}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Available</p>
                      </div>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        )}

        {step === 2 && selectedItem && (
          <div className="space-y-6">
             {/* Selected Item Banner */}
             <div className="bg-gradient-to-r from-tea-600 to-emerald-600 rounded-[2.5rem] p-8 shadow-2xl shadow-tea-600/20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 decoration-tea-300 underline underline-offset-4">Target Resource</span>
                      <h2 className="text-4xl font-black tracking-tighter mt-2">{selectedItem.item_name}</h2>
                      <p className="text-tea-200 text-xs font-bold font-mono mt-1 opacity-90">{selectedItem.sku} • {selectedItem.category}</p>
                   </div>
                   <div className="bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                      <QRPlaceholder size={80} text={selectedItem.sku} />
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-6 mt-12">
                   <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Deployment</p>
                      <p className="text-lg font-black mt-1">{selectedItem.location}</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10 text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Available</p>
                      <p className="text-lg font-black mt-1">{selectedItem.quantity} {selectedItem.unit}</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-sm p-4 rounded-3xl border border-white/10 text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Status</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                         <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                         <span className="text-lg font-black">In Stock</span>
                      </div>
                   </div>
                </div>
             </div>

             {/* Issuance Form */}
             <div className="premium-card p-10">
                <form onSubmit={handleConfirmIssue} className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity to Issue ({selectedItem.unit})</label>
                         <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setIssueForm({...issueForm, quantity: Math.max(1, issueForm.quantity - 1)})} className="w-12 h-12 rounded-xl border-2 border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 translate-y-[-1px] hover:border-tea-500 hover:text-tea-500 transition-all">-</button>
                            <input 
                              type="number" required min="1" max={selectedItem.quantity}
                              className="flex-1 px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-xl font-black text-center outline-none transition-all"
                              value={issueForm.quantity} onChange={(e) => setIssueForm({...issueForm, quantity: Number(e.target.value)})}
                            />
                            <button type="button" onClick={() => setIssueForm({...issueForm, quantity: Math.min(selectedItem.quantity, issueForm.quantity + 1)})} className="w-12 h-12 rounded-xl border-2 border-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 translate-y-[-1px] hover:border-tea-500 hover:text-tea-500 transition-all">+</button>
                         </div>
                         {issueForm.quantity > selectedItem.quantity && (
                           <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider pl-1">⚠ Critical: Exceeds available stock!</p>
                         )}
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-tea-600">Target Field Block / Division</label>
                         <div className="relative group">
                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-tea-500 transition-colors shadow-sm" size={20} />
                            <select 
                              required
                              className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-black outline-none transition-all appearance-none uppercase tracking-tight"
                              value={issueForm.reference} onChange={(e) => setIssueForm({...issueForm, reference: e.target.value})}
                            >
                               <option value="" className="text-slate-400 italic">Select Landing Sector...</option>
                               {blocks.map(block => (
                                 <option key={block.id} value={block.name}>{block.name} (Ref: {block.division_name})</option>
                               ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                         </div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Notes</label>
                      <textarea 
                        rows={3}
                        placeholder="Specify deployment rationale..."
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all resize-none"
                        value={issueForm.notes} onChange={(e) => setIssueForm({...issueForm, notes: e.target.value})}
                      />
                   </div>

                   <div className="pt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                      <button type="button" onClick={() => setStep(1)} className="text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">← Reselect Asset</button>
                      <button 
                        type="submit" disabled={isProcessing || issueForm.quantity > selectedItem.quantity || !issueForm.reference}
                        className="px-10 py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-tea-600/20 disabled:opacity-50 transition-all flex items-center gap-3"
                      >
                         {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />} Authorize Issuance
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {step === 3 && issuedData && (
          <div className="space-y-8 max-w-2xl mx-auto">
             <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-emerald-200/50 animate-bounce">
                   <CheckCircle2 size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase truncate">Items Issued Successfully!</h2>
                <p className="text-slate-500 text-sm font-bold">The logistical loop is closed. Resource deployment verified.</p>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-500">
                <div className="p-10 space-y-8 relative">
                   <div className="absolute top-0 right-0 p-8 text-tea-600/10">
                      <Tag size={120} />
                   </div>
                   <div className="text-center border-b border-slate-100 dark:border-slate-800 pb-8">
                      <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] mb-1">Stock Issue Receipt</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{issuedData.date}</p>
                   </div>

                   <div className="space-y-4">
                      {[
                        { label: 'Asset Issued', value: issuedData.item.item_name, color: 'text-slate-900 dark:text-white' },
                        { label: 'Strategic SKU', value: issuedData.item.sku, color: 'text-slate-500' },
                        { label: 'Issued Quantity', value: `${issuedData.qty} ${issuedData.item.unit}`, color: 'text-tea-600 font-black' },
                        { label: 'Landing Sector', value: issuedData.ref, color: 'text-blue-600 font-black' },
                        { label: 'Vault Balance', value: `${issuedData.remaining} ${issuedData.item.unit}`, color: 'text-slate-500' }
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center text-xs">
                           <span className="font-bold text-slate-400 uppercase tracking-wider">{row.label}</span>
                           <span className={`font-black uppercase tracking-tight ${row.color}`}>{row.value}</span>
                        </div>
                      ))}
                   </div>

                   <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col items-center">
                      <QRPlaceholder size={100} text={`ISSUE:${issuedData.item.sku}|QTY:${issuedData.qty}|BLOCK:${issuedData.ref}`} />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Optical Verification Tag</p>
                   </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/10 p-6 flex gap-3">
                   <button onClick={() => window.print()} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
                      <Printer size={16} /> Print Proof
                   </button>
                   <button onClick={() => { setStep(1); setSelectedItem(null); setIssuedData(null); setIssueForm({ quantity: 1, reference: '', notes: '' }); }} className="flex-1 bg-tea-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-tea-700 transition-all shadow-xl shadow-tea-600/20">
                      <PlusCircle size={16} /> Issue Again
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
