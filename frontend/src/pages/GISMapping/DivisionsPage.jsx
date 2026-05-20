import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers, Save, X, Loader2, CheckCircle, AlertTriangle, MapPin, Users } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({ name: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/gis/divisions');
      if (response.success) {
        setDivisions(response.data);
      } else {
        showToast('error', 'Failed to load divisions.');
      }
    } catch (error) {
      console.error('Fetch divisions failed:', error);
      showToast('error', 'Cannot connect to database. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
  }, []);

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const response = await apiClient.put(`/gis/divisions/${editingId}`, formData);
        if (response.success) {
          showToast('success', `Division "${formData.name}" updated.`);
          fetchDivisions();
          resetForm();
        }
      } else {
        const response = await apiClient.post('/gis/divisions', formData);
        if (response.success) {
          showToast('success', `Division "${formData.name}" created.`);
          fetchDivisions();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Save division failed:', error);
      showToast('error', 'Failed to save division. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (division) => {
    setFormData({ name: division.name });
    setEditingId(division.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiClient.delete(`/gis/divisions/${id}`);
      if (response.success) {
        showToast('success', 'Division removed from database.');
        fetchDivisions();
      }
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('error', 'Failed to delete. It may have linked blocks.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-tea-500 focus:ring-2 focus:ring-tea-200 dark:focus:ring-tea-900 transition-all';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2';

  return (
    <div className="space-y-8 animate-fade-in relative">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Divisions</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Layers size={14} className="text-tea-500" /> Manage estate operational divisions
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tea-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={16} /> Add Division
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="premium-card border-l-4 border-tea-500">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-tea-500/10">
                <Layers size={18} className="text-tea-600 dark:text-tea-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingId ? 'Edit Division' : 'Create New Division'}
              </h3>
            </div>
            <button onClick={resetForm} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="max-w-md">
              <label className={labelClass}>Division Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={e => setFormData({ name: e.target.value })}
                placeholder="e.g., North Division, East Wing"
                required
                className={inputClass}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-tea-600/20 transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : (editingId ? 'Update Division' : 'Create Division')}
              </button>
              <button type="button" onClick={resetForm}
                className="flex items-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-widest rounded-xl transition-all">
                <X size={16} /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <Layers size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Divisions</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{divisions.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-900/30">
            <MapPin size={22} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Blocks</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {divisions.reduce((sum, d) => sum + (d.block_count || 0), 0)}
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Users size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Estate</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white truncate">Galle Estate</h3>
          </div>
        </div>
      </div>

      {/* Divisions Table */}
      <div className="premium-card overflow-hidden p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-tea-500 animate-spin" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading from database...</p>
          </div>
        ) : divisions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Layers size={40} className="opacity-30" />
            <p className="text-sm font-bold uppercase tracking-widest">No divisions found</p>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-tea-700 transition-all">
              <Plus size={14} /> Add First Division
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                  <th className="px-6 py-4 text-left font-bold">Division Name</th>
                  <th className="px-6 py-4 text-left font-bold">Block Registry</th>
                  <th className="px-6 py-4 text-left font-bold">Date Created</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {divisions.map((division) => (
                  <tr key={division.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-tea-500/10">
                          <Layers size={14} className="text-tea-600 dark:text-tea-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-none">{division.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Unit</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                          <MapPin size={10} />
                          {division.block_count || 0} blocks
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {division.created_at ? new Date(division.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(division)}
                          className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(division.id)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shadow-sm bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Division?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                This will permanently remove the division. Any linked blocks must be reassigned first or they will also be removed.
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg shadow-red-600/20 transition-colors flex items-center justify-center gap-2">
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
