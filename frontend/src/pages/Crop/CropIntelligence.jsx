import React, { useState } from 'react';
import { Leaf, Activity, TrendingUp, Shovel, Scissors, Sprout, Database, Droplets, Briefcase } from 'lucide-react';
import PluckingIntel from './PluckingIntel';
import PruningIntel from './PruningIntel';
import WeedingIntel from './WeedingIntel';
import ManureIntel from './ManureIntel';
import LoppingIntel from './LoppingIntel';
import FoliarApplications from './FoliarIntel';
import OtherWorksIntel from './OtherWorksIntel';

export default function CropIntelligence() {
  const [taskType, setTaskType] = useState('Plucking');

  const tasks = [
    { id: 'Plucking', icon: Leaf, color: 'tea', label: 'Plucking Intel' },
    { id: 'Pruning', icon: Scissors, color: 'emerald', label: 'Pruning Intel' },
    { id: 'Weeding', icon: Shovel, color: 'sky', label: 'Weeding Intel' },
    { id: 'Manure', icon: Sprout, color: 'amber', label: 'Manure Intel' },
    { id: 'Lopping', icon: Activity, color: 'violet', label: 'Lopping Intel' },
    { id: 'Foliar', icon: Droplets, color: 'sky', label: 'Foliar Intel' },
    { id: 'Other', icon: Briefcase, color: 'indigo', label: 'Other Works' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">Operations Intelligence</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Unified Field Performance Registry
          </p>
        </div>
        
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
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 relative">
        <div className={`transition-all duration-300 ${taskType === 'Plucking' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <PluckingIntel isEmbedded={true} />
        </div>
        <div className={`transition-all duration-300 ${taskType === 'Pruning' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <PruningIntel isEmbedded={true} />
        </div>
        <div className={`transition-all duration-300 ${taskType === 'Weeding' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <WeedingIntel isEmbedded={true} />
        </div>
        <div className={`transition-all duration-300 ${taskType === 'Manure' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <ManureIntel isEmbedded={true} />
        </div>
        <div className={`transition-all duration-300 ${taskType === 'Lopping' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <LoppingIntel isEmbedded={true} />
        </div>
        <div className={`transition-all duration-300 ${taskType === 'Foliar' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <FoliarApplications isEmbedded={true} />
        </div>
        <div className={`transition-all duration-300 ${taskType === 'Other' ? 'opacity-100' : 'hidden opacity-0'}`}>
          <OtherWorksIntel isEmbedded={true} />
        </div>
      </div>
    </div>
  );
}
