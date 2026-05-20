import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck, Sprout, Leaf, Wallet, Package, History,
  ClipboardList, Users, ShieldCheck, BarChart3, RefreshCw, Clock,
  CheckCircle2, AlertCircle, Bell, CloudSun, Wind,
  Droplets, Settings, ArrowRight, TrendingUp, TrendingDown,
  Zap, UserCheck
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiClient } from "../api/client";

const modules = [
  { name: "Attendance", path: "/attendance/live", icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { name: "Plucking", path: "/crop/operations-intel", icon: Sprout, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { name: "Weeding", path: "/crop/rounds-intel", icon: Leaf, color: "text-tea-500", bg: "bg-tea-50 dark:bg-tea-900/20" },
  { name: "Advances", path: "/payrall/advances", icon: Wallet, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { name: "Stock", path: "/inventory/tea-packets", icon: Package, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { name: "Workforce", path: "/workforce", icon: Users, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  { name: "Rounds", path: "/crop/rounds-intel", icon: RefreshCw, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
  { name: "Compliance", path: "/compliance/estate", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  { name: "Reports", path: "/reports/attendance", icon: BarChart3, color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800/40" },
  { name: "Logs", path: "/attendance/today", icon: History, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
];

const TRANSLATIONS = {
  en: {
    greeting: "Good",
    morning: "Morning", afternoon: "Afternoon", evening: "Evening",
    subtitle: "Field Operations Command",
    liveData: "Live Field Data",
    activeForce: "Active Force",
    dailyYield: "Daily Yield",
    attendance: "Attendance Rate",
    criticalAlerts: "Alerts",
    digitalArsenal: "Quick Access",
    todayRoster: "Today's Roster",
    yieldChart: "Yield Trend",
    footer: "© 2026 TEA ERP PRO • FIELD OPERATIONS SUITE",
    modules: {
      Attendance: "Attendance", Plucking: "Plucking", Weeding: "Weeding",
      Advances: "Advances", Stock: "Stock", Workforce: "Workforce",
      Rounds: "Rounds", Compliance: "Compliance", Reports: "Reports", Logs: "Logs",
    },
  },
  si: {
    greeting: "ආයුබෝවන්",
    morning: "උදෑසන", afternoon: "දහවල්", evening: "සවස",
    subtitle: "ක්ෂේත්‍ර මෙහෙයුම් විධානය",
    liveData: "සජීවී ක්ෂේත්‍ර දත්ත",
    activeForce: "ක්‍රියාකාරී සේවකයන්",
    dailyYield: "දෛනික අස්වැන්න",
    attendance: "පැමිණීමේ අනුපාතය",
    criticalAlerts: "දැනුම්දීම්",
    digitalArsenal: "ඉක්මන් ප්‍රවේශය",
    todayRoster: "අද ලේඛනය",
    yieldChart: "අස්වැන්න ප්‍රවණතාව",
    footer: "© 2026 TEA ERP PRO • ක්ෂේත්‍ර මෙහෙයුම් කට්ටලය",
    modules: {
      Attendance: "පැමිණීම", Plucking: "දළු කැඩීම", Weeding: "වල් නෙලීම",
      Advances: "අත්තිකාරම්", Stock: "තොග", Workforce: "සේවා බලකාය",
      Rounds: "වට", Compliance: "අනුකූලතාවය", Reports: "වාර්තා", Logs: "සටහන්",
    },
  },
};

const getGreetingPeriod = () => {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
};

export default function FieldOfficerDashboard() {
  const [language, setLanguage] = useState(() => localStorage.getItem('tea-erp-lang') || 'en');
  const t = useMemo(() => TRANSLATIONS[language], [language]);

  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({
    activeWorkers: 0, todayYield: 0, attendanceRate: 0, pendingTasks: 0,
    yieldTrend: 0, workforceTrend: 0, yieldHistory: [], recentActivity: [], notifications: [],
  });

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? (() => { try { return JSON.parse(storedUser); } catch { return {}; } })() : {};

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handler = () => setLanguage(localStorage.getItem('tea-erp-lang') || 'en');
    window.addEventListener('languageChange', handler);
    return () => window.removeEventListener('languageChange', handler);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dashRes, workforceRes, attendanceRes, noticeRes, weatherRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/workforce/summary'),
          apiClient.get('/workforce/attendance-today'),
          apiClient.get('/notifications'),
          apiClient.get('/weather/current'),
        ]);

        const totalWorkers = workforceRes.success ? (workforceRes.data?.totalWorkers || 1) : 1;
        const presentToday = attendanceRes.success ? (attendanceRes.data?.length || 0) : 0;
        const unread = noticeRes.success ? noticeRes.data?.filter(n => !n.isRead) : [];

        setStats({
          activeWorkers: dashRes.success ? (dashRes.data?.activeWorkforce || 0) : 0,
          todayYield: dashRes.success ? (dashRes.data?.dailyYieldKg || 0) : 0,
          attendanceRate: Math.round((presentToday / totalWorkers) * 100),
          pendingTasks: unread.length,
          yieldTrend: dashRes.success ? (dashRes.data?.yieldTrend || 0) : 0,
          workforceTrend: dashRes.success ? (dashRes.data?.workforceTrend || 0) : 0,
          yieldHistory: dashRes.success ? (dashRes.data?.yieldHistory || []) : [],
          recentActivity: attendanceRes.success ? (attendanceRes.data?.slice(0, 6) || []) : [],
          notifications: unread.slice(0, 3),
          totalWorkers,
          presentToday,
        });

        if (weatherRes.success) setWeather(weatherRes.data);
      } catch (err) {
        console.error("Field officer dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const period = getGreetingPeriod();

  const kpiCards = [
    {
      label: t.activeForce, value: stats.activeWorkers,
      sub: `${stats.presentToday || 0} present today`,
      trend: stats.workforceTrend, icon: Users,
      color: "text-blue-600", bg: "bg-blue-500/10", accent: "#3b82f6",
    },
    {
      label: t.dailyYield, value: `${stats.todayYield} kg`,
      sub: "harvested today",
      trend: stats.yieldTrend, icon: Sprout,
      color: "text-emerald-600", bg: "bg-emerald-500/10", accent: "#10b981",
    },
    {
      label: t.attendance, value: `${stats.attendanceRate}%`,
      sub: `${stats.presentToday || 0} / ${stats.totalWorkers || 0} workers`,
      trend: null, icon: CheckCircle2,
      color: "text-tea-600", bg: "bg-tea-500/10", accent: "#10b981",
    },
    {
      label: t.criticalAlerts, value: stats.pendingTasks,
      sub: "unread notifications",
      trend: null, icon: AlertCircle,
      color: "text-amber-600", bg: "bg-amber-500/10", accent: "#f59e0b",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center -m-6 bg-slate-50 dark:bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Sprout className="w-12 h-12 text-tea-500 animate-bounce" />
            <div className="absolute inset-0 rounded-full bg-tea-500/20 animate-ping" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.3em] animate-pulse">Loading Field Operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50 -m-6 p-4 lg:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-700">

        {/* ── Command Header ── */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tea-500 via-emerald-400 to-cyan-500" />
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(16,185,129,0.2) 0%, transparent 60%)" }} />

          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-tea-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-tea-500/30 ring-2 ring-white/10 shrink-0">
                <UserCheck className="text-white" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black text-tea-400 uppercase tracking-widest px-2 py-0.5 rounded-full bg-tea-500/20 border border-tea-500/30">
                    Field Officer
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> {t.liveData}
                  </span>
                </div>
                <h1 className="text-xl font-black font-outfit uppercase italic tracking-tight text-white leading-none mb-0.5">
                  {language === 'en' ? `${t.greeting} ${t[period]},` : t.greeting} <span className="text-tea-400">{user.username || 'Officer'}</span>
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Language Toggle */}
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                {['en', 'si'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      localStorage.setItem('tea-erp-lang', lang);
                      window.dispatchEvent(new Event('languageChange'));
                    }}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${language === lang ? 'bg-slate-700 text-tea-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang === 'en' ? 'EN' : 'සිං'}
                  </button>
                ))}
              </div>

              {/* Weather Pill */}
              {weather && (
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <CloudSun size={16} />
                    <span className="text-sm font-black font-outfit">{weather.temp}°C</span>
                  </div>
                  <div className="h-4 w-px bg-slate-600" />
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1 text-[9px] font-bold">
                      <Droplets size={11} className="text-blue-400" /> {weather.humidity}%
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold">
                      <Wind size={11} className="text-slate-400" /> {weather.wind}km/h
                    </span>
                  </div>
                </div>
              )}

              {/* Live Clock */}
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700">
                <Clock size={13} className="text-tea-400" />
                <div className="text-right">
                  <p className="text-sm font-black font-outfit text-white tabular-nums">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">
                    {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Incident Alert ── */}
        {stats.notifications.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 animate-in slide-in-from-top duration-500">
            <div className="flex items-center gap-2 mb-2 text-rose-600 dark:text-rose-400">
              <Bell size={13} className="animate-bounce" />
              <span className="text-[9px] font-black uppercase tracking-widest">Incident Alerts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {stats.notifications.map((n, i) => (
                <div key={i} className="flex gap-2 p-2 rounded-xl bg-white/60 dark:bg-slate-900/60">
                  <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <p className="text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase leading-tight">{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((k, i) => (
            <div key={i} className="premium-card !p-4 group hover:-translate-y-1 hover:border-tea-500/30 transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <div className={`p-2 rounded-xl ${k.bg}`}>
                  <k.icon size={18} className={k.color} />
                </div>
                {k.trend !== null && k.trend !== undefined && k.trend !== 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${k.trend > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                    {k.trend > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {Math.abs(k.trend).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{k.label}</p>
              <h3 className="text-2xl font-black font-outfit italic tracking-tight text-slate-900 dark:text-white leading-none">
                {loading ? <div className="h-7 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" /> : k.value}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Mid Row: Yield Chart + Roster ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Yield Sparkline */}
          <div className="lg:col-span-7 premium-card !p-5 flex flex-col min-h-[240px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[11px] font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={13} className="text-tea-500" /> {t.yieldChart}
              </h2>
              <Link to="/crop/operations-intel" className="text-[9px] font-black text-tea-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                Details <ArrowRight size={10} />
              </Link>
            </div>
            <div style={{ height: 170 }}>
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={stats.yieldHistory || []} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="foYieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontFamily: 'Outfit', fontWeight: 900, fontSize: 11 }}
                    formatter={(v) => [`${v} kg`, 'Yield']}
                  />
                  <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2.5} fill="url(#foYieldGrad)"
                    dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Roster Preview */}
          <div className="lg:col-span-5 premium-card !p-5 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[11px] font-black font-outfit uppercase italic text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList size={13} className="text-tea-500" /> {t.todayRoster}
              </h2>
              <Link to="/attendance/today" className="text-[9px] font-black text-tea-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                All <ArrowRight size={10} />
              </Link>
            </div>
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {stats.recentActivity.length > 0 ? stats.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:border-tea-500/30 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-tea-400 to-emerald-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">
                      {(a.full_name_initials || a.first_name || 'W').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">
                        {a.full_name_initials || `${a.first_name || ''} ${a.last_name || ''}`.trim() || `Worker ${i + 1}`}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{a.task || 'Field Duty'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {a.block_name && (
                      <span className="text-[8px] font-black text-tea-600 dark:text-tea-400 px-1.5 py-0.5 rounded-md bg-tea-50 dark:bg-tea-900/30 border border-tea-100 dark:border-tea-800/50">
                        {a.block_name}
                      </span>
                    )}
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-xs font-bold py-6">
                  No attendance records for today
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Digital Arsenal ── */}
        <section className="premium-card !p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap size={13} className="text-tea-500" /> {t.digitalArsenal}
            </h2>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{modules.length} Modules</span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {modules.map((mod) => (
              <Link
                key={mod.name}
                to={mod.path}
                className="flex flex-col items-center text-center group hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-xl transition-all duration-200 border border-transparent hover:border-tea-500/20"
              >
                <div className={`p-2.5 rounded-xl mb-1.5 ${mod.bg} group-hover:scale-110 transition-transform duration-200`}>
                  <mod.icon size={16} className={mod.color} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 dark:text-slate-400 group-hover:text-tea-600 dark:group-hover:text-tea-400 transition-colors leading-tight">
                  {t.modules[mod.name] || mod.name}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="flex justify-between items-center px-5 py-3 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.footer}</p>
          <div className="flex gap-4">
            <Link to="/settings" className="text-slate-400 hover:text-tea-500 transition-colors">
              <Settings size={14} />
            </Link>
            <Link to="/notifications" className="text-slate-400 hover:text-tea-500 transition-colors">
              <Bell size={14} />
            </Link>
          </div>
        </footer>

      </div>
    </div>
  );
}
