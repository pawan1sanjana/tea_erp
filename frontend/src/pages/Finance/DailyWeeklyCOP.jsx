import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  Calculator, 
  RefreshCcw, 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "../../api/client";

// ── Config ─────────────────────────────────────────────────────────────────────
const REFRESH_MS = 30_000;

// ── Formatting helpers ─────────────────────────────────────────────────────────
const f2  = (v, d = 2) => {
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return v < 0 ? `(${s})` : s;
};
const brk = (v) =>
  `(${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
const av  = (a, c) => (c ? a / c : 0);
const pc  = (v) => (v < 0 ? "text-rose-600" : v > 0 ? "text-emerald-600" : "inherit");

// ── Table cell helpers ─────────────────────────────────────────────────────────
const TL = ({ children, bold, w, className = "" }) => (
  <td className={`text-left px-3 py-1 text-[11px] ${bold ? "font-black" : "font-medium text-slate-600 dark:text-slate-400"} ${className}`} style={{ width: w }}>
    {children}
  </td>
);
const TR = ({ v, bold, color, bracket, className = "" }) => (
  <td className={`text-right px-3 py-1 text-[11px] ${bold ? "font-black" : "font-medium"} ${color || "text-slate-900 dark:text-white"} ${className}`}>
    {bracket ? brk(v) : f2(v)}
  </td>
);
const AV = ({ a, c, bold, color, className = "" }) => <TR v={av(a, c)} bold={bold} color={color} className={className} />;

// ── Countdown ring ─────────────────────────────────────────────────────────────
function CountdownRing({ totalMs, remainingMs }) {
  const r = 8, cx = 10, cy = 10;
  const circ = 2 * Math.PI * r;
  const pct  = remainingMs / totalMs;
  return (
    <svg width="20" height="20" style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="2" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" className="text-tea-600" strokeWidth="2"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        style={{ transition: "stroke-dashoffset 1s linear" }} />
    </svg>
  );
}

export default function DailyWeeklyCOP() {
  const [reportType, setReportType] = useState("daily"); // "daily" or "weekly"
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  });
  
  const [data,      setData]      = useState(null);
  const [status,    setStatus]    = useState("idle");
  const [errMsg,    setErrMsg]    = useState("");
  const [remaining, setRemaining] = useState(REFRESH_MS);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const timerRef = useRef(null);
  const countRef = useRef(null);
  const exportRef = useRef(null);

  const currentEstate = "Boraluwaththa estate";

  // Calculate startDate and endDate based on selectedDate and reportType
  const dateRange = useMemo(() => {
    if (reportType === "daily") {
      return { startDate: selectedDate, endDate: selectedDate };
    } else {
      // Weekly: start at selectedDate and go for 7 days (startDate + 6 days)
      const start = new Date(selectedDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return {
        startDate: selectedDate,
        endDate: end.toISOString().split("T")[0]
      };
    }
  }, [selectedDate, reportType]);

  // ── Fetch report data ────────────────────────────────────────────────────────
  const fetchData = useCallback(async (range) => {
    if (!range) return;
    setStatus("loading");
    try {
      const res = await apiClient.get(`/estate-cop/daily-weekly-report?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(range.endDate)}`);
      if (res.success) {
        setData(res.data);
        setStatus("ok");
        setRemaining(REFRESH_MS);
      } else {
        throw new Error(res.error || "Failed to fetch report");
      }
    } catch (e) {
      setErrMsg(e.message);
      setStatus("error");
    }
  }, []);

  // ── Auto-refresh ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchData(dateRange);
    clearInterval(timerRef.current);
    clearInterval(countRef.current);
    timerRef.current = setInterval(() => fetchData(dateRange), REFRESH_MS);
    countRef.current = setInterval(() => {
      setRemaining(prev => (prev <= 1000 ? REFRESH_MS : prev - 1000));
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(countRef.current);
    };
  }, [dateRange, fetchData]);

  // ── Derived totals ────────────────────────────────────────────────────────────
  const derived = useMemo(() => {
    if (!data) return null;
    const mc = data.crop.monthly, tc = data.crop.todate;

    const sundryList = data.sundryExpensesList || [];
    const opSundryList = sundryList.filter(e => {
      const lbl = e.label.toLowerCase();
      return !lbl.includes('sundry') && !lbl.includes('other expense');
    });
    const remSundryList = sundryList.filter(e => {
      const lbl = e.label.toLowerCase();
      return lbl.includes('sundry') || lbl.includes('other expense');
    });

    const allOpExpenses = [...data.fieldExpenses, ...opSundryList];

    const tfM  = allOpExpenses.reduce((s, e) => s + (e.monthly || 0), 0);
    const tfT  = allOpExpenses.reduce((s, e) => s + (e.todate || 0),  0);
    const tcpM = data.capitalExpenses.reduce((s, e) => s + (e.monthly || 0), 0);
    const tcpT = data.capitalExpenses.reduce((s, e) => s + (e.todate || 0),  0);
    
    const sundryExpM = remSundryList.reduce((s, e) => s + (e.monthly || 0), 0);
    const sundryExpT = remSundryList.reduce((s, e) => s + (e.todate || 0),  0);

    const tiM  = (data.leafIncome?.monthly || 0) + (data.sundryIncome?.monthly || 0);
    const tiT  = (data.leafIncome?.todate || 0)  + (data.sundryIncome?.todate || 0);
    
    return {
      mc, tc, tfM, tfT, tcpM, tcpT, tiM, tiT,
      allOpExpenses,
      remSundryList,
      sundryExpM,
      sundryExpT,
      fpM: (data.leafIncome?.monthly || 0) - tfM,
      fpT: (data.leafIncome?.todate || 0)  - tfT,
      spM: (data.sundryIncome?.monthly || 0) - sundryExpM,
      spT: (data.sundryIncome?.todate || 0)  - sundryExpT,
      teM: tfM + sundryExpM, 
      teT: tfT + sundryExpT,
      pwcM: tiM - (tfM + sundryExpM + tcpM),
      pwcT: tiT - (tfT + sundryExpT + tcpT),
      pwoM: tiM - (tfM + sundryExpM),
      pwoT: tiT - (tfT + sundryExpT),
    };
  }, [data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const periodLabel = useMemo(() => {
    if (reportType === "daily") {
      return selectedDate;
    } else {
      return `${dateRange.startDate} to ${dateRange.endDate}`;
    }
  }, [reportType, selectedDate, dateRange]);

  const reportTitle = useMemo(() => {
    return reportType === "daily" ? "DAILY COP REPORT" : "WEEKLY COP REPORT";
  }, [reportType]);

  const exportCSV = () => {
    if (!data || !derived) return;
    const headers = ['Description', `${periodLabel} Amount (LKR)`, 'Cost Ave. (LKR/Kg)', 'To Date Amount (LKR)', 'To Date Cost Ave. (LKR/Kg)'];
    const rows = [];
    
    // Estate Operation
    rows.push(['ESTATE OPERATION', '', '', '', '']);
    rows.push([`Crop (Kg) – ${currentEstate}`, data.crop.monthly, '', data.crop.todate, '']);
    rows.push([
      `ESTATE LEAF INCOME – ${currentEstate}`,
      data.leafIncome?.monthly || 0,
      av(data.leafIncome?.monthly, derived.mc).toFixed(2),
      data.leafIncome?.todate || 0,
      av(data.leafIncome?.todate, derived.tc).toFixed(2)
    ]);
    
    derived.allOpExpenses.forEach(exp => {
      rows.push([
        exp.label,
        exp.monthly || 0,
        av(exp.monthly, derived.mc).toFixed(2),
        exp.todate || 0,
        av(exp.todate, derived.tc).toFixed(2)
      ]);
    });
    
    rows.push([
      'Total Expense',
      derived.tfM,
      av(derived.tfM, derived.mc).toFixed(2),
      derived.tfT,
      av(derived.tfT, derived.tc).toFixed(2)
    ]);
    
    rows.push([
      'Tea Field Profit / (Loss)',
      derived.fpM,
      av(derived.fpM, derived.mc).toFixed(2),
      derived.fpT,
      av(derived.fpT, derived.tc).toFixed(2)
    ]);
    
    // Estate Sundry
    rows.push([]);
    rows.push(['ESTATE SUNDRY', '', '', '', '']);
    data.sundryIncomeList?.forEach(inc => {
      rows.push([
        inc.label,
        inc.monthly || 0,
        av(inc.monthly, derived.mc).toFixed(2),
        inc.todate || 0,
        av(inc.todate, derived.tc).toFixed(2)
      ]);
    });
    if (data.sundryIncomeList?.length > 0) {
      rows.push([
        'Total Sundry Income',
        data.sundryIncome?.monthly || 0,
        av(data.sundryIncome?.monthly, derived.mc).toFixed(2),
        data.sundryIncome?.todate || 0,
        av(data.sundryIncome?.todate, derived.tc).toFixed(2)
      ]);
    }
    
    derived.remSundryList?.forEach(exp => {
      rows.push([
        exp.label,
        exp.monthly || 0,
        av(exp.monthly, derived.mc).toFixed(2),
        exp.todate || 0,
        av(exp.todate, derived.tc).toFixed(2)
      ]);
    });
    if (derived.remSundryList?.length > 0) {
      rows.push([
        'Total Sundry Expenses',
        derived.sundryExpM,
        av(derived.sundryExpM, derived.mc).toFixed(2),
        derived.sundryExpT,
        av(derived.sundryExpT, derived.tc).toFixed(2)
      ]);
    }
    rows.push([
      'Estate Sundry Profit / (Loss)',
      derived.spM,
      av(derived.spM, derived.mc).toFixed(2),
      derived.spT,
      av(derived.spT, derived.tc).toFixed(2)
    ]);
    
    // Capital Expenses
    rows.push([]);
    rows.push(['CAPITAL EXPENSES', '', '', '', '']);
    data.capitalExpenses.forEach(exp => {
      rows.push([
        exp.label,
        exp.monthly || 0,
        av(exp.monthly, derived.mc).toFixed(2),
        exp.todate || 0,
        av(exp.todate, derived.tc).toFixed(2)
      ]);
    });
    rows.push([
      'Total Capital Expenses',
      derived.tcpM,
      av(derived.tcpM, derived.mc).toFixed(2),
      derived.tcpT,
      av(derived.tcpT, derived.tc).toFixed(2)
    ]);
    
    // Summary
    rows.push([]);
    rows.push(['SUMMARY', '', '', '', '']);
    rows.push(['TOTAL INCOME', derived.tiM, av(derived.tiM, derived.mc).toFixed(2), derived.tiT, av(derived.tiT, derived.tc).toFixed(2)]);
    rows.push(['TOTAL EXPENSES', derived.teM, av(derived.teM, derived.mc).toFixed(2), derived.teT, av(derived.teT, derived.tc).toFixed(2)]);
    rows.push(['Profit WITH Capital Expenses', derived.pwcM, av(derived.pwcM, derived.mc).toFixed(2), derived.pwcT, av(derived.pwcT, derived.tc).toFixed(2)]);
    rows.push(['Profit WITHOUT Capital Expenses', derived.pwoM, av(derived.pwoM, derived.mc).toFixed(2), derived.pwoT, av(derived.pwoT, derived.tc).toFixed(2)]);

    const csvContent = [
      ['Estate', currentEstate],
      ['Period', periodLabel],
      [],
      headers.join(','),
      ...rows.map(r => r.map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val).join(','))
    ].join('\n');
    
    const fileName = reportType === "daily" 
      ? `Daily_COP_Report_${selectedDate.replace(/-/g, '_')}`
      : `Weekly_COP_Report_${dateRange.startDate.replace(/-/g, '_')}_to_${dateRange.endDate.replace(/-/g, '_')}`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
  };

  const exportPDF = () => {
    if (!data || !derived) return;
    const doc = new jsPDF('portrait');
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${currentEstate}`, 14, 15);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text(reportTitle, 14, 21);
    doc.text(`Period: ${periodLabel}`, 14, 27);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);
    
    const tableBody = [];
    
    // Helper to format values
    const fmt = (v) => f2(v);
    const fmtPct = (a, c) => f2(av(a, c));

    // Section 1: Estate Operation
    tableBody.push([{ content: 'ESTATE OPERATION', colSpan: 5, styles: { fillColor: [240, 245, 240], fontStyle: 'bold' } }]);
    tableBody.push([`Crop (Kg) – ${currentEstate}`, fmt(data.crop.monthly), '', fmt(data.crop.todate), '']);
    tableBody.push([
      `ESTATE LEAF INCOME – ${currentEstate}`,
      fmt(data.leafIncome?.monthly),
      fmtPct(data.leafIncome?.monthly, derived.mc),
      fmt(data.leafIncome?.todate),
      fmtPct(data.leafIncome?.todate, derived.tc)
    ]);
    
    derived.allOpExpenses.forEach(exp => {
      tableBody.push([
        exp.label,
        fmt(exp.monthly),
        fmtPct(exp.monthly, derived.mc),
        fmt(exp.todate),
        fmtPct(exp.todate, derived.tc)
      ]);
    });
    
    tableBody.push([
      { content: 'Total Expense', styles: { fontStyle: 'bold', fillColor: [253, 242, 242] } },
      { content: `(${fmt(derived.tfM)})`, styles: { fontStyle: 'bold', fillColor: [253, 242, 242] } },
      { content: `(${fmtPct(derived.tfM, derived.mc)})`, styles: { fontStyle: 'bold', fillColor: [253, 242, 242] } },
      { content: `(${fmt(derived.tfT)})`, styles: { fontStyle: 'bold', fillColor: [253, 242, 242] } },
      { content: `(${fmtPct(derived.tfT, derived.tc)})`, styles: { fontStyle: 'bold', fillColor: [253, 242, 242] } }
    ]);
    
    tableBody.push([
      { content: 'Tea Field Profit / (Loss)', styles: { fontStyle: 'bold', fillColor: derived.fpM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.fpM), styles: { fontStyle: 'bold', fillColor: derived.fpM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.fpM, derived.mc), styles: { fontStyle: 'bold', fillColor: derived.fpM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.fpT), styles: { fontStyle: 'bold', fillColor: derived.fpT >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.fpT, derived.tc), styles: { fontStyle: 'bold', fillColor: derived.fpT >= 0 ? [240, 253, 244] : [254, 242, 242] } }
    ]);
    
    // Section 2: Estate Sundry
    tableBody.push([{ content: 'ESTATE SUNDRY', colSpan: 5, styles: { fillColor: [240, 240, 250], fontStyle: 'bold' } }]);
    data.sundryIncomeList?.forEach(inc => {
      tableBody.push([
        inc.label,
        fmt(inc.monthly),
        fmtPct(inc.monthly, derived.mc),
        fmt(inc.todate),
        fmtPct(inc.todate, derived.tc)
      ]);
    });
    if (data.sundryIncomeList?.length > 0) {
      tableBody.push([
        'Total Sundry Income',
        fmt(data.sundryIncome?.monthly),
        fmtPct(data.sundryIncome?.monthly, derived.mc),
        fmt(data.sundryIncome?.todate),
        fmtPct(data.sundryIncome?.todate, derived.tc)
      ]);
    }
    
    derived.remSundryList?.forEach(exp => {
      tableBody.push([
        exp.label,
        fmt(exp.monthly),
        fmtPct(exp.monthly, derived.mc),
        fmt(exp.todate),
        fmtPct(exp.todate, derived.tc)
      ]);
    });
    if (derived.remSundryList?.length > 0) {
      tableBody.push([
        'Total Sundry Expenses',
        fmt(derived.sundryExpM),
        fmtPct(derived.sundryExpM, derived.mc),
        fmt(derived.sundryExpT),
        fmtPct(derived.sundryExpT, derived.tc)
      ]);
    }
    tableBody.push([
      { content: 'Estate Sundry Profit / (Loss)', styles: { fontStyle: 'bold', fillColor: derived.spM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.spM), styles: { fontStyle: 'bold', fillColor: derived.spM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.spM, derived.mc), styles: { fontStyle: 'bold', fillColor: derived.spM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.spT), styles: { fontStyle: 'bold', fillColor: derived.spT >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.spT, derived.tc), styles: { fontStyle: 'bold', fillColor: derived.spT >= 0 ? [240, 253, 244] : [254, 242, 242] } }
    ]);
    
    // Section 3: Capital Expenses
    tableBody.push([{ content: 'CAPITAL EXPENSES', colSpan: 5, styles: { fillColor: [250, 250, 250], fontStyle: 'bold' } }]);
    data.capitalExpenses.forEach(exp => {
      tableBody.push([
        { content: exp.label, styles: { fontStyle: 'italic' } },
        fmt(exp.monthly),
        fmtPct(exp.monthly, derived.mc),
        fmt(exp.todate),
        fmtPct(exp.todate, derived.tc)
      ]);
    });
    tableBody.push([
      { content: 'Total Capital Expenses', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      { content: `(${fmt(derived.tcpM)})`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      { content: `(${fmtPct(derived.tcpM, derived.mc)})`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      { content: `(${fmt(derived.tcpT)})`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
      { content: `(${fmtPct(derived.tcpT, derived.tc)})`, styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } }
    ]);
    
    // Section 4: Summary
    tableBody.push([{ content: 'SUMMARY', colSpan: 5, styles: { fillColor: [245, 245, 245], fontStyle: 'bold' } }]);
    tableBody.push([
      { content: 'TOTAL INCOME', styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
      { content: fmt(derived.tiM), styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
      { content: fmtPct(derived.tiM, derived.mc), styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
      { content: fmt(derived.tiT), styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } },
      { content: fmtPct(derived.tiT, derived.tc), styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } }
    ]);
    tableBody.push([
      { content: 'TOTAL EXPENSES', styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } },
      { content: `(${fmt(derived.teM)})`, styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } },
      { content: `(${fmtPct(derived.teM, derived.mc)})`, styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } },
      { content: `(${fmt(derived.teT)})`, styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } },
      { content: `(${fmtPct(derived.teT, derived.tc)})`, styles: { fontStyle: 'bold', fillColor: [254, 242, 242] } }
    ]);
    tableBody.push([
      { content: 'Profit WITH Capital Expenses', styles: { fontStyle: 'bold', fillColor: derived.pwcM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.pwcM), styles: { fontStyle: 'bold', fillColor: derived.pwcM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.pwcM, derived.mc), styles: { fontStyle: 'bold', fillColor: derived.pwcM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.pwcT), styles: { fontStyle: 'bold', fillColor: derived.pwcT >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.pwcT, derived.tc), styles: { fontStyle: 'bold', fillColor: derived.pwcT >= 0 ? [240, 253, 244] : [254, 242, 242] } }
    ]);
    tableBody.push([
      { content: 'Profit WITHOUT Capital Expenses', styles: { fontStyle: 'bold', fillColor: derived.pwoM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.pwoM), styles: { fontStyle: 'bold', fillColor: derived.pwoM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.pwoM, derived.mc), styles: { fontStyle: 'bold', fillColor: derived.pwoM >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmt(derived.pwoT), styles: { fontStyle: 'bold', fillColor: derived.pwoT >= 0 ? [240, 253, 244] : [254, 242, 242] } },
      { content: fmtPct(derived.pwoT, derived.tc), styles: { fontStyle: 'bold', fillColor: derived.pwoT >= 0 ? [240, 253, 244] : [254, 242, 242] } }
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Description', `Selected Period`, 'Cost Ave.', 'To Date', 'Cost Ave.']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [26, 71, 42], fontSize: 9, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' }
      }
    });
    
    const pdfName = reportType === "daily" 
      ? `Daily_COP_Report_${selectedDate.replace(/-/g, '_')}`
      : `Weekly_COP_Report_${dateRange.startDate.replace(/-/g, '_')}_to_${dateRange.endDate.replace(/-/g, '_')}`;

    doc.save(`${pdfName}.pdf`);
    setShowExportOptions(false);
  };

  const secs = Math.ceil(remaining / 1000);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* ── Premium Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic flex items-center gap-3">
            <Calculator className="text-tea-600" size={32} />
            Daily & Weekly COP Registry
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            Detailed Operation Reports & Cost Analysis • {currentEstate}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Toggle Report Type */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => {
                setReportType("daily");
                setData(null);
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                reportType === "daily"
                  ? "bg-tea-600 text-white shadow-md shadow-tea-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => {
                setReportType("weekly");
                setData(null);
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                reportType === "weekly"
                  ? "bg-tea-600 text-white shadow-md shadow-tea-600/10"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              Weekly
            </button>
          </div>

          {/* Date / Start Date Picker */}
          <div className="relative group flex items-center">
            <Calendar className="absolute left-3 text-slate-400 group-hover:text-tea-600 transition-colors pointer-events-none" size={14} />
            <input
              type="date"
              value={selectedDate}
              onChange={e => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              className="pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => fetchData(dateRange)}
            disabled={status === "loading"}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCcw size={14} className={status === "loading" ? "animate-spin" : ""} />
            {status === "loading" ? "Syncing..." : "Refresh"}
          </button>

          {/* Combined Export Button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
            >
              <Download size={14} /> Export <ChevronDown size={12} className={`transition-transform duration-300 ${showExportOptions ? 'rotate-180' : ''}`} />
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={exportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800"
                >
                  <FileText size={16} className="text-rose-500" /> PDF Report
                </button>
                <button
                  onClick={exportCSV}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Download size={16} className="text-emerald-500" /> CSV Ledger
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {status === "error" && (
        <div className="premium-card p-4 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 flex items-start gap-3 animate-in shake duration-500">
          <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-700 dark:text-rose-400 text-sm">System Error</p>
            <p className="text-xs text-rose-500 mt-0.5">{errMsg}</p>
          </div>
        </div>
      )}

      {/* ── Dashboard Stats ── */}
      {derived && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="premium-card">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Income</p>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">LKR {f2(derived.tiM)}</h3>
              <TrendingUp className="text-emerald-500" size={20} />
            </div>
          </div>
          <div className="premium-card">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Expenses</p>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black font-outfit italic text-slate-900 dark:text-white">LKR {f2(derived.teM)}</h3>
              <TrendingDown className="text-rose-500" size={20} />
            </div>
          </div>
          <div className="premium-card">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Net Profit ({reportType})</p>
            <div className="flex items-center justify-between">
              <h3 className={`text-xl font-black font-outfit italic ${derived.pwcM >= 0 ? "text-emerald-600" : "text-rose-600"}`}>LKR {f2(derived.pwcM)}</h3>
              <Activity className={derived.pwcM >= 0 ? "text-emerald-500" : "text-rose-500"} size={20} />
            </div>
          </div>
          <div className="premium-card flex items-center justify-between py-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Next Refresh In</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{secs}s</p>
            </div>
            <CountdownRing totalMs={REFRESH_MS} remainingMs={remaining} />
          </div>
        </div>
      )}

      {/* ── REPORT CONTENT ── */}
      {data && derived ? (
        <div className="premium-card overflow-hidden p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div id="report" className="p-8 md:p-12 max-w-5xl mx-auto">
            {/* Report Header */}
            <div className="text-center mb-10 border-b-4 border-slate-900 dark:border-slate-700 pb-6">
              <h2 className="text-2xl font-black tracking-[0.3em] text-slate-900 dark:text-white uppercase mb-1">{currentEstate}</h2>
              <h3 className="text-sm font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase mb-4 italic">{reportTitle}</h3>
              <div className="flex justify-center items-center gap-6 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <span className="flex items-center gap-2"><Clock size={12} /> Code: {data.code}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="flex items-center gap-2"><Calendar size={12} /> Period: {periodLabel}</span>
              </div>
            </div>

            {/* ── SECTION: ESTATE OPERATION ── */}
            <div className="mb-8">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-tea-700 mb-4 flex items-center gap-2">
                <div className="w-8 h-[2px] bg-tea-600" /> ESTATE OPERATION
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '17%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b-2 border-slate-900 dark:border-slate-700">
                      <th className="text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[38%]">Description</th>
                      <th className="text-right px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Period</th>
                      <th className="text-right px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Cost Ave.</th>
                      <th className="text-right px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400">To Date</th>
                      <th className="text-right px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Cost Ave.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      <TL bold>Crop (Kg) – {currentEstate}</TL>
                      <TR v={data.crop.monthly} bold /><td />
                      <TR v={data.crop.todate}  bold /><td />
                    </tr>
                    <tr className="bg-emerald-50/30 dark:bg-emerald-900/10">
                      <TL bold className="text-emerald-700">ESTATE LEAF INCOME – {currentEstate}</TL>
                      <TR v={data.leafIncome?.monthly} bold color="text-emerald-700" /><AV a={data.leafIncome?.monthly} c={derived.mc} bold className="text-emerald-600" />
                      <TR v={data.leafIncome?.todate}  bold color="text-emerald-700" /><AV a={data.leafIncome?.todate}  c={derived.tc} bold className="text-emerald-600" />
                    </tr>
                    
                    <tr><td colSpan={5} className="py-2" /></tr>

                    {derived.allOpExpenses.map((exp, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TL>{exp.label}</TL>
                        <TR v={exp.monthly} /><AV a={exp.monthly} c={derived.mc} />
                        <TR v={exp.todate}  /><AV a={exp.todate}  c={derived.tc} />
                      </tr>
                    ))}

                    <tr className="bg-rose-50/30 dark:bg-rose-900/10 border-t-2 border-slate-900 dark:border-slate-700">
                      <TL bold className="text-rose-700 uppercase">Total Expense</TL>
                      <TR v={derived.tfM} bold bracket color="text-rose-700" />
                      <td className="text-right px-3 py-1 text-[11px] font-black text-rose-600 italic">({f2(av(derived.tfM, derived.mc))})</td>
                      <TR v={derived.tfT} bold bracket color="text-rose-700" />
                      <td className="text-right px-3 py-1 text-[11px] font-black text-rose-600 italic">({f2(av(derived.tfT, derived.tc))})</td>
                    </tr>
                    <tr className={`border-t border-slate-200 dark:border-slate-800 ${derived.fpM < 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                      <TL bold className="uppercase tracking-wider">Tea Field Profit / (Loss)</TL>
                      <TR v={derived.fpM} bold color={pc(derived.fpM)} />
                      <td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.fpM)}`}>{f2(av(derived.fpM, derived.mc))}</td>
                      <TR v={derived.fpT} bold color={pc(derived.fpT)} />
                      <td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.fpT)}`}>{f2(av(derived.fpT, derived.tc))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SECTION: ESTATE SUNDRY ── */}
            <div className="mb-8">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-700 mb-4 flex items-center gap-2">
                <div className="w-8 h-[2px] bg-indigo-600" /> ESTATE SUNDRY
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '17%' }} />
                  </colgroup>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Sundry Income Categories */}
                    {data.sundryIncomeList?.map((inc, i) => (
                      <tr key={`inc-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-emerald-800 dark:text-emerald-300">
                        <TL w="38%">{inc.label}</TL>
                        <TR v={inc.monthly} /><AV a={inc.monthly} c={derived.mc} />
                        <TR v={inc.todate} /><AV a={inc.todate} c={derived.tc} />
                      </tr>
                    ))}
                    {data.sundryIncomeList?.length > 0 && (
                      <tr className="bg-emerald-50/20 dark:bg-emerald-900/10">
                        <TL bold className="uppercase text-[10px]">Total Sundry Income</TL>
                        <TR v={data.sundryIncome?.monthly} bold /><td className="text-right px-3 py-1 text-[11px] font-black italic">{f2(av(data.sundryIncome?.monthly, derived.mc))}</td>
                        <TR v={data.sundryIncome?.todate} bold /><td className="text-right px-3 py-1 text-[11px] font-black italic">{f2(av(data.sundryIncome?.todate, derived.tc))}</td>
                      </tr>
                    )}

                    {/* Sundry Expense Categories */}
                    {derived.remSundryList?.map((exp, i) => (
                      <tr key={`exp-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 text-rose-800 dark:text-rose-300">
                        <TL w="38%">{exp.label}</TL>
                        <TR v={exp.monthly} /><AV a={exp.monthly} c={derived.mc} />
                        <TR v={exp.todate} /><AV a={exp.todate} c={derived.tc} />
                      </tr>
                    ))}
                    {derived.remSundryList?.length > 0 && (
                      <tr className="bg-rose-50/20 dark:bg-rose-900/10">
                        <TL bold className="uppercase text-[10px]">Total Sundry Expenses</TL>
                        <TR v={derived.sundryExpM} bold /><td className="text-right px-3 py-1 text-[11px] font-black italic">{f2(av(derived.sundryExpM, derived.mc))}</td>
                        <TR v={derived.sundryExpT} bold /><td className="text-right px-3 py-1 text-[11px] font-black italic">{f2(av(derived.sundryExpT, derived.tc))}</td>
                      </tr>
                    )}

                    {(!data.sundryIncomeList?.length && !derived.remSundryList?.length) && (
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TL className="text-slate-400 italic" colSpan={5}>No sundry transactions recorded for this period</TL>
                      </tr>
                    )}
                    <tr className={`border-t-2 border-slate-900 dark:border-slate-700 ${derived.spM < 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                      <TL bold className="uppercase tracking-wider">Estate Sundry Profit / (Loss)</TL>
                      <TR v={derived.spM} bold color={pc(derived.spM)} /><td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.spM)}`}>{f2(av(derived.spM, derived.mc))}</td>
                      <TR v={derived.spT} bold color={pc(derived.spT)} /><td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.spT)}`}>{f2(av(derived.spT, derived.tc))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SECTION: CAPITAL EXPENSES ── */}
            <div className="mb-10">
              <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 flex items-center gap-2">
                <div className="w-8 h-[2px] bg-slate-400" /> CAPITAL EXPENSES
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <colgroup>
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '17%' }} />
                  </colgroup>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.capitalExpenses.map((exp, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TL className="italic">{exp.label}</TL>
                        <TR v={exp.monthly} /><AV a={exp.monthly} c={derived.mc} />
                        <TR v={exp.todate}  /><AV a={exp.todate}  c={derived.tc} />
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-t-2 border-slate-900 dark:border-slate-700">
                      <TL bold className="uppercase">Total Capital Expenses</TL>
                      <TR v={derived.tcpM} bold bracket color="text-slate-900 dark:text-white" />
                      <td className="text-right px-3 py-1 text-[11px] font-black italic">({f2(av(derived.tcpM, derived.mc))})</td>
                      <TR v={derived.tcpT} bold bracket color="text-slate-900 dark:text-white" />
                      <td className="text-right px-3 py-1 text-[11px] font-black italic">({f2(av(derived.tcpT, derived.tc))})</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── SECTION: SUMMARY ── */}
            <div className="border-t-4 border-slate-900 dark:border-slate-700 pt-6">
              <table className="w-full border-collapse">
                <colgroup>
                  <col style={{ width: '38%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <tbody className="divide-y-2 divide-slate-100 dark:divide-slate-800">
                  <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                    <TL bold w="38%" className="tracking-wider">TOTAL INCOME</TL>
                    <TR v={derived.tiM} bold />
                    <td className="text-right px-3 py-1 text-[11px] font-black italic">{f2(av(derived.tiM, derived.mc))}</td>
                    <TR v={derived.tiT} bold />
                    <td className="text-right px-3 py-1 text-[11px] font-black italic">{f2(av(derived.tiT, derived.tc))}</td>
                  </tr>
                  <tr className="bg-rose-50 dark:bg-rose-900/20">
                    <TL bold className="tracking-wider">TOTAL EXPENSES</TL>
                    <TR v={derived.teM} bold bracket />
                    <td className="text-right px-3 py-1 text-[11px] font-black italic">({f2(av(derived.teM, derived.mc))})</td>
                    <TR v={derived.teT} bold bracket />
                    <td className="text-right px-3 py-1 text-[11px] font-black italic">({f2(av(derived.teT, derived.tc))})</td>
                  </tr>
                  <tr className={`border-t-4 border-slate-900 dark:border-slate-700 ${derived.pwcM < 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}`}>
                    <TL bold className="tracking-widest uppercase">Profit WITH Capital Expenses</TL>
                    <TR v={derived.pwcM} bold color={pc(derived.pwcM)} />
                    <td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.pwcM)}`}>{f2(av(derived.pwcM, derived.mc))}</td>
                    <TR v={derived.pwcT} bold color={pc(derived.pwcT)} />
                    <td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.pwcT)}`}>{f2(av(derived.pwcT, derived.tc))}</td>
                  </tr>
                  <tr className={derived.pwoM < 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-emerald-50 dark:bg-emerald-900/20"}>
                    <TL bold className="tracking-wider uppercase">Profit WITHOUT Capital Expenses</TL>
                    <TR v={derived.pwoM} bold color={pc(derived.pwoM)} />
                    <td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.pwoM)}`}>{f2(av(derived.pwoM, derived.mc))}</td>
                    <TR v={derived.pwoT} bold color={pc(derived.pwoT)} />
                    <td className={`text-right px-3 py-1 text-[11px] font-black italic ${pc(derived.pwoT)}`}>{f2(av(derived.pwoT, derived.tc))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-12 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-4">
                <span>Period: {periodLabel}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>Generated: {new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={10} className="text-tea-600" />
                Live Sync Active
              </div>
            </div>
          </div>
        </div>
      ) : status === 'error' ? null : (
        <div className="p-20 text-center premium-card">
          <div className="w-12 h-12 border-4 border-tea-500/20 border-t-tea-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Initializing Intelligence Hub...</p>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report, #report * { visibility: visible; }
          #report { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 0 !important; 
            border: none !important; 
            background: white !important;
            color: black !important;
          }
          .dark #report { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}
