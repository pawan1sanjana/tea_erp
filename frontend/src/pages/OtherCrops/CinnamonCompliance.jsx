import React, { useState } from "react";
import { 
  ShieldCheck, 
  Download, 
  ExternalLink, 
  ChevronRight,
  Award,
  Droplets,
  Sprout,
  ShieldAlert,
  Beaker,
  ClipboardList,
  FileText,
  RefreshCcw
} from 'lucide-react';

const translations = {
  en: {
    title: "Cinnamon",
    subtitle: "Compliance",
    dept: "Department of Cinnamon Development · Sri Lanka",
    status: "Compliance Status",
    active: "Active Hub",
    portal: "Portal Access",
    stats: {
      forms: "Available Forms",
      sync: "Registry Sync",
      dept: "Department",
      audit: "Last Audit"
    },
    statutory: "Statutory Applications",
    select: "Select to Download",
    notice: "Official Notice",
    noticeText: "All applications must be submitted in triplicate to the Department of Cinnamon Development. Ensure all supporting documentation is attached to avoid delays in processing.",
    guidelines: "Submission Guidelines",
    checkpoints: "Critical Checkpoints",
    checks: [
      "Valid Land Registry Copy",
      "NIC of Registered Owner",
      "Block-wise GPS Coordinates",
      "Previous Harvest Records"
    ],
    footer: ["Standard PDF Protocol", "Sync v2.4.0", "Official Government Documents"],
    pdfDoc: "PDF Document",
    officialForm: "Official Registry Form"
  },
  si: {
    title: "කුරුඳු",
    subtitle: "අනුකූලතාව",
    dept: "කුරුඳු සංවර්ධන දෙපාර්තමේන්තුව · ශ්‍රී ලංකාව",
    status: "අනුකූලතා තත්ත්වය",
    active: "ක්‍රියාකාරී මධ්‍යස්ථානය",
    portal: "පිවිසුම් ද්වාරය",
    stats: {
      forms: "පවතින පෝරම",
      sync: "සමමුහුර්තකරණය",
      dept: "දෙපාර්තමේන්තුව",
      audit: "අවසන් විගණනය"
    },
    statutory: "ව්‍යවස්ථාපිත අයදුම්පත්",
    select: "බාගත කිරීමට තෝරන්න",
    notice: "නිල නිවේදනය",
    noticeText: "සියලුම අයදුම්පත් පිටපත් තුනකින් කුරුඳු සංවර්ධන දෙපාර්තමේන්තුවට ඉදිරිපත් කළ යුතුය. ප්‍රමාදයන් වළක්වා ගැනීම සඳහා සියලුම ආධාරක ලේඛන අමුණා ඇති බව සහතික කර ගන්න.",
    guidelines: "ඉදිරිපත් කිරීමේ මාර්ගෝපදේශ",
    checkpoints: "තීරණාත්මක පරීක්ෂාවන්",
    checks: [
      "වලංගු ඉඩම් ලියාපදිංචි පිටපත",
      "ලියාපදිංචි හිමිකරුගේ ජාතික හැඳුනුම්පත",
      "GPS ඛණ්ඩාංක",
      "පෙර අස්වනු වාර්තා"
    ],
    footer: ["සම්මත PDF ප්‍රොටෝකෝලය", "සමමුහුර්තකරණය v2.4.0", "නිල රජයේ ලේඛන"],
    pdfDoc: "PDF ලේඛනය",
    officialForm: "නිල ලියාපදිංචි පෝරමය"
  }
};

const applications = [
  {
    id: 1,
    title: { en: "Certification Application", si: "සහතික කිරීමේ අයදුම්පත" },
    href: "https://cinnamon.gov.lk/wp-content/uploads/2025/07/10.-Certification-application-only.pdf",
    icon: <Award className="text-amber-500" size={20} />,
    type: { en: "Certification", si: "සහතික කිරීම" }
  },
  {
    id: 2,
    title: { en: "Micro Irrigation Application", si: "ක්ෂුද්‍ර වාරිමාර්ග අයදුම්පත" },
    href: "https://cinnamon.gov.lk/wp-content/uploads/2025/07/Micro-Irrigation-application-only.pdf",
    icon: <Droplets className="text-blue-500" size={20} />,
    type: { en: "Irrigation", si: "වාරිමාර්ග" }
  },
  {
    id: 3,
    title: { en: "New Planting Application", si: "නව වගා අයදුම්පත" },
    href: "https://cinnamon.gov.lk/wp-content/uploads/2026/01/NEW-PLANTING-APPLICATION-new-version.pdf",
    icon: <Sprout className="text-emerald-500" size={20} />,
    type: { en: "Planting", si: "වගා කිරීම" }
  },
  {
    id: 4,
    title: { en: "Pest Control System Application", si: "පළිබෝධ පාලන පද්ධති අයදුම්පත" },
    href: "https://cinnamon.gov.lk/wp-content/uploads/2025/07/Pest-control-system-application-only.pdf",
    icon: <ShieldAlert className="text-rose-500" size={20} />,
    type: { en: "Protection", si: "ආරක්ෂණය" }
  },
  {
    id: 5,
    title: { en: "PH Application", si: "PH අයදුම්පත" },
    href: "https://cinnamon.gov.lk/wp-content/uploads/2025/07/PH-application-Sinhala.pdf",
    icon: <Beaker className="text-purple-500" size={20} />,
    type: { en: "Analysis", si: "විශ්ලේෂණය" }
  },
  {
    id: 6,
    title: { en: "PIP Application", si: "PIP අයදුම්පත" },
    href: "https://cinnamon.gov.lk/wp-content/uploads/2026/01/2.-PIP-application-new-version.pdf",
    icon: <ClipboardList className="text-indigo-500" size={20} />,
    type: { en: "Registry", si: "ලියාපදිංචිය" }
  },
];

