import React, { useState, useEffect } from 'react';
import { Scale, Factory, Calendar, Leaf, Save, TrendingUp, AlertCircle, RefreshCcw, FileText, Layers, Sprout, Plus, X, Banknote } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function FactoryCropWeight() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    intakeDate: date,
    grossWeight: '',
    waterDeduction: '',
    containerDeduction: '',
    coarseLeafDeduction: '',
    boiledLeafDeduction: '',
    ratePerKg: '150',
    remarks: ''
  });
  
  const [dailyHistory, setDailyHistory] = useState([]);

  const fetchFactoryIntakes = async () => {
    try {
      const d = new Date(date);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const res = await apiClient.get(`/crop/factory-intakes?year=${y}&month=${m}`);
      if (res.success && res.data) {
        const history = res.data.map(item => ({
          id: item.id,
          date: item.log_date,
          gross: parseFloat(item.gross_weight),
          deductions: parseFloat(item.water_deduction) + parseFloat(item.container_deduction) + parseFloat(item.coarse_leaf_deduction) + parseFloat(item.bag_weight_deduction || 0) + parseFloat(item.boiled_leaf_deduction || 0) + parseFloat(item.two_percent_deduction || 0),
          net: parseFloat(item.net_weight),
          rate: parseFloat(item.rate_per_kg),
          earnings: parseFloat(item.earnings)
        }));
        setDailyHistory(history);
      }
    } catch (e) {
      console.error('Failed to fetch factory intakes:', e);
    }
  };

  useEffect(() => {
    fetchFactoryIntakes();
  }, [date]);

  const [fieldWeightMonth, setFieldWeightMonth] = useState(0);

  useEffect(() => {
    const fetchFieldWeight = async () => {
      try {
        const d = new Date(date);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const res = await apiClient.get(`/crop/plucker-performance?year=${y}&month=${m}`);
        if (res.success && res.data) {
          const sum = res.data.reduce((acc, curr) => acc + (parseFloat(curr.total_kg) || 0), 0);
          setFieldWeightMonth(sum);
        }
      } catch (error) {
        console.error('Failed to fetch field weight', error);
      }
    };
    fetchFieldWeight();
  }, [date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateNetWeight = () => {
    const gross = parseFloat(formData.grossWeight) || 0;
    const water = parseFloat(formData.waterDeduction) || 0;
    const container = parseFloat(formData.containerDeduction) || 0;
    const coarse = parseFloat(formData.coarseLeafDeduction) || 0;
    const boiled = parseFloat(formData.boiledLeafDeduction) || 0;
    const twoPercent = gross * 0.02;

    return Math.max(0, gross - water - container - coarse - boiled - twoPercent);
  };

  const getTwoPercentDeduction = () => {
    const gross = parseFloat(formData.grossWeight) || 0;
    return gross * 0.02;
  };

  const calculateEarnings = () => {
    const net = calculateNetWeight();
    const rate = parseFloat(formData.ratePerKg) || 0;
    return (net * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const net = calculateNetWeight();
      const rate = parseFloat(formData.ratePerKg) || 150;
      const earnings = net * rate;

      await apiClient.post('/crop/factory-intakes', {
        log_date: formData.intakeDate,
        gross_weight: parseFloat(formData.grossWeight) || 0,
        water_deduction: parseFloat(formData.waterDeduction) || 0,
        container_deduction: parseFloat(formData.containerDeduction) || 0,
        coarse_leaf_deduction: parseFloat(formData.coarseLeafDeduction) || 0,
        bag_weight_deduction: 0,
        boiled_leaf_deduction: parseFloat(formData.boiledLeafDeduction) || 0,
        two_percent_deduction: getTwoPercentDeduction(),
        net_weight: net,
        rate_per_kg: rate,
        earnings: earnings,
        remarks: formData.remarks
      });

      setFormData({
        intakeDate: date,
        grossWeight: '',
        waterDeduction: '',
        containerDeduction: '',
        coarseLeafDeduction: '',
        boiledLeafDeduction: '',
        ratePerKg: formData.ratePerKg,
        remarks: ''
      });
      setShowIntakeModal(false);
      fetchFactoryIntakes();
    } catch (e) {
      console.error('Save intake failed:', e);
    } finally {
      setSaving(false);
    }
  };

  const totalFactoryNet = dailyHistory.reduce((acc, curr) => acc + curr.net, 0);
  const totalFactoryEarnings = dailyHistory.reduce((acc, curr) => acc + (curr.net * curr.rate), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight uppercase italic flex items-center gap-2">
            <Factory className="text-tea-500" /> Factory Crop <span className="text-tea-500">Weight</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Green Leaf Intake & Deduction Management</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none"
          />
          <button
            onClick={() => setShowIntakeModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-tea-600/20"
          >
            <Plus size={16} /> Record Intake
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card bg-tea-600 text-white border-none shadow-xl shadow-tea-600/20 flex flex-col justify-between p-6 overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Scale size={120} />
          </div>
          <div className="flex items-center justify-between opacity-80 mb-4 z-10">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Factory Weight</p>
            <Factory size={20} />
          </div>
          <div className="z-10">
            <h3 className="text-4xl font-black font-outfit italic tracking-tighter">
              {totalFactoryNet.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs not-italic uppercase ml-1 opacity-80">KG</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-indigo-900 border-none shadow-xl shadow-indigo-900/20 flex flex-col justify-between p-6 overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Layers size={120} className="text-indigo-500" />
          </div>
          <div className="flex items-center justify-between opacity-80 mb-4 z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Monthly Field Weight</p>
            <Sprout size={20} className="text-indigo-400" />
          </div>
          <div className="z-10">
            <h3 className="text-4xl font-black font-outfit italic tracking-tighter text-white">
              {fieldWeightMonth.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs not-italic uppercase ml-1 opacity-80">KG</span>
            </h3>
          </div>
        </div>

        <div className="premium-card bg-white dark:bg-slate-900 flex flex-col justify-between p-6 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest">Total Approx Earnings</p>
            <Banknote size={20} className="text-emerald-500" />
          </div>
          <div>
            <h3 className="text-4xl font-black font-outfit italic tracking-tighter text-slate-900 dark:text-emerald-400">
               Rs. {totalFactoryEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
      </div>

      <div className="premium-card p-0 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
             <Calendar className="text-blue-500" size={20} />
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Daily Factory Intakes</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Gross (KG)</th>
                <th className="px-6 py-4 text-right">Deductions (KG)</th>
                <th className="px-6 py-4 text-right">Net Yield (KG)</th>
                <th className="px-6 py-4 text-right">Rate (LKR)</th>
                <th className="px-6 py-4 text-right">Earnings (LKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dailyHistory.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs">{item.date}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-300">{item.gross.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-500/80">{item.deductions.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-black text-tea-600 dark:text-tea-400 text-sm">{item.net.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-500">{item.rate.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600 dark:text-emerald-400 italic">{(item.net * item.rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {dailyHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] italic opacity-50">
                    No factory intake records found
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td className="px-6 py-4">Total</td>
                <td className="px-6 py-4 text-right">{dailyHistory.reduce((s,i) => s + i.gross, 0).toFixed(1)}</td>
                <td className="px-6 py-4 text-right">{dailyHistory.reduce((s,i) => s + i.deductions, 0).toFixed(1)}</td>
                <td className="px-6 py-4 text-right text-tea-600 dark:text-tea-400 text-sm">{totalFactoryNet.toFixed(1)}</td>
                <td className="px-6 py-4 text-right">—</td>
                <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 text-sm">{totalFactoryEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showIntakeModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-tea-500/10 text-tea-600 rounded-2xl">
                  <Factory size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tight italic">Record Intake Measurement</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Intake Date:</span>
                    <input 
                      type="date"
                      name="intakeDate"
                      value={formData.intakeDate}
                      onChange={handleInputChange}
                      className="bg-transparent border-none text-[10px] font-bold text-tea-600 uppercase tracking-widest outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <button onClick={() => setShowIntakeModal(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 dashboard-scroll grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gross Weight (KG)</label>
                      <input 
                        type="number"
                        name="grossWeight"
                        value={formData.grossWeight}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Water Deduction (KG)</label>
                      <input 
                        type="number"
                        name="waterDeduction"
                        value={formData.waterDeduction}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Container Deduction (KG)</label>
                      <input 
                        type="number"
                        name="containerDeduction"
                        value={formData.containerDeduction}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Coarse Leaf Deduction (KG)</label>
                      <input 
                        type="number"
                        name="coarseLeafDeduction"
                        value={formData.coarseLeafDeduction}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Boiled Leaf Deduction (KG)</label>
                    <input 
                      type="number"
                      name="boiledLeafDeduction"
                      value={formData.boiledLeafDeduction}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rate per KG (LKR)</label>
                    <input 
                      type="number"
                      name="ratePerKg"
                      value={formData.ratePerKg}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl mt-6 flex justify-between items-center">
                  <div>
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Standard 2% Deduction</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gross Weight × 0.02</p>
                  </div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 italic">
                    {getTwoPercentDeduction().toFixed(2)} KG
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks / Notes</label>
                  <textarea 
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-tea-500 transition-colors min-h-[80px]"
                    placeholder="Optional remarks..."
                  ></textarea>
                </div>
              </div>

              <div className="space-y-6 flex flex-col justify-between">
                <div className="premium-card bg-tea-900 border-none relative overflow-hidden flex-1 flex flex-col justify-center">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Leaf size={120} className="text-tea-500" />
                  </div>
                  <h3 className="text-white font-black uppercase tracking-widest text-xs mb-8 flex items-center gap-2 font-outfit italic">
                    <TrendingUp size={16} className="text-tea-400" /> Net Weight Calculation
                  </h3>
                  
                  <div className="flex flex-col items-center justify-center py-6 border-b border-tea-800 mb-4">
                    <span className="text-[10px] font-black text-tea-400 uppercase tracking-widest mb-2">Calculated Net Yield</span>
                    <div className="text-5xl font-black text-white font-outfit italic tracking-tighter">
                      {calculateNetWeight().toFixed(2)}
                    </div>
                    <span className="text-sm font-bold text-tea-400 uppercase mt-1">KG</span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-2 mb-4">
                    <span className="text-[10px] font-black text-tea-400 uppercase tracking-widest mb-2">Approx. Earnings</span>
                    <div className="text-3xl font-black text-emerald-400 font-outfit italic tracking-tighter">
                      Rs. {calculateEarnings()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={handleSave}
                disabled={saving || !formData.grossWeight}
                className="w-full py-4 bg-tea-600 hover:bg-tea-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-tea-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving Record...' : 'Record Intake Weight'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
