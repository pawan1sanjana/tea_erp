import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, DollarSign, Scale, Wallet, ArrowRight, Calendar, Landmark, ReceiptText, BookOpen, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../api/client';
import { Link } from 'react-router-dom';

export default function FinanceOverview() {
  const [loading, setLoading] = useState(true);
  const [trial, setTrial] = useState({ data: [], totals: { debit: 0, credit: 0 } });

  const monthRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { from, to };
  }, []);

  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchChartData = async () => {
      setChartLoading(true);
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d);
      }

      try {
        const promises = months.map(d => {
          const from = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
          const to = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
          return apiClient.get(`/finance/reports/trial-balance?from=${from}&to=${to}`).then(res => ({
            month: d.toLocaleString('default', { month: 'short' }),
            res
          })).catch(() => ({ month: d.toLocaleString('default', { month: 'short' }), res: { success: false } }));
        });

        const results = await Promise.all(promises);

        if (!mounted) return;

        const formattedData = results.map(({ month, res }) => {
          const trialData = res.success ? res.data : [];
          const revenue = trialData
            .filter(r => r.type === 'income' || r.type === 'revenue')
            .reduce((sum, r) => sum + (Number(r.credit) || 0) - (Number(r.debit) || 0), 0);
          
          const expense = trialData
            .filter(r => r.type === 'expense')
            .reduce((sum, r) => sum + (Number(r.debit) || 0) - (Number(r.credit) || 0), 0);

          return {
            name: month,
            Revenue: revenue,
            Expenses: expense,
            Profit: revenue - expense
          };
        });

        setChartData(formattedData);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setChartLoading(false);
      }
    };

    fetchChartData();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const res = await apiClient.get(`/finance/reports/trial-balance?from=${monthRange.from}&to=${monthRange.to}`);
        if (!mounted) return;
        if (res.success) setTrial(res);
      } catch (_) {
        // keep empty state
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => { mounted = false; };
  }, [monthRange.from, monthRange.to]);

  const totalDebit = Number(trial.totals?.debit || 0);
  const totalCredit = Number(trial.totals?.credit || 0);
  const delta = Math.abs(totalDebit - totalCredit);



  const totalRevenue = (trial.data || [])
    .filter(r => r.type === 'income' || r.type === 'revenue')
    .reduce((sum, r) => sum + (Number(r.credit) || 0) - (Number(r.debit) || 0), 0);

  const totalExpenses = (trial.data || [])
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + (Number(r.debit) || 0) - (Number(r.credit) || 0), 0);

  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Finance Overview</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Real-time Financial Snapshot • {monthRange.from} → {monthRange.to}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/finance/expenses"
            className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
          >
            <Plus size={16} /> Add Expense
          </Link>
          <Link
            to="/finance/journal"
            className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
          >
            <BookOpen size={16} /> New Journal
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Debits', value: totalDebit.toFixed(2), unit: 'LKR', icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
          { label: 'Total Credits', value: totalCredit.toFixed(2), unit: 'LKR', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'TB Delta', value: delta.toFixed(2), unit: 'LKR', icon: Scale, color: delta < 0.01 ? 'text-emerald-500' : 'text-amber-500', bg: delta < 0.01 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Accounts', value: (trial.data || []).length, unit: 'Active', icon: Landmark, color: 'text-tea-500', bg: 'bg-tea-50 dark:bg-tea-500/10' },
        ].map((stat, i) => (
          <div key={i} className="premium-card relative overflow-hidden group">
            <stat.icon className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 ${stat.color}`} size={100} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-black font-outfit italic tracking-tighter ${stat.color}`}>{stat.value}</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 premium-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
              <Activity size={16} className="text-tea-500" /> Financial Summary
            </h3>
            <Link to="/finance/income" className="text-[10px] font-black uppercase tracking-widest text-tea-600 dark:text-tea-400 inline-flex items-center gap-2">
              View Income <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="h-[240px] flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full pb-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col justify-center relative overflow-hidden group">
                <TrendingUp size={80} className="absolute -right-4 -bottom-4 text-emerald-500 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <TrendingUp size={14} /> Total Revenue
                </p>
                <h4 className="text-2xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">
                  {totalRevenue.toFixed(2)}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">LKR</p>
              </div>

              <div className="bg-rose-50 dark:bg-rose-500/10 p-5 rounded-2xl border border-rose-100 dark:border-rose-500/20 flex flex-col justify-center relative overflow-hidden group">
                <TrendingDown size={80} className="absolute -right-4 -bottom-4 text-rose-500 opacity-10 group-hover:scale-110 transition-transform duration-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2">
                  <TrendingDown size={14} /> Total Expenses
                </p>
                <h4 className="text-2xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">
                  {totalExpenses.toFixed(2)}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">LKR</p>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col justify-center relative overflow-hidden group ${isProfit ? 'bg-tea-50 dark:bg-tea-500/10 border-tea-100 dark:border-tea-500/20' : 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'}`}>
                <DollarSign size={80} className={`absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500 ${isProfit ? 'text-tea-500' : 'text-amber-500'}`} />
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isProfit ? 'text-tea-600 dark:text-tea-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  <DollarSign size={14} /> Net {isProfit ? 'Profit' : 'Loss'}
                </p>
                <h4 className="text-2xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-white">
                  {Math.abs(netProfit).toFixed(2)}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">LKR</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="premium-card bg-slate-900 border-none relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ReceiptText size={110} className="text-tea-500" />
            </div>
            <h3 className="text-white font-black uppercase tracking-widest text-xs mb-5 font-outfit italic">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/finance/accounts" className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 border border-white/10">
                <Landmark size={16} /> Manage Accounts
              </Link>
              <Link to="/finance/expenses" className="w-full py-4 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 shadow-xl shadow-tea-600/20">
                <ReceiptText size={16} /> Record Expense
              </Link>
            </div>
          </div>


        </div>
      </div>

      <div className="premium-card">
        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2 mb-6">
          <Activity size={16} className="text-tea-500" /> 6-Month Financial Trend
        </h3>
        {chartLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `Rs ${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '16px', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

