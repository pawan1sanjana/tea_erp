import React, { useState } from "react";
import { 
  ShieldCheck, Landmark, Lock, Award, 
  FileText, Activity, ArrowRight, Info,
  Search, CheckCircle2, AlertCircle, Clock,
  BookOpen, ChevronDown, Sparkles, Building2,
  Receipt, Wallet, Gavel, Truck, Box,
  FileSpreadsheet, FilePlus, Download,
  UserCheck, Home, Coins, UserMinus,
  Users, Briefcase
} from 'lucide-react';

const EMPLOYER_TABS = [
  { id: "reg_employer", label: "ලියාපදිංචිය", icon: Building2 },
  { id: "contributions", label: "දායක මුදල්", icon: Wallet },
  { id: "penalties", label: "දඩ & නීති", icon: Gavel },
];

const MEMBER_TABS = [
  { id: "membership", label: "සාමාජිකත්වය", icon: UserCheck },
  { id: "statements", label: "ප්‍රකාශන & තහවුරු කිරීම්", icon: CheckCircle2 },
  { id: "pre_retirement", label: "පූර්ව විශ්‍රාම", icon: Home },
  { id: "claims", label: "හිමිකම් ලබා ගැනීම", icon: Coins },
];

function Accordion({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="premium-card p-0 overflow-hidden mb-4 border-slate-100 dark:border-slate-800">
      <button 
        className={`w-full flex items-center justify-between p-5 text-left transition-all ${open ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}`}
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-black text-slate-900 dark:text-white font-sinhala tracking-tight">{title}</span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
          <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sinhala">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EPFGuidelines() {
  const [mainCategory, setMainCategory] = useState("members"); // 'employers' or 'members'
  const [activeTab, setActiveTab] = useState(mainCategory === "employers" ? "reg_employer" : "membership");

  const handleCategoryChange = (cat) => {
    setMainCategory(cat);
    setActiveTab(cat === "employers" ? "reg_employer" : "membership");
  };

  const tabs = mainCategory === "employers" ? EMPLOYER_TABS : MEMBER_TABS;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sinhala">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">EPF Protocols</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-tea-500" /> Employees' Provident Fund Regulatory Guidelines
          </p>
        </div>
        
        <div className="px-5 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-tea-500/10 rounded-2xl flex items-center gap-5 shadow-lg shadow-tea-500/5 font-outfit">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">REG REF</span>
            <span className="text-lg font-black text-tea-600 tracking-wider mt-1 italic uppercase">CBSL-EPF</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">AUDIT</span>
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Grade A</span>
          </div>
        </div>
      </div>

      {/* Main Category Switcher */}
      <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 max-w-xl mx-auto shadow-inner">
        <button
          onClick={() => handleCategoryChange("employers")}
          className={`flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-300 ${
            mainCategory === "employers" 
              ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-xl shadow-slate-200/50 dark:shadow-none' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase size={20} />
          <span className="text-sm font-black uppercase tracking-widest">සේවායෝජකයින්</span>
        </button>
        <button
          onClick={() => handleCategoryChange("members")}
          className={`flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-300 ${
            mainCategory === "members" 
              ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-xl shadow-slate-200/50 dark:shadow-none' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Users size={20} />
          <span className="text-sm font-black uppercase tracking-widest">සාමාජිකයින්</span>
        </button>
      </div>

      {/* Sub-Tabs Design */}
      <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-900/30 p-1.5 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800 overflow-x-auto max-w-full no-scrollbar mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-tea-600 shadow-sm font-outfit' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-outfit'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Guidance Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ========== EMPLOYER SECTIONS ========== */}
          {mainCategory === "employers" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              {activeTab === "reg_employer" && (
                <div className="space-y-6">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic uppercase tracking-tight">
                      <Building2 className="text-tea-500" size={20} /> සේවායෝජක ලියාපදිංචිය
                    </h3>
                    <p className="mb-6">ඕනෑම ව්‍යාපාරයක එක් සේවකයෙකු හෝ සිටින සේවා යෝජකයෙකු සේ.අ.අ. සඳහා දායක මුදල් ගෙවීමට නීත්‍යානුකූලව බැඳී සිටී.</p>
                    <div className="space-y-4">
                      {[
                        "පළමු සේවකයා බඳවා ගැනීමෙන් දින 14 ක් ඇතුළත 'D' ආකෘති පත්‍රය යොමු කළ යුතුය.",
                        "සේවායෝජක ලියාපදිංචි සහතිකය කම්කරු දෙපාර්තමේන්තුවෙන් ලබා ගත යුතුය.",
                        "නව සේවා යෝජකයන් 'D' ආකෘති පත්‍රයේ පිටපතක් ශ්‍රී ලංකා මහ බැංකුවේ සේ.අ.අ දෙපාර්තමේන්තුවට යැවිය යුතුය."
                      ].map((text, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="w-6 h-6 bg-tea-100 dark:bg-tea-900/30 text-tea-600 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-loose">{text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "contributions" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="premium-card bg-tea-50/50 dark:bg-tea-900/10 border-tea-200 dark:border-tea-800/50 text-center space-y-2">
                      <p className="text-[10px] font-black text-tea-600 uppercase tracking-widest">සේවායෝජක දායකත්වය</p>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white font-outfit">12%</h4>
                    </div>
                    <div className="premium-card bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 text-center space-y-2">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">සේවක දායකත්වය</p>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white font-outfit">8%</h4>
                    </div>
                  </div>
                  
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Wallet className="text-emerald-500" size={20} /> දායක මුදල් ප්‍රේෂණය
                    </h3>
                    <div className="space-y-3">
                      <Accordion title="විද්‍යුත් දත්ත (e-Returns) ක්‍රමවේදය">
                        <p className="mb-4 font-bold text-xs text-slate-500">සේවකයින් 50 ට වැඩි ආයතන සඳහා අනිවාර්ය වේ. සෙසු ආයතනවලටද නිර්දේශිතයි.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {[
                            { label: 'e-Registration Form', url: 'https://epf.lk/wp-content/uploads/2021/06/e-Registration-Form.pdf' },
                            { label: 'දායක මුදල් විස්තර (XLS)', url: 'https://epf.lk/epf_new/wp-content/uploads/2021/06/Contribution-Detail-File.xls', icon: FileSpreadsheet },
                            { label: 'ගෙවීම් සාරාංශ (XLS)', url: 'https://epf.lk/epf_new/wp-content/uploads/2021/06/Payment-Summary-File.xls', icon: FileSpreadsheet }
                          ].map((link, i) => (
                            <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-emerald-500/50 transition-all group">
                              {link.icon ? <link.icon size={16} className="text-emerald-500" /> : <FilePlus size={16} className="text-emerald-500" />}
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{link.label}</span>
                            </a>
                          ))}
                        </div>
                      </Accordion>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "penalties" && (
                <div className="space-y-6">
                  <div className="premium-card overflow-hidden p-0 border-none shadow-2xl">
                    <div className="p-6 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-4">
                      <div className="w-10 h-10 bg-rose-500/20 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertCircle size={20} />
                      </div>
                      <h4 className="text-sm font-black text-rose-600 uppercase tracking-widest italic font-sinhala">ප්‍රමාද ගෙවීම් සඳහා අධිභාර</h4>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden">
                        {[
                          ['දින 01 – 10', '5%'],
                          ['දින 11 – මාස 01', '15%'],
                          ['මාස 01 – 03', '20%'],
                          ['මාස 03 – 06', '30%'],
                          ['මාස 06 – 12', '40%'],
                          ['මාස 12+', '50%'],
                        ].map(([period, rate]) => (
                          <React.Fragment key={period}>
                            <div className="bg-white dark:bg-slate-900 p-4 text-xs font-bold text-slate-700 dark:text-slate-300 text-center">{period}</div>
                            <div className="bg-white dark:bg-slate-900 p-4 text-xs font-black text-rose-500 text-center">{rate}</div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== MEMBER SECTIONS ========== */}
          {mainCategory === "members" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
              {activeTab === "membership" && (
                <div className="space-y-6">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic uppercase tracking-tight">
                      <UserCheck className="text-tea-500" size={20} /> සාමාජිකයෙකු බවට පත්වීම
                    </h3>
                    <p className="mb-6 font-bold text-slate-700 dark:text-slate-300">සේවකයකුට ඔහුගේ / ඇයගේ රැකියාවේ පළමු දිනයේ සිටම සේවක අර්ථසාධක අරමුදලේ සාමාජිකත්වය හිමිවේ.</p>
                    <div className="space-y-3">
                      <Accordion title="සාමාජිකත්වය ලැබීමට සුදුස්සන්">
                        <ul className="space-y-2">
                          {[
                            "සියලුම සේවකයින් ස්ථිර, තාවකාලික, ආධුනික, අනියම් හෝ වැඩ මුර සේවකයින්.",
                            "කොන්ත්‍රාත්, කොමිස් හෝ ඉටු කරන ලද පදනම මත සේවය කරන සේවකයින්.",
                            "පවුලේ ව්‍යාපාර වල සේවය කරන බාහිර සේවකයින්.",
                            "වැටුපක් ලබන අධ්‍යක්ෂවරුන් සහ හවුල්කරුවන්.",
                            "වයස අවුරුදු 14 ට වැඩි පාසල් ළමුන් (පාසල් වේලාවෙන් පසු).",
                            "විදේශයන්හි සිට දේශීයව රැකියාවල නියුතු අය."
                          ].map((item, i) => (
                            <li key={i} className="flex gap-2">
                              <ArrowRight size={12} className="text-tea-500 shrink-0 mt-1" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </Accordion>
                      <Accordion title="ප්‍රතිලාභීන් නම් කිරීම (Beneficiary)">
                        <p className="mb-4">"H – පෝරමය" භාවිතා කර ප්‍රතිලාභීන් නම් කළ හැකිය.</p>
                        <ul className="space-y-2 text-xs">
                          <li className="flex gap-2"><ArrowRight size={12} className="text-tea-500 mt-1" /> අවිවාහක පුද්ගලයෙකුට ඕනෑම අයෙකු නම් කළ හැකිය.</li>
                          <li className="flex gap-2"><ArrowRight size={12} className="text-tea-500 mt-1" /> විවාහක පුද්ගලයෙකුට පවුලේ සාමාජිකයන් නම් කළ හැකිය.</li>
                          <li className="flex gap-2 text-rose-500 font-bold font-sinhala leading-loose"><AlertCircle size={12} className="mt-1 shrink-0" /> විවාහයට පෙර බලපැවැත්වෙන නාමයෝජනා විවාහයෙන් පසු ස්වයංක්‍රීයව අවලංගු වේ.</li>
                        </ul>
                      </Accordion>
                    </div>
                  </div>

                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2 italic uppercase tracking-tight">
                      <Sparkles className="text-amber-500" size={20} /> RR ව්‍යාපෘතිය (නැවත ලියාපදිංචිය)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: 'RR පෝරමය', url: 'https://epf.lk/wp-content/uploads/2024/06/RR-Form.pdf' },
                        { label: 'ආවරණ ලිපිය', url: 'https://epf.lk/wp-content/uploads/2024/06/Covering-Letter.pdf' },
                        { label: 'මාර්ගෝපදේශය', url: 'https://epf.lk/wp-content/uploads/2025/05/Re-Registration-Guideline.pdf' }
                      ].map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-tea-500/50 transition-all group shadow-sm">
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{link.label}</span>
                          <Download size={14} className="text-slate-300 group-hover:text-tea-500 transition-colors" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "statements" && (
                <div className="space-y-6">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <CheckCircle2 className="text-sky-500" size={20} /> ප්‍රකාශන & තහවුරු කිරීම්
                    </h3>
                    <div className="space-y-3">
                      <Accordion title="දායක මුදල් විස්තර වාර්තාව (History Report)">
                        <div className="flex flex-wrap gap-3">
                          <a href="https://epf.lk/wp-content/uploads/2026/04/%E0%B\xDA%E0%B\xBA%E0%B\x9A-%E0%B\xB8%E0%B\xBD%E0%B\xAF%E0%B\xBD%E0%B\xBD-%E0%B\xBD%E0%B\xBD%E0%B\xBD%E0%B\xBA%E0%B\xBB-%E0%B\xBD%E0%B\xBD%E0%B\xBB%E0%B\xAD%E0%B\xBD%E0%B\xBD-%E0%B\xBD%E0%B\xBD%E0%B\xBB%E0%B\xBD%E0%B\xAD%E0%B\xBD%E0%B\xBD%E0%B\xBD%E0%B\xBD.docx" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-sky-600 hover:bg-sky-50 transition-all border border-slate-200 dark:border-slate-700">
                            <FileText size={14} /> අවශ්‍ය ලියවිලි (DOCX)
                          </a>
                          <a href="https://epf.lk/wp-content/uploads/2024/04/Contribution-History-Application.pdf" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-sky-600 hover:bg-sky-50 transition-all border border-slate-200 dark:border-slate-700">
                            <FilePlus size={14} /> අයදුම්පත (PDF)
                          </a>
                        </div>
                      </Accordion>
                      <Accordion title="ශේෂ තහවුරු කිරීම් (Balance Confirmation)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <a href="https://epf.lk/wp-content/uploads/2024/04/Application-E-Mail-Sinhala-1.pdf" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all group">
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">අයදුම්පත – ඊ මේල්</span>
                            <Download size={14} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                          </a>
                          <a href="https://epf.lk/wp-content/uploads/2024/04/Application-OTC-Sinhala-1.pdf" target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-sky-500/50 transition-all group">
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">අයදුම්පත – කවුන්ටරයෙන්</span>
                            <Download size={14} className="text-slate-300 group-hover:text-sky-500 transition-colors" />
                          </a>
                        </div>
                      </Accordion>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "pre_retirement" && (
                <div className="space-y-6">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Home className="text-amber-500" size={20} /> පූර්ව විශ්‍රාම ප්‍රතිලාභ
                    </h3>
                    <div className="space-y-3">
                      <Accordion title="ශේෂයෙන් 30% මුදල් ලබා ගැනීම">
                        <p className="mb-4 text-xs font-bold text-slate-500 italic leading-loose font-sinhala">අරමුණු: (1) නිවාස කටයුතු, (2) හෘද සැත්කම්, වකුගඩු, පිළිකා ඇතුළු බරපතල වෛද්‍ය ප්‍රතිකාර.</p>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">අවම ශේෂය</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white font-outfit tracking-tighter">Rs. 300,000</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">සේවා කාලය</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white font-outfit tracking-tighter uppercase italic">10 Years</p>
                          </div>
                        </div>
                      </Accordion>
                      <Accordion title="නිවාස ණය යෝජනා ක්‍රමය">
                        <p className="mb-4">දායක වන සක්‍රීය සාමාජිකයින්ට ගිණුම් ශේෂයෙන් 75% ක් දක්වා ණය ඇපකරය ලෙස ලබා ගත හැකිය.</p>
                        <ul className="space-y-2 text-xs">
                          <li className="flex gap-2"><ArrowRight size={12} className="text-amber-500 mt-1" /> නිවාස ඉදිකිරීම හෝ මිලදී ගැනීම.</li>
                          <li className="flex gap-2"><ArrowRight size={12} className="text-amber-500 mt-1" /> නිවාස වැඩිදියුණු කිරීම.</li>
                        </ul>
                      </Accordion>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "claims" && (
                <div className="space-y-6">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Coins className="text-amber-500" size={20} /> ප්‍රතිලාභ හිමිකම් අයදුම් කිරීම
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "විශ්‍රාම වයස සම්පූර්ණ වීම (පිරිමි: 55, ගැහැණු: 50).",
                        "ගැහැණු සේවකයෙකු විවාහය සඳහා රැකියාවෙන් ඉවත් වීම.",
                        "අයෝග්‍යතාවය (වෛද්‍ය හේතු) මත රැකියාවෙන් ඉවත් වීම.",
                        "ස්ථීර පදිංචිය සඳහා විදේශගත වීම.",
                        "මියගිය සාමාජිකයින්ගේ උරුමකරුවන් සඳහා (L පෝරමය)."
                      ].map((item, i) => (
                        <div key={i} className="flex gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 size={16} className="text-tea-500 mt-1 shrink-0" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-loose">{item}</p>
                        </div>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <div className="premium-card bg-tea-600 text-white shadow-2xl shadow-tea-600/30 border-none">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Info size={16} /> නිල ලිපිනය
            </h4>
            <div className="space-y-2 opacity-90 font-sinhala">
              <p className="text-[11px] font-bold leading-loose">
                අධිකාරී, සේවක අර්ථ සාධක අරමුදල<br />
                ශ්‍රී ලංකා මහ බැංකුව, ලොයිඩ්ස් ගොඩනැගිල්ල<br />
                අංක 13, සර් බාරොන් ජයතිලක මාවත, කොළඹ 01
              </p>
              <p className="text-[10px] font-black text-tea-200 mt-2 italic">epfhelpdesk@cbsl.lk</p>
            </div>
          </div>

          <div className="premium-card pt-6 pb-6 pr-6 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Verification Protocol</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {mainCategory === "employers" ? <Building2 size={16} className="text-tea-500" /> : <Users size={16} className="text-tea-500" />}
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  {mainCategory === "employers" ? 'Employer Status: Verified' : 'Member Eligibility: Active'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-tea-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Audit Integrity Layer</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}