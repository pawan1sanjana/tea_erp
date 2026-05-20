import React, { useEffect, useState } from 'react';
import { Plus, RefreshCcw, AlertTriangle, Layers, DollarSign, Wallet } from 'lucide-react';
import { apiClient } from '../../api/client';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function CapitalExpenses() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  
  const [projectForm, setProjectForm] = useState({ project_name: '', budget_allocated: '', start_date: todayISO() });
  const [expenseForm, setExpenseForm] = useState({ project_id: '', amount: '', description: '', expense_date: todayISO() });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, eRes] = await Promise.all([
        apiClient.get('/finance/capital-projects'),
        apiClient.get('/finance/capital-expenses')
      ]);
      if (pRes.success) setProjects(pRes.data);
      if (eRes.success) setExpenses(eRes.data);
    } catch (e) {
      setError(e.message || 'Failed to load capital data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveProject = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post('/finance/capital-projects', projectForm);
      if (!res.success) throw new Error(res.error || 'Failed to save project');
      setProjectForm({ project_name: '', budget_allocated: '', start_date: todayISO() });
      setShowProjectForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const saveExpense = async () => {
    setSaving(true);
    try {
      const res = await apiClient.post('/finance/capital-expenses', expenseForm);
      if (!res.success) throw new Error(res.error || 'Failed to save expense');
      setExpenseForm({ project_id: '', amount: '', description: '', expense_date: todayISO() });
      setShowExpenseForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const totalBudget = projects.reduce((sum, p) => sum + Number(p.budget_allocated), 0);
  const totalSpent = projects.reduce((sum, p) => sum + Number(p.total_spent), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Capital Budgets</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Allocate Project Budgets & Track Capital Expenditures Independently
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowProjectForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20"
          >
            <Plus size={16} /> New Project
          </button>
          
          <button
            onClick={() => setShowExpenseForm(true)}
            disabled={projects.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet size={16} /> Log Expense
          </button>

          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="premium-card p-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 flex items-start gap-3">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">Error</p>
            <p className="text-xs text-rose-500 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-6 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Allocated Budget</p>
              <h3 className="text-3xl font-black mt-2 font-outfit">LKR {totalBudget.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <Layers size={24} />
            </div>
          </div>
        </div>
        
        <div className="premium-card p-6 bg-gradient-to-br from-rose-500 to-rose-700 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Capital Spent</p>
              <h3 className="text-3xl font-black mt-2 font-outfit">LKR {totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="premium-card p-6 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Remaining Budget</p>
              <h3 className="text-3xl font-black mt-2 font-outfit">LKR {(totalBudget - totalSpent).toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <Wallet size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Projects List */}
        <div className="premium-card overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Layers size={14} /> Capital Projects
            </h3>
            <span className="text-[9px] font-black bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
              {projects.length} Active
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="p-10 text-center"><div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto" /></div>
            ) : projects.length === 0 ? (
              <div className="p-10 text-center text-slate-400"><p className="text-[10px] uppercase font-bold tracking-widest opacity-60">No projects allocated</p></div>
            ) : (
              <div className="space-y-2">
                {projects.map(p => {
                  const spentPct = p.budget_allocated > 0 ? (p.total_spent / p.budget_allocated) * 100 : 0;
                  const isOver = p.total_spent > p.budget_allocated;
                  return (
                    <div key={p.id} className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.project_name}</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Started: {p.start_date ? p.start_date.slice(0, 10) : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{Number(p.total_spent).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">of {Number(p.budget_allocated).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${Math.min(spentPct, 100)}%` }} 
                        />
                      </div>
                      {isOver && <p className="text-[10px] font-bold text-rose-500 mt-2 text-right uppercase tracking-wider">Over Budget!</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Expenses List */}
        <div className="premium-card overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-tea-600 dark:text-tea-400 flex items-center gap-2">
              <Wallet size={14} /> Recent Capital Expenses
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center"><div className="w-8 h-8 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin mx-auto" /></div>
            ) : expenses.length === 0 ? (
              <div className="p-10 text-center text-slate-400"><p className="text-[10px] uppercase font-bold tracking-widest opacity-60">No expenses recorded</p></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date / Desc</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Project</th>
                    <th className="py-3 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-6">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white">{e.expense_date ? e.expense_date.slice(0, 10) : '—'}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{e.description || '—'}</p>
                      </td>
                      <td className="py-3 px-6 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                        {e.project_name}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-md">
                          {Number(e.amount).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Forms Modals */}
      {showProjectForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <Plus size={16} className="text-indigo-600" /> New Capital Project
              </h3>
              <button onClick={() => setShowProjectForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Project Name</p>
                <input
                  value={projectForm.project_name}
                  onChange={e => setProjectForm(p => ({ ...p, project_name: e.target.value }))}
                  placeholder="e.g., Factory Roof Repair"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Allocated Budget (LKR)</p>
                <input
                  type="number"
                  value={projectForm.budget_allocated}
                  onChange={e => setProjectForm(p => ({ ...p, budget_allocated: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Start Date</p>
                <input
                  type="date"
                  value={projectForm.start_date}
                  onChange={e => setProjectForm(p => ({ ...p, start_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>
              <button
                onClick={saveProject}
                disabled={saving || !projectForm.project_name || !projectForm.budget_allocated}
                className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Allocate Budget'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                <Wallet size={16} className="text-tea-600" /> Log Capital Expense
              </h3>
              <button onClick={() => setShowExpenseForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Project</p>
                <select
                  value={expenseForm.project_id}
                  onChange={e => setExpenseForm(p => ({ ...p, project_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tea-500/30"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name} (Budget: {Number(p.budget_allocated).toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Amount Spent (LKR)</p>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tea-500/30"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Description</p>
                <input
                  value={expenseForm.description}
                  onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="What was purchased/paid for?"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tea-500/30"
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Expense Date</p>
                <input
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={e => setExpenseForm(p => ({ ...p, expense_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tea-500/30"
                />
              </div>
              <button
                onClick={saveExpense}
                disabled={saving || !expenseForm.project_id || !expenseForm.amount}
                className="mt-6 w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-tea-600/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Log Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
