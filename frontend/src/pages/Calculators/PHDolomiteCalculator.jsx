import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw, Save, FileDown, Info, User, Hash, Thermometer } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function PHDolomiteCalculator() {
  const [currentPH, setCurrentPH] = useState('');
  const [area, setArea] = useState('');
  const [unit, setUnit] = useState('hectares');
  const [result, setResult] = useState(null);

  const calculate = (e) => {
    if (e) e.preventDefault();
    if (!currentPH || !area) return;

    const phValue = parseFloat(currentPH);
    let rate = 0; // Tons per Hectare

    // TEA RESEARCH INSTITUTE (TRI) STANDARDS FOR SRI LANKA
    if (phValue < 4.0) {
      rate = 4.0;
    } else if (phValue < 4.5) {
      rate = 2.0;
    } else if (phValue < 5.0) {
      rate = 1.0;
    } else if (phValue < 5.5) {
      rate = 0.5;
    } else {
      rate = 0.0;
    }

    let hectares = parseFloat(area);
    if (unit === 'acres') hectares *= 0.404686;
    if (unit === 'perches') hectares *= 0.002529;

    const totalKg = rate * hectares * 1000;

    setResult({
      rate: (rate * 1000).toFixed(0),
      totalKg: totalKg.toFixed(0),
      bags: (totalKg / 50).toFixed(0), // 50kg bags
      status: phValue >= 4.5 && phValue <= 5.5 ? 'Optimal' : phValue < 4.5 ? 'Acidic' : 'High'
    });
  };

  const generatePDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const date = new Date().toLocaleString();

    doc.setFontSize(22);
    doc.setTextColor(21, 128, 61);
    doc.text("TeaERP Pro - Dolomite Analysis", 20, 30);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Generated: ${date}`, 20, 40);
    doc.line(20, 45, 190, 45);

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Soil pH: ${currentPH}`, 25, 60);
    doc.text(`Land Area: ${area} ${unit}`, 25, 70);

    doc.setFontSize(14);
    doc.setTextColor(21, 128, 61);
    doc.text("CALCULATION RESULTS", 20, 90);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Recommended Rate: ${result.rate} KG / Hectare`, 25, 100);
    doc.text(`Total Quantity: ${result.totalKg} KG`, 25, 110);
    doc.text(`Bags Required (50kg): ${result.bags} Bags`, 25, 120);

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Official recommendation based on Tea Research Institute (TRI) guidelines.", 20, 280);

    doc.save(`Dolomite_Report_${date.split(',')[0]}.pdf`);
  };

  const reset = () => {
    setCurrentPH('');
    setArea('');
    setResult(null);
  };

  // PH Marker position logic
  const getMarkerPosition = () => {
    if (!currentPH) return '50%';
    const ph = parseFloat(currentPH);
    const clamped = Math.min(Math.max(ph, 3), 9);
    return `${((clamped - 3) / 6) * 100}%`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit text-tea-600">Dolomite Calculator</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tea Plantation Soil Acidity Correction Tool</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
          <form onSubmit={calculate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                 Soil pH (3.0 - 9.0)
              </label>
              <input 
                type="number" 
                step="0.1"
                min="3"
                max="9"
                value={currentPH}
                onChange={(e) => setCurrentPH(e.target.value)}
                placeholder="e.g. 5.5"
                className="w-full px-5 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500 transition-all text-base outline-none font-bold text-tea-600 shadow-sm"
              />
              {/* pH Indicator Bar */}
              <div className="mt-4 h-2.5 bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-blue-400 to-blue-700 rounded-full relative overflow-visible shadow-inner">
                <div 
                  className="absolute w-1.5 h-4.5 bg-slate-900 dark:bg-white rounded-full -top-1 transition-all duration-700 shadow-md ring-2 ring-white dark:ring-slate-900"
                  style={{ left: getMarkerPosition() }}
                ></div>
                <div className="absolute top-5 left-0 right-0 flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                  <span>3.0</span>
                  <span>4.5</span>
                  <span>5.5</span>
                  <span>7.0</span>
                  <span>9.0</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Land Area</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Size"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500 transition-all text-sm outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Unit</label>
                  <select 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-tea-500/20 focus:border-tea-500 transition-all text-sm outline-none font-bold"
                  >
                    <option value="hectares">Hectares</option>
                    <option value="acres">Acres</option>
                    <option value="perches">Perches</option>
                  </select>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-tea-600 hover:bg-tea-700 text-white rounded-2xl font-bold shadow-xl shadow-tea-500/20 transition-all mt-6 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Calculator size={20} /> Calculate Requirements
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="space-y-6">
          <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${result ? 'border-tea-500/50 bg-tea-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-center">Dosage Recommendations</h3>
            {result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Input pH</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{currentPH}</p>
                    <span className={`text-[9px] font-bold uppercase tracking-tight ${result.status === 'Optimal' ? 'text-green-500' : 'text-amber-500'}`}>{result.status} Status</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">KG / Hectare</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{result.rate}</p>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Standard Rate</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-tea-500/10 border border-tea-500/30 text-center col-span-2">
                    <p className="text-[10px] font-bold text-tea-600 uppercase">Mandatory Quantity</p>
                    <p className="text-3xl font-black text-tea-600">{result.totalKg} <span className="text-sm">KG</span></p>
                    <p className="text-[10px] font-bold text-tea-600/70 uppercase pt-1">≈ {result.bags} Bags (50kg Each)</p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button onClick={generatePDF} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                    <FileDown size={14} /> Export PDF
                  </button>
                  <button onClick={reset} className="flex-1 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-500/20 transition-all flex items-center justify-center gap-2">
                    <RotateCcw size={14} /> Clear Result
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                  <Calculator size={24} />
                </div>
                <p className="text-sm text-slate-400">Complete analysis form to <br /> generate recommendations</p>
              </div>
            )}
          </div>

          <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Info size={14} /> Technical Standard
            </h4>
            <p className="text-[10px] text-blue-700 dark:text-blue-500 leading-relaxed font-medium">
              Calculation based on Tea Research Institute (TRI) Circular 01/24. Maintain 6-week interval between Dolomite and Fertilization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
