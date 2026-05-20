import React from 'react';
import FieldData from '../../components/GISMapping/FieldData';

export default function FieldDataPage() {
  const handleDataUpdate = (data) => {
    console.log('Weather data updated:', data);
  };

  return (
    <div className="animate-fade-in relative space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">Field Data Analysis</h1>
        <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
          Environmental health metrics, soil mapping, and 5-day weather history
        </p>
      </div>

      <FieldData onDataUpdate={handleDataUpdate} />
    </div>
  );
}
