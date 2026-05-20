import React from 'react';
import { Book, ChevronRight, Layout, Leaf, Users, CloudSun, Package, ShieldCheck } from 'lucide-react';

const DocSection = ({ icon: Icon, title, description, steps }) => (
  <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-tea-500/10 text-tea-600 dark:text-tea-400">
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
    </div>
    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
    <ul className="space-y-2">
      {steps.map((step, idx) => (
        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <ChevronRight size={16} className="text-tea-500 mt-0.5 shrink-0" />
          <span>{step}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default function DocumentationPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
          System Documentation
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Comprehensive guide for operating the TeaERP Pro Estate Intelligence Platform.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DocSection 
          icon={Layout}
          title="Dashboard & Navigation"
          description="The central hub for all estate operations and real-time KPI tracking."
          steps={[
            "Overview of total harvest and workforce presence.",
            "Quick access to module sub-navigation via the sidebar.",
            "Notification center for climatic and operational alerts."
          ]}
        />

        <DocSection 
          icon={Leaf}
          title="Crop Intelligence"
          description="Manage field boundaries, crop varieties, and harvest analytics."
          steps={[
            "Record daily/weekly pluckings with precise weights.",
            "Analyze yield performance by field or division.",
            "Monitor soil health and fertilizer application schedules."
          ]}
        />

        <DocSection 
          icon={Users}
          title="Workforce Management"
          description="Handle HR, attendance, and payroll for estate workers."
          steps={[
            "Register new field workers with profile photos.",
            "Track daily muster logs for payroll calculation.",
            "Manage EPF/ETF compliance and benefit disbursements."
          ]}
        />

        <DocSection 
          icon={CloudSun}
          title="Weather & Climate"
          description="Hyper-local forecasting tailored to your estate GPS coordinates."
          steps={[
            "Real-time temperature, humidity, and wind monitoring.",
            "5-day forecast for planning harvest and fertilization.",
            "Automated alerts for heavy rainfall and frost risks."
          ]}
        />

        <DocSection 
          icon={Package}
          title="Inventory Systems"
          description="Track goods, biological assets, and physical estate equipment."
          steps={[
            "Monitor fertilizer, tea-seed, and fuel stock levels.",
            "Biological asset valuation for accounting audits.",
            "Maintenance logs for factory machinery and tractors."
          ]}
        />

        <DocSection 
          icon={ShieldCheck}
          title="System Administration"
          description="Managing users, estates, and platform security."
          steps={[
            "Assign role-based access controls (Admin, Manager, Field Officer).",
            "Update system-wide settings and API integrations.",
            "Audit logs for critical data modifications."
          ]}
        />
      </div>

      <div className="glass-panel p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
        <Book className="mx-auto text-slate-300" size={48} />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Need more specific help?</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          For module-specific technical specifications or API integration guides, 
          please contact your estate's system architect.
        </p>
      </div>
    </div>
  );
}
