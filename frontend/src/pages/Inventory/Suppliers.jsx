import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Mail, Phone, MapPin, 
  Edit2, Trash2, Loader2, Info, ChevronLeft, ChevronRight,
  CheckCircle2, X, Save, AlertCircle, Building2, Globe
} from 'lucide-react';
import { apiClient } from '../../api/client';

export default function SuppliersPage() {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplier_name: '', contact_person: '', email: '', phone: '', address: '' });
  const [editForm, setEditForm] = useState({});
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/suppliers');
      if (response.success) setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.post('/suppliers', form);
      if (response.success) {
        setShowAddModal(false);
        setForm({ supplier_name: '', contact_person: '', email: '', phone: '', address: '' });
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Failed to add supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await apiClient.put(`/suppliers/${editForm.id}`, editForm);
      if (response.success) {
        setShowEditModal(false);
        fetchSuppliers();
      }
    } catch (error) {
       console.error("Update failed");
    } finally {
       setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedSupplier) return;
    try {
      setSaving(true);
      const response = await apiClient.delete(`/suppliers/${selectedSupplier.id}`);
      if (response.success) {
        setShowDeleteModal(false);
        fetchSuppliers();
      }
    } catch (error) {
       console.error("Delete failed");
    } finally {
       setSaving(false);
    }
  };

  const filteredData = suppliers.filter(s => 
    s.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.contact_person && s.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Supplier Directory</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Users size={14} className="text-tea-500" /> Track vendor relationships and strategic estate contact networks
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-tea-600/20 transition-all hover:scale-[1.02]"
        >
          <UserPlus size={18} /> Register New Supplier
        </button>
      </div>

      {/* Suppliers Table Card */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 border-l-[3px] border-tea-500">
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
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/40 px-4 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
             <Info size={14} className="text-blue-500" /> Verified Partners Only
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left font-bold">Supplier Identity</th>
                <th className="px-6 py-4 text-left font-bold">Primary Contact</th>
                <th className="px-6 py-4 text-left font-bold">Digital Reach</th>
                <th className="px-6 py-4 text-left font-bold">Headquarters</th>
                <th className="px-6 py-4 text-center font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold tracking-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                   <td colSpan="6" className="py-24 text-center">
                      <Loader2 className="w-8 h-8 text-tea-500 animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing logistics grid...</p>
                   </td>
                </tr>
              ) : currentEntries.length === 0 ? (
                <tr>
                   <td colSpan="6" className="py-24 text-center text-slate-400 italic font-medium uppercase text-[10px] tracking-widest opacity-60">
                      No vendors matching query
                   </td>
                </tr>
              ) : (
                currentEntries.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-400/5 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-900 dark:text-slate-100 font-black text-xs shadow-sm border border-slate-200 dark:border-slate-700">
                           {sup.supplier_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white tracking-tight text-sm uppercase">{sup.supplier_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-slate-300 font-bold text-sm uppercase">{sup.contact_person || '—'}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5 font-bold">
                        {sup.email && (<div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400"><Mail size={12} className="text-tea-500" /> {sup.email}</div>)}
                        {sup.phone && (<div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400"><Phone size={12} className="text-tea-500" /> {sup.phone}</div>)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate text-[10px] font-bold uppercase tracking-tight">{sup.address || '—'}</td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${sup.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        {sup.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditForm(sup); setShowEditModal(true); }} className="p-2.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-transparent hover:border-blue-200/50 transition-all shadow-sm"><Edit2 size={16} /></button>
                        <button onClick={() => { setSelectedSupplier(sup); setShowDeleteModal(true); }} className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/40 border border-transparent hover:border-rose-200/50 transition-all shadow-sm"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowEditModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8 text-slate-900 dark:text-white text-2xl font-black uppercase tracking-tight">Modify Vendor Details<button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button></div>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['supplier_name', 'contact_person', 'email', 'phone'].map(field => (
                    <div key={field} className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.replace('_', ' ')}</label>
                    <input type={field === 'email' ? 'email' : 'text'} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={editForm[field] || ''} onChange={(e)=>setEditForm({...editForm, [field]: e.target.value})} /></div>
                  ))}
                  <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HQ Address</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={editForm.address || ''} onChange={(e)=>setEditForm({...editForm, address: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4"><button type="button" onClick={()=>setShowEditModal(false)} className="py-4 border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex gap-2 justify-center items-center">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 animate-in zoom-in-95 duration-200 relative z-10">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200/50">
                <Trash2 size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Archive Vendor?</h2>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-3 mb-8 uppercase tracking-wider leading-relaxed">
                Archiving <span className="text-red-500">"{selectedSupplier?.supplier_name}"</span> will prevent new logistical links while preserving historical records.
              </p>
              <div className="flex w-full gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={confirmDelete} disabled={saving} className="flex-1 px-4 py-3.5 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : 'Confirm Archive'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddModal(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8"><h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Register Supplier</h3><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={24} className="text-slate-400" /></button></div>
              <form onSubmit={handleAddSupplier} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {['supplier_name', 'contact_person', 'email', 'phone'].map(field => (
                     <div key={field} className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.replace('_', ' ')}</label>
                     <input type={field === 'email' ? 'email' : 'text'} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={form[field]} onChange={(e)=>setForm({...form, [field]: e.target.value})} /></div>
                   ))}
                   <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">HQ Address</label>
                   <input type="text" className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-tea-500 rounded-2xl text-sm font-bold outline-none transition-all" value={form.address} onChange={(e)=>setForm({...form, address: e.target.value})} /></div>
                </div>
                <button type="submit" disabled={saving} className="w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex gap-3 justify-center items-center">{saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} Commit Registration</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
