import React, { useState } from 'react';
import { Map, BarChart3, Navigation, Plus, Rows3 } from 'lucide-react';
import FieldMapPage from './FieldMapPage';
import FieldDataPage from './FieldDataPage';
import GPSTrackingPage from './GPSTrackingPage';
import AddFieldBlocksPage from './AddFieldBlocksPage';
import DivisionsPage from './DivisionsPage';

const TABS = [
  { id: 'fieldMap',    label: 'Field Map',        icon: Map },
  { id: 'divisions',   label: 'Divisions',         icon: Rows3 },
  { id: 'blocks',      label: 'Field Blocks',      icon: Plus },
  { id: 'gpsTracking', label: 'GPS Tracker',       icon: Navigation },
];

export default function GISMapping() {
  const [activeTab, setActiveTab] = useState('fieldMap');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`gis-tab-${id}`}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
              activeTab === id
                ? 'bg-white dark:bg-slate-800 text-tea-600 dark:text-tea-400 shadow-md'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'fieldMap'    && <FieldMapPage />}
      {activeTab === 'divisions'   && <DivisionsPage />}
      {activeTab === 'blocks'      && <AddFieldBlocksPage />}
      {activeTab === 'gpsTracking' && <GPSTrackingPage />}
    </div>
  );
}
