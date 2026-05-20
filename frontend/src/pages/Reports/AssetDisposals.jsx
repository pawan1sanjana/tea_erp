import React, { useState, useEffect, useMemo } from 'react';
import { 
  Archive, Calendar, Search, Filter, Download, 
  FileText, FileSpreadsheet, ChevronLeft, ChevronRight,
  TrendingUp, DollarSign, Clock
} from 'lucide-react';
import { apiClient } from '../../api/client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AssetDisposals() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'All',
    month: 'All',
    year: new Date().getFullYear().toString()
  });

  const months = [
    { value: '1', label: 'January' }, { value: '2', label: 'February' },
    { value: '3', label: 'March' }, { value: '4', label: 'April' },
    { value: '5', label: 'May' }, { value: '6', label: 'June' },
    { value: '7', label: 'July' }, { value: '8', label: 'August' },
    { value: '9', label: 'September' }, { value: '10', label: 'October' },
    { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  useEffect(() => {
    fetchDisposals();
  }, [filters]);

  const fetchDisposals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.type !== 'All') params.append('type', filters.type);
      if (filters.month !== 'All') params.append('month', filters.month);
      if (filters.year !== 'All') params.append('year', filters.year);

      const response = await apiClient.get(`/reports/asset-disposals?${params.toString()}`);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch disposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    return data.reduce((acc, item) => {
      acc.total += Number(item.amount);
      if (item.asset_type === 'biological') acc.bio += Number(item.amount);
      else acc.phy += Number(item.amount);
      return acc;
    }, { total: 0, bio: 0, phy: 0 });
  }, [data]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'Type': item.asset_type.toUpperCase(),
      'Asset Name': item.asset_name,
      'Category': item.asset_category,
      'Sale Date': new Date(item.sale_date).toLocaleDateString(),
      'Buyer': item.buyer,
      'Amount (LKR)': item.amount,
      'Income Account': `${item.account_code} - ${item.account_name}`,
      'Notes': item.notes
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asset_Disposals");
    XLSX.writeFile(workbook, `Asset_Disposals_Report_${filters.year}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(20);
    doc.text("Asset Disposal & Archive Report", 14, 22);
    doc.setFontSize(10);
    doc.text(`Period: ${filters.month !== 'All' ? months.find(m => m.value === filters.month).label : 'Full Year'} ${filters.year}`, 14, 30);
    doc.text(`Total Recovery: LKR ${totals.total.toLocaleString()}`, 14, 35);
    
    autoTable(doc, {
      startY: 45,
      head: [['Type', 'Asset Name', 'Category', 'Date', 'Buyer', 'Amount (LKR)', 'Account']],
      body: data.map(i => [
        i.asset_type.toUpperCase(),
        i.asset_name,
        i.asset_category,
        new Date(i.sale_date).toLocaleDateString(),
        i.buyer,
        Number(i.amount).toLocaleString(),
        i.account_name
      ]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });
    
    doc.save(`Asset_Disposal_Report_${filters.year}.pdf`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Archive size={20} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Asset Archives</h1>
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
            Historical Data for Sold & Disposed Plantation Assets
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button onClick={exportToPDF} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
            <FileText size={16} className="text-red-500" /> PDF Report
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm">
            <FileSpreadsheet size={16} className="text-emerald-500" /> Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card bg-gradient-to-br from-indigo-600 to-indigo-800 border-none text-white overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Total Recovery Value</p>
            <h3 className="text-3xl font-black mt-2 leading-none flex items-baseline gap-2">
              <span className="text-sm">LKR</span> {totals.total.toLocaleString()}
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded-full">
              <TrendingUp size={12} /> Combined disposal revenue
            </div>
          </div>
          <Archive size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
        </div>

        <div className="premium-card flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biological Assets</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">LKR {totals.bio.toLocaleString()}</h4>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(totals.bio/totals.total)*100 || 0}%` }}></div>
          </div>
        </div>

        <div className="premium-card flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical Assets</p>
            <h4 className="text-xl font-black text-slate-900 dark:text-white mt-1">LKR {totals.phy.toLocaleString()}</h4>
          </div>
          <div className="mt-4 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(totals.phy/totals.total)*100 || 0}%` }}></div>
          </div>
        </div>
      </div>

      <div className="premium-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Type</label>
            <div className="relative">
              <select 
                value={filters.type} 
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase outline-none focus:border-indigo-500 appearance-none transition-all"
              >
                <option value="All">All Assets</option>
                <option value="Biological">Biological</option>
                <option value="Physical">Physical</option>
              </select>
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
            <div className="relative">
              <select 
                value={filters.month} 
                onChange={(e) => setFilters({...filters, month: e.target.value})}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase outline-none focus:border-indigo-500 appearance-none transition-all"
              >
                <option value="All">Full Year</option>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fiscal Year</label>
            <div className="relative">
              <select 
                value={filters.year} 
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase outline-none focus:border-indigo-500 appearance-none transition-all"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            </div>
          </div>

          <button onClick={fetchDisposals} className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            <Search size={14} /> Refresh Data
          </button>
        </div>
      </div>

      <div className="premium-card overflow-hidden p-0 border-collapse">
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retrieving archives...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="p-20 text-center text-slate-400">
            <Archive size={40} className="mx-auto mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest">No archival records for this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] font-black tracking-widest text-slate-400">
                  <th className="px-6 py-4">Asset Details</th>
                  <th className="px-6 py-4">Sale Info</th>
                  <th className="px-6 py-4">Recovery Value</th>
                  <th className="px-6 py-4">Income Destination</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                          item.asset_type === 'biological' 
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600'
                            : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-600'
                        }`}>
                          <Archive size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{item.asset_name}</p>
                          <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.asset_category}</span>
                             <span className="text-slate-200 dark:text-slate-700">•</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID #{item.original_id}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Calendar size={12} className="text-slate-400"/>
                            {new Date(item.sale_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <DollarSign size={12}/> {item.buyer}
                          </p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900 dark:text-white">Rs. {Number(item.amount).toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                         <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                         <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Realized Value</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 inline-block">
                          <p className="text-[10px] font-black text-slate-900 dark:text-white leading-none mb-1">{item.account_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{item.account_code}</p>
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className="px-3 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest">
                         Archived
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
