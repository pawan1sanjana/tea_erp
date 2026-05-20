import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, Calendar, AlertCircle, CheckCircle, 
  ArrowLeft, TreeDeciduous, Ruler, Maximize2, Tag, 
  Save, XCircle, Info, Box, ChevronDown, Truck, Wrench, Building2, Drill, Package, ShieldCheck, DollarSign, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';

export default function AssetRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [blocks, setBlocks] = useState([]);
  
  // Biological Asset State
  const [biologicalFormData, setBiologicalFormData] = useState({
    block_id: '',
    block_name: '',
    tree_species: 'Teak (Tectona grandis)',
    height_ft: '',
    girth_in: '',
    height_category: 'Mature',
    girth_category: 'Grade A',
    census_date: new Date().toISOString().split('T')[0]
  });

  // Physical Asset State
  const [physicalFormData, setPhysicalFormData] = useState({
    asset_name: '',
    asset_type: 'Equipment',
    serial_number: '',
    location: '',
    purchase_date: new Date().toISOString().split('T')[0],
    asset_condition: 'excellent',
    maintenance_status: 'operational',
    value: '',
    last_maintenance_date: '',
    next_service_date: ''
  });

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      const response = await apiClient.get('/crop/blocks');
      if (response.success) {
        setBlocks(response.data);
        if (response.data.length > 0) {
          setBiologicalFormData(prev => ({ 
            ...prev, 
            block_id: response.data[0].id, 
            block_name: response.data[0].name 
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    }
  };

  const handleBiologicalChange = (e) => {
    const { name, value } = e.target;
    if (name === 'block_id') {
      const selectedBlock = blocks.find(b => b.id.toString() === value.toString());
      setBiologicalFormData(prev => ({ 
        ...prev, 
        block_id: value, 
        block_name: selectedBlock ? selectedBlock.name : '' 
      }));
    } else {
      setBiologicalFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhysicalChange = (e) => {
    const { name, value } = e.target;
    setPhysicalFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBiologicalSubmit = async (e) => {
    e.preventDefault();
    if (!biologicalFormData.block_id) {
       alert('Please select a valid block from the GIS page first.');
       return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/inventory/biological', biologicalFormData);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => { navigate('/inventory/biological-assets'); }, 1500);
      }
    } catch (error) {
      alert('Failed to register biological asset.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await apiClient.post('/inventory/physical', physicalFormData);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => { navigate('/inventory/physical-assets'); }, 1500);
      }
    } catch (error) {
      alert('Failed to register physical asset.');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-tea-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all appearance-none outline-none";
  const inputClass = "w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-tea-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl text-sm font-bold shadow-sm transition-all outline-none";
  const labelClass = "text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 mb-2 block";
  const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Strategic Asset Entry</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
             <PlusCircle size={14} className="text-indigo-500" /> Unified registration for biological forestry and tactical estate assets
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit">
           <ArrowLeft size={16}/> Back
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
           <CheckCircle className="text-emerald-500" size={20}/>
           <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Operation successful! Redirecting to inventory...</p>
        </div>
      )}

      {/* --- BIOLOGICAL SECTION --- */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="p-3 bg-tea-100 dark:bg-tea-900/30 rounded-2xl">
              <TreeDeciduous className="text-tea-600 dark:text-tea-400" size={24}/>
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Register Biological Asset</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Forestry stocks & Timber records</p>
           </div>
        </div>

        <div className="premium-card p-8">
          <form onSubmit={handleBiologicalSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className={labelClass}>Assigned GIS Block</label>
                <div className="relative">
                  <Box className={iconClass} size={18} />
                  <select name="block_id" value={biologicalFormData.block_id} onChange={handleBiologicalChange} className={selectClass}>
                    {blocks.map(block => (
                      <option key={block.id} value={block.id}>{block.name} ({block.cropType})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Tree Species</label>
                <div className="relative">
                  <Tag className={iconClass} size={18} />
                  <select name="tree_species" value={biologicalFormData.tree_species} onChange={handleBiologicalChange} className={selectClass}>
                    <option>Teak (Tectona grandis)</option>
                    <option>Mahogany</option>
                    <option>Eucalyptus</option>
                    <option>Rosewood</option>
                    <option>Sandalwood</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Height (ft)</label>
                <div className="relative">
                  <Maximize2 className={iconClass} size={18} />
                  <input type="number" step="0.1" name="height_ft" value={biologicalFormData.height_ft} onChange={handleBiologicalChange} required placeholder="e.g. 45.5" className={inputClass} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Girth (in)</label>
                <div className="relative">
                  <Ruler className={iconClass} size={18} />
                  <input type="number" step="0.1" name="girth_in" value={biologicalFormData.girth_in} onChange={handleBiologicalChange} required placeholder="e.g. 32.0" className={inputClass} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Census Date</label>
                <div className="relative">
                  <Calendar className={iconClass} size={18} />
                  <input type="date" name="census_date" value={biologicalFormData.census_date} onChange={handleBiologicalChange} required className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button type="submit" disabled={loading} className="px-10 py-4 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-tea-600/20 transition-all flex items-center gap-3">
                {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                Register Biological Asset
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* --- PHYSICAL SECTION --- */}
      <section className="space-y-6 pt-4">
        <div className="flex items-center gap-4 mb-2">
           <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
              <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={24}/>
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Register Physical Asset</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Machinery, Vehicles & Infrastructure</p>
           </div>
        </div>

        <div className="premium-card p-8 bg-slate-50/50 dark:bg-slate-900/30 border-dashed">
          <form onSubmit={handlePhysicalSubmit} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className={labelClass}>Asset Name</label>
                   <div className="relative">
                      <Drill className={iconClass} size={18}/>
                      <input type="text" name="asset_name" value={physicalFormData.asset_name} onChange={handlePhysicalChange} required placeholder="e.g. Tractor 4020" className={inputClass} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={labelClass}>Asset Category</label>
                   <div className="relative">
                      <Truck className={iconClass} size={18}/>
                      <select name="asset_type" value={physicalFormData.asset_type} onChange={handlePhysicalChange} className={selectClass}>
                         <option>Equipment</option>
                         <option>Vehicles</option>
                         <option>Buildings</option>
                         <option>Tools</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={labelClass}>Serial Number</label>
                   <div className="relative">
                      <Tag className={iconClass} size={18}/>
                      <input type="text" name="serial_number" value={physicalFormData.serial_number} onChange={handlePhysicalChange} required placeholder="e.g. SN-8821" className={inputClass} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={labelClass}>Valuation (LKR)</label>
                   <div className="relative">
                      <DollarSign className={iconClass} size={18}/>
                      <input type="number" name="value" value={physicalFormData.value} onChange={handlePhysicalChange} required placeholder="e.g. 1250000" className={inputClass} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={labelClass}>Station/Location</label>
                   <div className="relative">
                      <MapPin className={iconClass} size={18}/>
                      <input type="text" name="location" value={physicalFormData.location} onChange={handlePhysicalChange} required placeholder="e.g. Main Factory Shed" className={inputClass} />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={labelClass}>Acquisition Date</label>
                   <div className="relative">
                      <Calendar className={iconClass} size={18}/>
                      <input type="date" name="purchase_date" value={physicalFormData.purchase_date} onChange={handlePhysicalChange} required className={inputClass} />
                   </div>
                </div>
             </div>
             
             <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="submit" disabled={loading} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-3">
                   {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                   Register Physical Asset
                </button>
             </div>
          </form>
        </div>
      </section>
    </div>
  );
}

function Loader2({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
