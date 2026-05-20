import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Search, Filter, Download, FileSpreadsheet, 
  FileText, TrendingUp, UserCheck, UserX, ScanFace, 
  Clock, Database, ArrowUpRight, Activity, Layers, 
  ShieldCheck, Loader2, ChevronRight, ChevronLeft, User, MapPin
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AttendanceAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalPresent: 0,
    bioRate: 0,
    lateRate: 0,
    coverage: 0
  });
  const [chartData, setChartData] = useState([]);
  const [methodData, setMethodData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(15);

  useEffect(() => {
    fetchAnalyticalData();
  }, [dateRange]);

  const fetchAnalyticalData = async () => {
    setLoading(true);
    try {
      // Simulate multi-date fetch (in reality this would be a single optimized endpoint)
      const res = await apiClient.get(`/workforce/attendance-today?start=${dateRange.start}&end=${dateRange.end}`);
      const statsRes = await apiClient.get('/workforce/attendance-stats');
      
      if (res.success) {
        setAttendance(res.data);
        // Calculate method breakdown for pie chart
        const methods = res.data.reduce((acc, curr) => {
          const m = curr.auth_method || 'manual';
          acc[m] = (acc[m] || 0) + 1;
          return acc;
        }, {});
        
        setMethodData(Object.entries(methods).map(([name, value]) => ({ name: name.toUpperCase(), value })));
      }

      if (statsRes.success) {
        setChartData(statsRes.data);
      }

      // Mock aggregate stats
      setStats({
        totalPresent: res.data?.length || 0,
        bioRate: Math.round(((res.data?.filter(a => a.auth_method === 'face').length || 0) / (res.data?.length || 1)) * 100),
        lateRate: 12, // Mocked late %
        coverage: 94
      });

    } catch (err) {
      console.error("Analytics fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    return attendance.filter(a => {
      const matchesSearch = `${a.first_name} ${a.last_name} ${a.worker_id}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMethod = filterMethod === 'all' || a.auth_method === filterMethod;
      return matchesSearch && matchesMethod;
    });
  }, [attendance, searchTerm, filterMethod]);

  // Pagination Logic
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredAttendance.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredAttendance.length / entriesPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const exportToExcel = () => {
    const data = filteredAttendance.map(a => ({
      'Worker ID': a.worker_id,
      'Name': `${a.first_name} ${a.last_name}`,
      'Check-In': a.check_in_time,
      'Check-Out': a.check_out_time || '—',
      'Hours': a.total_hours || '—',
      'Method': a.auth_method?.toUpperCase(),
      'Location': `${a.latitude}, ${a.longitude}`
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AttendanceReport");
    XLSX.writeFile(workbook, `Attendance_Report_${dateRange.start}_to_${dateRange.end}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(22);
    doc.text("TeaERP Pro - Workforce Intelligence Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);
    
    const tableData = filteredAttendance.map(a => [
      a.worker_id,
      `${a.first_name} ${a.last_name}`,
      a.check_in_time,
      a.check_out_time || '—',
      a.total_hours || '—',
      a.auth_method?.toUpperCase(),
      a.latitude && a.longitude ? `${Number(a.latitude).toFixed(4)}, ${Number(a.longitude).toFixed(4)}` : '—'
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['ID', 'Personnel Name', 'Check-In', 'Check-Out', 'Hrs', 'Method', 'Coordinates']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: '#0f172a', textColor: '#ffffff', fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, font: 'helvetica' },
      alternateRowStyles: { fillColor: '#f8fafc' }
    });

    doc.save(`Workforce_Report_${dateRange.start}_to_${dateRange.end}.pdf`);
    setShowExportOptions(false);
  };

  const handleAudit = (workerId) => {
    navigate('/workforce/view', { state: { auditWorkerId: workerId } });
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 ${loading ? 'opacity-60 cursor-wait' : ''}`}>
      {/* ── Premium Report Header ── */}
      <div className="flex flex-col xl:flex-row justify-between items-end xl:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Workforce Intelligence & Analytics</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-tea-500" /> Administrative reporting engine — Biometric auditing & deployment trends
          </p>
        </div>

        <div className="flex flex-row items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-2">
            <Calendar size={14} className="text-tea-500" />
            <div className="flex items-center gap-1">
              <input 
                type="date" 
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-[10px] font-black uppercase dark:text-white outline-none w-28 px-1"
              />
              <span className="text-slate-300 text-[10px]">TO</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-[10px] font-black uppercase dark:text-white outline-none w-28 px-1"
              />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

          <div className="relative">
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-6 py-2.5 bg-tea-600 hover:bg-tea-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-tea-600/20"
            >
              <Download size={14} /> Export
            </button>
            
            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                  <FileSpreadsheet size={16} /> Excel Spreadsheet
                </button>
                <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                  <FileText size={16} /> PDF Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Performance HUD ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Deployment Volume", value: stats.totalPresent, unit: "Personnel", trend: "+12%", icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Biometric Adoption", value: `${stats.bioRate}%`, unit: "High Fidelity", trend: "+4%", icon: ScanFace, color: "text-tea-500", bg: "bg-tea-500/10" },
          { label: "Punctuality Index", value: "88%", unit: "On-Time Ratio", trend: "-2%", icon: Clock, color: "text-indigo-500", bg: "bg-indigo-500/10" },
          { label: "Active Utilization", value: `${stats.coverage}%`, unit: "Resource Cover", trend: "Stable", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-5 group hover:border-tea-500/30 transition-all cursor-default">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${stat.trend.includes('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">{stat.value}</h3>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Visual Analytics Center ── */}
        <div className="lg:col-span-2 space-y-6">
          <div className="premium-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-tea-500" /> Personnel Density Trend
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-temporal deployment analysis</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(16, 185, 129, 0.05)'}}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: 'none', color: '#fff', padding: '12px' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#10b981' : '#10b98140'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Side Panels: Composition & Trends ── */}
        <div className="space-y-6">
          <div className="premium-card p-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Layers size={14} className="text-indigo-500" /> Authentication Stack
            </h3>
            <div className="flex items-center justify-center h-[240px] relative border-b border-slate-50 dark:border-slate-800 mb-6">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={methodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {methodData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === 'FACE' ? '#10b981' : entry.name === 'QR' ? '#3b82f6' : '#f59e0b'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-[10px] font-black text-slate-400">BIOMETRIC</p>
                 <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{stats.bioRate}%</p>
              </div>
            </div>
            <div className="space-y-3">
              {methodData.map((m, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${m.name === 'FACE' ? 'bg-emerald-500' : m.name === 'QR' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                    <span className="text-[9px] font-black text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase">{m.name} LOGS</span>
                  </div>
                  <span className="text-[10px] font-black dark:text-white">{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Deployment Grid: Full Width Expanded ── */}
      <div className="premium-card p-0 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white flex items-center gap-2">
                  <Database size={14} className="text-indigo-500" /> Deployment Registry
                </h3>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Filter by name/ID..." 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-tea-500 transition-all"
                   />
                </div>
                <select 
                  value={filterMethod}
                  onChange={e => setFilterMethod(e.target.value)}
                  className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                >
                  <option value="all">ALL METHODS</option>
                  <option value="face">BIOMETRIC</option>
                  <option value="qr">QR AUDIT</option>
                  <option value="manual">OVERRIDE</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-left">Personnel</th>
                    <th className="px-6 py-4 text-left">Shift Date</th>
                    <th className="px-6 py-4 text-left">Time (In/Out)</th>
                    <th className="px-6 py-4 text-left">Duration</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-center">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {currentEntries.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center font-black text-[10px] border border-teal-500/10">
                            {log.first_name?.[0]}{log.first_name?.[1]}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white leading-none mb-1">{log.first_name} {log.last_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{log.worker_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{log.shift_date ? new Date(log.shift_date).toLocaleDateString() : 'Today'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase">
                              <ArrowUpRight size={10} /> {log.check_in_time}
                           </div>
                           <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                              <Download size={10} className="rotate-180" /> {log.check_out_time || '—'}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <Clock size={12} className="text-indigo-500" />
                           <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                             {log.total_hours ? `${log.total_hours}h` : '—'}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border ${
                          log.auth_method === 'face' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          log.auth_method === 'qr' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}>
                          {log.auth_method || 'manual'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[9px] text-slate-500 uppercase tracking-tighter">
                        {log.latitude && log.longitude ? `${Number(log.latitude).toFixed(4)}, ${Number(log.longitude).toFixed(4)}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleAudit(log.worker_internal_id)}
                          className="p-2 text-slate-300 hover:text-tea-500 transition-all hover:bg-tea-500/5 rounded-xl"
                        >
                          <ArrowUpRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* High-Fidelity Pagination */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing {indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredAttendance.length)} of {filteredAttendance.length} Personnel Logs
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                   {[...Array(Math.min(5, totalPages))].map((_, i) => {
                     const page = i + 1;
                     return (
                       <button
                         key={page}
                         onClick={() => paginate(page)}
                         className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${currentPage === page ? 'bg-tea-600 text-white shadow-lg shadow-tea-600/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                       >
                         {page}
                       </button>
                     );
                   })}
                </div>
                <button 
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition-all hover:bg-slate-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
