import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Save, X, Loader2, Leaf, AlertTriangle, CheckCircle, Layers, Activity } from 'lucide-react';
import { apiClient } from '../../api/client';

const getBlockArea = (block) => {
  const dbArea = Number(block.area_hectares) || Number(block.area);
  if (dbArea) return dbArea;
  
  if (!block.polygon_coordinates) return 0;
  
  let latLngs = [];
  try {
    let polyData = block.polygon_coordinates;
    if (typeof polyData === 'string') polyData = JSON.parse(polyData);
    
    let rawCoords = null;
    if (polyData && polyData.type === 'Feature' && polyData.geometry?.type === 'Polygon') {
      rawCoords = polyData.geometry.coordinates[0];
    } else if (polyData && polyData.type === 'Polygon') {
      rawCoords = polyData.coordinates[0];
    } else if (Array.isArray(polyData)) {
      rawCoords = polyData;
    }
    
    if (rawCoords && rawCoords.length > 0) {
      latLngs = rawCoords.map(c => {
        if (c && typeof c === 'object' && 'lat' in c && ('lng' in c || 'lon' in c)) return [c.lat, c.lng || c.lon];
        if (Array.isArray(c) && c.length >= 2) return typeof c[0] === 'number' ? [c[1], c[0]] : null;
        return null;
      }).filter(Boolean);
    }
  } catch(e) { return 0; }
  
  if (latLngs.length < 3) return 0;
  
  let area = 0;
  const R = 6378137;
  for (let i = 0; i < latLngs.length; i++) {
    const p1 = latLngs[i];
    const p2 = latLngs[(i + 1) % latLngs.length];
    const lat1 = p1[0] * Math.PI / 180;
    const lng1 = p1[1] * Math.PI / 180;
    const lat2 = p2[0] * Math.PI / 180;
    const lng2 = p2[1] * Math.PI / 180;
    area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs(area * R * R / 2) / 10000;
};

export default function AddFieldBlocksPage() {
  const [blocks, setBlocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [divisions, setDivisions] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    division_id: '',
    cropType: '',
    area: '',
    cloneType: '',
    yop: '',
    status: 'Active'
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/crop/blocks');
      if (response.success) {
        setBlocks(response.data);
      } else {
        showToast('error', 'Failed to load blocks from database.');
      }
    } catch (error) {
      console.error('Fetch blocks failed:', error);
      showToast('error', 'Cannot connect to database. Check backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await apiClient.get('/gis/divisions');
      if (response.success) {
        setDivisions(response.data);
      }
    } catch (error) {
      console.error('Fetch divisions failed:', error);
    }
  };

  useEffect(() => {
    fetchBlocks();
    fetchDivisions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: '', division_id: '', cropType: '', area: '', cloneType: '', yop: '', status: 'Active' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const response = await apiClient.put(`/crop/blocks/${editingId}`, {
          name: formData.name,
          division_id: formData.division_id,
          area: formData.area,
          tea_variety: formData.cloneType,
          yop: formData.yop,
          status: formData.status,
        });
        if (response.success) {
          showToast('success', `Block "${formData.name}" updated successfully.`);
          fetchBlocks();
          resetForm();
        }
      } else {
        const response = await apiClient.post('/crop/blocks', {
          name: formData.name,
          division_id: formData.division_id,
          area: formData.area,
          tea_variety: formData.cloneType,
          yop: formData.yop,
          status: formData.status,
        });
        if (response.success) {
          showToast('success', `Block "${formData.name}" created successfully.`);
          fetchBlocks();
          resetForm();
        }
      }
    } catch (error) {
      console.error('Save block failed:', error);
      showToast('error', 'Failed to save block. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBlock = (block) => {
    setFormData({
      name: block.name || '',
      division_id: block.division_id || '',
      cropType: block.cropType || '',
      area: block.area_hectares || block.area || '',
      cloneType: block.tea_variety || block.cloneType || '',
      yop: block.planting_year || block.yop || '',
      status: block.status || 'Active'
    });
    setEditingId(block.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBlock = async (id) => {
    try {
      const response = await apiClient.delete(`/crop/blocks/${id}`);
      if (response.success) {
        showToast('success', 'Block removed from database.');
        fetchBlocks();
      }
    } catch (error) {
      console.error('Delete block failed:', error);
      showToast('error', 'Failed to delete block.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:border-tea-500 focus:ring-2 focus:ring-tea-200 dark:focus:ring-tea-900 transition-all';
  const labelClass = 'block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2';

  return (
    <div className="space-y-8 animate-fade-in relative">

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Field Blocks</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-tea-500" /> Register & manage estate cultivation blocks
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tea-600/20 transition-all hover:scale-[1.02]"
          >
            <Plus size={16} /> Add Block
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="premium-card border-l-4 border-tea-500">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-tea-500/10">
                <Leaf size={18} className="text-tea-600 dark:text-tea-400" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {editingId ? 'Edit Block' : 'Register New Block'}
              </h3>
            </div>
            <button onClick={resetForm} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>Block Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange}
                  placeholder="e.g., Block A, North Block" required className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Division <span className="text-red-500">*</span></label>
                <select name="division_id" value={formData.division_id} onChange={handleInputChange} required className={inputClass}>
                  <option value="">Select Division</option>
                  {divisions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Crop Type</label>
                <select name="cropType" value={formData.cropType} onChange={handleInputChange} className={inputClass}>
                  <option value="">Select Crop Type</option>
                  <option value="Tea">Tea</option>
                  <option value="Coffee">Coffee</option>
                  <option value="Spices">Spices</option>
                  <option value="Cocoa">Cocoa</option>
                  <option value="Mixed">Mixed Crops</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Type of Clone</label>
                <input type="text" name="cloneType" value={formData.cloneType} onChange={handleInputChange}
                  placeholder="e.g., TRI-2023, AV2-2020" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Year of Planting (YOP)</label>
                <input type="number" name="yop" value={formData.yop} onChange={handleInputChange}
                  placeholder="e.g., 2021" min="1900" max="2100" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Area (hectares)</label>
                <input type="number" name="area" value={formData.area} onChange={handleInputChange}
                  placeholder="e.g., 2.5" step="0.01" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange} className={inputClass}>
                  <option value="Active">Active</option>
                  <option value="Pruned">Pruned</option>
                  <option value="Rested">Rested</option>
                  <option value="Fallow">Fallow</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-tea-600 hover:bg-tea-700 disabled:opacity-60 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-tea-600/20 transition-all"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : (editingId ? 'Update Block' : 'Create Block')}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <Layers size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Blocks</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{blocks.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Activity size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Blocks</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {blocks.filter(b => (b.status || '').toLowerCase() === 'active').length}
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <MapPin size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Area (ha)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {blocks.reduce((sum, b) => sum + getBlockArea(b), 0).toFixed(1)}
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30">
            <Leaf size={22} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Est. Clones</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {new Set(blocks.map(b => b.cloneType || b.tea_variety).filter(Boolean)).size || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Blocks Table */}
      <div className="premium-card overflow-hidden p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 text-tea-500 animate-spin" />
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading from database...</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <MapPin size={40} className="opacity-30" />
            <p className="text-sm font-bold uppercase tracking-widest">No blocks registered yet</p>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-tea-700 transition-all">
              <Plus size={14} /> Add Your First Block
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                  <th className="px-6 py-4 text-left font-bold">Block Name</th>
                  <th className="px-6 py-4 text-left font-bold">Division</th>
                  <th className="px-6 py-4 text-left font-bold">Area (ha)</th>
                  <th className="px-6 py-4 text-left font-bold">Crop / Clone</th>
                  <th className="px-6 py-4 text-left font-bold">Status</th>
                  <th className="px-6 py-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-tea-500/10">
                          <Leaf size={14} className="text-tea-600 dark:text-tea-400" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{block.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{block.division_name || '—'}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                      {getBlockArea(block).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{block.cropType || block.crop_type || 'Tea'}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {block.tea_variety || block.cloneType || block.clone_type || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        (block.status || '').toLowerCase() === 'active'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          : (block.status || '').toLowerCase() === 'pruned'
                          ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400'
                          : (block.status || '').toLowerCase() === 'rested'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : (block.status || '').toLowerCase() === 'fallow'
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (block.status || '').toLowerCase() === 'active' ? 'bg-emerald-500 animate-pulse' :
                          (block.status || '').toLowerCase() === 'pruned' ? 'bg-sky-500' :
                          (block.status || '').toLowerCase() === 'rested' ? 'bg-purple-500' :
                          (block.status || '').toLowerCase() === 'fallow' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        {block.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleEditBlock(block)}
                          className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirmId(block.id)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Delete">
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Block?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                This will permanently remove the block from your MySQL database. This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button onClick={() => handleDeleteBlock(deleteConfirmId)}
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
