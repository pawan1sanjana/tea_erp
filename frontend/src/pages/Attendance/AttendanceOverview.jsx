import React, { useMemo, useState, useEffect } from 'react';
import { 
  Clock, CheckCircle2, TrendingUp, Calendar, UserCheck, 
  UserX, ScanFace, QrCode, ClipboardList, ShieldCheck,
  Activity, Layers, MapPin, Search, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';

export default function AttendanceOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    presentToday: 0,
    totalWorkers: 0,
    enrolledWorkers: 0,
    biometricCheckinsToday: 0
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      try {
        const [summaryRes, enrolledRes, bioRes, statsRes, monthlyRes] = await Promise.all([
          apiClient.get('/workforce/summary').catch(e => ({ success: false, error: 'Summary Fail' })),
          apiClient.get('/workforce/face-descriptors').catch(() => ({ success: false, data: [] })),
          apiClient.get('/workforce/attendance-today').catch(e => ({ success: false, data: [], error: 'Today Fail' })),
          apiClient.get('/workforce/attendance-stats').catch(e => ({ success: false, data: [], error: 'Stats Fail' })),
          apiClient.get('/workforce/attendance-stats-monthly').catch(e => ({ success: false, data: [], error: 'Monthly Fail' })),
        ]);

        if (!isMounted) return;

        if (!summaryRes.success && !statsRes.success) {
          setError("Personnel Synchronization Delayed");
        }

        const totalWorkers = summaryRes?.success ? Number(summaryRes.data?.totalWorkers || 0) : 0;
        const presentToday = summaryRes?.success ? Number(summaryRes.data?.presentToday || 0) : 0;
        const enrolledWorkers = enrolledRes?.success ? (enrolledRes.data?.length || 0) : 0;
        const biometricCheckinsToday = bioRes?.success ? (bioRes.data?.length || 0) : 0;

        setStats({ totalWorkers, presentToday, enrolledWorkers, biometricCheckinsToday });
        
        const logs = bioRes?.success ? (bioRes.data || []).map(log => ({
          id: log.worker_id,
          name: `${log.first_name} ${log.last_name}`,
          time: log.check_in_time,
          status: 'verified'
        })).slice(0, 6) : [];
        setRecentLogs(logs);

        if (statsRes?.success) {
          setAttendanceData(statsRes.data);
        }
        if (monthlyRes?.success) {
          setMonthlyData(monthlyRes.data);
        }
      } catch (err) {
        console.error("Overview sync failed", err);
        if (isMounted) setError("Critical Infrastructure Offline");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    run();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 italic animate-pulse">Synchronizing Biometric Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Attendance Management</h1>
           <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
             <ShieldCheck size={14} className="text-tea-500" /> Executive biometric analytics and workforce deployment intelligence
           </p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => navigate('/attendance/logs')}
             className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
           >
             <Search size={16} /> Historical Logs
           </button>
           <button 
             onClick={() => navigate('/attendance/live')}
             className="flex items-center gap-2 px-5 py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-tea-600/20 transition-all hover:scale-[1.02]"
           >
             <ScanFace size={16} /> Launch Scanner
           </button>
        </div>
      </div>

      {/* KPI Section - Matching Biological Assets Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present Today", value: stats.presentToday, unit: "Workers", icon: UserCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
          { label: "Bio-Verified", value: stats.biometricCheckinsToday, unit: "Checked", icon: ScanFace, color: "text-tea-600 dark:text-tea-400", bg: "bg-tea-100 dark:bg-tea-900/30" },
          { label: "Absenteeism", value: Math.max(stats.totalWorkers - stats.presentToday, 0), unit: "Today", icon: UserX, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-100 dark:bg-rose-900/30" },
          { label: "Coverage Rate", value: stats.totalWorkers > 0 ? `${Math.round((stats.enrolledWorkers / stats.totalWorkers) * 100)}%` : "—", unit: "Enrollment", icon: TrendingUp, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" },
        ].map((stat, i) => (
          <div key={i} className="premium-card flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-2xl ${stat.bg}`}>
              <stat.icon className={stat.color} size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">{stat.value}</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{stat.unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Chart */}
          <div className="premium-card flex flex-col pt-6 pb-6">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
                  <Calendar size={16} className="text-tea-500" /> Weekly Attendance Pulse
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Personnel density over the last 6 cycles</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                 <Activity size={12} className="text-tea-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Heartbeat</span>
              </div>
            </div>
            <div className="h-[320px] w-full bg-white dark:bg-slate-900/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                   <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500">
                      <Activity size={32} className="animate-pulse" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">{error}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={attendanceData.length ? attendanceData : [{day: '—', count: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff', padding: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.count > 450 ? '#10b981' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="premium-card flex flex-col pt-6 pb-6">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2">
                  <Activity size={16} className="text-indigo-500" /> Macro Operational Output
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">30-Day strategic workforce assessment</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                 <Layers size={12} className="text-indigo-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Monthly</span>
              </div>
            </div>
            <div className="h-[320px] w-full bg-white dark:bg-slate-900/50 rounded-3xl p-4 border border-slate-100 dark:border-slate-800">
              {error ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                   <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500">
                      <Activity size={32} className="animate-pulse" />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">{error}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={monthlyData.length ? monthlyData : [{date: '—', count: 0}]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff', padding: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={20}>
                      {monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={'#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Tactical Actions & Logs */}
        <div className="space-y-6">
           <div className="premium-card bg-slate-900 border-none relative overflow-hidden p-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <UserCheck size={120} className="text-tea-500" />
              </div>
              <h3 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-8 font-outfit italic flex items-center gap-2">
                <TrendingUp size={14} className="text-tea-500" /> Quick Operational Launch
              </h3>
              <div className="space-y-3 relative z-10">
                 <button
                    onClick={() => navigate('/attendance/live')}
                    className="w-full py-4 bg-teal-600/90 hover:bg-teal-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-between px-6 shadow-xl shadow-teal-900/40 group"
                 >
                    <div className="flex items-center gap-3">
                      <ScanFace size={18} /> Face Scan
                    </div>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
                 <button
                    onClick={() => navigate('/attendance/qr')}
                    className="w-full py-4 bg-blue-600/90 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-between px-6 shadow-xl shadow-blue-900/40 group"
                 >
                    <div className="flex items-center gap-3">
                      <QrCode size={18} /> QR Audit
                    </div>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                 </button>
                 
                 <div className="pt-4 border-t border-white/5 mt-4">
                    <button
                        onClick={() => navigate('/attendance/manual')}
                        className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[9px] transition-all flex flex-col items-center justify-center gap-2 border border-white/10 group"
                    >
                        <ShieldCheck size={20} className="text-tea-500 mb-1" />
                        Manual Override
                        <span className="text-[7px] text-slate-500 tracking-widest font-bold">Manual Overrides & Off-Time</span>
                    </button>
                 </div>
              </div>
           </div>

           <div className="premium-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-800 dark:text-white font-black uppercase tracking-widest text-[10px] italic">Recent Bio-Logs</h3>
                <button onClick={() => navigate('/attendance/logs')} className="text-[10px] font-black text-tea-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                  View All <ArrowUpRight size={10} />
                </button>
              </div>
              <div className="space-y-4">
                 {(recentLogs.length ? recentLogs : [
                   { id: 'empty-1', name: "—", time: "—", status: "—" },
                   { id: 'empty-2', name: "—", time: "—", status: "—" },
                   { id: 'empty-3', name: "—", time: "—", status: "—" },
                 ]).map((log, i) => (
                   <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800/50 group hover:border-tea-500/30 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                          <UserCheck size={14} className="text-slate-400 group-hover:text-tea-500 transition-colors" />
                        </div>
                        <div>
                          <p className="text-xs font-black dark:text-white uppercase tracking-tight italic leading-none mb-1">{log.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{log.time}</p>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
                        Verified
                      </span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
