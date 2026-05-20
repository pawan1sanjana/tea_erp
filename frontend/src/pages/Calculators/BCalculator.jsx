import React, { useState } from 'react';
import { Calculator, RotateCcw, Zap, Info } from 'lucide-react';

export default function UnitsConverter() {
  const [activeTab, setActiveTab] = useState('area');
  
  // Area converter state
  const [areaInput, setAreaInput] = useState('');
  const [areaUnit, setAreaUnit] = useState('hectare');
  const [areaResult, setAreaResult] = useState(null);

  // Volume converter state
  const [volumeInput, setVolumeInput] = useState('');
  const [volumeUnit, setVolumeUnit] = useState('liter');
  const [volumeResult, setVolumeResult] = useState(null);

  // Distance converter state
  const [distanceInput, setDistanceInput] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('meter');
  const [distanceResult, setDistanceResult] = useState(null);

  // Land measurement units (in square meters as base)
  const areaUnits = {
    'hectare': { label: 'Hectare (ha)', value: 10000 },
    'acre': { label: 'Acre', value: 4046.86 },
    'perch': { label: 'Perch (pole)', value: 25.2929 },
    'guntha': { label: 'Guntha', value: 101.17 },
    'decimal': { label: 'Decimal', value: 40.47 },
    'square-meter': { label: 'Square Meter (m²)', value: 1 },
    'square-feet': { label: 'Square Feet (ft²)', value: 0.092903 }
  };

  // Volume measurement units (in milliliters as base)
  const volumeUnits = {
    'milliliter': { label: 'Milliliter (ml)', value: 1 },
    'liter': { label: 'Liter (l)', value: 1000 },
    'cubic-meter': { label: 'Cubic Meter (m³)', value: 1000000 },
    'gallon-us': { label: 'US Gallon', value: 3785.41 },
    'gallon-imperial': { label: 'Imperial Gallon', value: 4546.09 },
    'cubic-feet': { label: 'Cubic Feet (ft³)', value: 28316.8 },
    'cubic-inch': { label: 'Cubic Inch (in³)', value: 16.3871 },
    'pint': { label: 'Pint (US)', value: 473.176 }
  };

  // Distance measurement units (in meters as base)
  const distanceUnits = {
    'meter': { label: 'Meter (m)', value: 1 },
    'kilometer': { label: 'Kilometer (km)', value: 1000 },
    'centimeter': { label: 'Centimeter (cm)', value: 0.01 },
    'millimeter': { label: 'Millimeter (mm)', value: 0.001 },
    'mile': { label: 'Mile', value: 1609.34 },
    'yard': { label: 'Yard (yd)', value: 0.9144 },
    'foot': { label: 'Foot (ft)', value: 0.3048 },
    'inch': { label: 'Inch (in)', value: 0.0254 }
  };

  const convertArea = () => {
    if (!areaInput) return;

    const valueInSquareMeters = parseFloat(areaInput) * areaUnits[areaUnit].value;

    const conversions = {};
    Object.keys(areaUnits).forEach(unit => {
      conversions[unit] = (valueInSquareMeters / areaUnits[unit].value).toFixed(4);
    });

    setAreaResult({
      inputValue: areaInput,
      inputUnit: areaUnit,
      conversions: conversions
    });
  };

  const convertVolume = () => {
    if (!volumeInput) return;

    const valueInMilliliters = parseFloat(volumeInput) * volumeUnits[volumeUnit].value;

    const conversions = {};
    Object.keys(volumeUnits).forEach(unit => {
      conversions[unit] = (valueInMilliliters / volumeUnits[unit].value).toFixed(4);
    });

    setVolumeResult({
      inputValue: volumeInput,
      inputUnit: volumeUnit,
      conversions: conversions
    });
  };

  const resetArea = () => {
    setAreaInput('');
    setAreaResult(null);
  };

  const resetVolume = () => {
    setVolumeInput('');
    setVolumeResult(null);
  };

  const convertDistance = () => {
    if (!distanceInput) return;

    const valueInMeters = parseFloat(distanceInput) * distanceUnits[distanceUnit].value;

    const conversions = {};
    Object.keys(distanceUnits).forEach(unit => {
      conversions[unit] = (valueInMeters / distanceUnits[unit].value).toFixed(4);
    });

    setDistanceResult({
      inputValue: distanceInput,
      inputUnit: distanceUnit,
      conversions: conversions
    });
  };

  const resetDistance = () => {
    setDistanceInput('');
    setDistanceResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-outfit flex items-center gap-2 text-emerald-600">
            Land, Volume & Distance Converter
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Convert between area, volume, and distance measurements</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('area')}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'area'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Area Converter
        </button>
        <button
          onClick={() => setActiveTab('volume')}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'volume'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Volume Converter
        </button>
        <button
          onClick={() => setActiveTab('distance')}
          className={`px-6 py-3 font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'distance'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          Distance Converter
        </button>
      </div>

      {/* Area Converter */}
      {activeTab === 'area' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Land Area</label>
                <input 
                  type="number" 
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">From Unit</label>
                <select 
                  value={areaUnit} 
                  onChange={(e) => setAreaUnit(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
                >
                  {Object.entries(areaUnits).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={convertArea}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <Calculator size={18} /> Convert
              </button>
              <button 
                onClick={resetArea}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">1️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enter value</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Input your measurement</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">2️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pick unit</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Select source unit</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">3️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Get results</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">All conversions shown</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${areaResult ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Results</h3>
              {areaResult ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entered</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {areaResult.inputValue} {areaUnits[areaResult.inputUnit].label}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(areaResult.conversions).map(([unit, value]) => (
                      <div key={unit} className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{areaUnits[unit].label}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <Zap size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Enter value and unit <br /> to see all conversions</p>
                </div>
              )}
            </div>
            
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Info size={14} /> Common Conversions
              </h4>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-500 leading-relaxed font-medium space-y-1">
                <p>• 1 hectare = 2.471 acres</p>
                <p>• 1 acre = 0.4047 hectares</p>
                <p>• 1 hectare = 39.5 perches</p>
                <p>• 10 guntha = 1 hectare</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volume Converter */}
      {activeTab === 'volume' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Volume</label>
                <input 
                  type="number" 
                  value={volumeInput}
                  onChange={(e) => setVolumeInput(e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">From Unit</label>
                <select 
                  value={volumeUnit} 
                  onChange={(e) => setVolumeUnit(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
                >
                  {Object.entries(volumeUnits).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={convertVolume}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <Calculator size={18} /> Convert
              </button>
              <button 
                onClick={resetVolume}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">1️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enter value</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Input your measurement</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">2️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pick unit</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Select source unit</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">3️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Get results</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">All conversions shown</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${volumeResult ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Results</h3>
              {volumeResult ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entered</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {volumeResult.inputValue} {volumeUnits[volumeResult.inputUnit].label}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(volumeResult.conversions).map(([unit, value]) => (
                      <div key={unit} className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{volumeUnits[unit].label}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <Zap size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Enter value and unit <br /> to see all conversions</p>
                </div>
              )}
            </div>
            
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Info size={14} /> Common Conversions
              </h4>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-500 leading-relaxed font-medium space-y-1">
                <p>• 1 liter = 0.264 US gallon</p>
                <p>• 1 m³ = 1000 liters</p>
                <p>• 1 US gallon = 3.785 liters</p>
                <p>• 1 pint = 0.473 liters</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distance Converter */}
      {activeTab === 'distance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Distance</label>
                <input 
                  type="number" 
                  value={distanceInput}
                  onChange={(e) => setDistanceInput(e.target.value)}
                  placeholder="Enter value"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">From Unit</label>
                <select 
                  value={distanceUnit} 
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 dark:text-white"
                >
                  {Object.entries(distanceUnits).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={convertDistance}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
              >
                <Calculator size={18} /> Convert
              </button>
              <button 
                onClick={resetDistance}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Instructions */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">1️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Enter value</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Input your measurement</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">2️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pick unit</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">Select source unit</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="text-2xl mb-1">3️⃣</div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Get results</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-400">All conversions shown</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`glass-panel p-6 rounded-3xl border transition-all duration-500 ${distanceResult ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 opacity-50'}`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Results</h3>
              {distanceResult ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Entered</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {distanceResult.inputValue} {distanceUnits[distanceResult.inputUnit].label}
                    </p>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(distanceResult.conversions).map(([unit, value]) => (
                      <div key={unit} className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{distanceUnits[unit].label}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center space-y-2">
                  <Zap size={32} className="text-slate-300" />
                  <p className="text-sm text-slate-400">Enter value and unit <br /> to see all conversions</p>
                </div>
              )}
            </div>
            
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30">
              <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Info size={14} /> Common Conversions
              </h4>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-500 leading-relaxed font-medium space-y-1">
                <p>• 1 km = 0.621 miles</p>
                <p>• 1 mile = 1.609 km</p>
                <p>• 1 meter = 3.281 feet</p>
                <p>• 1 yard = 0.914 meters</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
