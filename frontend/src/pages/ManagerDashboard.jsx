import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Users, Leaf, CloudRain, Wallet, Target,
  ShieldCheck, ArrowUpRight, ChevronRight, Activity, Award,
  CheckCircle2, Package, Landmark, BarChart3, ArrowRight,
  TrendingUp as ProfitIcon, Database, Layers, CheckSquare, AlertTriangle, Scale, Sprout,
  CloudSun, Droplets, Wind
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, BarChart, Bar
} from "recharts";
import { apiClient } from "../api/client";

const VALUATION_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7"];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, agronomics, finance

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? (() => { try { return JSON.parse(storedUser); } catch { return {}; } })() : {};

  // Fetch summary data and weather
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, weatherRes] = await Promise.all([
          apiClient.get('/dashboard/manager-summary'),
          apiClient.get('/weather/current').catch(() => ({ success: false }))
        ]);
        if (res.success) {
          setData(res.data);
        }
        if (weatherRes && weatherRes.success) {
          setWeather(weatherRes.data);
        }
      } catch (err) {
        console.error("Manager summary fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to switch dashboards instantly for demo/testing
  const handleDashboardSwitch = (role) => {
    const parsedUser = { ...user, role };
    localStorage.setItem('user', JSON.stringify(parsedUser));
    // Dispatch custom event to let app refresh or force reload
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center -m-6 bg-slate-50 dark:bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Award className="w-12 h-12 text-emerald-500 animate-spin" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Portfolio Ledger...</p>
        </div>
      </div>
    );
  }

  const d = data || {
    financials: { totalIncome: 2450000, totalExpenses: 1250000, capitalExpenses: 350000, netProfit: 850000, marginPercent: 34.7, cashflowHistory: [] },
    valuations: { goodsValue: 420000, biologicalValue: 1850000, physicalValue: 3200000, teaStockValue: 180000, totalValuation: 5650000 },
    productivity: { totalBlocks: 8, totalAreaHectares: 24.5, totalYieldKg: 14520, yieldPerHectare: 592.65 },
    operationsSummary: []
  };

  const f = d.financials;
  const v = d.valuations;
  const p = d.productivity;

  // Valuation Pie Data
  const valuationData = [
    { name: "Biological Assets", value: v.biologicalValue },
    { name: "Physical Assets", value: v.physicalValue },
    { name: "Goods Inventory", value: v.goodsValue },
    { name: "Tea Packet Stock", value: v.teaStockValue }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 -m-6 p-6 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-5 animate-in fade-in duration-700">

        {/* ── Header Command Bar ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                MANAGER PORTFOLIO HUB
              </span>
              <span className="flex items-center gap-1 text-[9px] font-black text-teal-500 dark:text-teal-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping inline-block mr-1" /> Strategic Command
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
              Welcome back, <span className="text-emerald-500">{user.username || 'Manager'}</span>
            </h1>
            <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-xs font-bold flex items-center gap-2">
              <Award size={14} className="text-emerald-500" /> Evergreen Plantation Group • Financial & Operational Oversight
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Weather Pill */}
            {weather && (
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <CloudSun size={14} />
                  <span>{weather.temp}°C</span>
                </div>
                <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                  <span className="flex items-center gap-1">
                    <Droplets size={11} className="text-blue-500" /> {weather.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind size={11} className="text-slate-400" /> {weather.wind} km/h
                  </span>
                </div>
              </div>
            )}

            {/* Role Switcher Pill */}
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Switch Dashboard:</span>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button 
                  onClick={() => handleDashboardSwitch('admin')}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
                >
                  Admin
                </button>
                <button 
                  onClick={() => handleDashboardSwitch('manager')}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition-all"
                >
                  Manager
                </button>
                <button 
                  onClick={() => handleDashboardSwitch('field_officer')}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
                >
                  Officer
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="flex border-b border-slate-200 dark:border-slate-800/80 gap-6">
          {["overview", "agronomics", "finance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab 
                  ? "text-emerald-500 border-b-2 border-emerald-500 font-extrabold" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {tab === "overview" && "Executive Overview"}
              {tab === "agronomics" && "Agronomic Intelligence"}
              {tab === "finance" && "Financial Core"}
            </button>
          ))}
        </div>

        {/* ── Tab Content: Executive Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-5 animate-in fade-in duration-500">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="premium-card !p-5 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border-emerald-500/20 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Wallet size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-500 px-2 py-0.5 bg-emerald-500/10 rounded-full flex items-center gap-1">
                    <TrendingUp size={10} /> Active
                  </span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Leaf Sales Revenue</p>
                <h3 className="text-2xl font-black font-outfit italic tracking-tight text-slate-900 dark:text-white">LKR {f.totalIncome.toLocaleString()}</h3>
                <p className="text-[9px] text-slate-400 mt-1">Consolidated estate crop income ledger</p>
              </div>

              <div className="premium-card !p-5 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent border-rose-500/20 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500">
                    <TrendingDown size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-rose-500 px-2 py-0.5 bg-rose-500/10 rounded-full">
                    -3.4% Spend
                  </span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Operating Expenses (OPEX)</p>
                <h3 className="text-2xl font-black font-outfit italic tracking-tight text-slate-900 dark:text-white">LKR {f.totalExpenses.toLocaleString()}</h3>
                <p className="text-[9px] text-slate-400 mt-1">General operational expenses month-to-date</p>
              </div>

              <div className="premium-card !p-5 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent border-blue-500/20 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                    <Landmark size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-500/10 rounded-full">
                    2 Projects
                  </span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Capital Investment (CAPEX)</p>
                <h3 className="text-2xl font-black font-outfit italic tracking-tight text-slate-900 dark:text-white">LKR {f.capitalExpenses.toLocaleString()}</h3>
                <p className="text-[9px] text-slate-400 mt-1">Replanting and infrastructure capital projects</p>
              </div>

              <div className="premium-card !p-5 bg-gradient-to-br from-teal-500/10 via-transparent to-transparent border-teal-500/20 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-500">
                    <Award size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-teal-500 px-2 py-0.5 bg-teal-500/10 rounded-full flex items-center gap-1">
                    {f.marginPercent.toFixed(1)}% Margin
                  </span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Net Operating Surplus</p>
                <h3 className={`text-2xl font-black font-outfit italic tracking-tight ${f.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  LKR {f.netProfit.toLocaleString()}
                </h3>
                <p className="text-[9px] text-slate-400 mt-1">Consolidated EBITA financial surplus</p>
              </div>
            </div>

            {/* Mid Section: Profitability Curve & Asset Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Financial Cashflow Trajectory */}
              <div className="lg:col-span-8 premium-card !p-6 flex flex-col min-h-[360px]">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                      <ProfitIcon size={16} className="text-emerald-500" /> Revenue & Expense Trajectory
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">6-Month Portfolio Cashflow History</p>
                  </div>
                  <div className="flex gap-4 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Income</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Expenses</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-teal-500 inline-block" /> Profit</span>
                  </div>
                </div>
                <div className="w-full flex-1" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={f.cashflowHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', fontFamily: 'Outfit', fontWeight: 900, fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#incGrad)" name="Income" />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#expGrad)" name="Expense" />
                      <Line type="monotone" dataKey="profit" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} name="Profit" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Asset Valuation Split */}
              <div className="lg:col-span-4 premium-card !p-6 flex flex-col justify-between min-h-[360px]">
                <div>
                  <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <Database size={16} className="text-teal-500" /> Asset Portfolio
                  </h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Estate-wide Capital Valuation</p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  <div style={{ height: 160, width: '100%' }} className="relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie
                          data={valuationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {valuationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={VALUATION_COLORS[index % VALUATION_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Valuation']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center text-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total Valuation</span>
                      <span className="text-sm font-black font-outfit text-slate-900 dark:text-white">LKR {(v.totalValuation / 1000000).toFixed(2)}M</span>
                    </div>
                  </div>

                  {/* Legends */}
                  <div className="w-full mt-4 space-y-2">
                    {valuationData.map((item, index) => (
                      <div key={item.name} className="flex justify-between items-center text-[10px] font-bold">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: VALUATION_COLORS[index] }} />
                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[130px]">{item.name}</span>
                        </div>
                        <span className="text-slate-800 dark:text-white">LKR {item.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Productivity Index and Health Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="premium-card !p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <Leaf size={14} className="text-emerald-500" /> Land Productivity Index
                  </h2>
                  <span className="text-[8px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    COP Indicator
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Yield Per Hectare</p>
                      <h4 className="text-xl font-black font-outfit italic text-slate-800 dark:text-white mt-0.5">
                        {p.yieldPerHectare.toFixed(2)} kg/ha
                      </h4>
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                      <TrendingUp size={10} /> Optimal
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Total Area</p>
                      <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{p.totalAreaHectares} ha</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Blocks</p>
                      <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{p.totalBlocks} active</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Harvest MTD</p>
                      <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{(p.totalYieldKg / 1000).toFixed(1)} tons</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card !p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity size={14} className="text-blue-500" /> Operational Density
                  </h2>
                  <Link to="/crop/operations-intel" className="text-[8px] font-black text-blue-500 uppercase tracking-widest hover:underline">
                    View Schedule
                  </Link>
                </div>
                
                <div className="space-y-2">
                  {d.operationsSummary.slice(0, 4).map((op, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-[10px] font-black uppercase shrink-0">
                          {op.name.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase truncate capitalize">{op.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[8px] font-black text-slate-400 uppercase">{op.count} rounds</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                          op.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                          op.status === "in_progress" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                        }`}>
                          {op.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="premium-card !p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck size={14} className="text-teal-500" /> Compliance & Integrity
                  </h2>
                  <span className="text-[8px] font-bold text-emerald-500 px-1.5 py-0.5 bg-emerald-500/10 rounded">
                    100% Secure
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                    <ShieldCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Insurance Registry</p>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">All biological plantation covers active. No renewal liabilities outstanding.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
                    <CheckSquare size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase">EPF/ETF Guidelines</p>
                      <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">Payroll wages and provident funds submitted to Central Bank of Sri Lanka.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── Tab Content: Agronomics ── */}
        {activeTab === "agronomics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-500">
            {/* Left side: Soil Health pH & Nutrient Tracker */}
            <div className="lg:col-span-6 premium-card !p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                  <Sprout size={16} className="text-emerald-500" /> Blockwise Soil Health & pH
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Chemical & Organic Nutrient Balance</p>
              </div>

              <div className="space-y-4">
                {[
                  { block: "Block 01", variety: "TRI 2023", ph: 4.8, dolomiteNeeded: 1200, status: "Normal" },
                  { block: "Block 02", variety: "TRI 2026", ph: 4.2, dolomiteNeeded: 2500, status: "Critical pH" },
                  { block: "Block 03", variety: "TRI 2023", ph: 5.1, dolomiteNeeded: 0, status: "Optimal" },
                  { block: "Block 04", variety: "TRI 2025", ph: 4.5, dolomiteNeeded: 1500, status: "Normal" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">{item.block}</span>
                        <span className="text-[8px] font-black text-slate-400 bg-slate-200 dark:bg-slate-700 px-1 rounded">{item.variety}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">Dolomite Need: {item.dolomiteNeeded} kg</p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black font-outfit text-slate-900 dark:text-white">pH {item.ph}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        item.status === "Optimal" ? "bg-emerald-500/10 text-emerald-500" :
                        item.status === "Normal" ? "bg-blue-500/10 text-blue-500" : "bg-rose-500/10 text-rose-500"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: Agronomic Operations List */}
            <div className="lg:col-span-6 premium-card !p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare size={16} className="text-teal-500" /> Agronomic Rounds Scheduler
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Chemical & Fertilizer Applications</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Fertilizer Round A-2", type: "Manure", date: "2026-05-22", dosage: "250 kg/ha", status: "Scheduled" },
                  { name: "Foliar Spray ZnSO4", type: "Foliar", date: "2026-05-24", dosage: "15 kg/ha", status: "Scheduled" },
                  { name: "Block 02 Pruning (Heavy)", type: "Pruning", date: "2026-05-20", dosage: "Medium shade lopping", status: "In Progress" },
                  { name: "Soil Health pH Survey", type: "Soil Test", date: "2026-05-18", dosage: "8 block core tests", status: "Completed" }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">{item.name}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1 rounded uppercase">{item.type}</span>
                        <span className="text-[8px] font-bold text-slate-400">Dosage: {item.dosage}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400">{item.date}</p>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        item.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" :
                        item.status === "In Progress" ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab Content: Financial Core ── */}
        {activeTab === "finance" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-500">
            {/* Profitability Index Sheet */}
            <div className="lg:col-span-7 premium-card !p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                  <Scale size={16} className="text-emerald-500" /> Double-entry Ledger Overview
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Chart of Accounts Valuation Summary</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="pb-3">Account Code</th>
                      <th className="pb-3">Account Name</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3 text-right">Debit Balance</th>
                      <th className="pb-3 text-right">Credit Balance</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    <tr className="border-b border-slate-100 dark:border-slate-800/50 py-2">
                      <td className="py-2.5 font-outfit font-black">1000</td>
                      <td>Cash & Bank Ledger</td>
                      <td><span className="text-[9px] font-black text-blue-500 uppercase">Asset</span></td>
                      <td className="text-right text-slate-950 dark:text-white">LKR 940,250</td>
                      <td className="text-right text-slate-400">-</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50 py-2">
                      <td className="py-2.5 font-outfit font-black">1100</td>
                      <td>Accounts Receivable</td>
                      <td><span className="text-[9px] font-black text-blue-500 uppercase">Asset</span></td>
                      <td className="text-right text-slate-950 dark:text-white">LKR 310,000</td>
                      <td className="text-right text-slate-400">-</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50 py-2">
                      <td className="py-2.5 font-outfit font-black">2000</td>
                      <td>Accounts Payable</td>
                      <td><span className="text-[9px] font-black text-amber-500 uppercase">Liability</span></td>
                      <td className="text-right text-slate-400">-</td>
                      <td className="text-right text-slate-950 dark:text-white">LKR 124,500</td>
                    </tr>
                    <tr className="border-b border-slate-100 dark:border-slate-800/50 py-2">
                      <td className="py-2.5 font-outfit font-black">3000</td>
                      <td>Retained Owner Equity</td>
                      <td><span className="text-[9px] font-black text-purple-500 uppercase">Equity</span></td>
                      <td className="text-right text-slate-400">-</td>
                      <td className="text-right text-slate-950 dark:text-white">LKR 1,125,750</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Budget allocation chart */}
            <div className="lg:col-span-5 premium-card !p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <BarChart3 size={16} className="text-teal-500" /> Project Budgeting Allocation
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Capital Projects Budget vs Actual Spending</p>
              </div>

              <div className="w-full flex-1" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={[
                    { name: "Replant Proj A", Budget: 800000, Actual: 450000 },
                    { name: "Factory Refit", Budget: 1500000, Actual: 1350000 },
                    { name: "Muster Terminal", Budget: 300000, Actual: 240000 }
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fontWeight: 800 }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10, fontWeight: 800 }} />
                    <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
