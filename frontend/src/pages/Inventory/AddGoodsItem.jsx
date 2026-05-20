import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  ArrowLeft, Info, Package, DollarSign, MapPin, Tag, 
  Trash2, Download, Printer, Save, Sparkles, Box, ChevronDown, CheckCircle2, AlertCircle, Loader2, PlusCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api/client";

// ── Minimal QR renderer via QRServer API ──
function QRImage({ text, size = 152 }) {
  if (!text) return null;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=0f172a&bgcolor=f8fafc`;
  return <img src={url} alt="QR Code" width={size} height={size} className="rounded-xl" />;
}

const CATEGORIES = [
  "Fertilizers & Chemicals", "Harvesting Tools", "Machinery Spares", 
  "Fuel & Lubricants", "Packaging Materials", "Safety Gear", "Nursery Supplies", "Factory Consumables"
];

export default function AddGoodsItem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    item_name: "", sku: "", category: "", location: "",
    description: "", quantity: "", unit: "pcs",
    unit_price: "", min_stock_level: "5", supplier_id: "",
  });
  const [suppliers, setSuppliers] = useState([]);
  const [qrText, setQrText] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedItem, setSavedItem] = useState(null);
  const [toast, setToast] = useState(null);
  const debounceRef = useRef(null);

  // Load suppliers on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await apiClient.get('/suppliers');
      if (response.success) {
        setSuppliers(response.data);
      }
    } catch (error) {
       console.error("Failed to load suppliers");
    }
  };

  // Debounced QR preview update
  const scheduleQRUpdate = useCallback((f) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const { item_name, sku, quantity, unit, location } = f;
      if (!item_name && !sku) { setQrText(""); return; }
      setQrText(`ITEM:NEW|NAME:${item_name}|SKU:${sku}|QTY:${quantity || 0} ${unit}|LOC:${location}`);
    }, 300);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    setForm(updated);
    scheduleQRUpdate(updated);
  };

  const autoSKU = () => {
    const prefix = form.category ? form.category.substring(0, 3).toUpperCase() : "ITM";
    const nameCode = form.item_name
      ? form.item_name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "") || "XXX"
      : "XXX";
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const sku = `${prefix}-${nameCode}-${suffix}`;
    const updated = { ...form, sku };
    setForm(updated);
    scheduleQRUpdate(updated);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiClient.post('/inventory/goods', form);
      if (response.success) {
        const item = { id: response.id, ...form };
        setSavedItem(item);
        const realQR = `ITEM:${response.id}|NAME:${item.item_name}|SKU:${item.sku}|QTY:${item.quantity} ${item.unit}|LOC:${item.location}`;
        setQrText(realQR);
        showToast("Item created successfully!");
      } else {
        showToast(response.error || "Failed to create item", "error");
      }
    } catch (error) {
      showToast("Connection error", "error");
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = () => {
    if (!savedItem || !qrText) return;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrText)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_${savedItem.sku || "item"}.png`;
    a.click();
  };

  const printQR = () => {
    if (!savedItem || !qrText) return;
    const imgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`;
    const w = window.open("", "_blank");
    w.document.write(`<html><head><title>QR Label - ${savedItem.item_name}</title>
    <style>body{font-family:'Outfit',sans-serif;text-align:center;padding:24px;background:#fff;} h2{font-size:16px;margin:12px 0 4px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;} p{font-size:12px;color:#64748b;margin:3px;font-weight:600;} .box{border:2px solid #e2e8f0;border-radius:24px;padding:32px;display:inline-block;min-width:240px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);} img{border-radius:16px;margin-bottom:8px;}</style>
    </head><body><div class="box">
    <img src="${imgUrl}" width="180">
    <h2>${savedItem.item_name}</h2>
    <p>SKU: <strong>${savedItem.sku}</strong></p>
    <p>STOCK: <strong>${savedItem.quantity} ${savedItem.unit}</strong></p>
    <p>LOCATION: <strong>${savedItem.location || "N/A"}</strong></p>
    <p style="margin-top:16px;font-size:10px;color:#94a3b8;letter-spacing:0.1em;text-transform:uppercase;font-weight:900;">TeaERP Tactical Edge</p>
    </div><script>window.onload=()=>{window.print()}<\/script></body></html>`);
    w.document.close();
  };

  const inputCls = "w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none";
  const selectCls = "w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all appearance-none outline-none";
  const labelCls = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-2 block";
  const iconCls = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Register Plantation Asset</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
             <PlusCircle size={14} className="text-tea-500" /> Strategic resource onboarding for estate and factory operations
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* ── Left: Form ── */}
        <div className="lg:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="space-y-8">

            {/* Basic Information */}
            <div className="premium-card p-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <Box className="text-indigo-500" size={14} /> Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                <div className="space-y-1">
                  <label className={labelCls}>Nomenclature <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Package className={iconCls} size={18} />
                    <input
                      type="text" name="item_name" required placeholder="e.g. Tactical Drill X2"
                      value={form.item_name} onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>SKU identifier <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Tag className={iconCls} size={18} />
                    <input
                      type="text" name="sku" required placeholder="e.g. TACT-882"
                      value={form.sku} onChange={handleChange}
                      className={inputCls + " font-mono pr-24 uppercase"}
                    />
                    <button
                      type="button" onClick={autoSKU}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 rounded-xl transition-all"
                    >
                      Draft SKU
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Strategic Classification</label>
                  <div className="relative">
                    <Box className={iconCls + " pointer-events-none"} size={18} />
                    <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                      <option value="">Select Category</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={labelCls}>Field Deployment / Shelf</label>
                  <div className="relative">
                    <MapPin className={iconCls} size={18} />
                    <input
                      type="text" name="location" placeholder="e.g. WH-SEC-04"
                      value={form.location} onChange={handleChange}
                      className={inputCls + " uppercase"}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className={labelCls}>Logistical Notes</label>
                  <textarea
                    name="description" rows={3} placeholder="Technical details, maintenance intervals..."
                    value={form.description} onChange={handleChange}
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Stock & Pricing */}
            <div className="premium-card p-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                <DollarSign className="text-emerald-500" size={14} /> Numerical Data
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <label className={labelCls}>Opening Vol</label>
                  <input
                    type="number" name="quantity" required min="0" placeholder="0"
                    value={form.quantity} onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Unit type</label>
                  <input
                    type="text" name="unit" placeholder="pcs"
                    value={form.unit} onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Valuation</label>
                  <input
                    type="number" name="unit_price" step="0.01" min="0" placeholder="0.00"
                    value={form.unit_price} onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Threshold</label>
                  <input
                    type="number" name="min_stock_level" min="0"
                    value={form.min_stock_level} onChange={handleChange}
                    className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none"
                  />
                </div>
              </div>
              <div className="mt-8 space-y-1">
                <label className={labelCls}>Authorized Supplier</label>
                <div className="relative">
                   <Hotel className={iconCls + " pointer-events-none"} size={18} />
                   <select name="supplier_id" value={form.supplier_id} onChange={handleChange} className={selectCls}>
                    <option value="">Select Supplier (Optional)</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit" disabled={saving}
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Commit Resource Registration
              </button>
            </div>
          </form>
        </div>

        {/* ── Right: Live QR Preview ── */}
        <div className="lg:col-span-1">
          <div className="premium-card p-8 sticky top-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">
               Digital Footprint
            </h3>

            <div className="w-full aspect-square bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center mb-8 overflow-hidden transition-all">
              {qrText ? (
                <div className="p-4 bg-white rounded-2xl shadow-xl animate-in zoom-in-90 duration-300">
                   <QRImage text={qrText} size={160} />
                </div>
              ) : (
                <div className="text-center text-slate-300 dark:text-slate-700">
                  <div className="text-6xl mb-4 opacity-20">▦</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting meta-data</p>
                </div>
              )}
            </div>

            {qrText && (
              <div className="space-y-4 mb-10 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomenclature</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{form.item_name || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Hash (SKU)</span>
                  <span className="text-xs font-mono font-black text-indigo-500">{form.sku || "—"}</span>
                </div>
              </div>
            )}

            {/* Post-save actions */}
            {savedItem ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <button
                  onClick={downloadQR}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-xl"
                >
                  Download Digitial QR
                </button>
                <button
                  onClick={printQR}
                  className="w-full py-4 border-2 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Print Label
                </button>
              </div>
            ) : (
               <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                 <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 leading-relaxed text-center">
                    QR codes automate warehouse auditing and field distribution tracking.
                 </p>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[999] p-5 rounded-3xl shadow-2xl animate-in slide-in-from-right-8 ${toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"} flex items-center gap-4`}>
          {toast.type === "error" ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
          <div>
            <p className="text-xs font-black uppercase tracking-widest tracking-tight">System Message</p>
            <p className="text-sm font-bold opacity-90">{toast.msg}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons for the form
function Hotel({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" /><path d="m9 16 .348-.24c1.1-.759 2.203-1.42 3.652-1.42s2.553.661 3.652 1.42L17 16" /><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}
