import React from 'react';
import { Rocket, Sparkles, Bug, Zap, CheckCircle2 } from 'lucide-react';

const ReleaseItem = ({ version, date, type, title, description, changes }) => {
  const isMajor = type === 'major';
  
  return (
    <div className="relative pl-10 pb-12 last:pb-0 group">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-2 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 group-last:hidden"></div>
      
      {/* Timeline Dot */}
      <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-white dark:border-slate-900 z-10 flex items-center justify-center shadow-sm ${
        isMajor ? 'bg-tea-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
      }`}>
        {isMajor ? <Rocket size={14} /> : <Zap size={14} />}
      </div>

      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            isMajor ? 'bg-tea-500/10 text-tea-600 dark:text-tea-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            v{version}
          </span>
          <span className="text-xs text-slate-400 font-medium">{date}</span>
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 dark:text-white font-outfit">
          {title}
        </h3>
      </div>

      <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-tea-500/20 transition-all duration-300">
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          {description}
        </p>
        
        <div className="space-y-3">
          {changes.map((change, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`mt-1 rounded-full p-0.5 shrink-0 ${
                change.type === 'feature' ? 'bg-green-500/10 text-green-500' : 
                change.type === 'fix' ? 'bg-blue-500/10 text-blue-500' : 
                'bg-purple-500/10 text-purple-500'
              }`}>
                {change.type === 'feature' ? <Sparkles size={12} /> : 
                 change.type === 'fix' ? <Bug size={12} /> : 
                 <Zap size={12} />}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {change.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ReleaseNotesPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
          Evolution of TeaERP Pro
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Explore the latest innovations and stability updates we've introduced to power your 
          estate intelligence operations.
        </p>
      </div>

      {/* Timeline container */}
      <div className="mt-12 relative">
        <ReleaseItem 
          version="2.4.0"
          date="April 15, 2026"
          type="major"
          title="The Accounts Expansion & Face Intelligence"
          description="A major leap forward in workforce management and platform responsiveness. This update introduces biological asset syncing and face-capture authentication."
          changes={[
            { type: 'feature', text: 'Live Photo Capture for user registration via integrated webcam API.' },
            { type: 'feature', text: 'Universal Responsiveness: Fully redesigned mobile sidebar and header.' },
            { type: 'improvement', text: 'Dynamic Estate Branding: Custom logos and names based on estate ID.' },
            { type: 'fix', text: 'Resolved sidebar flicker during theme switching in dark mode.' }
          ]}
        />

        <ReleaseItem 
          version="2.2.0"
          date="March 28, 2026"
          type="minor"
          title="The Weather Intelligence Update"
          description="Enhancing field monitoring with hyper-local weather forecasting and automated climatic alerts for Galle Estate."
          changes={[
            { type: 'feature', text: 'Standalone Weather Module with 5-day forecasts.' },
            { type: 'feature', text: 'Climatic Push Notifications for extreme harvest conditions.' },
            { type: 'improvement', text: 'Optimized MySQL query performance for large inventory datasets.' }
          ]}
        />

        <ReleaseItem 
          version="1.0.0"
          date="February 02, 2026"
          type="minor"
          title="TeaERP Pro Core Launch"
          description="The first public release of the estate intelligence platform, featuring integrated crop and labor tracking."
          changes={[
            { type: 'feature', text: 'Initial Dashboard with real-time estate KPI monitoring.' },
            { type: 'feature', text: 'Workforce & HR Management with EPF tracking.' }
          ]}
        />
      </div>

      <div className="p-8 glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-4">
        <CheckCircle2 size={40} className="text-tea-500" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Auto-Update Enabled</h3>
        <p className="text-sm text-slate-500 max-w-md">
          Your system is currently on the stable production branch. Security patches are 
          applied automatically during off-peak hours (12:00 AM – 3:00 AM IST).
        </p>
      </div>
    </div>
  );
}
