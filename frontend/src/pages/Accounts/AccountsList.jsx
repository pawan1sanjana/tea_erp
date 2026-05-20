import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, UserCog, Archive, Trash2, CheckCircle2, XCircle, Edit, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function AccountsList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: '', // 'archive', 'delete', 'unarchive'
    user: null
  });

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/accounts');
      if (response.success) {
        setUsers(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openConfirmModal = (type, user) => {
    setConfirmModal({ show: true, type, user });
  };

  const handleConfirmAction = async () => {
    const { type, user } = confirmModal;
    if (!user) return;

    try {
      if (type === 'archive' || type === 'unarchive') {
        const newStatus = type === 'archive' ? 'inactive' : 'active';
        const response = await apiClient.put(`/accounts/${user.id}/status`, { status: newStatus });
        if (response.success) fetchUsers();
      } else if (type === 'delete') {
        const response = await apiClient.delete(`/accounts/${user.id}`);
        if (response.success) fetchUsers();
      }
    } catch (err) {
      alert(`Error during ${type} operation`);
    } finally {
      setConfirmModal({ show: false, type: '', user: null });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <UserCog className="text-tea-500" /> Accounts Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage system access, roles, and user profiles.</p>
        </div>
        <Link to="/accounts/new" className="px-4 py-2 bg-tea-500 text-white font-medium rounded-lg hover:bg-tea-600 active:scale-95 transition-all shadow-sm hover:shadow-tea-500/30 flex items-center gap-2">
          <UserPlus size={18} />
          Register User
        </Link>
      </div>

      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 font-semibold text-sm transition-colors relative ${
            activeTab === 'active' 
              ? 'text-tea-600 dark:text-tea-400' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Active Accounts
          {activeTab === 'active' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-tea-500 rounded-t-full"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('archived')}
          className={`pb-4 px-2 font-semibold text-sm transition-colors relative ${
            activeTab === 'archived' 
              ? 'text-tea-600 dark:text-tea-400' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Archived Accounts
          {activeTab === 'archived' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-tea-500 rounded-t-full"></span>
          )}
        </button>
      </div>

      <div className="glass-panel w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/50 dark:bg-slate-900/50 uppercase text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 font-medium">Loading accounts...</td></tr>
              ) : users.filter(u => activeTab === 'active' ? u.status === 'active' : u.status !== 'active').length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-500 font-medium">No {activeTab} users found.</td></tr>
              ) : (
                users.filter(u => activeTab === 'active' ? u.status === 'active' : u.status !== 'active').map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 capitalize ring-1 ring-inset ring-slate-200 dark:ring-slate-700">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-inset ring-green-500/20' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-1 ring-inset ring-amber-500/20'
                      }`}>
                        {user.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          to={`/accounts/${user.id}/edit`}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </Link>
                        <button 
                          onClick={() => openConfirmModal(user.status === 'active' ? 'archive' : 'unarchive', user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.status === 'active' 
                              ? 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                              : 'text-tea-500 hover:text-tea-600 hover:bg-tea-50 dark:hover:bg-tea-900/20'
                          }`}
                          title={user.status === 'active' ? 'Archive User' : 'Unarchive User'}
                        >
                          <Archive size={18} />
                        </button>
                        <button 
                          onClick={() => openConfirmModal('delete', user)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete User permanently"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center p-4 mb-4 ${
                confirmModal.type === 'delete' 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500' 
                  : confirmModal.type === 'archive'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500'
              }`}>
                {confirmModal.type === 'delete' ? <Trash2 size={32} /> : confirmModal.type === 'archive' ? <Archive size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                {confirmModal.type} Account
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                {confirmModal.type === 'delete' 
                  ? `Are you sure you want to permanently delete ${confirmModal.user?.first_name}'s account? This action cannot be undone.`
                  : confirmModal.type === 'archive'
                    ? `Archiving ${confirmModal.user?.first_name}'s account will disable their access but keep their data. Proceed?`
                    : `Restoring ${confirmModal.user?.first_name}'s account will re-enable their system access. Proceed?`}
              </p>
              <div className="flex w-full gap-3 mt-1">
                <button
                  onClick={() => setConfirmModal({ show: false, type: '', user: null })}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold shadow-lg transition-colors ${
                    confirmModal.type === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                      : confirmModal.type === 'archive'
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                        : 'bg-tea-500 hover:bg-tea-600 shadow-tea-500/20'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
