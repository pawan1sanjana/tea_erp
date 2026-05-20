import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, ClipboardCheck, Award, Search, Archive, GripVertical, Map, Activity, Clock, CheckCircle, LayoutGrid, List, X, Lock, Banknote } from 'lucide-react';
import { apiClient } from '../../api/client';

export default function WorkforceList() {
  const [workers, setWorkers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [activeAttendance, setActiveAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [viewMode, setViewMode] = useState('board'); // 'list' | 'board'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drag and Drop Muster State
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedTask, setSelectedTask] = useState('Plucking');
  const [musterAssignments, setMusterAssignments] = useState({}); // { workerId: { blockId, task, daily_wage } }
  const [batchWage, setBatchWage] = useState(''); // Global/Batch wage for specialized tasks
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [workersResponse, summaryResponse, blocksResponse, attendanceResponse] = await Promise.all([
          apiClient.get('/workforce/workers'),
          apiClient.get('/workforce/summary'),
          apiClient.get('/crop/blocks'),
          apiClient.get('/workforce/attendance-today').catch(() => ({ success: false, data: [] }))
        ]);

        if (workersResponse.success) {
          setWorkers(workersResponse.data);
          
          // Rehydrate existing daily assignments to prevent double-booking
          const existingAssignments = {};
          workersResponse.data.forEach(w => {
            if (w.block_id && w.task) {
              existingAssignments[w.id] = {
                blockId: w.block_id.toString(),
                task: w.task,
                daily_wage: w.daily_wage,
                isSaved: true
              };
            }
          });
          setMusterAssignments(existingAssignments);
        }
        if (summaryResponse.success) setSummary(summaryResponse.data);
        if (blocksResponse.success) {
          setBlocks(blocksResponse.data);
          if (blocksResponse.data.length > 0) {
            setSelectedBlockId(blocksResponse.data[0].id.toString());
          }
        }
        if (attendanceResponse.success) {
          setActiveAttendance(attendanceResponse.data);
        }
      } catch (error) {
        console.error('Fetch workforce data failed', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, workerId) => {
    e.dataTransfer.setData('workerId', workerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropToAssign = (e) => {
    e.preventDefault();
    const workerId = e.dataTransfer.getData('workerId');
    if (!workerId || !selectedBlockId) return;

    setMusterAssignments(prev => ({
      ...prev,
      [workerId]: { 
        blockId: selectedBlockId, 
        task: selectedTask,
        daily_wage: (['Other Works', 'Cinnamon', 'Coconut'].includes(selectedTask)) ? (batchWage || null) : null
      }
    }));
  };

  const handleDropToUnassign = (e) => {
    e.preventDefault();
    const workerId = e.dataTransfer.getData('workerId');
    if (!workerId) return;

    setMusterAssignments(prev => {
      const newAssignments = { ...prev };
      delete newAssignments[workerId];
      return newAssignments;
    });
  };

  const handleSaveMuster = async () => {
    setIsSaving(true);
    try {
      const assignmentsPayload = Object.keys(musterAssignments).map(workerId => ({
        worker_id: workerId,
        block_id: musterAssignments[workerId].blockId,
        task: musterAssignments[workerId].task,
        daily_wage: musterAssignments[workerId].daily_wage
      }));

      const res = await apiClient.post('/workforce/muster/bulk', { assignments: assignmentsPayload });
      
      if (res.success) {
        alert(`Successfully assigned ${assignmentsPayload.length} personnel to the muster!`);
        
        // Lock them in the UI instantly
        setMusterAssignments(prev => {
          const locked = { ...prev };
          Object.keys(locked).forEach(k => {
            locked[k].isSaved = true;
          });
          return locked;
        });
      } else {
        throw new Error(res.error || 'Failed to save assignments');
      }
    } catch (error) {
      console.error('Save Muster Error:', error);
      alert('Error saving muster assignments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Derived State ---
  const filteredWorkers = workers.filter(w => 
    `${w.first_name} ${w.last_name} ${w.worker_id}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableWorkers = filteredWorkers.filter(w => {
    const att = activeAttendance.find(a => String(a.worker_id) === String(w.worker_id));
    const isSignedOn = att && att.check_in_time && !att.check_out_time;
    return !musterAssignments[w.id] && isSignedOn;
  });
  const assignedToCurrentBlock = filteredWorkers.filter(w => 
    musterAssignments[w.id] && musterAssignments[w.id].blockId === selectedBlockId
  );
  
  // List view components
  const renderListView = () => (
    <div className="premium-card overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by EPF or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-tea-500 transition-all text-sm"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] tracking-[0.2em]">
              <th className="px-6 py-4 text-left font-bold">Worker ID</th>
              <th className="px-6 py-4 text-left font-bold">Worker Name</th>
              <th className="px-6 py-4 text-left font-bold">Status</th>
              <th className="px-6 py-4 text-left font-bold">Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredWorkers.map((worker) => (
              <tr key={worker.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-mono font-bold text-tea-600 dark:text-tea-400">{worker.worker_id || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {worker.photo ? (
                      <img 
                        src={worker.photo.startsWith('data:') ? worker.photo : `/api/uploads/${worker.photo}`} 
                        alt={worker.first_name} 
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" 
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-xs uppercase shrink-0 text-slate-500">
                        {(worker.first_name?.[0] || '') + (worker.last_name?.[0] || '')}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-outfit">{worker.first_name} {worker.last_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const att = activeAttendance.find(a => String(a.worker_id) === String(worker.worker_id));
                    const isOffDuty = !!att?.check_out_time;
                    const isOnDuty = !!att?.check_in_time && !isOffDuty;
                    
                    return (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isOnDuty ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 
                        isOffDuty ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {isOnDuty ? 'On Duty' : isOffDuty ? 'Off Duty' : 'Absent'}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  {musterAssignments[worker.id] ? (
                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black tracking-widest uppercase">
                      Block {blocks.find(b => b.id.toString() === musterAssignments[worker.id].blockId)?.name} • {musterAssignments[worker.id].task}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">Unassigned</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBoardView = () => (
    <div className="grid grid-cols-[1.2fr_1fr] md:grid-cols-[1.5fr_1fr] lg:grid-cols-[2fr_1fr] gap-1 md:gap-4 h-auto md:h-[750px] min-h-[600px] animate-fade-in">
      
      {/* Target Mustering Block (Right Side conceptually, but rendered first in flex flow or left depending on preference) */}
      <div className="premium-card flex flex-col overflow-hidden border-2 border-tea-500 flex-1">
        <div className="p-2 md:p-4 bg-tea-500/10 border-b border-tea-500/20">
          <div className="flex items-center justify-between mb-2 md:mb-4">
            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-tea-600 dark:text-tea-400 flex items-center gap-1 md:gap-2">
              <Map size={14} className="shrink-0" /> <span className="truncate">Assignments</span>
            </h3>
            <span className="px-1.5 md:px-2.5 py-0.5 md:py-1 bg-tea-600 text-white text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shrink-0">
              {assignedToCurrentBlock.length} <span className="hidden md:inline">Assigned</span>
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 md:gap-3">
             <div className="flex flex-col gap-1">
               <label className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 tracking-widest">Target Block</label>
               <select 
                 value={selectedBlockId} 
                 onChange={(e) => setSelectedBlockId(e.target.value)}
                 className="p-1.5 md:p-2 border border-tea-500/30 rounded-xl bg-white dark:bg-slate-900 text-[10px] md:text-xs font-bold outline-none text-slate-900 dark:text-white cursor-pointer"
               >
                 {blocks.map(b => (
                   <option key={b.id} value={b.id}>{b.name}</option>
                 ))}
               </select>
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-[8px] md:text-[9px] font-black uppercase text-slate-500 tracking-widest">Active Task</label>
               <select 
                 value={selectedTask} 
                 onChange={(e) => setSelectedTask(e.target.value)}
                 className="p-1.5 md:p-2 border border-tea-500/30 rounded-xl bg-white dark:bg-slate-900 text-[10px] md:text-xs font-bold outline-none text-slate-900 dark:text-white cursor-pointer"
               >
                 <option value="Plucking">Plucking</option>
                 <option value="Pruning">Pruning</option>
                 <option value="Weeding">Weeding</option>
                 <option value="Factory">Factory</option>
                 <option value="Manure">Manure</option>
                 <option value="Foliar Application">Foliar Application</option>
                 <option value="Nursery">Nursery</option>
                 <option value="Lopping">Lopping</option>
                 <option value="Cinnamon">Cinnamon</option>
                 <option value="Coconut">Coconut</option>
                 <option value="Other Works">Other Works</option>
               </select>
             </div>
             {['Other Works', 'Cinnamon', 'Coconut'].includes(selectedTask) && (
               <div className="flex flex-col gap-1 sm:col-span-2 mt-2 animate-in slide-in-from-top-2">
                 <label className="text-[8px] md:text-[9px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-1">
                   <Banknote size={10} /> Manual Daily Wage Override (LKR)
                 </label>
                 <input 
                   type="number"
                   placeholder="Enter daily amount..."
                   value={batchWage}
                   onChange={(e) => setBatchWage(e.target.value)}
                   className="p-1.5 md:p-2 border border-amber-500/30 rounded-xl bg-amber-50/30 dark:bg-amber-900/10 text-[10px] md:text-xs font-bold outline-none text-slate-900 dark:text-white"
                 />
               </div>
             )}
          </div>
        </div>

        <div 
          className="flex-1 p-2 md:p-4 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto dashboard-scroll grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 content-start"
          onDragOver={handleDragOver}
          onDrop={handleDropToAssign}
        >
          {assignedToCurrentBlock.length === 0 ? (
            <div className="col-span-full h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl mx-2 md:mx-4 my-4 md:my-8 p-6 md:p-10 min-h-[150px] md:min-h-[200px]">
               <Map className="mb-2 opacity-30" size={32} />
               <p className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-50">Drag Labours Here</p>
               <p className="text-[9px] md:text-[10px] font-bold mt-1 max-w-[200px] text-center opacity-40">Assign personnel to this block and task.</p>
            </div>
          ) : (
            assignedToCurrentBlock.map(worker => {
              const isLocked = musterAssignments[worker.id]?.isSaved;
              return (
                <div 
                  key={worker.id}
                  draggable={!isLocked}
                  onDragStart={(e) => !isLocked && handleDragStart(e, worker.id)}
                  className={`flex flex-col items-center justify-center text-center gap-1 md:gap-2 p-2 md:p-3 bg-white dark:bg-slate-800 border-t-4 ${isLocked ? 'border-t-slate-400 opacity-80 cursor-not-allowed' : 'border-t-tea-500 cursor-grab active:cursor-grabbing hover:scale-[1.02]'} border border-slate-100 dark:border-slate-700/50 rounded-xl shadow-sm transition-transform aspect-square relative group`}
                >
                  <div className="absolute top-1 md:top-2 left-1 md:left-2 text-slate-300 transition-opacity">
                    {isLocked ? <Lock size={12} className="text-amber-500" /> : <GripVertical size={14} className="opacity-0 group-hover:opacity-100" />}
                  </div>
                  {worker.photo ? (
                    <img 
                      src={worker.photo.startsWith('data:') ? worker.photo : `/api/uploads/${worker.photo}`} 
                      alt={worker.first_name} 
                      className={`w-12 h-12 md:w-[60px] md:h-[60px] rounded-full object-cover shrink-0 border-2 ${isLocked ? 'border-slate-300 dark:border-slate-600 grayscale-[30%]' : 'border-slate-200 dark:border-slate-700'} shadow-sm`} 
                    />
                  ) : (
                    <div className={`w-12 h-12 md:w-[60px] md:h-[60px] rounded-full ${isLocked ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-900'} flex items-center justify-center font-bold text-xs md:text-sm text-slate-500 uppercase shrink-0 border-2 ${isLocked ? 'border-slate-300 dark:border-slate-600' : 'border-slate-200 dark:border-slate-800'} shadow-sm`}>
                      {worker.first_name?.[0]}{worker.last_name?.[0]}
                    </div>
                  )}
                  <div className="w-full px-1 flex-1 flex flex-col justify-end pb-1">
                    <p className={`text-sm font-black ${isLocked ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'} truncate leading-tight`}>{worker.first_name}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-tea-600 dark:text-tea-500 truncate mt-0.5">
                      {musterAssignments[worker.id].task} 
                      {musterAssignments[worker.id].daily_wage && ` • Rs.${musterAssignments[worker.id].daily_wage}`}
                    </p>
                  </div>
                  {!isLocked && (
                    <button title="Remove" onClick={() => handleDropToUnassign({ preventDefault: () => {}, dataTransfer: { getData: () => worker.id } })} className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 shadow-sm">
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Save Controls */}
        <div className="p-2 md:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex justify-end">
          <button 
            onClick={handleSaveMuster}
            disabled={isSaving || Object.keys(musterAssignments).length === 0}
            className="btn-primary flex items-center gap-1.5 md:gap-2 group w-full md:w-auto justify-center disabled:opacity-50 text-[10px] md:text-sm py-2 md:py-2.5"
          >
            {isSaving ? <Activity className="animate-spin" size={14} /> : <CheckCircle size={14} className="group-hover:scale-110 transition-transform" />}
            {isSaving ? 'Syncing...' : 'Save Muster'}
          </button>
        </div>
      </div>

      {/* Available Personnel Pool */}
      <div className="premium-card flex flex-col overflow-hidden">
        <div className="p-2 md:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-1 md:gap-2 mb-2 md:mb-4 truncate">
            <Users size={14} className="text-indigo-500 shrink-0" /> Available
          </h3>
          <div className="relative">
            <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 md:pl-10 pr-2 md:pr-4 py-1.5 md:py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-all text-[10px] md:text-xs font-bold"
            />
          </div>
        </div>

        <div 
          className="flex-1 p-2 md:p-4 overflow-y-auto dashboard-scroll bg-slate-50/20 dark:bg-transparent grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 content-start"
          onDragOver={handleDragOver}
          onDrop={handleDropToUnassign}
        >
           {availableWorkers.length === 0 ? (
             <div className="col-span-full text-center p-4 md:p-8 text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-widest">
               No available personnel
             </div>
           ) : (
             availableWorkers.map(worker => (
               <div 
                 key={worker.id}
                 draggable
                 onDragStart={(e) => handleDragStart(e, worker.id)}
                 className="flex flex-col items-center justify-center text-center gap-1 md:gap-2 p-2 md:p-3 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400/50 transition-colors aspect-square relative group"
               >
                 <div className="absolute top-1 md:top-2 left-1 md:left-2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                   <GripVertical size={14} />
                 </div>
                 <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                 {worker.photo ? (
                   <img src={worker.photo} alt={worker.first_name} className="w-12 h-12 md:w-[60px] md:h-[60px] rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                 ) : (
                   <div className="w-12 h-12 md:w-[60px] md:h-[60px] rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center font-bold text-xs md:text-sm text-slate-500 uppercase shrink-0">
                     {worker.first_name?.[0]}{worker.last_name?.[0]}
                   </div>
                 )}
                 <div className="w-full px-1">
                   <p className="text-sm font-black text-slate-900 dark:text-white truncate">{worker.first_name}</p>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
      
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in relative z-0">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Smart Muster</h1>
          <p className="text-slate-500 mt-1 uppercase tracking-[0.2em] text-xs font-bold flex items-center gap-2">
            <Activity size={14} className="text-tea-500" /> Team Logistics & Daily Task Assignment
          </p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2 border border-slate-200 dark:border-slate-700">
             <button 
               onClick={() => setViewMode('board')} 
               className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-tea-600 dark:text-tea-400' : 'text-slate-400 hover:text-slate-600'}`}
               title="Muster Builder"
             >
               <LayoutGrid size={16} />
             </button>
             <button 
               onClick={() => setViewMode('list')} 
               className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-tea-600 dark:text-tea-400' : 'text-slate-400 hover:text-slate-600'}`}
               title="Directory List"
             >
               <List size={16} />
             </button>
          </div>
        </div>
      </div>


      {/* Main Content Area */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-tea-600 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 border-dashed">
          <Activity className="animate-pulse mb-3" size={32} />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Synchronizing Rosters...</span>
        </div>
      ) : (
        viewMode === 'board' ? renderBoardView() : renderListView()
      )}

    </div>
  );
}