function AppCard({ app, lang }) {
  return (
    <a
      href={app.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 hover:-translate-y-1"
    >
      <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
        {app.icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2 mb-0.5">
           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{app.type[lang]}</span>
           <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700"></span>
           <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tight">{translations[lang].pdfDoc}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-tight truncate font-outfit">
          {app.title[lang]}
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
          cinnamon.gov.lk · {translations[lang].officialForm}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400 group-hover:text-amber-500 transition-colors">
          <Download size={16} />
        </div>
        <ChevronRight size={18} className="text-slate-300 dark:text-slate-700 transition-all duration-300 group-hover:translate-x-1 group-hover:text-amber-500" />
      </div>
    </a>
  );
}

export default function CinnamonCompliance() {
  const [lang, setLang] = useState('en');
  const t = translations[lang];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20">
                <ShieldCheck size={24} />
             </div>
             <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
               {t.title} <span className="text-amber-600">{t.subtitle}</span>
             </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2 pl-1 mt-2 uppercase tracking-widest text-[10px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {t.dept}
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <button 
             onClick={() => setLang(lang === 'en' ? 'si' : 'en')}
             className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-200 transition-colors border border-amber-200/50"
           >
             {lang === 'en' ? 'සිංහල' : 'English'}
           </button>
           <div className="px-4 py-2 text-right border-x border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t.status}</p>
              <p className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1 mt-1">
                 {t.active} <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </p>
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
              <ExternalLink size={12} />
              {t.portal}
           </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.stats.forms, val: "06", unit: "PDFs", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: t.stats.sync, val: "100", unit: "%", icon: RefreshCcw, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: t.stats.dept, val: "DCD", unit: "SL", icon: Award, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: t.stats.audit, val: lang === 'en' ? 'May' : 'මැයි', unit: "2026", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
        ].map((stat, i) => (
          <div key={i} className="premium-card p-5 border-none shadow-xl shadow-black/5 dark:shadow-none flex items-center gap-4 group">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
               <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white font-outfit italic tracking-tighter leading-none">
                {stat.val}<span className="text-[9px] font-bold text-slate-400 not-italic ml-1 uppercase">{stat.unit}</span>
              </h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between px-2 mb-2">
               <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-3 font-outfit">
                  <ClipboardList className="text-amber-500" /> {t.statutory}
               </h2>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t.select}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {applications.map((app) => (
                  <AppCard key={app.id} app={app} lang={lang} />
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6 text-left">
            <div className="glass-panel p-6 rounded-[2rem] bg-amber-600 text-white shadow-xl shadow-amber-600/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
               <h3 className="relative text-sm font-black uppercase tracking-widest mb-4">{t.notice}</h3>
               <p className="relative text-xs font-medium leading-relaxed opacity-90 mb-6 italic">
                  "{t.noticeText}"
               </p>
               <button className="relative w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-white/30">
                  <Download size={14} /> {t.guidelines}
               </button>
            </div>

            <div className="glass-panel p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-6 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-rose-500"/> {t.checkpoints}
               </h3>
               <div className="space-y-4">
                  {t.checks.map((check, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                       <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{check}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <footer className="pt-8 pb-4 text-center border-t border-slate-200 dark:border-slate-800">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex flex-wrap items-center justify-center gap-4">
            {t.footer.map((item, i) => (
              <React.Fragment key={i}>
                <span>{item}</span>
                {i < t.footer.length - 1 && <span className="w-1 h-1 rounded-full bg-slate-300"></span>}
              </React.Fragment>
            ))}
         </p>
      </footer>
    </div>
  );
}
