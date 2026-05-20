import React, { useState, useCallback, useEffect } from "react";
import { 
  Settings, 
  Users, 
  ClipboardList, 
  Leaf, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Banknote,
  Weight,
  Save,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Activity,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  RefreshCcw,
  Droplets,
  SplitSquareVertical
} from "lucide-react";
import { apiClient } from '../../api/client';

// ─────────────────────────────────────────────
//  Payrall - Plucking Wage Calculation Module
//  Modernized to match ERP High-Fidelity Standards
// ─────────────────────────────────────────────

export default function Payrall() {
  // Supported Task Types
  const tasks = [
    { id: 'Plucking', icon: Leaf, color: 'tea' },
    { id: 'Pruning', icon: Activity, color: 'emerald' },
    { id: 'Weeding', icon: TrendingUp, color: 'sky' },
    { id: 'Manure', icon: Banknote, color: 'amber' },
    { id: 'Lopping', icon: Weight, color: 'violet' },
    { id: 'Foliar', icon: Droplets, color: 'sky' },
    { id: 'Other Works', icon: ClipboardList, color: 'indigo' }
  ];

  // Configuration State (per task)
  const [taskConfigs, setTaskConfigs] = useState({
    Plucking: { baseWage: 1400, target: 18, rate: 65 },
    Pruning: { baseWage: 1400, target: 120, rate: 5 },
    Weeding: { baseWage: 1400, target: 0.5, rate: 500 },
    Manure: { baseWage: 1400, target: 50, rate: 10 },
    Lopping: { baseWage: 1400, target: 0.5, rate: 500 },
    Foliar: { baseWage: 1400, target: 0.5, rate: 500 },
    'Other Works': { baseWage: 1400, target: 1, rate: 0 }
  });
  
  // Active state
  const [taskType, setTaskType] = useState('Plucking');
  
  // Data State (per task results)
  const [taskData, setTaskData] = useState({
    Plucking: { workers: [], results: null },
    Pruning: { workers: [], results: null },
    Weeding: { workers: [], results: null },
    Manure: { workers: [], results: null },
    Lopping: { workers: [], results: null },
    Foliar: { workers: [], results: null },
    'Other Works': { workers: [], results: null }
  });

  const [isCalculating, setIsCalculating] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showWageParams, setShowWageParams] = useState(false);
  const [loading, setLoading] = useState(true);

  // Half Payment Option — set of worker internal IDs flagged for half base wage
  const [payOverrides, setPayOverrides] = useState({}); // { worker_id: multiplier }
  const [payOverrideModal, setPayOverrideModal] = useState(null); // { worker }
  const [payOverrideSaving, setPayOverrideSaving] = useState(false);
  const [payOverrideMsg, setPayOverrideMsg] = useState(null);

  // Called when the Pay Rate button is clicked
  const requestPayOverride = (worker) => {
    setPayOverrideModal({ worker });
  };

  // Called when user selects a multiplier in the modal
  const setMultiplier = async (workerId, multiplier) => {
    setPayOverrideSaving(true);
    setPayOverrideMsg(null);
    setPayOverrideModal(null);

    try {
      const dataToUse = currentData.workers;
      if (dataToUse.length === 0) { setPayOverrideSaving(false); return; }

      // Build fresh overrides with this change
      const updatedOverrides = { ...payOverrides };
      if (multiplier === 1.0) delete updatedOverrides[workerId];
      else updatedOverrides[workerId] = multiplier;

      // Recompute wages for all workers using the updated overrides
      const computed = dataToUse.map(w => {
        let value = 0;
        if (taskType === 'Plucking') value = w.kg || 0;
        else if (taskType === 'Pruning') value = w.bushes || 0;
        else if (taskType === 'Weeding') value = w.area || 0;
        else if (taskType === 'Manure') value = w.qty || 0;
        else if (taskType === 'Lopping') value = w.area || 0;
        else if (taskType === 'Foliar') value = w.area || 0;
        else if (taskType === 'Other Works') value = w.units || 0;

        const { target, rate, baseWage } = currentConfig;
        const currentMult = updatedOverrides[w.id] || 1.0;
        const isOverride = currentMult !== 1.0;
        
        const over = Math.max(0, value - target);
        const bonus = over * rate;
        const eligible = value >= target;

        let wage;
        if (isOverride) {
          wage = Math.round(baseWage * currentMult);
        } else {
          wage = eligible ? baseWage + bonus : Math.round((value / target) * baseWage);
        }

        return { 
          ...w, 
          over, 
          bonus: isOverride ? 0 : bonus, 
          wage, 
          eligible: isOverride ? currentMult >= 1.0 : eligible, 
          performanceValue: value, 
          payMultiplier: currentMult 
        };
      });

      const totalValue = computed.reduce((s, r) => s + r.performanceValue, 0);
      const totalWage  = computed.reduce((s, r) => s + r.wage, 0);
      const qualified  = computed.filter(r => r.eligible).length;

      // Build the full save payload
      const entries = computed.map(r => {
        const entry = {
          worker_id:   r.id,
          worker_epf:  r.worker_id,
          worker_name: r.name,
          task:        r.task || taskType,
          bonus:       r.bonus,
          wage:        r.wage,
          eligible:    r.eligible,
          pay_multiplier: r.payMultiplier
        };
        if (taskType === 'Plucking')      { entry.kg    = r.performanceValue; entry.over_kg    = r.over; }
        else if (taskType === 'Pruning')  { entry.bushes = r.performanceValue; entry.over_bushes = r.over; }
        else if (taskType === 'Weeding') { entry.acres  = r.performanceValue; entry.over_acres  = r.over; }
        else if (taskType === 'Lopping') { entry.acres  = r.performanceValue; entry.over_acres  = r.over; }
        else if (taskType === 'Foliar')  { entry.acres  = r.performanceValue; entry.over_acres  = r.over; }
        else                              { entry.qty    = r.performanceValue; entry.over_qty    = r.over; }
        return entry;
      });

      const payload = {
        batch_date:        selectedDate,
        task_type:         taskType,
        base_wage:         currentConfig.baseWage,
        bonus_rate:        currentConfig.rate,
        total_wage:        totalWage,
        qualified_workers: qualified,
        entries
      };
      if (taskType === 'Plucking')      { payload.target_kg     = currentConfig.target; payload.total_kg    = totalValue; }
      else if (taskType === 'Pruning')  { payload.target_bushes = currentConfig.target; payload.total_bushes = totalValue; }
      else if (taskType === 'Weeding') { payload.target_acres  = currentConfig.target; payload.total_area   = totalValue; }
      else if (taskType === 'Lopping') { payload.target_acres  = currentConfig.target; payload.total_area   = totalValue; }
      else if (taskType === 'Foliar')  { payload.target_acres  = currentConfig.target; payload.total_area   = totalValue; }
      else                              { payload.target_qty    = currentConfig.target; payload.total_qty    = totalValue; }

      const res = await apiClient.post('/payrall/batch', payload);
      if (res && res.success === false) throw new Error(res.error || 'Save rejected');

      setPayOverrides(updatedOverrides);
      setTaskData(prev => ({
        ...prev,
        [taskType]: {
          ...prev[taskType],
          results: { rows: computed, totalValue, totalWage, qualified }
        }
      }));

      setPayOverrideMsg({
        type: 'success',
        text: `Pay rate updated for ${computed.find(w => w.id === workerId).name} — Multiplier: ${multiplier}x`
      });
    } catch (err) {
      console.error('Pay override save failed:', err);
      setPayOverrideMsg({ type: 'error', text: 'Save failed — please try again.' });
    } finally {
      setPayOverrideSaving(false);
    }
  };

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString('sv-SE');
  });
  const [isHistorical, setIsHistorical] = useState(false);

  // Current config for active task
  const currentConfig = taskConfigs[taskType];
  const currentData = taskData[taskType];

  // Load data when date or task changes
  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, taskType]);

  // Recalculate when parameters or task change
  useEffect(() => {
    if (currentData.workers.length > 0) {
      calculateWages();
    }
  }, [taskConfigs, taskType]);

  // Instantly recalculate when pay-override flags change
  useEffect(() => {
    if (currentData.workers.length > 0) {
      calculateWages();
    }
  }, [payOverrides]);

  const [isResyncing, setIsResyncing] = useState(false);
  const [resyncMsg, setResyncMsg] = useState(null);

  const resyncKGFromIntel = async () => {
    setIsResyncing(true);
    setResyncMsg(null);
    try {
      const res = await apiClient.post('/payrall/resync-kg', {
        batch_date: selectedDate,
        task_type: taskType
      });
      if (res.success) {
        const unit = taskType === 'Plucking' ? 'kg' : 
                     taskType === 'Pruning' ? 'bushes' : 
                     taskType === 'Weeding' ? 'acres' : 
                     taskType === 'Lopping' ? 'acres' :
                     taskType === 'Foliar' ? 'acres' :
                     'units';
        setResyncMsg({ 
          type: 'success', 
          text: `Re-synced ${res.updated} entries ${res.added > 0 ? `(+${res.added} new workers)` : ''} · Total ${res.total_kg?.toFixed(2)} ${unit}` 
        });
        // Reload to show updated data
        await loadData(selectedDate);
      } else {
        setResyncMsg({ type: 'error', text: res.error || 'Resync failed' });
      }
    } catch (err) {
      setResyncMsg({ type: 'error', text: 'Resync request failed' });
    } finally {
      setIsResyncing(false);
    }
  };

  const saveBatch = async (calculatedRows, totalValue, totalWage, qualified, forceSave = false) => {
    if ((isHistorical && !forceSave) || calculatedRows.length === 0) return;
    try {
      const payload = {
        batch_date: selectedDate,
        task_type: taskType,
        base_wage: currentConfig.baseWage,
        bonus_rate: currentConfig.rate,
        total_wage: totalWage,
        qualified_workers: qualified,
        entries: calculatedRows.map(r => {
          const baseEntry = {
            worker_id: r.id,
            worker_epf: r.worker_id,
            worker_name: r.name,
            task: r.task || taskType,
            bonus: r.bonus,
            wage: r.wage,
            eligible: r.eligible,
            pay_multiplier: r.payMultiplier || 1.0
          };
          if (taskType === 'Plucking') {
            baseEntry.kg = r.performanceValue;
            baseEntry.over_kg = r.over;
          } else if (taskType === 'Pruning') {
            baseEntry.bushes = r.performanceValue;
            baseEntry.over_bushes = r.over;
          } else if (taskType === 'Weeding') {
            baseEntry.acres = r.performanceValue;
            baseEntry.over_acres = r.over;
          } else if (taskType === 'Lopping') {
            baseEntry.acres = r.performanceValue;
            baseEntry.over_acres = r.over;
          } else if (taskType === 'Foliar') {
            baseEntry.acres = r.performanceValue;
            baseEntry.over_acres = r.over;
          } else {
            baseEntry.qty = r.performanceValue;
            baseEntry.over_qty = r.over;
          }
          return baseEntry;
        })
      };

      if (taskType === 'Plucking') {
        payload.target_kg = currentConfig.target;
        payload.total_kg = totalValue;
      } else if (taskType === 'Pruning') {
        payload.target_bushes = currentConfig.target;
        payload.total_bushes = totalValue;
      } else if (taskType === 'Weeding') {
        payload.target_acres = currentConfig.target;
        payload.total_area = totalValue;
      } else if (taskType === 'Lopping') {
        payload.target_acres = currentConfig.target;
        payload.total_area = totalValue;
      } else if (taskType === 'Foliar') {
        payload.target_acres = currentConfig.target;
        payload.total_area = totalValue;
      } else {
        payload.target_qty = currentConfig.target;
        payload.total_qty = totalValue;
      }

      await apiClient.post('/payrall/batch', payload);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const calculateWages = useCallback((workerData, forceSave = false) => {
    const dataToUse = workerData || currentData.workers;
    if (dataToUse.length === 0) return;
    setIsCalculating(true);
    
    // Simulate minor delay for calculation feel
    setTimeout(() => {
      const computed = dataToUse.map(w => {
        let value = 0;
        if (taskType === 'Plucking') value = w.kg || 0;
        else if (taskType === 'Pruning') value = w.bushes || 0;
        else if (taskType === 'Weeding') value = w.area || 0;
        else if (taskType === 'Manure') value = w.qty || 0;
        else if (taskType === 'Lopping') value = w.area || 0;
        else if (taskType === 'Foliar') value = w.area || 0;
        else if (taskType === 'Other Works') value = w.units || 0;

        const target = currentConfig.target;
        const rate = currentConfig.rate;
        const baseWage = currentConfig.baseWage;
        const multiplier = payOverrides[w.id] || 1.0;
        const isOverride = multiplier !== 1.0;
        
        const over = Math.max(0, value - target);
        const bonus = over * rate;
        const eligible = value >= target;
        
        let wage;
        if (isOverride) {
          wage = Math.round(baseWage * multiplier);
        } else if (eligible) {
          wage = baseWage + bonus;
        } else {
          // Workers below target get proportional pay (no bonus)
          wage = Math.round((value / target) * baseWage);
        }
          
        return { ...w, over, bonus: isOverride ? 0 : bonus, wage, eligible: isOverride ? multiplier >= 1.0 : eligible, performanceValue: value, payMultiplier: multiplier };
      });

      const totalValue = computed.reduce((s, r) => s + r.performanceValue, 0);
      const totalWage = computed.reduce((s, r) => s + r.wage, 0);
      const qualified = computed.filter(r => r.eligible).length;

      setTaskData(prev => ({
        ...prev,
        [taskType]: { ...prev[taskType], results: { rows: computed, totalValue, totalWage, qualified } }
      }));
      setIsCalculating(false);
      
      // Auto-save if it's the current day calculation
      if (!isHistorical || forceSave) {
        saveBatch(computed, totalValue, totalWage, qualified, forceSave);
      }
    }, 400);
  }, [currentData.workers, currentConfig, taskType, selectedDate, isHistorical, payOverrides]);

  const updateValue = (id, val) => {
    const num = parseFloat(val) || 0;
    setTaskData(prev => {
      const newWorkers = prev[taskType].workers.map(w => {
        if (w.id === id) {
          if (taskType === 'Plucking') return { ...w, kg: num };
          if (taskType === 'Pruning') return { ...w, bushes: num };
          if (taskType === 'Weeding') return { ...w, area: num };
          if (taskType === 'Manure') return { ...w, qty: num };
          if (taskType === 'Lopping') return { ...w, area: num };
          if (taskType === 'Foliar') return { ...w, area: num };
          if (taskType === 'Other Works') return { ...w, units: num };
        }
        return w;
      });
      return {
        ...prev,
        [taskType]: { ...prev[taskType], workers: newWorkers }
      };
    });
  };

  const loadData = async (dateStr) => {
    try {
      setLoading(true);
      const today = new Date().toLocaleDateString('sv-SE');
      const isToday = dateStr === today;

      // Check for saved batch first
      const batchRes = await apiClient.get(`/payrall/batch?date=${dateStr}&task=${taskType}`);
      
      if (batchRes.success && batchRes.data && !isToday) {
        setIsHistorical(true);

        // Auto-resync KG from live intel before rendering
        try {
          await apiClient.post('/payrall/resync-kg', {
            batch_date: dateStr,
            task_type: taskType
          });
        } catch (_) {
          // Non-fatal: if resync fails, we still load the saved batch
        }

        // Re-fetch batch with updated values after resync
        const refreshedRes = await apiClient.get(`/payrall/batch?date=${dateStr}&task=${taskType}`);
        const batch = (refreshedRes.success && refreshedRes.data) ? refreshedRes.data : batchRes.data;

        const historicalOverrides = {};
        batch.entries.forEach(e => {
          if (e.pay_multiplier && parseFloat(e.pay_multiplier) !== 1.0) {
            historicalOverrides[e.worker_id] = parseFloat(e.pay_multiplier);
          }
        });
        setPayOverrides(historicalOverrides);

        const historicalWorkers = batch.entries.map(e => {
          const photoUrl = e.photo 
            ? (e.photo.startsWith('data:') ? e.photo : `/api/uploads/${e.photo}`)
            : null;

          return {
            id: e.worker_id,
            worker_id: e.master_worker_id || e.worker_id,
            name: e.first_name ? `${e.first_name} ${e.last_name}` : e.worker_name,
            photo: photoUrl,
            kg: parseFloat(e.kg),
            morning_kg: parseFloat(e.morning_kg) || 0,
            midday_kg: parseFloat(e.midday_kg) || 0,
            afternoon_kg: parseFloat(e.afternoon_kg) || 0,
            evening_kg: parseFloat(e.evening_kg) || 0,
            bushes: parseFloat(e.kg),
            area: parseFloat(e.kg),
            qty: parseFloat(e.kg),
            trees: parseFloat(e.kg),
            liters: parseFloat(e.kg),
            units: parseFloat(e.kg)
          };
        });
        
        const historicalResults = {
          rows: batch.entries.map(e => {
            const photoUrl = e.photo 
              ? (e.photo.startsWith('data:') ? e.photo : `/api/uploads/${e.photo}`)
              : null;

            const multiplier = parseFloat(e.pay_multiplier) || 1.0;

            return {
              id: e.worker_id,
              worker_id: e.master_worker_id || e.worker_id,
              name: e.first_name ? `${e.first_name} ${e.last_name}` : e.worker_name,
              photo: photoUrl,
              performanceValue: parseFloat(e.kg),
              morning_kg: parseFloat(e.morning_kg) || 0,
              midday_kg: parseFloat(e.midday_kg) || 0,
              afternoon_kg: parseFloat(e.afternoon_kg) || 0,
              evening_kg: parseFloat(e.evening_kg) || 0,
              over: parseFloat(e.over_kg),
              bonus: parseFloat(e.bonus),
              wage: parseFloat(e.wage),
              eligible: Boolean(e.eligible),
              payMultiplier: multiplier
            };
          }),
          totalValue: parseFloat(batch.total_kg),
          totalWage: parseFloat(batch.total_wage),
          qualified: batch.qualified_workers
        };

        setTaskData(prev => ({
          ...prev,
          [taskType]: { workers: historicalWorkers, results: historicalResults }
        }));
        
      } else if (isToday) {
        // No batch, but it's today, so calculate normally
        setIsHistorical(false);
        const y = parseInt(dateStr.split('-')[0]);
        const m = parseInt(dateStr.split('-')[1]);
        const d = parseInt(dateStr.split('-')[2]);

        let perfEndpoint = '';
        if (taskType === 'Plucking') perfEndpoint = `/crop/plucker-performance?year=${y}&month=${m}&day=${d}`;
        else if (taskType === 'Pruning') perfEndpoint = `/crop/pruning-performance?year=${y}&month=${m}&day=${d}`;
        else if (taskType === 'Weeding') perfEndpoint = `/crop/weeding-performance?year=${y}&month=${m}&day=${d}`;
        else if (taskType === 'Manure') perfEndpoint = `/crop/manure-performance?year=${y}&month=${m}&day=${d}`;
        else if (taskType === 'Lopping') perfEndpoint = `/crop/lopping-performance?year=${y}&month=${m}&day=${d}`;
        else if (taskType === 'Foliar') perfEndpoint = `/crop/foliar-performance?year=${y}&month=${m}&day=${d}`;
        else if (taskType === 'Other Works') perfEndpoint = `/crop/other-works-performance?year=${y}&month=${m}&day=${d}`;

        const [resMuster, resPerf] = await Promise.all([
          apiClient.get(`/workforce/attendance-today?date=${dateStr}`),
          apiClient.get(perfEndpoint)
        ]);

        if (resMuster.success) {
          const perfMap = {};
          if (resPerf.success && resPerf.data) {
            resPerf.data.forEach(p => {
              if (taskType === 'Plucking') {
                perfMap[p.id] = {
                  total: parseFloat(p.total_kg) || 0,
                  morning: parseFloat(p.morning_kg) || 0,
                  midday: parseFloat(p.midday_kg) || 0,
                  afternoon: parseFloat(p.afternoon_kg) || 0,
                  evening: parseFloat(p.evening_kg) || 0
                };
              } else if (taskType === 'Pruning') perfMap[p.id] = parseFloat(p.total_bushes) || 0;
              else if (taskType === 'Weeding') perfMap[p.id] = parseFloat(p.total_area) || 0;
              else if (taskType === 'Manure') perfMap[p.id] = parseFloat(p.total_qty) || 0;
              else if (taskType === 'Lopping') {
                perfMap[p.id] = {
                  value: parseFloat(p.total_area) || 0,
                  payMultiplier: parseFloat(p.pay_multiplier) || 1.0
                };
              }
              else if (taskType === 'Foliar') perfMap[p.id] = parseFloat(p.total_area) || 0;
              else if (taskType === 'Other Works') perfMap[p.id] = parseFloat(p.total_units) || 0;
            });
          }

          // 1. Map muster workers for the task
          const musterTaskWorkers = resMuster.data.filter(w => w.task === taskType);
          
          // 2. Identify workers from performance data who might not be in muster (released)
          const perfTaskWorkers = resPerf.data || [];
          
          // 3. Merge them using a Map to avoid duplicates
          const unifiedWorkersMap = new Map();
          
          // First, add everyone from muster
          musterTaskWorkers.forEach(w => {
            const photoUrl = w.photo 
              ? (w.photo.startsWith('data:') ? w.photo : `/api/uploads/${w.photo}`)
              : null;
              
            unifiedWorkersMap.set(w.worker_internal_id, {
              id: w.worker_internal_id,
              name: `${w.first_name} ${w.last_name}`,
              photo: photoUrl,
              kg: taskType === 'Plucking' ? (perfMap[w.worker_internal_id]?.total || 0) : 0,
              morning_kg: taskType === 'Plucking' ? (perfMap[w.worker_internal_id]?.morning || 0) : 0,
              midday_kg: taskType === 'Plucking' ? (perfMap[w.worker_internal_id]?.midday || 0) : 0,
              afternoon_kg: taskType === 'Plucking' ? (perfMap[w.worker_internal_id]?.afternoon || 0) : 0,
              evening_kg: taskType === 'Plucking' ? (perfMap[w.worker_internal_id]?.evening || 0) : 0,
              bushes: taskType === 'Pruning' ? (perfMap[w.worker_internal_id] || 0) : 0,
              area: (taskType === 'Weeding' || taskType === 'Lopping' || taskType === 'Foliar') ? (
                taskType === 'Lopping' ? (perfMap[w.worker_internal_id]?.value || 0) : (perfMap[w.worker_internal_id] || 0)
              ) : 0,
              qty: taskType === 'Manure' ? (perfMap[w.worker_internal_id] || 0) : 0,
              units: taskType === 'Other Works' ? (perfMap[w.worker_internal_id] || 0) : 0,
              worker_id: w.worker_id,
              task: w.task
            });
          });

          // Second, add everyone from performance data who is NOT in the muster list
          perfTaskWorkers.forEach(p => {
            if (!unifiedWorkersMap.has(p.id)) {
              const photoUrl = p.photo 
                ? (p.photo.startsWith('data:') ? p.photo : `/api/uploads/${p.photo}`)
                : null;
                
              unifiedWorkersMap.set(p.id, {
                id: p.id,
                name: `${p.first_name} ${p.last_name}`,
                photo: photoUrl,
                kg: taskType === 'Plucking' ? (parseFloat(p.total_kg) || 0) : 0,
                morning_kg: taskType === 'Plucking' ? (parseFloat(p.morning_kg) || 0) : 0,
                midday_kg: taskType === 'Plucking' ? (parseFloat(p.midday_kg) || 0) : 0,
                afternoon_kg: taskType === 'Plucking' ? (parseFloat(p.afternoon_kg) || 0) : 0,
                evening_kg: taskType === 'Plucking' ? (parseFloat(p.evening_kg) || 0) : 0,
                bushes: taskType === 'Pruning' ? (parseFloat(p.total_bushes) || 0) : 0,
                area: (taskType === 'Weeding' || taskType === 'Lopping' || taskType === 'Foliar') ? (
                  taskType === 'Lopping' ? (parseFloat(p.total_area) || 0) : (parseFloat(p.total_area) || 0)
                ) : 0,
                qty: taskType === 'Manure' ? (parseFloat(p.total_qty) || 0) : 0,
                units: taskType === 'Other Works' ? (parseFloat(p.total_units) || 0) : 0,
                worker_id: p.worker_code,
                task: taskType // Assume they were on this task since they have logs for it
              });
            }
          });

          const presentWorkers = Array.from(unifiedWorkersMap.values());
          
          // Sync multipliers from intel if available
          const freshOverrides = {};
          presentWorkers.forEach(w => {
            const pData = perfMap[w.id];
            if (pData && typeof pData === 'object' && pData.payMultiplier && pData.payMultiplier !== 1.0) {
              freshOverrides[w.id] = pData.payMultiplier;
            }
          });
          if (Object.keys(freshOverrides).length > 0) {
            setPayOverrides(prev => ({ ...prev, ...freshOverrides }));
          }
            
          setTaskData(prev => ({
            ...prev,
            [taskType]: { ...prev[taskType], workers: presentWorkers }
          }));

          if (presentWorkers.length > 0) {
            calculateWages(presentWorkers, true);
          } else {
            setTaskData(prev => ({
              ...prev,
              [taskType]: { ...prev[taskType], results: null }
            }));
          }
        }
      } else {
        // Past date with no batch
        setIsHistorical(true);
        setTaskData(prev => ({
          ...prev,
          [taskType]: { workers: [], results: null }
        }));
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Payroll Intelligence</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <Banknote size={14} className="text-tea-500" /> Daily {taskType.toLowerCase()} wage calculation with performance incentives
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm shadow-sm">
            {tasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setTaskType(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  taskType === t.id 
                    ? `bg-${t.color}-500 text-white shadow-lg shadow-${t.color}-500/30 scale-105 z-10` 
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <t.icon size={14} />
                <span className="hidden sm:inline">{t.id}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().split('T')[0]);
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex flex-col items-center px-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {isHistorical && <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Historical</span>}
            </div>
            <button
              onClick={() => {
                const d = new Date(selectedDate);
                const today = new Date().toLocaleDateString('sv-SE');
                if (selectedDate < today) {
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }
              }}
              disabled={selectedDate >= new Date().toLocaleDateString('sv-SE')}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(selectedDate)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm group"
            >
              <RefreshCcw size={16} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} /> Refresh Data
            </button>

            <div className="relative">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center gap-2 px-5 py-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-outfit shadow-sm bg-white dark:bg-slate-900"
              >
                <Download size={16} /> Export
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] p-2 animate-in slide-in-from-top-2">
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                    <FileSpreadsheet size={16} /> CSV Report
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                    <FileText size={16} /> PDF Payslips
                  </button>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setShowWageParams(!showWageParams)}
            className={`flex items-center justify-center p-3 border ${showWageParams ? 'bg-tea-50 border-tea-200 text-tea-600 dark:bg-tea-900/20 dark:border-tea-800' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'} rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm`}
            title={isHistorical ? "View settings used for this batch" : "Wage Settings"}
          >
            <Settings size={18} className={showWageParams ? 'animate-spin-slow' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-tea-100 dark:bg-tea-900/30">
            <Users size={22} className="text-tea-600 dark:text-tea-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Workers</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{currentData.workers.length}</h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
            <Weight size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Total {taskType === 'Plucking' ? 'Harvest' : taskType === 'Pruning' ? 'Output' : taskType === 'Weeding' ? 'Area' : taskType === 'Lopping' ? 'Area' : taskType === 'Foliar' ? 'Area' : 'Output'}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {currentData.results ? currentData.results.totalValue.toFixed(2) : currentData.workers.reduce((a,c)=>a+(taskType === 'Plucking' ? c.kg : taskType === 'Pruning' ? c.bushes : taskType === 'Weeding' ? c.area : taskType === 'Lopping' ? c.trees : taskType === 'Foliar' ? c.liters : taskType === 'Other Works' ? c.units : c.qty), 0).toFixed(2)}
              <span className="text-[10px] text-slate-400 font-bold ml-1">
                {taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bushes' : taskType === 'Weeding' ? 'acres' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'}
              </span>
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-900/30">
            <CheckCircle2 size={22} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Target Met</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {currentData.results ? currentData.results.qualified : 0}
              <span className="text-[10px] text-slate-400 font-bold ml-1">/{currentData.workers.length}</span>
            </h3>
          </div>
        </div>
        <div className="premium-card flex items-center gap-4 shadow-sm border-tea-500/20">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <Banknote size={22} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider leading-none mb-1">Total Wage</p>
            <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
              {currentData.results ? `Rs ${currentData.results.totalWage.toLocaleString()}` : 'Rs 0'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Wage Parameters Modal */}
        {showWageParams && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
              onClick={() => setShowWageParams(false)}
            />
            <div className="premium-card w-full max-w-sm relative z-10 animate-in zoom-in-95 slide-in-from-bottom-10 duration-400 shadow-2xl border border-white/10">
              <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tea-50 dark:bg-tea-900/30 rounded-2xl">
                    <Settings size={18} className="text-tea-500 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 leading-none">Wage Parameters</h2>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure {taskType} Rates</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowWageParams(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Base Daily Wage</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={currentConfig.baseWage} 
                      readOnly={isHistorical}
                      onChange={e => setTaskConfigs(prev => ({ ...prev, [taskType]: { ...prev[taskType], baseWage: parseFloat(e.target.value) || 0 } }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-tea-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">LKR</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Target {taskType === 'Plucking' ? 'Weight' : taskType === 'Pruning' ? 'Bushes' : taskType === 'Weeding' ? 'Area' : 'Quantity'}</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={currentConfig.target} 
                      readOnly={isHistorical}
                      onChange={e => setTaskConfigs(prev => ({ ...prev, [taskType]: { ...prev[taskType], target: Math.max(0.1, parseFloat(e.target.value) || 0) } }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-tea-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {taskType === 'Plucking' ? 'KG' : taskType === 'Pruning' ? 'BUSHES' : taskType === 'Weeding' ? 'ACRES' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Surplus Bonus Rate</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      value={currentConfig.rate} 
                      readOnly={isHistorical}
                      onChange={e => setTaskConfigs(prev => ({ ...prev, [taskType]: { ...prev[taskType], rate: parseFloat(e.target.value) || 0 } }))}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-base font-black focus:border-tea-500 outline-none transition-all shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700 font-outfit italic"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Per Unit</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-2 flex gap-3">
                   <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                   <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-wider">
                     Efficiency Incentive: Surplus earns <strong>Rs {currentConfig.rate}/{taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bush' : taskType === 'Weeding' ? 'acre' : taskType === 'Lopping' ? 'acre' : taskType === 'Foliar' ? 'acre' : 'unit'}</strong> above <strong>{currentConfig.target} {taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bushes' : taskType === 'Weeding' ? 'acres' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'}</strong>.
                   </p>
                </div>
              </div>

              <button 
                onClick={() => setShowWageParams(false)}
                className="w-full mt-6 py-3 bg-tea-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-tea-700 transition-all shadow-xl shadow-tea-600/20 active:scale-95"
              >
                {isHistorical ? 'Close Parameters' : 'Sync & Calculate'}
              </button>
            </div>
          </div>
        )}

        {/* Workers List / Results Table */}
        <div className="col-span-full">
          <div className="premium-card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <ClipboardList size={18} className="text-tea-500" />
                   <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                      {currentData.results ? `${taskType} Results` : `${taskType} Harvest Log`}
                   </h2>
                 </div>
                 <button 
                   onClick={() => loadData(selectedDate)}
                   className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                   title="Sync with Attendance"
                 >
                   <Activity size={14} />
                 </button>
               </div>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                 {new Date(selectedDate).toLocaleDateString("en-LK", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
               </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[9px] tracking-[0.2em]">
                    <th className="px-6 py-3 text-left font-bold">Worker</th>
                    <th className="px-6 py-3 text-left font-bold">EPF / ID</th>
                    <th className="px-6 py-3 text-left font-bold">{taskType === 'Plucking' ? 'Harvest (KG)' : taskType === 'Pruning' ? 'Output (Bushes)' : taskType === 'Weeding' ? 'Area (Acres)' : taskType === 'Lopping' ? 'Area (Acres)' : taskType === 'Foliar' ? 'Area (Acres)' : 'Output (Units)'}</th>
                    {taskType === 'Plucking' && (
                      <>
                        <th className="px-3 py-3 text-center font-bold text-[8px]">Morning</th>
                        <th className="px-3 py-3 text-center font-bold text-[8px]">Midday</th>
                        <th className="px-3 py-3 text-center font-bold text-[8px]">Afternoon</th>
                        <th className="px-3 py-3 text-center font-bold text-[8px]">Evening</th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left font-bold">Status / Bonus</th>
                    <th className="px-4 py-3 text-center font-bold" title="Pay Rate Overrides">
                      <div className="flex items-center justify-center gap-1">
                        <Banknote size={11} />
                        <span>Rate</span>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right font-bold">Payable Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Activity size={32} className="text-tea-500 animate-spin" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Synchronizing Attendance...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentData.workers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Users size={48} className="mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">No {taskType.toLowerCase()} records for today</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    (currentData.results?.rows || currentData.workers).map((worker, idx) => (
                      <tr key={worker.id || `worker-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                              {worker.photo ? (
                                <img src={worker.photo} alt={worker.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <Users size={18} />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{worker.name}</span>
                                {currentData.results && !worker.eligible && (
                                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Below</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-black font-mono text-tea-600 dark:text-tea-400 bg-tea-500/10 px-2 py-1 rounded-lg">
                             {worker.worker_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {!currentData.results ? (
                            <div className="flex items-center gap-2">
                              <div className="relative w-24">
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={taskType === 'Plucking' ? worker.kg : taskType === 'Pruning' ? worker.bushes : taskType === 'Weeding' ? worker.area : taskType === 'Lopping' ? worker.trees : taskType === 'Foliar' ? worker.liters : taskType === 'Other Works' ? worker.units : worker.qty} 
                                  onChange={(e) => updateValue(worker.id, e.target.value)}
                                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-bold focus:border-tea-500 outline-none"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-slate-400 font-bold uppercase">
                                  {taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bushes' : taskType === 'Weeding' ? 'acres' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'}
                                </span>
                              </div>
                              {(worker.kg > 0 || worker.bushes > 0 || worker.area > 0 || worker.qty > 0 || worker.trees > 0 || worker.liters > 0 || worker.units > 0) && <Leaf size={12} className="text-tea-500" title="Synced from field logs" />}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                               <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{worker.performanceValue.toFixed(2)} {taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bushes' : taskType === 'Weeding' ? 'acres' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'}</span>
                               <div className="h-1.5 w-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                 <div 
                                   className={`h-full ${worker.eligible ? 'bg-tea-500' : 'bg-amber-400'}`} 
                                   style={{ width: `${Math.min(100, (worker.performanceValue/currentConfig.target)*100)}%` }}
                                 />
                               </div>
                            </div>
                          )}
                        </td>
                        {taskType === 'Plucking' && (
                          <>
                            <td className="px-3 py-4 text-center">
                              <span className="text-[10px] font-bold text-slate-500">{worker.morning_kg > 0 ? worker.morning_kg.toFixed(1) : '-'}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="text-[10px] font-bold text-slate-500">{worker.midday_kg > 0 ? worker.midday_kg.toFixed(1) : '-'}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="text-[10px] font-bold text-slate-500">{worker.afternoon_kg > 0 ? worker.afternoon_kg.toFixed(1) : '-'}</span>
                            </td>
                            <td className="px-3 py-4 text-center">
                              <span className="text-[10px] font-bold text-slate-500">{worker.evening_kg > 0 ? worker.evening_kg.toFixed(1) : '-'}</span>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4">
                          {currentData.results ? (
                            <div className="flex flex-col">
                              <span className={`text-[10px] font-bold uppercase tracking-tight ${
                                worker.payMultiplier !== 1.0 ? 'text-violet-600 dark:text-violet-400'
                                : worker.over > 0 ? 'text-amber-600' : 'text-slate-500'
                              }`}>
                                {worker.payMultiplier !== 1.0
                                  ? `${worker.payMultiplier}x Rate Applied`
                                  : worker.over > 0
                                    ? `+${worker.over.toFixed(2)} ${taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bushes' : taskType === 'Weeding' ? 'acres' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'} Surplus`
                                    : (worker.eligible ? 'Target Achieved' : 'Proportional')}
                              </span>
                              {worker.payMultiplier === 1.0 && worker.bonus > 0 && <span className="text-[9px] text-slate-400 font-medium italic">Rs {worker.bonus.toLocaleString()} Bonus</span>}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium">Pending calculation</span>
                          )}
                        </td>
                        {/* Pay Rate Toggle */}
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => requestPayOverride(worker)}
                            disabled={isHistorical || payOverrideSaving}
                            title={payOverrides[worker.id] ? `Multiplier: ${payOverrides[worker.id]}x` : 'Apply Pay Rate Override'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
                              payOverrides[worker.id]
                                ? 'bg-violet-600 text-white border-violet-700 shadow-md shadow-violet-500/30 scale-105'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 hover:border-violet-300'
                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                          >
                            <Banknote size={11} />
                            {payOverrides[worker.id] ? `${payOverrides[worker.id]}x` : 'Std'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            {payOverrides[worker.id] && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-violet-500 flex items-center gap-1">
                                <Banknote size={9} /> {payOverrides[worker.id]}x Rate
                              </span>
                            )}
                            <span className={`font-black font-outfit text-sm ${
                              currentData.results
                                ? payOverrides[worker.id]
                                  ? 'text-violet-600 dark:text-violet-400'
                                  : 'text-tea-600 dark:text-tea-400'
                                : 'text-slate-400 opacity-50'
                            }`}>
                              {currentData.results ? `Rs ${worker.wage.toLocaleString()}` : '--'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {currentData.results && (
              <div className="bg-tea-50 dark:bg-tea-950/30 px-6 py-6 border-t border-tea-100 dark:border-tea-900/30">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-6 flex-wrap">
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-tea-600 dark:text-tea-400 uppercase tracking-widest">Total {taskType === 'Plucking' ? 'Weight' : taskType === 'Pruning' ? 'Output' : taskType === 'Weeding' ? 'Area' : taskType === 'Lopping' ? 'Area' : taskType === 'Foliar' ? 'Area' : 'Output'}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">{currentData.results.totalValue.toFixed(2)} {taskType === 'Plucking' ? 'kg' : taskType === 'Pruning' ? 'bushes' : taskType === 'Weeding' ? 'acres' : taskType === 'Lopping' ? 'acres' : taskType === 'Foliar' ? 'acres' : 'units'}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-tea-600 dark:text-tea-400 uppercase tracking-widest">Qualified</span>
                       <span className="text-lg font-black text-slate-900 dark:text-white leading-tight">{currentData.results.qualified} / {currentData.workers.length}</span>
                    </div>
                    {Object.keys(payOverrides).length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest flex items-center gap-1">
                          <Banknote size={10} /> Overrides
                        </span>
                        <span className="text-lg font-black text-violet-600 dark:text-violet-400 leading-tight">
                          {Object.keys(payOverrides).filter(id => currentData.workers.some(w => w.id === id)).length}
                          <span className="text-[10px] text-violet-400 font-bold ml-1">workers</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black text-tea-700 dark:text-tea-300 uppercase tracking-[0.2em] mb-1">Total Payable Wages</span>
                     <span className="text-3xl font-black text-tea-600 dark:text-tea-400 font-outfit leading-none tracking-tighter">Rs {currentData.results.totalWage.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {currentData.results && isHistorical && (
            <div className="mt-6 flex flex-col gap-3">
              {resyncMsg && (
                <div className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
                  resyncMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                }`}>
                  {resyncMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {resyncMsg.text}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={resyncKGFromIntel}
                  disabled={isResyncing}
                  className="flex items-center gap-2 px-5 py-3 bg-tea-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-tea-700 active:scale-95 transition-all shadow-lg shadow-tea-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={14} className={isResyncing ? 'animate-spin' : ''} />
                  {isResyncing ? 'Re-syncing...' : `Re-sync ${taskType === 'Plucking' ? 'KG' : taskType === 'Pruning' ? 'Bushes' : (taskType === 'Weeding' || taskType === 'Lopping' || taskType === 'Foliar') ? 'Area' : 'Qty'} from ${taskType} Intel`}
                </button>
                <div className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm flex items-center gap-2 cursor-default">
                  <CheckCircle2 size={16} className="text-emerald-500" /> Auto-Saved Batch
                </div>
              </div>
            </div>
          )}
          {currentData.results && !isHistorical && (
            <div className="mt-6 flex justify-end gap-3">
               <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-sm flex items-center gap-2 cursor-default">
                 <CheckCircle2 size={16} /> Data Synced & Saved
               </div>
            </div>
          )}

          {/* Pay-Override Toast */}
          {payOverrideMsg && (
            <div className={`mt-4 flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider border animate-in slide-in-from-bottom-4 duration-300 ${
              payOverrideMsg.type === 'success'
                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
            }`}>
              {payOverrideMsg.type === 'success'
                ? <CheckCircle2 size={15} />
                : <AlertCircle size={15} />}
              <span>{payOverrideMsg.text}</span>
              <button
                onClick={() => setPayOverrideMsg(null)}
                className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors opacity-60 hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pay Rate Override Selection Modal ─────────────────────── */}
      {payOverrideModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setPayOverrideModal(null)}
          />
          <div className="relative z-10 w-full max-w-sm animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
            <div className="premium-card border border-violet-200/40 dark:border-violet-800/40 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Banknote size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-widest text-white leading-none">Pay Rate Override</h2>
                    <p className="text-[9px] font-bold text-violet-200 uppercase tracking-widest mt-1">{payOverrideModal.worker.name}</p>
                  </div>
                </div>
                <button onClick={() => setPayOverrideModal(null)} className="p-1.5 hover:bg-white/20 rounded-xl text-white/70">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Standard', multiplier: 1.0, color: 'slate' },
                    { label: '½ Pay', multiplier: 0.5, color: 'amber' },
                    { label: '1.5x Pay', multiplier: 1.5, color: 'violet' },
                    { label: 'Double Pay', multiplier: 2.0, color: 'rose' }
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setMultiplier(payOverrideModal.worker.id, opt.multiplier)}
                      className={`p-4 rounded-2xl flex flex-col items-center gap-2 border-2 transition-all group ${
                        (payOverrides[payOverrideModal.worker.id] || 1.0) === opt.multiplier
                          ? `bg-${opt.color}-500/10 border-${opt.color}-500 shadow-lg shadow-${opt.color}-500/10`
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        (payOverrides[payOverrideModal.worker.id] || 1.0) === opt.multiplier ? `text-${opt.color}-600` : 'text-slate-400'
                      }`}>{opt.label}</span>
                      <span className={`text-xl font-black font-outfit ${(payOverrides[payOverrideModal.worker.id] || 1.0) === opt.multiplier ? `text-${opt.color}-600` : 'text-slate-900 dark:text-white'}`}>
                        {opt.multiplier}x
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                  <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest text-center">
                    Overrides bypass performance targets and apply a fixed multiplier to the base daily wage.
                  </p>
                </div>

                <button
                  onClick={() => setPayOverrideModal(null)}
                  className="w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
