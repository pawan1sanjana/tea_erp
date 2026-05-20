import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, MapPin, Clock, Fingerprint, QrCode, 
  ClipboardList, ScanFace, ExternalLink, Filter, Loader2, 
  User, Database, ChevronLeft, ChevronRight, Activity, 
  TrendingUp, UserCheck, ShieldCheck, Download, FileSpreadsheet, FileText,
  ChevronDown, ArrowLeft, Landmark, Layers, Edit2, Trash2, X, AlertTriangle, Save
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function TodaysAttendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  // Modal State
  const [selectedLog, setSelectedLog] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Stats
  const stats = {
    totalPresent: attendance.length,
    biometricCount: attendance.filter(a => a.auth_method === 'face').length,
    qrCount: attendance.filter(a => a.auth_method === 'qr').length,
    manualCount: attendance.filter(a => a.auth_method === 'manual').length,
    checkedOut: attendance.filter(a => a.check_out_time).length,
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/workforce/attendance-today?date=${selectedDate}`);
      if (response.success) {
        setAttendance(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedLog) return;
    setIsProcessing(true);
    try {
      const res = await apiClient.delete(`/workforce/attendance/${selectedLog.id}`);
      if (res.success) {
        setAttendance(attendance.filter(a => a.id !== selectedLog.id));
        setShowDeleteModal(false);
      }
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await apiClient.put(`/workforce/attendance/${selectedLog.id}`, {
        check_in_time: selectedLog.check_in_time,
        check_out_time: selectedLog.check_out_time || ''
      });
      if (res.success) {
        fetchAttendance();
        setShowEditModal(false);
      }
    } catch (err) {
      console.error('Failed to edit', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditChange = (e) => {
    setSelectedLog({ ...selectedLog, [e.target.name]: e.target.value });
  };

  const exportToExcel = () => {
    const data = attendance.map(a => ({
      'Worker ID': a.worker_id,
      'Name': `${a.first_name} ${a.last_name}`,
      'Check-In': a.check_in_time,
      'Check-Out': a.check_out_time || '—',
      'Total Hours': a.total_hours != null ? `${a.total_hours}h` : '—',
      'Method': a.auth_method?.toUpperCase(),
      'Latitude': a.latitude,
      'Longitude': a.longitude
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `Attendance_Logs_${selectedDate}.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`TeaERP Pro — Attendance Logs (${selectedDate})`, 14, 15);
    const tableData = attendance.map(a => [
      a.worker_id,
      `${a.first_name} ${a.last_name}`,
      a.check_in_time,
      a.check_out_time || '—',
      a.total_hours != null ? `${a.total_hours}h` : '—',
      a.auth_method?.toUpperCase(),
      `${a.latitude || 'N/A'}, ${a.longitude || 'N/A'}`
    ]);
    autoTable(doc, {
      head: [['ID', 'Personnel Name', 'Check-In', 'Check-Out', 'Hours', 'Method', 'Location']],
      body: tableData,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 }
    });
    doc.save(`Attendance_Logs_${selectedDate}.pdf`);
    setShowExportOptions(false);
  };

  const filteredData = attendance.filter(a => 
    `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.worker_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Premium Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Personnel Deployment Logs</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Database size={14} className="text-tea-500" /> Historical biometric auditing and workforce extraction metrics — {attendance.length} records
          </p>
        </div>
        
        <div className="flex gap-3 relative">
           <div className="relative group">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit"
              >
                <Download size={16} /> Export
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

      {/* Stats Cards - Matching BiologicalAssets Style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Present", value: stats.totalPresent, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
          { label: "Checked Out", value: stats.checkedOut, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
          { label: "QR Tactical", value: stats.qrCount, icon: QrCode, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
          { label: "Manual Override", value: stats.manualCount, icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
        ].map((stat, i) => (
          <div key={i} className="premium-card flex items-center gap-4">
             <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-outfit">{stat.value}</h3>
             </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search by name or worker ID..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-tea-500 transition-all font-outfit text-sm"
               />
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl shadow-sm">
               <Calendar size={18} className="text-tea-500" />
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="bg-transparent text-sm font-black dark:text-white outline-none"
               />
            </div>
         </div>
      </div>

      {/* Main Table Card */}
      <div className="premium-card overflow-hidden p-0 border-collapse shadow-sm border-slate-200 dark:border-slate-800">
         <div className="overflow-x-auto">
            <table className="w-full border-collapse">
               <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
                     <th className="px-3 py-2.5 text-left font-bold">Personnel Record</th>
                     <th className="px-3 py-2.5 text-left font-bold">Check-In</th>
                     <th className="px-3 py-2.5 text-left font-bold">Check-Out Event</th>
                     <th className="px-3 py-2.5 text-left font-bold">Shift Hours</th>
                     <th className="px-3 py-2.5 text-left font-bold">Auth Method</th>
                     <th className="px-3 py-2.5 text-left font-bold">Tactical Position</th>
                     <th className="px-3 py-2.5 text-right font-bold">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-3 py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-4">
                           <Loader2 className="w-8 h-8 text-tea-500 animate-spin" />
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Hydrating Ledger Records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="flex flex-col items-center justify-center py-24 text-slate-400">
                        <Search size={40} className="opacity-30 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No attendance records identified</p>
                      </td>
                    </tr>
                  ) : filteredData.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                       <td className="px-3 py-2.5">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                                {log.photo ? <img src={log.photo} className="w-full h-full object-cover" /> : <User size={16} className="text-slate-300" />}
                             </div>
                             <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{log.first_name} {log.last_name}</p>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase mt-0.5">
                                   <Layers size={10} className="text-tea-500" /> {log.worker_id}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2 font-bold dark:text-slate-200 text-sm">
                             <Clock size={12} className="text-indigo-500" />
                             {log.check_in_time || '—'}
                          </div>
                       </td>
                       <td className="px-3 py-2.5">
                          {log.check_out_time ? (
                            <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 text-sm">
                               <Clock size={12} className="text-rose-400" />
                               {log.check_out_time}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">Active Shift</span>
                          )}
                       </td>
                       <td className="px-3 py-2.5">
                          {log.total_hours != null ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-violet-50 text-violet-600 border border-violet-200 uppercase tracking-widest">
                               {log.total_hours}h
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 italic">—</span>
                          )}
                       </td>
                       <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            log.auth_method === 'face' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            log.auth_method === 'qr' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {log.auth_method === 'face' ? <ShieldCheck size={12} /> : log.auth_method === 'qr' ? <QrCode size={12} /> : <ClipboardList size={12} />}
                            {log.auth_method?.toUpperCase()}
                          </span>
                       </td>
                       <td className="px-3 py-2.5">
                          {log.latitude ? (
                             <div className="text-[10px] font-mono text-slate-500 flex flex-col leading-tight">
                                <span className="flex items-center gap-1"><MapPin size={10} className="text-tea-500" /> LAT: {parseFloat(log.latitude).toFixed(4)}</span>
                                <span className="ml-3.5">LON: {parseFloat(log.longitude).toFixed(4)}</span>
                             </div>
                          ) : (
                             <span className="text-[10px] font-bold text-slate-400 italic">No GPS Lock</span>
                          )}
                       </td>
                       <td className="px-3 py-2.5 text-right">
                          <div className="flex items-center gap-2 justify-end transition-opacity">
                             <button onClick={() => { setSelectedLog(log); setShowEditModal(true); }} className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all border border-transparent hover:border-blue-200/50">
                                <Edit2 size={15} />
                             </button>
                             <button onClick={() => { setSelectedLog(log); setShowDeleteModal(true); }} className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-all border border-transparent hover:border-red-200/50">
                                <Trash2 size={15} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         
         {/* Footer / Pagination Placeholder */}
         <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
               Displaying {filteredData.length} records · {stats.checkedOut} checked out
            </span>
            <div className="flex gap-2">
               <button disabled className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30">
                  <ChevronLeft size={16} />
               </button>
               <button disabled className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30">
                  <ChevronRight size={16} />
               </button>
            </div>
         </div>
      </div>

      {/* Confirmation Modals */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Record?</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                Permanently remove attendance record for <span className="font-bold">"{selectedLog?.first_name} {selectedLog?.last_name}"</span>?
              </p>
              <div className="flex w-full gap-3">
                <button onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDeleteSubmit} disabled={isProcessing}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all">
                  {isProcessing ? 'Removing...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-lg rounded-[2.5rem] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
             <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Edit Shift Ledger</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
             </div>
             <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Check-In Time</label>
                     <input type="time" step="1" name="check_in_time" value={selectedLog?.check_in_time || ''} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500" required />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Check-Out Event</label>
                     <input type="time" step="1" name="check_out_time" value={selectedLog?.check_out_time || ''} onChange={handleEditChange} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:border-tea-500" />
                   </div>
                </div>
                <div className="flex gap-3 pt-4">
                   <button type="submit" disabled={isProcessing} className="flex-[2] py-3 bg-tea-600 hover:bg-tea-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-tea-600/20 flex items-center justify-center gap-2">
                     {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
                     Update Record
                   </button>
                   <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-black uppercase tracking-widest rounded-xl">Cancel</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
