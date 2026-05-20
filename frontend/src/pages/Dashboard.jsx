import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Users, Leaf, CloudRain, Wallet, Target,
  ShieldCheck, ArrowUpRight, ChevronRight, Activity,
  CheckCircle2, Package, Landmark, BarChart3, ArrowRight,
  CloudSun, Droplets, Wind
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { apiClient } from "../api/client";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

const QUICK_ACTIONS = [
  { label: "Crop Ops", icon: Leaf, to: "/crop/operations-intel", color: "text-emerald-500", bg: "bg-emerald-500/10", hoverBorder: "hover:border-emerald-500/40" },
  { label: "Attendance", icon: Users, to: "/attendance/today", color: "text-blue-500", bg: "bg-blue-500/10", hoverBorder: "hover:border-blue-500/40" },
  { label: "Payroll", icon: Wallet, to: "/payrall", color: "text-amber-500", bg: "bg-amber-500/10", hoverBorder: "hover:border-amber-500/40" },
  { label: "Finance", icon: Landmark, to: "/finance/overview", color: "text-purple-500", bg: "bg-purple-500/10", hoverBorder: "hover:border-purple-500/40" },
  { label: "Inventory", icon: Package, to: "/inventory/goods", color: "text-rose-500", bg: "bg-rose-500/10", hoverBorder: "hover:border-rose-500/40" },
  { label: "Reports", icon: BarChart3, to: "/reports/attendance", color: "text-indigo-500", bg: "bg-indigo-500/10", hoverBorder: "hover:border-indigo-500/40" },
];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [execData, setExecData] = useState(null);
  const [workforce, setWorkforce] = useState(null);
  const [weather, setWeather] = useState(null);

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? (() => { try { return JSON.parse(storedUser); } catch { return {}; } })() : {};

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, e, w, weatherRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/dashboard/executive-summary'),
          apiClient.get('/workforce/summary'),
          apiClient.get('/weather/current').catch(() => ({ success: false }))
        ]);
        if (s.success) setStats(s.data);
        if (e.success) setExecData(e.data);
        if (w.success) setWorkforce(w.data);
        if (weatherRes && weatherRes.success) setWeather(weatherRes.data);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center -m-6 bg-slate-50 dark:bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Leaf className="w-12 h-12 text-tea-500 animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-tea-500/20 animate-ping" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Syncing Intelligence Core...</p>
        </div>
      </div>
    );
  }

  const s = stats || {};
  const e = execData || {};
  const w = workforce || {};
  const attendanceRate = w.totalWorkers > 0 ? Math.round((w.presentToday / w.totalWorkers) * 100) : 0;

  const kpis = [
    { title: "Today's Yield", value: `${(s.dailyYieldKg || 0).toLocaleString()} kg`, trend: s.yieldTrend, icon: Leaf, color: "text-emerald-500", accent: "#10b981" },
    { title: "Monthly Expenses", value: `LKR ${(e.totalMonthlyExpenses || 0).toLocaleString()}`, trend: -5.2, icon: Wallet, color: "text-blue-500", accent: "#3b82f6" },
    { title: "Active Workforce", value: `${s.activeWorkforce || 0}`, trend: s.workforceTrend, icon: Users, color: "text-amber-500", accent: "#f59e0b" },
    { title: "Yield Quality", value: s.avgQualityGrade || 'N/A', trend: 2.4, icon: Target, color: "text-purple-500", accent: "#a855f7" },
    { title: "Attendance Rate", value: `${attendanceRate}%`, trend: null, icon: CheckCircle2, color: "text-rose-500", accent: "#f43f5e" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 -m-6 p-6">
      <div className="max-w-[1600px] mx-auto space-y-5 animate-in fade-in duration-700">

        {/* ── Hero Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-black text-tea-600 dark:text-tea-400 uppercase tracking-[0.25em] px-2 py-0.5 rounded-full bg-tea-500/10 border border-tea-500/20">
                {(user.role || 'admin').replace('_', ' ')}
              </span>
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
              </span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
              Welcome back, <span className="text-tea-500">{user.username || 'Admin'}</span>
            </h1>
            <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-xs font-bold flex items-center gap-2">
              <ShieldCheck size={14} className="text-tea-500" /> Estate Intelligence • Strategic Command Center
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

            <div className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <Activity size={14} className="text-tea-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Optimal</span>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`premium-card !p-4 flex flex-col items-center gap-2 group hover:-translate-y-1 ${action.hoverBorder} transition-all duration-300`}
            >
              <div className={`p-2.5 rounded-xl ${action.bg} group-hover:scale-110 transition-transform duration-300`}>
                <action.icon size={20} className={action.color} />
              </div>
              <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center group-hover:text-tea-600 dark:group-hover:text-tea-400 transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="premium-card !p-5 group hover:-translate-y-1 transition-all duration-300"
              style={{ borderColor: `${kpi.accent}22` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${kpi.accent}18` }}>
                  <kpi.icon size={20} className={kpi.color} />
                </div>
                {kpi.trend != null && (
                  <div className={`flex items-center gap-0.5 text-[9px] font-black px-2 py-1 rounded-lg ${kpi.trend >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                    {kpi.trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {Math.abs(kpi.trend).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
              <h3 className="text-xl font-black font-outfit italic tracking-tight text-slate-900 dark:text-white">{kpi.value}</h3>
            </div>
          ))}
        </div>

        {/* ── Analytics Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* Yield Chart */}
          <div className="lg:col-span-8 premium-card !p-6 flex flex-col min-h-[360px]">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-base font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp size={16} className="text-tea-500" /> Yield Trajectory
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">7-Day Harvest Output Analysis</p>
              </div>
              <Link to="/crop/operations-intel" className="flex items-center gap-1 text-[9px] font-black text-tea-500 uppercase tracking-widest hover:gap-2 transition-all border-b border-tea-500/30 pb-0.5">
                Full Report <ArrowUpRight size={10} />
              </Link>
            </div>
            <div className="w-full" style={{ height: 270 }}>
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={s.yieldHistory || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', fontFamily: 'Outfit', fontWeight: 900, fontSize: 12 }}
                    formatter={(v) => [`${v} kg`, 'Yield']}
                  />
                  <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#yieldGrad)"
                    dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-4">

            {/* Quality Donut */}
            <div className="premium-card !p-5 flex flex-col h-[200px]">
              <h2 className="text-[11px] font-black font-outfit uppercase italic text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Target size={13} className="text-purple-500" /> Quality Split
              </h2>
              {(e.qualityDistribution?.length || 0) > 0 ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1" style={{ height: 130 }}>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie data={e.qualityDistribution || []} innerRadius={38} outerRadius={55} paddingAngle={4} dataKey="count" nameKey="quality_grade">
                          {e.qualityDistribution?.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Batches']} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 shrink-0">
                    {e.qualityDistribution?.map((item, index) => (
                      <div key={item.quality_grade} className="flex items-center gap-2 text-[9px] font-black uppercase">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-slate-400">Gr.{item.quality_grade}</span>
                        <span className="text-slate-900 dark:text-white">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold">No quality data yet</div>
              )}
            </div>

            {/* Attendance Snapshot */}
            <div className="premium-card !p-5 flex flex-col justify-between h-[150px]">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                  <Users size={13} className="text-blue-500" /> Today's Attendance
                </h2>
                <Link to="/attendance/today" className="text-[9px] font-black text-blue-500 uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all">
                  View <ArrowRight size={10} />
                </Link>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-3xl font-black font-outfit italic text-slate-900 dark:text-white">{w.presentToday || 0}</span>
                  <span className="text-[10px] font-bold text-slate-400">of {w.totalWorkers || 0}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] font-bold text-emerald-500">{attendanceRate}% present</span>
                  <span className="text-[9px] font-bold text-slate-400">{(w.totalWorkers || 0) - (w.presentToday || 0)} absent</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Bottom Info Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <InfoCard
            title="Environmental Alert"
            content={s.recentWeatherAlert || 'Atmospheric conditions stable. No active alerts.'}
            icon={CloudRain}
            type="warning"
            link="/weather/realtime"
          />
          <InfoCard
            title="Financial Signal"
            content={`Monthly spend at LKR ${(e.totalMonthlyExpenses || 0).toLocaleString()}. ${(e.totalMonthlyExpenses || 0) > 50000 ? 'Review high-variance cost centres for Q efficiency.' : 'Within standard operational budget thresholds.'}`}
            icon={Wallet}
            type="info"
            link="/finance/overview"
          />
          <InfoCard
            title="Workforce Efficiency"
            content={`Attendance at ${attendanceRate}% of registered workforce — ${attendanceRate >= 80 ? 'operational density is optimal.' : 'below target. Review absenteeism logs.'}`}
            icon={Activity}
            type="success"
            link="/reports/attendance"
          />
        </div>

      </div>
    </div>
  );
}

const InfoCard = ({ title, content, icon: Icon, type, link }) => {
  const styles = {
    warning: "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600",
    success: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600",
    info: "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600",
  };
  return (
    <div className={`p-5 rounded-3xl border ${styles[type]} flex flex-col gap-3`}>
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm shrink-0">
          <Icon size={16} />
        </div>
        <div>
          <h4 className="text-[9px] font-black uppercase tracking-widest mb-1">{title}</h4>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{content}</p>
        </div>
      </div>
      {link && (
        <Link to={link} className="self-end flex items-center gap-1 text-[9px] font-black uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity">
          View Details <ChevronRight size={10} />
        </Link>
      )}
    </div>
  );
};
