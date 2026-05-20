import React, { useState } from 'react';
import { Calculator, RotateCcw, Zap, Info, Droplets, FlaskConical, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MAX_SALT_PCT = 5;
const UREA_N_PCT   = 0.46;
const EPSOM_MG_PCT = 0.0986;
const SOP_K2O_PCT  = 0.50;   // Sulphate of potash ~50% K₂O
const SOP_K_PCT    = 0.415;  // ~41.5% K elemental

const round2 = (n) => Math.round(n * 100) / 100;
const round4 = (n) => Math.round(n * 10000) / 10000;

const getPct = (kg, liters) => {
  if (!liters) return 0;
  return round2((kg / liters) * 100);
};

const getTotalSaltPct = (arr, liters) => {
  if (!liters) return 0;
  return round2(arr.reduce((s, v) => s + v, 0) / liters * 100);
};

export default function FoliarSprayCalculator() {
  const [activeTab, setActiveTab] = useState('zinc');
  const [area, setArea] = useState('');
  const [unit, setUnit] = useState('ha');

  // Section 1 — ZnSO4
  const [znRate, setZnRate] = useState('1');
  const [wRate1, setWRate1] = useState('100');
  const [useUrea1, setUseUrea1] = useState(false);
  const [urea1Rate, setUrea1Rate] = useState('1');
  const [useEp1, setUseEp1] = useState(false);
  const [ep1Rate, setEp1Rate] = useState('1');
  const [apps1, setApps1] = useState('1');
  const [znResult, setZnResult] = useState(null);

  // Section 2 — N & Mg
  const [urea2Rate, setUrea2Rate] = useState('');
  const [ep2Rate, setEp2Rate] = useState('');
  const [wRate2, setWRate2] = useState('100');
  const [apps2, setApps2] = useState('1');
  const [nMgResult, setNMgResult] = useState(null);

  // Section 3 — K (SOP)
  const [sopRate, setSopRate] = useState('');
  const [useUrea3, setUseUrea3] = useState(false);
  const [urea3Rate, setUrea3Rate] = useState('2');
  const [wRate3, setWRate3] = useState('100');
  const [sopResult, setSopResult] = useState(null);

  const calculateZinc = () => {
    if (!area || !znRate) return;
    const a = parseFloat(area);
    const areaHa = unit === 'ha' ? a : unit === 'ac' ? a * 0.404686 : a / 10000;
    const rate = parseFloat(znRate);
    const water = parseFloat(wRate1);
    const uRate = useUrea1 ? parseFloat(urea1Rate) : 0;
    const eRate = useEp1 ? parseFloat(ep1Rate) : 0;
    const apps = parseInt(apps1) || 1;

    const znKg = round2(rate * areaHa);
    const wL = round2(water * areaHa);
    const uKg = round2(uRate * areaHa);
    const eKg = round2(eRate * areaHa);
    const salt = getTotalSaltPct([znKg, uKg, eKg], wL);

    setZnResult({
      znKg, wL, uKg, eKg, salt, apps,
      znPct: getPct(znKg, wL),
      uPct: getPct(uKg, wL),
      ePct: getPct(eKg, wL),
      totalZn: round2(znKg * apps),
      totalWater: round2(wL * apps)
    });
  };

  const calculateNMg = () => {
    if (!area || !urea2Rate || !ep2Rate) return;
    const a = parseFloat(area);
    const areaHa = unit === 'ha' ? a : unit === 'ac' ? a * 0.404686 : a / 10000;
    const uRate = parseFloat(urea2Rate);
    const eRate = parseFloat(ep2Rate);
    const water = parseFloat(wRate2);
    const apps = parseInt(apps2) || 1;

    const uKg = round2(uRate * areaHa);
    const eKg = round2(eRate * areaHa);
    const wL = round2(water * areaHa);
    const salt = getTotalSaltPct([uKg, eKg], wL);

    setNMgResult({
      uKg, eKg, wL, salt, apps,
      uPct: getPct(uKg, wL),
      ePct: getPct(eKg, wL),
      nKg: round2(uKg * UREA_N_PCT),
      mgKg: round2(eKg * EPSOM_MG_PCT),
      totalN: round2(uKg * UREA_N_PCT * apps),
      totalMg: round2(eKg * EPSOM_MG_PCT * apps)
    });
  };

  const calculateSOP = () => {
    if (!area || !sopRate) return;
    const a = parseFloat(area);
    const areaHa = unit === 'ha' ? a : unit === 'ac' ? a * 0.404686 : a / 10000;
    const rate = parseFloat(sopRate);
    const water = parseFloat(wRate3);
    const uRate = useUrea3 ? parseFloat(urea3Rate) : 0;
    const sopKg = round2(rate * areaHa);
    const wL = round2(water * areaHa);
    const uKg = round2(uRate * areaHa);
    const salt = getTotalSaltPct([sopKg, uKg], wL);

    setSopResult({
      sopKg, wL, uKg, salt,
      sopPct: getPct(sopKg, wL),
      uPct: getPct(uKg, wL),
      kKg: round2(sopKg * SOP_K_PCT),
      k2oKg: round2(sopKg * SOP_K2O_PCT)
    });
  };

  const resetZinc = () => {
    setZnRate('1');
    setWRate1('100');
    setZnResult(null);
  };

  const resetNMg = () => {
    setUrea2Rate('');
    setEp2Rate('');
    setWRate2('100');
    setNMgResult(null);
  };

  const resetSOP = () => {
    setSopRate('');
    setWRate3('100');
    setSopResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit flex items-center gap-2 text-emerald-600">
            <Droplets className="text-emerald-500" /> Foliar Applications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Nutrient spray & mixing concentration calculator</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('zinc')}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'zinc'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Zinc Sulphate
        </button>
        <button
          onClick={() => setActiveTab('nmg')}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'nmg'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Nitrogen & Magnesium
        </button>
        <button
          onClick={() => setActiveTab('sop')}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'sop'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Potassium (SOP)
        </button>
      </div>

      {/* Shared Land Area Panel */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Plantation Area</label>
            <input 
              type="number" 
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Enter area"
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Unit</label>
            <select 
              value={unit} 
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
            >
              <option value="ha">Hectares (ha)</option>
              <option value="ac">Acres (ac)</option>
              <option value="m2">Square Meters (m²)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Zinc Tab */}
      {activeTab === 'zinc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">ZnSO₄ Rate (kg/ha)</label>
                <input 
                  type="number" 
                  value={znRate} 
                  readOnly
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-400 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Water Rate (L/ha)</label>
                <input 
                  type="number" 
                  value={wRate1} 
                  readOnly
                  className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 cursor-not-allowed text-slate-500 dark:text-slate-400 font-bold" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Optional Additives</p>
              <div className="flex gap-3">
                <button onClick={() => setUseUrea1(!useUrea1)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${useUrea1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>Include Urea</button>
                <button onClick={() => setUseEp1(!useEp1)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${useEp1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>Include Epsom</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {useUrea1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Urea (kg/ha)</label>
                    <input type="number" step="0.1" value={urea1Rate} onChange={e => setUrea1Rate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                  </div>
                )}
                {useEp1 && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Epsom (kg/ha)</label>
                    <input type="number" step="0.1" value={ep1Rate} onChange={e => setEp1Rate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={calculateZinc} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"><Calculator size={18} /> Calculate</button>
              <button onClick={resetZinc} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><RotateCcw size={18} /></button>
            </div>

            {/* Visual Guide */}
            <div className="grid grid-cols-3 gap-3 mt-4 opacity-70">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <div className="text-lg mb-1">⚖️</div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">1.0 kg/ha</p>
                <p className="text-[9px] text-slate-500 tracking-tighter">Standard Rate</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <div className="text-lg mb-1">💧</div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">100 L/ha</p>
                <p className="text-[9px] text-slate-500 tracking-tighter">Water Volume</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                <div className="text-lg mb-1">⚠️</div>
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">5% Max</p>
                <p className="text-[9px] text-slate-500 tracking-tighter">Salt Limit</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${znResult ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Mixing Plan</h3>
              {znResult ? (
                <div className="space-y-4">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Water</p>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1">{znResult.wL} Liters</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">ZnSO₄ Required</span>
                      <span className="font-bold text-emerald-600">{znResult.znKg} kg</span>
                    </div>
                    {useUrea1 && (
                      <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Urea Additive</span>
                        <span className="font-bold text-emerald-600">{znResult.uKg} kg</span>
                      </div>
                    )}
                    {useEp1 && (
                      <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Epsom Additive</span>
                        <span className="font-bold text-emerald-600">{znResult.eKg} kg</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Salt Concentration</span>
                      <span className={`text-xs font-black ${znResult.salt > 5 ? 'text-red-500' : 'text-emerald-600'}`}>{znResult.salt}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.min((znResult.salt / 5) * 100, 100)}%` }} className={`h-full ${znResult.salt > 5 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <Droplets size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-400 tracking-tight">Enter rates and area <br /> to generate mixing plan</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
              <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info size={14} /> Advisory</h4>
              <p className="text-[10px] text-blue-700 dark:text-blue-500 leading-relaxed font-medium">Dissolve ZnSO₄ completely. Do not exceed 5% total salt concentration to avoid leaf scorch.</p>
            </div>
          </div>
        </div>
      )}

      {/* NMg Tab */}
      {activeTab === 'nmg' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Urea Rate (kg/ha)</label>
                <input type="number" step="0.1" value={urea2Rate} onChange={e => setUrea2Rate(e.target.value)} placeholder="Recommended 1.0 - 2.0" className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Epsom Rate (kg/ha)</label>
                <input type="number" step="0.1" value={ep2Rate} onChange={e => setEp2Rate(e.target.value)} placeholder="Recommended 1.0 - 2.0" className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Water Rate (L/ha)</label>
                <input type="number" step="10" value={wRate2} onChange={e => setWRate2(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Applications</label>
                <input type="number" step="1" value={apps2} onChange={e => setApps2(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={calculateNMg} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"><Calculator size={18} /> Calculate</button>
              <button onClick={resetNMg} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><RotateCcw size={18} /></button>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${nMgResult ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Nutrient Delivery</h3>
              {nMgResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nitrogen (N)</p>
                      <p className="text-lg font-black text-emerald-600">{nMgResult.nKg} kg</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Magnesium (Mg)</p>
                      <p className="text-lg font-black text-emerald-600">{nMgResult.mgKg} kg</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 font-medium">Urea (46% N)</span>
                      <span className="font-bold">{nMgResult.uKg} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 font-medium">Epsom (9.86% Mg)</span>
                      <span className="font-bold">{nMgResult.eKg} kg</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Concentration Check</span>
                      <span className={`text-xs font-black ${nMgResult.salt > 5 ? 'text-red-500' : 'text-emerald-600'}`}>{nMgResult.salt}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full">
                      <div style={{ width: `${Math.min((nMgResult.salt / 5) * 100, 100)}%` }} className={`h-full ${nMgResult.salt > 5 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <FlaskConical size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-400 tracking-tight">Enter N & Mg rates <br /> for nutrient breakdown</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info size={14} /> Protocol</h4>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-500 leading-relaxed font-medium">Recommended for rapid recovery from N or Mg deficiency. Apply during high humidity for max absorption.</p>
            </div>
          </div>
        </div>
      )}

      {/* SOP Tab */}
      {activeTab === 'sop' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">SOP Rate (kg/ha)</label>
                <input type="number" step="0.1" value={sopRate} onChange={e => setSopRate(e.target.value)} placeholder="Recommended 2.0" className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Water Rate (L/ha)</label>
                <input type="number" step="10" value={wRate3} onChange={e => setWRate3(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => setUseUrea3(!useUrea3)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${useUrea3 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>Enhance with 2% Urea</button>
              {useUrea3 && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300 max-w-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Urea Rate (kg/ha)</label>
                  <input type="number" step="0.1" value={urea3Rate} onChange={e => setUrea3Rate(e.target.value)} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm font-bold" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={calculateSOP} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"><Calculator size={18} /> Calculate</button>
              <button onClick={resetSOP} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"><RotateCcw size={18} /></button>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${sopResult ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Potassium Prep</h3>
              {sopResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Potassium (K)</p>
                      <p className="text-lg font-black text-emerald-600">{sopResult.kKg} kg</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">K₂O Equivalent</p>
                      <p className="text-lg font-black text-emerald-600">{sopResult.k2oKg} kg</p>
                    </div>
                  </div>
                  

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 font-medium">SOP Required</span>
                      <span className="font-bold">{sopResult.sopKg} kg</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-slate-600 font-medium">Water Volume</span>
                      <span className="font-bold">{sopResult.wL} Liters</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Concentration</span>
                      <span className={`text-xs font-black ${sopResult.salt > 5 ? 'text-red-500' : 'text-emerald-600'}`}>{sopResult.salt}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div style={{ width: `${Math.min((sopResult.salt / 5) * 100, 100)}%` }} className={`h-full ${sopResult.salt > 5 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <Zap size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-400 tracking-tight">Enter SOP rate <br /> to see potassium breakdown</p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30">
              <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info size={14} /> SOP Guidelines</h4>
              <p className="text-[10px] text-indigo-700 dark:text-indigo-500 leading-relaxed font-medium">Applications must start at least one month before dry period onset. 2% Urea improves K absorption efficiency.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
