import React from 'react';
import { Shield, Lock, Eye, Database, FileText, Globe } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          At TeaERP Pro, we prioritize the protection of your estate intelligence. 
          Learn how we safeguard your data and ensure operational integrity.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-tea-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
            <Database size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Data Collection</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            We collect only essential operational data: estate boundaries, harvest weights, workforce logs, and secure user credentials.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-tea-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-tea-500/10 text-tea-600 dark:text-tea-400 flex items-center justify-center mb-4">
            <Eye size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Data Usage</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Your data is used exclusively to power the Estate Intelligence dashboard, generate crop forecasts, and automate inventory tracking.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-tea-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">System Security</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            All data is encrypted in transit and at rest using AES-256 standards. Our Node.js/MySQL architecture enforces strict IAM protocols.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-tea-500/30 transition-all duration-300">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <Globe size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Third-Party Policy</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            We never sell or share your data. Third-party integrations (like OpenWeather) receive only the minimum anonymized location data needed.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="text-tea-500" size={24} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Rights & Compliance</h2>
        </div>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Estate administrators retain full ownership of all data entered into the system. You have the right to export, modify, or archive your data at any time through the Management Console. In compliance with regional data protection standards, we maintain a comprehensive audit log of all administrative actions.
          </p>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <p className="text-sm text-slate-400">
          Last updated: April 15, 2026 · TeaERP Compliance Team
        </p>
      </div>
    </div>
  );
}

