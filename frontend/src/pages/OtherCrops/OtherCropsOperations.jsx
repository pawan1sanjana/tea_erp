import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scissors, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Layers, 
  Weight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  TreePine,
  DollarSign,
  Settings,
  Trash2,
  Edit2,
  CreditCard,
  Package
} from 'lucide-react';
import { apiClient } from '../../api/client';

const DEFAULT_COCONUT_RATE = 85;
const COCONUT_GRADES = ["Premium", "Standard", "Export"];

const gradeColors = {
  Premium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  Standard: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  Export: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
};

const fmt = (n) => `Rs. ${Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OtherCropsOperations() {
  const [activeTab, setActiveTab] = useState('cinnamon'); // 'cinnamon' (Peeling), 'coconut' (Harvest), or 'pepper' (Harvest)
  const [loading, setLoading] = useState(true);
  
  // Cinnamon State
  const [contracts, setContracts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showCinnamonForm, setShowCinnamonForm] = useState(false);
  const [cinnamonWorkerSearch, setCinnamonWorkerSearch] = useState("");
  const [showCinnamonWorkerDropdown, setShowCinnamonWorkerDropdown] = useState(false);
  const cinnamonWorkerDropdownRef = useRef(null);
  const [selectedCinnamonWorkerName, setSelectedCinnamonWorkerName] = useState("");
  const [cinnamonForm, setCinnamonForm] = useState({
    contract_date: new Date().toISOString().split('T')[0],
    block_id: '',
    contractor_id: '',
    peeled_weight: '',
    rate_per_kg: '450'
  });

  // Coconut State
  const [harvests, setHarvests] = useState([]);
  const [coconutForm, setCoconutForm] = useState({ date: "", block_id: "", trees: "", nuts: "", grade: "Standard", harvester: "", notes: "", rate: DEFAULT_COCONUT_RATE, paid: false });
  const [coconutEditId, setCoconutEditId] = useState(null);
  const [showCoconutForm, setShowCoconutForm] = useState(false);
  const [coconutFilter, setCoconutFilter] = useState({ block_id: "", grade: "", harvester: "", paid: "", date: "" });
  const [coconutSearch, setCoconutSearch] = useState("");
  const [coconutSubTab, setCoconutSubTab] = useState("records"); // 'records' or 'payments'
  const [coconutDeleteId, setCoconutDeleteId] = useState(null);
  const [coconutWorkerSearch, setCoconutWorkerSearch] = useState("");
  const [showCoconutWorkerDropdown, setShowCoconutWorkerDropdown] = useState(false);
  const coconutWorkerDropdownRef = useRef(null);

  // Pepper State
  const [pepperHarvests, setPepperHarvests] = useState([]);
  const [pepperForm, setPepperForm] = useState({
    date: new Date().toISOString().split('T')[0],
    block_id: '',
    harvester_id: '',
    quantity_kg: '',
    rate_per_kg: '250',
    notes: '',
    paid: false
  });
  const [pepperEditId, setPepperEditId] = useState(null);
  const [showPepperForm, setShowPepperForm] = useState(false);
  const [pepperWorkerSearch, setPepperWorkerSearch] = useState("");
  const [showPepperWorkerDropdown, setShowPepperWorkerDropdown] = useState(false);
  const [selectedPepperWorkerName, setSelectedPepperWorkerName] = useState("");
  const pepperWorkerDropdownRef = useRef(null);

  // Common Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cinnamonWorkerDropdownRef.current && !cinnamonWorkerDropdownRef.current.contains(event.target)) {
        setShowCinnamonWorkerDropdown(false);
      }
      if (coconutWorkerDropdownRef.current && !coconutWorkerDropdownRef.current.contains(event.target)) {
        setShowCoconutWorkerDropdown(false);
      }
      if (pepperWorkerDropdownRef.current && !pepperWorkerDropdownRef.current.contains(event.target)) {
        setShowPepperWorkerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, hRes, bRes, wRes, pRes] = await Promise.all([
        apiClient.get('/cinnamon/contracts'),
        apiClient.get('/coconut/harvests'),
        apiClient.get('/crop/blocks'),
        apiClient.get('/workforce/workers'),
        apiClient.get('/pepper/harvests')
      ]);
      
      if (cRes.success) setContracts(cRes.data);
      if (hRes.success) setHarvests(hRes.data);
      if (bRes.success) setBlocks(bRes.data);
      if (wRes.success) setWorkers(wRes.data);
      if (pRes.success) setPepperHarvests(pRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cinnamon Logic
  const handleCinnamonSave = async () => {
    try {
      const response = await apiClient.post('/cinnamon/contracts', cinnamonForm);
      if (response.success) {
        setShowCinnamonForm(false);
        fetchData();
        setCinnamonForm({
          contract_date: new Date().toISOString().split('T')[0],
          block_id: '',
          contractor_id: '',
          peeled_weight: '',
          rate_per_kg: '450'
        });
        setSelectedCinnamonWorkerName("");
      }
    } catch (error) {
      console.error('Cinnamon Save failed:', error);
    }
  };

  // Coconut Logic
  const handleCoconutSave = async (e) => {
    e?.preventDefault();
    try {
      if (coconutEditId) {
        await apiClient.put(`/coconut/harvests/${coconutEditId}`, coconutForm);
      } else {
        await apiClient.post('/coconut/harvests', coconutForm);
      }
      setShowCoconutForm(false);
      setCoconutEditId(null);
      fetchData();
    } catch (error) {
      console.error('Coconut Save failed:', error);
    }
  };

  const toggleCoconutPaid = async (rec) => {
    try {
      const res = await apiClient.put(`/coconut/harvests/${rec.id}/toggle-paid`, { paid: !rec.paid });
      if (res.success) fetchData();
    } catch (error) {
      console.error('Failed to toggle paid status:', error);
    }
  };

  // Pepper Logic
  const handlePepperSave = async (e) => {
    e?.preventDefault();
    try {
      if (pepperEditId) {
        await apiClient.put(`/pepper/harvests/${pepperEditId}`, pepperForm);
      } else {
        await apiClient.post('/pepper/harvests', pepperForm);
      }
      setShowPepperForm(false);
      setPepperEditId(null);
      fetchData();
      setPepperForm({
        date: new Date().toISOString().split('T')[0],
        block_id: '',
        harvester_id: '',
        quantity_kg: '',
        rate_per_kg: '250',
        notes: '',
        paid: false
      });
      setSelectedPepperWorkerName("");
    } catch (error) {
      console.error('Pepper Save failed:', error);
    }
  };

  const togglePepperPaid = async (rec) => {
    try {
      const res = await apiClient.put(`/pepper/harvests/${rec.id}/toggle-paid`, { paid: !rec.paid });
      if (res.success) fetchData();
    } catch (error) {
      console.error('Failed to toggle paid status:', error);
    }
  };

  const handlePepperDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pepper harvest record?")) return;
    try {
      const res = await apiClient.delete(`/pepper/harvests/${id}`);
      if (res.success) fetchData();
    } catch (error) {
      console.error('Failed to delete pepper harvest:', error);
    }
  };

  // Filtering & Pagination
  const filteredItems = useMemo(() => {
    if (activeTab === 'cinnamon') {
      return contracts;
    } else if (activeTab === 'coconut') {
      return harvests.filter(rec =>
        (!coconutFilter.date || rec.date === coconutFilter.date) &&
        (!coconutFilter.block_id || rec.block_id === coconutFilter.block_id) &&
        (!coconutFilter.grade || rec.grade === coconutFilter.grade) &&
        (!coconutFilter.harvester || rec.harvester === coconutFilter.harvester) &&
        (coconutFilter.paid === "" || String(rec.paid) === coconutFilter.paid) &&
        (!coconutSearch || [rec.date, rec.block_name || "", rec.harvester, rec.notes, String(rec.nuts), rec.grade]
          .join(" ").toLowerCase().includes(coconutSearch.toLowerCase()))
      );
    } else {
      return pepperHarvests;
    }
  }, [activeTab, contracts, harvests, pepperHarvests, coconutFilter, coconutSearch]);

  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, coconutFilter, coconutSearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight flex items-center gap-3">
             Other Crops <span className="text-emerald-600">Operations</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 pl-1 mt-1 uppercase tracking-widest text-[10px]">
             <CheckCircle2 size={14} className="text-emerald-600" />
             Harvesting & Peeling Command Center
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm self-stretch md:self-auto">
          <button 
            onClick={() => setActiveTab('cinnamon')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cinnamon' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Scissors size={14} /> Cinnamon Peeling
          </button>
          <button 
            onClick={() => setActiveTab('coconut')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'coconut' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <TreePine size={14} /> Coconut Harvest
          </button>
          <button 
            onClick={() => setActiveTab('pepper')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pepper' ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Package size={14} /> Pepper Harvest
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        {/* CINNAMON CONTENT */}
        {activeTab === 'cinnamon' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                 <Scissors className="text-amber-600" /> Peeling Contracts Ledger
              </h2>
              <button 
                onClick={() => setShowCinnamonForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
              >
                <Plus size={16} /> Record Contract
              </button>
            </div>

            {loading ? (
              <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300">
                 <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-600 rounded-full animate-spin mx-auto"></div>
                 <p className="mt-4 text-slate-500 font-medium tracking-wide">Syncing contract ledger...</p>
              </div>
            ) : contracts.length === 0 ? (
              <div className="p-20 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-300 text-slate-400">
                 <Scissors size={48} className="mx-auto mb-4 opacity-20" />
                 <p className="font-bold">No contracts found.</p>
              </div>
            ) : (
              <div className="premium-card overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-200 dark:border-slate-700 font-outfit">
                      <th className="px-6 py-4">Contract Date</th>
                      <th className="px-6 py-4">Block / Estate Division</th>
                      <th className="px-6 py-4">Contractor Details</th>
                      <th className="px-6 py-4">Peeled Weight</th>
                      <th className="px-6 py-4">Rate (LKR)</th>
                      <th className="px-6 py-4 text-right">Settlement Amount</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedItems.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group cursor-default">
                        <td className="px-6 py-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                           {new Date(c.contract_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                           <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{c.block_name}</p>
                           <p className="text-[9px] font-medium text-slate-400 italic">Operations Area</p>
                        </td>
                        <td className="px-6 py-3">
                           <div className="flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-black">
                                {c.first_name[0]}
                             </div>
                             <p className="text-xs font-black text-slate-700 dark:text-slate-300">{c.first_name} {c.last_name}</p>
                           </div>
                        </td>
                        <td className="px-6 py-3">
                           <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{c.peeled_weight} kg</span>
                        </td>
                        <td className="px-6 py-3 text-xs font-bold text-slate-500">
                           Rs. {c.rate_per_kg} /kg
                        </td>
                        <td className="px-6 py-3 text-right">
                           <span className="text-sm font-black text-amber-600 dark:text-amber-500">
                              Rs. {Number(c.total_payable).toLocaleString()}
                           </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${c.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                             {c.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* COCONUT CONTENT */}
        {activeTab === 'coconut' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Nuts", value: harvests.reduce((s, r) => s + Number(r.nuts), 0).toLocaleString(), icon: TreePine, color: "text-emerald-600", bg: "bg-emerald-100" },
                { label: "Payable", value: fmt(harvests.reduce((s, r) => s + r.trees * r.rate, 0)), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100" },
                { label: "Outstanding", value: fmt(harvests.filter(r => !r.paid).reduce((s, r) => s + r.trees * r.rate, 0)), icon: Clock, color: "text-rose-600", bg: "bg-rose-100" },
                { label: "Sessions", value: harvests.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
              ].map(s => (
                <div key={s.label} className="premium-card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                    <h4 className={`text-lg font-black ${s.color} font-outfit`}>{s.value}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 w-full sm:w-auto">
                <button onClick={() => setCoconutSubTab("records")} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${coconutSubTab === 'records' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>Records</button>
                <button onClick={() => setCoconutSubTab("payments")} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${coconutSubTab === 'payments' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}>Harvesters</button>
              </div>
              <button 
                onClick={() => { setCoconutForm({ ...coconutForm, date: new Date().toISOString().split('T')[0] }); setCoconutEditId(null); setShowCoconutForm(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
              >
                <Plus size={16} /> New Harvest
              </button>
            </div>

            {coconutSubTab === "records" ? (
              <div className="premium-card overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4">Date / Block</th>
                      <th className="px-6 py-4">Nuts Harvested</th>
                      <th className="px-6 py-4">Harvester</th>
                      <th className="px-6 py-4 text-right">Payment</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedItems.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-3">
                           <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{rec.block_name || "N/A"}</p>
                           <p className="text-[9px] font-bold text-slate-400">{rec.date}</p>
                        </td>
                        <td className="px-6 py-3">
                           <span className="text-sm font-black text-emerald-600">{rec.nuts.toLocaleString()}</span>
                           <span className="text-[9px] ml-1 uppercase text-slate-400">Nuts</span>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs">{rec.harvester}</td>
                        <td className="px-6 py-3 text-right font-black text-amber-600 text-xs">Rs.{(rec.trees * rec.rate).toLocaleString()}</td>
                        <td className="px-6 py-3 text-center">
                          <button onClick={() => toggleCoconutPaid(rec)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${rec.paid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {rec.paid ? "Paid" : "Unpaid"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Simplified payment summary per harvester */}
                 {Array.from(new Set(harvests.map(h => h.harvester))).map(h => {
                    const hRecs = harvests.filter(r => r.harvester === h);
                    const total = hRecs.reduce((s, r) => s + r.trees * r.rate, 0);
                    const unpaid = hRecs.filter(r => !r.paid).reduce((s, r) => s + r.trees * r.rate, 0);
                    return (
                      <div key={h} className="premium-card p-4 border-l-4 border-emerald-500">
                         <div className="flex justify-between items-center">
                            <div>
                               <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{h}</h3>
                               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{hRecs.length} Sessions</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-amber-600 italic">Outstanding</p>
                               <p className="text-base font-black text-rose-600">Rs. {unpaid.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                    );
                 })}
              </div>
            )}
          </div>
        )}

        {/* PEPPER CONTENT */}
        {activeTab === 'pepper' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Plucked", value: `${pepperHarvests.reduce((s, r) => s + Number(r.quantity_kg), 0).toLocaleString()} kg`, icon: Package, color: "text-rose-600", bg: "bg-rose-100" },
                { label: "Payable", value: fmt(pepperHarvests.reduce((s, r) => s + Number(r.total_payable), 0)), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-100" },
                { label: "Outstanding", value: fmt(pepperHarvests.filter(r => !r.paid).reduce((s, r) => s + Number(r.total_payable), 0)), icon: Clock, color: "text-rose-600", bg: "bg-rose-100" },
                { label: "Sessions", value: pepperHarvests.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-100" },
              ].map(s => (
                <div key={s.label} className="premium-card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} ${s.color}`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                    <h4 className={`text-lg font-black ${s.color} font-outfit`}>{s.value}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                 <Package className="text-rose-600" /> Pepper Harvest Records
              </h2>
              <button 
                onClick={() => { 
                  setPepperForm({
                    date: new Date().toISOString().split('T')[0],
                    block_id: '',
                    harvester_id: '',
                    quantity_kg: '',
                    rate_per_kg: '250',
                    notes: '',
                    paid: false
                  }); 
                  setPepperEditId(null); 
                  setSelectedPepperWorkerName("");
                  setShowPepperForm(true); 
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white border-none rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg animate-pulse"
              >
                <Plus size={16} /> New Harvest Record
              </button>
            </div>

            <div className="premium-card overflow-hidden">
              {pepperHarvests.length === 0 ? (
                <div className="p-16 text-center text-slate-400">
                  <Package size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold">No pepper harvests recorded yet.</p>
                  <p className="text-xs">Add a harvest entry using the button above.</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[9px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4">Date / Block</th>
                      <th className="px-6 py-4">Quantity Plucked</th>
                      <th className="px-6 py-4">Harvester</th>
                      <th className="px-6 py-4 text-right">Payment</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedItems.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-3">
                           <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{rec.block_name || "N/A"}</p>
                           <p className="text-[9px] font-bold text-slate-400">{rec.date}</p>
                        </td>
                        <td className="px-6 py-3">
                           <span className="text-sm font-black text-rose-600">{Number(rec.quantity_kg).toLocaleString()}</span>
                           <span className="text-[9px] ml-1 uppercase text-slate-400">kg</span>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-xs">
                          {rec.first_name} {rec.last_name}
                          <p className="text-[8px] text-slate-400">ID: {rec.worker_code}</p>
                        </td>
                        <td className="px-6 py-3 text-right font-black text-amber-600 text-xs">Rs. {Number(rec.total_payable).toLocaleString()}</td>
                        <td className="px-6 py-3 text-center">
                          <button onClick={() => togglePepperPaid(rec)} className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${rec.paid ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {rec.paid ? "Paid" : "Unpaid"}
                          </button>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setPepperEditId(rec.id);
                                setPepperForm({
                                  date: rec.date,
                                  block_id: rec.block_id,
                                  harvester_id: rec.harvester_id,
                                  quantity_kg: rec.quantity_kg,
                                  rate_per_kg: rec.rate_per_kg,
                                  notes: rec.notes || "",
                                  paid: rec.paid
                                });
                                setSelectedPepperWorkerName(`${rec.first_name} ${rec.last_name}`);
                                setShowPepperForm(true);
                              }}
                              className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[8px] font-black uppercase border border-blue-200 hover:bg-blue-100 transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handlePepperDelete(rec.id)}
                              className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black uppercase border border-rose-200 hover:bg-rose-100 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cinnamon Form Modal */}
      {showCinnamonForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-amber-50/50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                       <Scissors size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Cinnamon Contract</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">New Peeling & Cutting Record</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCinnamonForm(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" value={cinnamonForm.contract_date} onChange={e => setCinnamonForm({...cinnamonForm, contract_date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Block</label>
                       <select value={cinnamonForm.block_id} onChange={e => setCinnamonForm({...cinnamonForm, block_id: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20">
                          <option value="">Select Block</option>
                          {blocks.filter(b => b.cropType === 'Cinnamon').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                    <div className="md:col-span-2 space-y-2 relative" ref={cinnamonWorkerDropdownRef}>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contractor</label>
                       <div 
                         className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl flex items-center justify-between cursor-pointer"
                         onClick={() => setShowCinnamonWorkerDropdown(!showCinnamonWorkerDropdown)}
                       >
                         <span className={`text-sm font-bold ${cinnamonForm.contractor_id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                           {selectedCinnamonWorkerName || "Search and select contractor..."}
                         </span>
                         <ChevronDown size={18} />
                       </div>
                       {showCinnamonWorkerDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[60] overflow-hidden">
                             <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                <input autoFocus type="text" placeholder="Search..." value={cinnamonWorkerSearch} onChange={e => setCinnamonWorkerSearch(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold" />
                             </div>
                             <div className="max-h-60 overflow-y-auto p-2">
                                {workers.filter(w => (w.first_name + " " + w.last_name).toLowerCase().includes(cinnamonWorkerSearch.toLowerCase())).map(w => (
                                   <div key={w.id} className="px-4 py-3 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-pointer rounded-xl" onClick={() => {
                                      setCinnamonForm({...cinnamonForm, contractor_id: w.id});
                                      setSelectedCinnamonWorkerName(`${w.first_name} ${w.last_name}`);
                                      setShowCinnamonWorkerDropdown(false);
                                   }}>{w.first_name} {w.last_name}</div>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Peeled Weight (kg)</label>
                       <input type="number" value={cinnamonForm.peeled_weight} onChange={e => setCinnamonForm({...cinnamonForm, peeled_weight: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate (LKR/kg)</label>
                       <input type="number" value={cinnamonForm.rate_per_kg} onChange={e => setCinnamonForm({...cinnamonForm, rate_per_kg: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                 <button onClick={handleCinnamonSave} className="w-full py-5 bg-amber-600 hover:bg-amber-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">
                    Commit Cinnamon Record
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Coconut Form Modal */}
      {showCoconutForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-emerald-50/50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                       <TreePine size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{coconutEditId ? "Edit" : "New"} Harvest</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estate Nut Collection</p>
                    </div>
                 </div>
                 <button onClick={() => setShowCoconutForm(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" value={coconutForm.date} onChange={e => setCoconutForm({...coconutForm, date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Block</label>
                       <select value={coconutForm.block_id} onChange={e => setCoconutForm({...coconutForm, block_id: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20">
                          <option value="">Select Block</option>
                          {blocks.filter(b => b.cropType === 'Coconut').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Trees Climbed</label>
                       <input type="number" value={coconutForm.trees} onChange={e => setCoconutForm({...coconutForm, trees: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nuts Collected</label>
                       <input type="number" value={coconutForm.nuts} onChange={e => setCoconutForm({...coconutForm, nuts: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                    <div className="md:col-span-2 space-y-2 relative" ref={coconutWorkerDropdownRef}>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harvester / Worker Team</label>
                       <div 
                         className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl flex items-center justify-between cursor-pointer group hover:ring-2 hover:ring-emerald-500/20 transition-all"
                         onClick={() => setShowCoconutWorkerDropdown(!showCoconutWorkerDropdown)}
                       >
                         <div className="flex items-center gap-3 overflow-hidden">
                           <User size={18} className="text-emerald-500" />
                           <span className={`text-sm font-bold truncate ${coconutForm.harvester ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                             {coconutForm.harvester || "Search and select harvester..."}
                           </span>
                         </div>
                         <ChevronDown size={18} className={`text-slate-400 transition-transform ${showCoconutWorkerDropdown ? 'rotate-180' : ''}`} />
                       </div>

                       {showCoconutWorkerDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                             <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                   <input 
                                     autoFocus
                                     type="text" 
                                     placeholder="Search harvester name..."
                                     value={coconutWorkerSearch}
                                     onChange={(e) => setCoconutWorkerSearch(e.target.value)}
                                     className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold focus:ring-0 outline-none"
                                   />
                                </div>
                             </div>
                             <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                {workers.filter(w => (w.first_name + " " + w.last_name).toLowerCase().includes(coconutWorkerSearch.toLowerCase())).length > 0 ? (
                                   workers.filter(w => (w.first_name + " " + w.last_name).toLowerCase().includes(coconutWorkerSearch.toLowerCase())).map(w => (
                                      <div 
                                        key={w.id}
                                        className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 cursor-pointer rounded-xl flex items-center justify-between group"
                                        onClick={() => {
                                           setCoconutForm({...coconutForm, harvester: `${w.first_name} ${w.last_name}`});
                                           setShowCoconutWorkerDropdown(false);
                                           setCoconutWorkerSearch("");
                                        }}
                                      >
                                        <div>
                                          <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-emerald-700 transition-colors">{w.first_name} {w.last_name}</p>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Worker ID: {w.worker_id}</p>
                                        </div>
                                        {coconutForm.harvester === `${w.first_name} ${w.last_name}` && <Check size={16} className="text-emerald-500" />}
                                      </div>
                                   ))
                                ) : (
                                   <div className="p-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No harvesters found</div>
                                )}
                             </div>
                          </div>
                       )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate per Tree</label>
                       <input type="number" value={coconutForm.rate} onChange={e => setCoconutForm({...coconutForm, rate: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500/20" />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                 <button onClick={handleCoconutSave} className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all">
                    Finalize Coconut Entry
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Pepper Form Modal */}
      {showPepperForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 border border-slate-200 dark:border-slate-800">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-rose-50/50 dark:bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg">
                       <Package size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{pepperEditId ? "Edit" : "New"} Pepper Record</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estate Pepper Plucking Log</p>
                    </div>
                 </div>
                 <button onClick={() => setShowPepperForm(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">✕</button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date</label>
                       <input type="date" value={pepperForm.date} onChange={e => setPepperForm({...pepperForm, date: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Block</label>
                       <select value={pepperForm.block_id} onChange={e => setPepperForm({...pepperForm, block_id: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20">
                          <option value="">Select Block</option>
                          {blocks.filter(b => b.cropType === 'Pepper').map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                    </div>
                    <div className="md:col-span-2 space-y-2 relative" ref={pepperWorkerDropdownRef}>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harvester / Worker</label>
                       <div 
                         className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl flex items-center justify-between cursor-pointer"
                         onClick={() => setShowPepperWorkerDropdown(!showPepperWorkerDropdown)}
                       >
                         <span className={`text-sm font-bold ${pepperForm.harvester_id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                           {selectedPepperWorkerName || "Search and select harvester..."}
                         </span>
                         <ChevronDown size={18} />
                       </div>
                       {showPepperWorkerDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[60] overflow-hidden">
                             <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                                <input autoFocus type="text" placeholder="Search..." value={pepperWorkerSearch} onChange={e => setPepperWorkerSearch(e.target.value)} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold" />
                             </div>
                             <div className="max-h-60 overflow-y-auto p-2">
                                {workers.filter(w => (w.first_name + " " + w.last_name).toLowerCase().includes(pepperWorkerSearch.toLowerCase())).map(w => (
                                   <div key={w.id} className="px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 cursor-pointer rounded-xl" onClick={() => {
                                      setPepperForm({...pepperForm, harvester_id: w.id});
                                      setSelectedPepperWorkerName(`${w.first_name} ${w.last_name}`);
                                      setShowPepperWorkerDropdown(false);
                                   }}>{w.first_name} {w.last_name}</div>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quantity Plucked (kg)</label>
                       <input type="number" value={pepperForm.quantity_kg} onChange={e => setPepperForm({...pepperForm, quantity_kg: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rate (LKR/kg)</label>
                       <input type="number" value={pepperForm.rate_per_kg} onChange={e => setPepperForm({...pepperForm, rate_per_kg: e.target.value})} className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500/20" />
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                 <button onClick={handlePepperSave} className="w-full py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all animate-pulse">
                    Commit Pepper Record
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="premium-card p-4 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
          <span>Records {Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}</span>
          <div className="flex items-center gap-4">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronLeft size={16} /></button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
