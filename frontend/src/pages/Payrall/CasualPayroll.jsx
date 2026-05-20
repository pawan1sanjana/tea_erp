import React, { useState, useEffect } from "react";
import { 
  Banknote, 
  Users, 
  Calendar, 
  Search, 
  Download, 
  Printer, 
  Activity, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  ArrowRight,
  TrendingUp,
  Wallet,
  ReceiptText,
  Clock,
  UserCheck,
  X,
  RefreshCcw
} from "lucide-react";
import { apiClient } from '../../api/client';

export default function CasualPayroll() {
  const [loading, setLoading] = useState(false);
  const [payrollData, setPayrollData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // weekly, contract, daily
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showPayslip, setShowPayslip] = useState(false);
  
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Default to last 7 days
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  useEffect(() => {
    fetchCasualPayroll();
  }, [dateRange, filterType]);

  const fetchCasualPayroll = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/payrall/casual?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&type=${filterType}`);
      if (res.success) setPayrollData(res.data);
    } catch (error) {
      console.error("Failed to fetch casual payroll:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = payrollData.filter(w => 
    w.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.worker_epf?.toString().includes(searchTerm)
  );

  const totalGross = filteredData.reduce((acc, curr) => acc + parseFloat(curr.gross_pay), 0);
  const totalNet = filteredData.reduce((acc, curr) => acc + parseFloat(curr.net_pay), 0);
  const totalDeductions = totalGross - totalNet;

  const exportToCSV = () => {
    const headers = ["Worker Name", "ID", "Type", "Days Worked", "Gross Pay", "Tea Ded.", "Advances", "Net Pay"];
    const rows = filteredData.map(w => [
      w.worker_name,
      w.worker_epf,
      w.wage_type,
      w.days_worked,
      w.gross_pay,
      w.tea_deduction,
      w.advance_deduction,
      w.net_pay
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Casual_Payroll_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleViewPayslip = (worker) => {
    setSelectedWorker(worker);
    setShowPayslip(true);
  };

  const PayslipModal = ({ worker, onClose }) => {
    if (!worker) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ReceiptText size={18} className="text-tea-500" /> Payment Voucher
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
              >
                <Printer size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div id="printable-payslip" className="p-6 space-y-4 font-outfit">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Evergreen Estate</h1>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Casual/Contract Voucher</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-tea-600 dark:text-tea-400 uppercase border border-tea-200 dark:border-tea-800 px-2 py-0.5 rounded-full bg-tea-50 dark:bg-tea-900/30">
                  {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Personnel</p>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">{worker.worker_name}</h3>
                <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">Category: {worker.wage_type}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Attendance</p>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none">{worker.days_worked} Days Logged</h3>
              </div>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                {[
                  { label: 'Plucking Tasks', val: worker.plucking_pay },
                  { label: 'Pruning Tasks', val: worker.pruning_pay },
                  { label: 'Other Field Work', val: (worker.weeding_pay + worker.manure_pay + worker.lopping_pay + worker.foliar_pay + worker.other_pay) }
                ].map((item, i) => item.val > 0 && (
                  <div key={i} className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">Rs {item.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">Gross Earnings</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">Rs {parseFloat(worker.gross_pay).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-rose-500 text-[9px]">
                <span className="font-bold uppercase">Tea Packet Issue</span>
                <span className="font-black">- Rs {worker.tea_deduction.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-rose-600 text-[9px]">
                <span className="font-bold uppercase">Cash Advance</span>
                <span className="font-black">- Rs {worker.advance_deduction.toLocaleString()}</span>
              </div>

              <div className="pt-3 mt-3 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Net Payable</h2>
                <h2 className="text-xl font-black text-tea-600 dark:text-tea-400">Rs {parseFloat(worker.net_pay).toLocaleString()}</h2>
              </div>
            </div>

            <div className="pt-6 flex justify-between items-end opacity-40">
              <div className="border-t border-slate-400 w-24 pt-1">
                <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest text-center">Receiver Sign</p>
              </div>
              <div className="text-right">
                <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">Estate Voucher System</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Casual & Contract Payroll</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mt-1">
            <Clock size={12} className="text-tea-500" /> Weekly, Contract & Daily Cash Disbursements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase outline-none"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
            <span className="text-slate-300 mx-1">/</span>
            <input 
              type="date" 
              className="bg-transparent border-none text-[10px] font-black uppercase outline-none"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <button
            onClick={fetchCasualPayroll}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm group"
          >
            <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> Refresh
          </button>

          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit shadow-sm bg-white dark:bg-slate-900"
          >
            <Download size={16} /> Export CSV
          </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-tea-100 dark:bg-tea-900/30 text-tea-600"><Users size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Workforce</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{filteredData.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600"><Wallet size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Gross Total</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Rs {totalGross.toLocaleString()}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 border-tea-500/20 bg-tea-50/10">
          <div className="p-3 rounded-xl bg-tea-600 text-white shadow-lg shadow-tea-600/20"><Banknote size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">Net Payable</p>
            <h3 className="text-xl font-black text-tea-600">Rs {totalNet.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filter & Listing */}
      <div className="premium-card p-0 overflow-hidden shadow-xl shadow-slate-200/20">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Filter size={14} className="text-tea-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Payment Registry</h2>
             </div>
             <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {['all', 'weekly', 'contract', 'daily'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 text-[8px] font-black uppercase tracking-tighter rounded-md transition-all ${filterType === t ? 'bg-tea-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {t}
                  </button>
                ))}
             </div>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search worker..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-tea-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-[8px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-left">Worker Profile</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-center">Days</th>
                <th className="px-4 py-4 text-right text-indigo-500">Plucking</th>
                <th className="px-4 py-4 text-right text-emerald-500">Pruning</th>
                <th className="px-4 py-4 text-right text-sky-500">Others</th>
                <th className="px-4 py-4 text-right">Gross Pay</th>
                <th className="px-4 py-4 text-right text-rose-500">Tea Ded.</th>
                <th className="px-4 py-4 text-right text-rose-500">Advances</th>
                <th className="px-6 py-4 text-right text-tea-600">Net Payable</th>
                <th className="px-6 py-4 text-center">Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="11" className="py-20 text-center"><Activity className="animate-spin inline text-tea-500" /></td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="11" className="py-20 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">No records found for selected criteria</td></tr>
              ) : filteredData.map(worker => (
                <tr key={worker.worker_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors text-[10px]">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-900 dark:text-white uppercase leading-none">{worker.worker_name}</div>
                    <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">ID: {worker.worker_epf || 'NEW'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                      worker.wage_type === 'weekly' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                      worker.wage_type === 'contract' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {worker.wage_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-500">{worker.days_worked}</td>
                  <td className="px-4 py-4 text-right font-medium text-indigo-600">Rs {worker.plucking_pay.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-medium text-emerald-600">Rs {worker.pruning_pay.toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-medium text-slate-500">Rs {(worker.weeding_pay + worker.manure_pay + worker.lopping_pay + worker.foliar_pay + worker.other_pay).toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white">Rs {parseFloat(worker.gross_pay).toLocaleString()}</td>
                  <td className="px-4 py-4 text-right font-black text-rose-500">
                    {worker.tea_deduction > 0 ? `Rs ${worker.tea_deduction.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-rose-500">
                    {worker.advance_deduction > 0 ? `Rs ${worker.advance_deduction.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-xs font-black text-tea-600">Rs {parseFloat(worker.net_pay).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handleViewPayslip(worker)}
                      className="p-1.5 hover:bg-tea-50 text-slate-300 hover:text-tea-600 rounded-lg transition-colors"
                    >
                      <ReceiptText size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} className="text-white" />
         </div>
         <div className="z-10">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Total Disbursement Ready</h2>
            <p className="text-3xl font-black mt-1">Rs {totalNet.toLocaleString()}</p>
         </div>
         <div className="flex gap-4 z-10">
            <button className="flex items-center gap-2 px-6 py-3 bg-tea-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-tea-700 shadow-xl shadow-tea-600/20 transition-all active:scale-95">
               <Printer size={16} /> Print All Vouchers
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 backdrop-blur-md transition-all active:scale-95">
               Archive Batch <ArrowRight size={16} />
            </button>
         </div>
      </div>

      {/* Payslip Modal */}
      {showPayslip && <PayslipModal worker={selectedWorker} onClose={() => setShowPayslip(false)} />}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
