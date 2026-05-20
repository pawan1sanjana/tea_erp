import { LifeBuoy, Mail, MessageSquare, BookOpen, Clock, PhoneCall, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';

const FAQItem = ({ question, answer }) => (
  <details className="group glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
    <summary className="flex items-center justify-between p-5 cursor-pointer list-none">
      <h4 className="text-base font-bold text-slate-800 dark:text-white group-open:text-tea-500 transition-colors">
        {question}
      </h4>
      <ChevronDown size={18} className="text-slate-400 group-open:rotate-180 transition-transform duration-300" />
    </summary>
    <div className="px-5 pb-5">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {answer}
      </p>
    </div>
  </details>
);

export default function SupportPage() {
  const handleDownloadDoc = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();

    // Set Title
    doc.setFontSize(22);
    doc.setTextColor(21, 128, 61); // Tea Green
    doc.text("TeaERP Pro - User Manual", 20, 30);

    // Set Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Version 2.4.0 PRO | Generated: ${date}`, 20, 38);
    
    // Draw horizontal line
    doc.setDrawColor(200);
    doc.line(20, 42, 190, 42);

    // Section: System Overview
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("1. System Overview", 20, 55);
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text("TeaERP Pro is a comprehensive estate management platform designed to", 20, 65);
    doc.text("automate harvest tracking, workforce logistics, and climatic analytics.", 20, 70);

    // Section: Key Modules
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("2. Key Modules", 20, 85);
    doc.setFontSize(11);
    doc.setTextColor(60);
    const modules = [
      "- DASHBOARD: Real-time KPI monitoring and estate overview.",
      "- CROP INTELLIGENCE: Field mapping and harvest weights.",
      "- WORKFORCE: Attendance and photo-id registration.",
      "- WEATHER: Hyper-local forecasting and alerts.",
      "- ACCOUNTS: User management and role-based access."
    ];
    modules.forEach((module, index) => {
      doc.text(module, 25, 95 + (index * 7));
    });

    // Section: Tasks
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("3. Common Tasks", 20, 140);
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text("- Resetting Password: Go to Accounts > Edit User.", 25, 150);
    doc.text("- Recording Harvest: Navigate to Crop Intelligence.", 25, 157);
    doc.text("- Viewing Weather: Access the Weather module for 5-day forecasts.", 25, 164);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("TeaERP Pro Platform (c) 2026", 20, 280);
    doc.text("Contact Support: support@teaerp.pro", 140, 280);

    // Save PDF
    doc.save('TeaERP_Pro_Manual.pdf');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-outfit tracking-tight">
          System Support Center
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Operational issues? Technical questions? Our dedicated estate intelligence support team 
          is active and ready to assist you.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Email Support</h3>
          <p className="text-sm text-slate-500">Fast tracking for complex technical issues.</p>
          <p className="text-sm font-bold text-tea-600">support@teaerp.pro</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 flex items-center justify-center">
            <PhoneCall size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Estate Hotline</h3>
          <p className="text-sm text-slate-500">Immediate assistance for harvest emergencies.</p>
          <p className="text-sm font-bold text-green-600">+94 11 234 5678</p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Docs & Guides</h3>
          <p className="text-sm text-slate-500">Self-serve knowledge base for all modules.</p>
          <button 
            onClick={handleDownloadDoc}
            className="inline-block text-sm font-bold text-purple-600 hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            Download Documentation
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="text-tea-500" size={24} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-outfit">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-4">
          <FAQItem 
            question="How do I reset an employee password?" 
            answer="Administrators can reset passwords through the 'Accounts & Users' module. Find the user in the active list, click 'Edit', and enter a new secure password in the 'Update Password' field." 
          />
          <FAQItem 
            question="Why is my weather dashboard showing locally?" 
            answer="The dashboard uses real-time GPS coordinates of your estate. Ensure that 'Galle Estate' has correct mapping coordinates set in the GIS Mapping module for precise local forecasting." 
          />
          <FAQItem 
            question="Can I export monthly harvest reports?" 
            answer="Yes! Navigate to the Crop Intelligence module and use the 'Export Data' function. You can download reports in CSV or PDF formats for offline auditing." 
          />
        </div>
      </div>

      {/* Response Info */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-6 glass-panel rounded-3xl border border-tea-500/20 bg-tea-500/5">
        <div className="flex items-center gap-3">
          <Clock className="text-tea-500" size={20} />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-800 dark:text-white">Response Time:</span> Under 2 Hours
          </p>
        </div>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          Available Monday – Saturday, 8:00 AM – 6:00 PM (IST)
        </p>
      </div>
    </div>
  );
}
