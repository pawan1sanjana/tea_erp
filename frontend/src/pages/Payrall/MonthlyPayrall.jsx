import React, { useState, useEffect, useRef } from "react";
import { 
  Banknote, 
  Calendar, 
  Users, 
  Download, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Activity, 
  Printer,
  Search,
  ArrowRight,
  TrendingUp,
  ReceiptText,
  Weight,
  X
} from "lucide-react";
import { apiClient } from '../../api/client';

export default function MonthlyPayrall() {
  const [loading, setLoading] = useState(true);
  const [payrollData, setPayrollData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showPayslip, setShowPayslip] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  useEffect(() => {
    fetchMonthlyPayroll();
  }, [selectedDate]);

  const fetchMonthlyPayroll = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/payrall/monthly?year=${selectedDate.year}&month=${selectedDate.month}`);
      if (res.success) {
        setPayrollData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch monthly payroll:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (delta) => {
    setSelectedDate(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const filteredData = payrollData.filter(p => 
    p.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.worker_epf && p.worker_epf.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalGross = filteredData.reduce((acc, p) => acc + p.gross_pay, 0);
  const totalEPF = filteredData.reduce((acc, p) => acc + p.epf_deduction, 0);
  const totalNet = filteredData.reduce((acc, p) => acc + p.net_pay, 0);

  const handleViewPayslip = (worker) => {
    setSelectedWorker(worker);
    setShowPayslip(true);
  };

  const exportToCSV = () => {
    if (payrollData.length === 0) return;
    
    const headers = ["Worker Name", "EPF/ID", "Days Worked", "Total Harvest (KG)", "Gross Pay (Rs)", "EPF (8%)", "EPF (3%)", "Net Payable (Rs)"];
    const rows = payrollData.map(p => [
      p.worker_name,
      p.worker_epf || "N/A",
      p.days_worked,
      p.total_kg?.toFixed(2),
      p.gross_pay,
      p.epf_8_deduction,
      p.epf_3_deduction,
      p.net_pay
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Paysheet_${monthNames[selectedDate.month - 1]}_${selectedDate.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPaysheet = () => {
    window.print();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const PayslipModal = ({ worker, onClose }) => {
    const printRef = useRef();

    if (!worker) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ReceiptText size={18} className="text-tea-500" /> Worker Payslip
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={() => window.print()}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors"
                title="Print Payslip"
              >
                <Printer size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div id="printable-payslip" className="p-4 space-y-4 font-outfit" ref={printRef}>
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Evergreen Estate</h1>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Monthly Payroll Slip</p>
              </div>
              <div className="text-right">
                <span className="text-[8px] font-black text-tea-600 dark:text-tea-400 uppercase border border-tea-200 dark:border-tea-800 px-2 py-0.5 rounded-full bg-tea-50 dark:bg-tea-900/30">
                  {monthNames[selectedDate.month - 1]} {selectedDate.year}
                </span>
              </div>
            </div>

            {/* Worker Details */}
            <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Employee</p>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">{worker.worker_name}</h3>
                <p className="text-[9px] font-bold text-tea-600 dark:text-tea-400 mt-0.5">EPF: {worker.worker_epf || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Stats</p>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none">{worker.days_worked} Days / {(Number(worker.total_kg) || 0).toFixed(1)}kg</h3>
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-2">
              <div className="space-y-1 px-1">
                {[
                  { label: 'Plucking', val: worker.plucking_pay },
                  { label: 'Pruning', val: worker.pruning_pay },
                  { label: 'Weeding', val: worker.weeding_pay },
                  { label: 'Others', val: (worker.manure_pay + worker.lopping_pay + worker.foliar_pay + worker.other_pay) }
                ].map((item, i) => item.val > 0 && (
                  <div key={i} className="flex justify-between items-center text-[9px]">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-slate-900 dark:text-white font-bold">Rs {item.val.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-1.5 px-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase">Gross Total</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">Rs {worker.gross_pay.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-1 px-1 text-rose-500">
                <span className="text-[9px] font-bold uppercase">Tea Packet Deduction</span>
                <span className="text-[10px] font-black">- Rs {worker.tea_deduction.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-1 px-1 text-rose-600">
                <span className="text-[9px] font-bold uppercase">Cash Advance</span>
                <span className="text-[10px] font-black">- Rs {worker.advance_deduction.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-1 px-1 text-rose-600">
                <span className="text-[9px] font-bold uppercase">EPF (8%)</span>
                <span className="text-[10px] font-black">- Rs {worker.epf_8_deduction.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-rose-600 px-1">
                <span className="text-[9px] font-bold uppercase">EPF (3%)</span>
                <span className="text-[10px] font-black">- Rs {worker.epf_3_deduction.toLocaleString()}</span>
              </div>

              <div className="pt-2 mt-2 border-t border-dashed border-slate-300 dark:border-slate-700 flex justify-between items-center px-1">
                <div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Net Amount</h2>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-black text-tea-600 dark:text-tea-400">Rs {worker.net_pay.toLocaleString()}</h2>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 flex justify-between items-end opacity-40 grayscale">
              <div>
                <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Accountant Signature</p>
              </div>
              <div className="text-right">
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Evergreen Pro Intelligence</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Monthly Payroll Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Banknote size={14} className="text-tea-500" /> Aggregated monthly earnings with 8% and 3% EPF statutory deductions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col items-center px-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                {monthNames[selectedDate.month - 1]} {selectedDate.year}
              </span>
            </div>
            <button
              onClick={() => changeMonth(1)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={printPaysheet}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <Printer size={16} /> Print Paysheet
          </button>

          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-tea-700 transition-all shadow-lg shadow-tea-600/20"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <Users size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Total Workforce</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{payrollData.length} <span className="text-[10px] text-slate-400">Workers</span></h3>
          </div>
        </div>

        <div className="premium-card flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Weight size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Gross Monthly</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Rs {totalGross.toLocaleString()}</h3>
          </div>
        </div>

        <div className="premium-card flex items-center gap-4 border-rose-500/20">
          <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-900/30">
            <TrendingUp size={22} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Statutory EPF (11%)</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white text-rose-600">Rs {totalEPF.toLocaleString()}</h3>
          </div>
        </div>

        <div className="premium-card flex items-center gap-4 border-tea-500/30 bg-tea-50/10">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <Banknote size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider mb-1">Net Disbursements</p>
            <h3 className="text-2xl font-black text-tea-600 dark:text-tea-400">Rs {totalNet.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filters & Table */}
      <div id="paysheet-table" className="premium-card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50 print:hidden">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-tea-500" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              Payroll Registry · {monthNames[selectedDate.month - 1]} {selectedDate.year}
            </h2>
          </div>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search worker name or EPF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[8px] tracking-wider">
                <th className="px-3 py-3 text-left font-black">Worker Profile</th>
                <th className="px-3 py-3 text-left font-black">EPF / ID</th>
                <th className="px-3 py-3 text-center font-black">Days</th>
                <th className="px-3 py-3 text-right font-black text-indigo-500">Plucking</th>
                <th className="px-3 py-3 text-right font-black text-emerald-500">Pruning</th>
                <th className="px-3 py-3 text-right font-black text-sky-500">Weeding</th>
                <th className="px-3 py-3 text-right font-black text-slate-500">Other</th>
                 <th className="px-3 py-3 text-right font-black">Gross Pay</th>
                <th className="px-3 py-3 text-right font-black text-rose-500">Tea Ded.</th>
                <th className="px-3 py-3 text-right font-black text-rose-500">Advances</th>
                <th className="px-3 py-3 text-right font-black text-rose-600">EPF (8%)</th>
                <th className="px-3 py-3 text-right font-black text-rose-600">EPF (3%)</th>
                <th className="px-3 py-3 text-right font-black">Net Pay</th>
                <th className="px-3 py-3 text-center font-black print:hidden">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="14" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Activity size={32} className="text-tea-500 animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Aggregating Monthly Intelligence...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="14" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-30">
                      <Users size={48} className="mb-4 text-slate-400" />
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No payroll records found for this period</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((worker) => (
                  <tr key={worker.worker_id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group text-[10px]">
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-black text-slate-900 dark:text-white uppercase truncate max-w-[100px]">{worker.worker_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="font-bold text-slate-600 dark:text-slate-300">
                        {worker.worker_epf || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className="font-bold text-slate-900 dark:text-white">{worker.days_worked}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-500">
                      {worker.plucking_pay > 0 ? worker.plucking_pay.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-500">
                      {worker.pruning_pay > 0 ? worker.pruning_pay.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-500">
                      {worker.weeding_pay > 0 ? worker.weeding_pay.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-slate-500">
                      {(worker.manure_pay + worker.lopping_pay + worker.foliar_pay + worker.other_pay) > 0 
                        ? (worker.manure_pay + worker.lopping_pay + worker.foliar_pay + worker.other_pay).toLocaleString() 
                        : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-slate-900 dark:text-white">
                      {worker.gross_pay.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-rose-500">
                      {worker.tea_deduction > 0 ? worker.tea_deduction.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-rose-500">
                      {worker.advance_deduction > 0 ? worker.advance_deduction.toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-rose-600">
                      {worker.epf_8_deduction.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-rose-600">
                      {worker.epf_3_deduction.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-right font-black text-tea-600 dark:text-tea-400">
                      {worker.net_pay.toLocaleString()}
                    </td>
                    <td className="px-3 py-1.5 text-center print:hidden">
                      <button 
                        onClick={() => handleViewPayslip(worker)}
                        className="p-1 hover:bg-tea-50 dark:hover:bg-tea-900/30 text-slate-400 hover:text-tea-600 rounded-lg transition-all"
                      >
                        <FileText size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      {!loading && filteredData.length > 0 && (
        <div className="flex flex-col md:flex-row justify-end gap-6 text-right px-4">
          <div className="space-y-1">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Statutory Cost</p>
             <p className="text-xl font-black text-rose-500">Rs {totalEPF.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Net Disbursement Volume</p>
             <p className="text-2xl font-black text-tea-600 dark:text-tea-400">Rs {totalNet.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {showPayslip && <PayslipModal worker={selectedWorker} onClose={() => setShowPayslip(false)} />}
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip *,
          #paysheet-table, #paysheet-table * {
            visibility: visible;
          }
          
          /* If Payslip is open, only print that */
          ${showPayslip ? `
            #paysheet-table { display: none !important; }
            #printable-payslip {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0.5cm;
              font-size: 10pt;
            }
            #printable-payslip h1 { font-size: 16pt; }
            #printable-payslip h2 { font-size: 14pt; }
            #printable-payslip h3 { font-size: 12pt; }
          ` : `
            /* Otherwise print the table */
            #paysheet-table {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              font-size: 7pt;
            }
            #paysheet-table table {
              width: 100%;
              border-collapse: collapse;
            }
            #paysheet-table th, #paysheet-table td {
              padding: 2pt 4pt !important;
              border-bottom: 0.1pt solid #eee;
            }
            .print\\:hidden { display: none !important; }
            th:last-child, td:last-child { display: none !important; } /* Hide Actions column */
            
            /* Compact Header for Print */
            #paysheet-table h2 { font-size: 12pt; margin-bottom: 10pt; }
          `}
          
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
