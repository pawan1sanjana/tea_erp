import React, { useState } from "react";
import { 
  ShieldCheck, Landmark, Lock, Award, 
  FileText, Activity, ArrowRight, Info,
  Search, CheckCircle2, AlertCircle, Clock,
  BookOpen, ChevronDown, Sparkles, Building2,
  Receipt, Wallet, Gavel, Truck, Box,
  FileSpreadsheet, FilePlus, Download,
  UserCheck, Home, Coins, UserMinus,
  Users, Briefcase, Globe, PhoneCall,
  ExternalLink, Stethoscope, GraduationCap,
  Heart, Eye, MapPin, Calendar, Sprout
} from 'lucide-react';

const EMPLOYER_TABS = [
  { id: "eligibility", label: "නිර්වචන & සුදුසුකම්", icon: UserCheck },
  { id: "contributions", label: "දායක මුදල්", icon: Wallet },
  { id: "remittance", label: "ගෙවීම් ක්‍රමවේද", icon: Truck },
  { id: "penalties", label: "දඩ & නීති", icon: Gavel },
];

const MEMBER_TABS = [
  { id: "benefits", label: "සාමාජික ප්‍රතිලාභ", icon: Coins },
  { id: "claims", label: "හිමිකම් ලබා ගැනීම", icon: Award },
  { id: "welfare", label: "සුබසාධන සේවා", icon: Sparkles },
];

const BANKS = [
  { name: "ලංකා බැංකුව", phones: ["011 2204659", "011 2204654"], url: "https://inet.boc.lk/epay/" },
  { name: "කොමෂල් බැංකුව", phones: ["011 2353588", "011 2353628"], url: "https://www.combankdigital.com" },
  { name: "මහජන බැංකුව", phones: ["011 2594503", "011 2481538"], url: "https://www.enet.peoplesbank.lk" },
  { name: "සම්පත් බැංකුව", phones: ["011 2332173", "011 2017537"], url: "https://www.sampathvishwa.com" },
  { name: "සෙලාන් බැංකුව", phones: ["011 2008888", "011 2456249"], url: "https://www.seylanbank.lk" },
  { name: "HNB බැංකුව", phones: ["011 2661976", "011 2661960"], url: "https://payfast.hnb.lk" },
];

function Accordion({ title, children, icon: Icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="premium-card p-0 overflow-hidden mb-4 border-slate-100 dark:border-slate-800">
      <button 
        className={`w-full flex items-center justify-between p-5 text-left transition-all ${open ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'}`}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-rose-500 shrink-0" />}
          <span className="text-sm font-black text-slate-900 dark:text-white font-sinhala tracking-tight">{title}</span>
        </div>
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

export default function ETFGuidelines() {
  const [mainCategory, setMainCategory] = useState("employers");
  const [activeTab, setActiveTab] = useState("eligibility");

  const handleCategoryChange = (cat) => {
    setMainCategory(cat);
    setActiveTab(cat === "employers" ? "eligibility" : "benefits");
  };

  const tabs = mainCategory === "employers" ? EMPLOYER_TABS : MEMBER_TABS;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sinhala">
      
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">ETF Protocols</h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1">
            <ShieldCheck size={14} className="text-rose-500" /> Employees' Trust Fund Board (ETFB)
          </p>
        </div>
        
        <div className="px-5 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-rose-500/10 rounded-2xl flex items-center gap-5 shadow-lg shadow-rose-500/5 font-outfit">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">FUND VALUE</span>
            <span className="text-lg font-black text-rose-600 tracking-wider mt-1 italic uppercase font-outfit">Rs. 637.4B</span>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">ACTIVE MEMBERS</span>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 font-outfit">~2.5 Million</span>
          </div>
        </div>
      </div>

      {/* Main Category Switcher */}
      <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 max-w-xl mx-auto shadow-inner">
        <button
          onClick={() => handleCategoryChange("employers")}
          className={`flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-300 ${
            mainCategory === "employers" 
              ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xl shadow-slate-200/50 dark:shadow-none' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase size={20} />
          <span className="text-sm font-black uppercase tracking-widest font-sinhala">සේවායෝජකයින්</span>
        </button>
        <button
          onClick={() => handleCategoryChange("members")}
          className={`flex items-center justify-center gap-3 py-4 rounded-[1.5rem] transition-all duration-300 ${
            mainCategory === "members" 
              ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xl shadow-slate-200/50 dark:shadow-none' 
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Users size={20} />
          <span className="text-sm font-black uppercase tracking-widest font-sinhala">සාමාජිකයින්</span>
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
                ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-sm font-outfit' 
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
              {activeTab === "eligibility" && (
                <div className="space-y-6 font-sinhala">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Building2 className="text-rose-500" size={20} /> සුදුසුකම් & නිර්වචන
                    </h3>
                    <div className="space-y-4">
                      <Accordion title="සේවා යෝජකයා (Employer)">
                        <p className="leading-loose">යම් කම්කරුවෙකු සේවයේ යොදවන යම් පුද්ගලයකු හෝ යම් පුද්ගලයකු වෙනුවෙන් කම්කරුවකු සේවයේ යොදවන වෙනත් පුද්ගලයකු. ඊට ව්‍යාපාර ආයතන, සමාගම්, සංස්ථා, පළාත් පාලන මණ්ඩල සහ වෘත්තීය සමිති ඇතුළත් වේ.</p>
                      </Accordion>
                      <Accordion title="සේවකයා (Employee)">
                        <p className="leading-loose">සේවයේ යොදවන ඕනෑම පුද්ගලයෙකු — ආයතන, සමාගම්, සංස්ථා, පළාත් පාලන ආයතන හෝ වෘත්තීය සමිතිවල සේවා යෝජක මණ්ඩලය ඇතුළු ඕනෑම පුද්ගලයකු විසින් සේවයේ යෙදෙන්නෙකු.</p>
                      </Accordion>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="premium-card border-l-4 border-l-emerald-500">
                        <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3">අනිවාර්ය ආවරණය</h4>
                        <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" /> පෞද්ගලික අංශයේ සියලුම සේවා යෝජකයින්.</li>
                          <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" /> රජයේ විශ්‍රාම වැටුප් නොලබන රාජ්‍ය සේවකයින්.</li>
                        </ul>
                     </div>
                     <div className="premium-card border-l-4 border-l-rose-500">
                        <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-3">නිදහස් කර ඇති පාර්ශව</h4>
                        <ul className="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <li className="flex gap-2"><AlertCircle size={12} className="text-rose-500 shrink-0 mt-0.5" /> ගෘහ සේවකයන්.</li>
                          <li className="flex gap-2"><AlertCircle size={12} className="text-rose-500 shrink-0 mt-0.5" /> සේවකයන් 10 ට අඩු පුන්‍යාධාර ආයතන.</li>
                        </ul>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === "contributions" && (
                <div className="space-y-6">
                  <div className="premium-card bg-rose-500/10 border-rose-500/20 text-center p-8 shadow-2xl shadow-rose-500/5">
                     <p className="text-xs font-black text-rose-600 uppercase tracking-[0.3em] mb-2 font-sinhala">මාසික දායක මුදල</p>
                     <h4 className="text-6xl font-black text-slate-900 dark:text-white font-outfit">3%</h4>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-4">Of Total Monthly Earnings</p>
                  </div>

                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight font-sinhala">
                      <FileText className="text-rose-500" size={20} /> ඉපයීම් වලට ඇතුළත් විය යුතු දෑ
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "වැටුප්, වේතන හෝ ගාස්තු",
                        "ජීවන වියදම් දීමනා",
                        "ආහාර වල මූල්‍ය වටිනාකම",
                        "පාරිතෝෂික දීමනා",
                        "කොමිස් මුදල්",
                        "කෑලි ගණනට ගෙවීම්"
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <CheckCircle2 size={16} className="text-rose-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sinhala">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="premium-card bg-slate-900 text-white border-none shadow-xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4 font-sinhala">සේවායෝජක කාණ්ඩ</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xl font-black text-rose-500 font-outfit italic">R1</p>
                        <p className="text-[10px] font-bold opacity-80 font-sinhala">සේවකයන් 15 හෝ ඊට වැඩි</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-rose-500 font-outfit italic">R4</p>
                        <p className="text-[10px] font-bold opacity-80 font-sinhala">සේවකයන් 15 ට අඩු</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "remittance" && (
                <div className="space-y-6">
                  <div className="premium-card border-l-4 border-l-amber-500 bg-amber-500/5">
                    <div className="flex gap-4">
                      <Clock className="text-amber-500 shrink-0" size={24} />
                      <div className="space-y-2 font-sinhala">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-loose italic">
                          ඉතා වැදගත්: සෑම මාසයක් සඳහාම ගෙවිය යුතු දායක මුදල් ඊළඟ මාසයේ අවසාන වැඩ කරන දිනට හෝ එදිනට පෙර මණ්ඩලයට ලැබිය යුතුය.
                        </p>
                        <p className="text-[10px] text-amber-600 font-bold">
                          සටහන: සේවකයන් 15+ සිටින සේවායෝජකයින් සඳහා විද්‍යුත් ගෙවීම් (Electronic Payments) අනිවාර්ය වේ.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight font-sinhala">
                      <Globe className="text-rose-500" size={20} /> විද්‍යුත් මාධ්‍ය හරහා ගෙවීම්
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {BANKS.map((bank, i) => (
                        <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm hover:border-rose-500/50 transition-all group">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white font-sinhala">{bank.name}</h4>
                            <a href={bank.url} target="_blank" rel="noreferrer" className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ExternalLink size={14} />
                            </a>
                          </div>
                          <div className="space-y-1">
                            {bank.phones.map((phone, pi) => (
                              <div key={pi} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                <PhoneCall size={10} /> {phone}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
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
                      <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden font-outfit">
                        {[
                          ['දින 10ක් නොඉක්මවූ', '5%'],
                          ['දින 11 – මාස 01', '15%'],
                          ['මාස 01 – 03', '20%'],
                          ['මාස 03 – 06', '30%'],
                          ['මාස 06 – 12', '40%'],
                          ['මාස 12+', '50%'],
                        ].map(([period, rate]) => (
                          <React.Fragment key={period}>
                            <div className="bg-white dark:bg-slate-900 p-4 text-xs font-bold text-slate-700 dark:text-slate-300 text-center font-sinhala">{period}</div>
                            <div className="bg-white dark:bg-slate-900 p-4 text-xs font-black text-rose-500 text-center font-outfit italic">{rate}</div>
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
            <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6 font-sinhala">
              
              {activeTab === "benefits" && (
                <div className="space-y-6">
                  <div className="premium-card bg-emerald-500/5 border-emerald-500/20">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Stethoscope className="text-emerald-500" size={20} /> සෞඛ්‍ය & වෛද්‍ය ප්‍රතිලාභ
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Accordion title="Viyana සෞඛ්‍ය රක්ෂණය" icon={ShieldCheck}>
                        <p>සාමාජිකයන් සහ ඔවුන්ගේ පවුලේ සාමාජිකයන් සඳහා වන රෝහල්ගතවීමේ රක්ෂණාවරණය.</p>
                      </Accordion>
                      <Accordion title="හෘද සැත්කම් මූල්‍ය ආධාර" icon={Heart}>
                        <p>හෘද සැත්කම් සහ වකුගඩු බද්ධ කිරීම් සඳහා මූල්‍ය ආධාර ලබාදීමේ ක්‍රමවේදය.</p>
                      </Accordion>
                      <Accordion title="ඇස් කණ්ණාඩි ලබාගැනීම" icon={Eye}>
                        <p>ඇස් කණ්ණාඩි සඳහා වන කාච වල පිරිවැය ප්‍රතිපූරණය කිරීම (Lens Cost Reimbursement).</p>
                      </Accordion>
                    </div>
                  </div>

                  <div className="premium-card bg-sky-500/5 border-sky-500/20">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <GraduationCap className="text-sky-500" size={20} /> ශිෂ්‍යත්ව ප්‍රතිලාභ (Scholarships)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Accordion title="5 වසර ශිෂ්‍යත්ව පාරිතෝෂික" icon={Award}>
                        <p>5 වසර ශිෂ්‍යත්ව විභාගයෙන් විශිෂ්ට ලෙස සමත්වන සාමාජික දරුවන් සඳහා පිරිනැමෙන මූල්‍ය ත්‍යාග.</p>
                      </Accordion>
                      <Accordion title="නිපුණතා සවිය (A/L)" icon={Sprout}>
                        <p>අ.පො.ස. (උ/පෙ) හදාරන දරුවන්ගේ වෘත්තීය පුහුණු පාඨමාලා (NVQ 3, 4, 5) සඳහා රු. 50,000/- දක්වා ආධාර.</p>
                      </Accordion>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "claims" && (
                <div className="space-y-6">
                  <div className="premium-card">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Award className="text-rose-500" size={20} /> හිමිකම් ලබාගත හැකි අවස්ථා
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: "වයස අවුරුදු 54 (කාන්තා) / 55 (පුරුෂ) සම්පූර්ණ වීම", desc: "විශ්‍රාම යාමේදී සම්පූර්ණ අරමුදල ලබාගත හැක." },
                        { title: "සදාකාලික බෙලහීනතාවය", desc: "වෛද්‍ය මණ්ඩල නිර්දේශ මත අරමුදල ලබාගත හැක." },
                        { title: "මරණ ප්‍රතිලාභ", desc: "සාමාජිකයකුගේ මරණයකදී ඔවුන්ගේ යැපෙන්නන් වෙත ගෙවනු ලබන වන්දි සහ අරමුදල්." },
                        { title: "ස්ථිර පදිංචිය සඳහා විදේශ ගත වීම", desc: "ලංකාව අතහැර ස්ථිර පදිංචියට යන අවස්ථාවේදී ලබාගත හැක." }
                      ].map((claim, i) => (
                        <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-black text-slate-900 dark:text-white mb-1">{claim.title}</p>
                          <p className="text-[11px] font-bold text-slate-500">{claim.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "welfare" && (
                <div className="space-y-6">
                  <div className="premium-card">
                     <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                      <Home className="text-rose-500" size={20} /> නිවාස ණය & සුබසාධන
                    </h3>
                    <Accordion title="නිවාස ණය සහතික කිරීම (Housing Loan Guarantee)">
                      <p>රාජ්‍ය සහ පෞද්ගලික බැංකු මගින් නිවාස ණය ලබාගැනීමේදී ETF අරමුදල ඇපකරයක් ලෙස භාවිතා කිරීමේ පහසුකම.</p>
                    </Accordion>
                    <Accordion title="ETF නිවාඩු නිකේතන (Holiday Bungalows)">
                      <p>සාමාජිකයන් සඳහා අනුරාධපුරය වැනි ප්‍රදේශ වල පිහිටි ETF නිවාඩු නිකේතන සහනදායී මිලට වෙන්කරවා ගැනීමේ හැකියාව.</p>
                    </Accordion>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Info Column */}
        <div className="space-y-6">
          <div className="premium-card bg-rose-600 text-white shadow-2xl shadow-rose-600/30 border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
               <Building2 size={80} />
            </div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 relative z-10">
              <MapPin size={16} /> නිල මූලස්ථානය
            </h4>
            <div className="space-y-2 opacity-90 font-sinhala relative z-10">
              <p className="text-[11px] font-bold leading-loose">
                සේවා නියුක්තයන්ගේ භාර අරමුදල් මණ්ඩලය<br />
                19 - 23 මහල්, "මෙහෙවර පියස"<br />
                කිරිල පාර, නාරාහේන්පිට<br />
                කොළඹ 05
              </p>
              <div className="pt-3 flex flex-col gap-1">
                <p className="text-[10px] font-black text-rose-200 italic flex items-center gap-2"><PhoneCall size={10} /> 011 7747200</p>
                <p className="text-[10px] font-black text-rose-200 italic flex items-center gap-2"><Globe size={10} /> www.etfb.lk</p>
              </div>
            </div>
          </div>

          <div className="premium-card pt-6 pb-6 pr-6 pl-6 bg-slate-50/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Verification & Services</h4>
            <div className="space-y-4">
              <a href="https://appointment.etfb.lk" target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-rose-500 transition-all group">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-rose-500" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-sinhala">කල්තියා දිනයක් වෙන්කරවා ගැනීම</span>
                </div>
                <ArrowRight size={12} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
              </a>
              <div className="flex items-center gap-3 p-3 opacity-60">
                <Search size={16} className="text-rose-500" />
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-sinhala">හිමිකම් අයදුම්පත් තත්ත්වය (Claims)</span>
              </div>
            </div>
          </div>

          <div className="premium-card bg-slate-900 text-white border-none text-center">
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 font-outfit">Fund Oversight</p>
            <p className="text-[10px] font-bold opacity-80 font-sinhala">මෙම අරමුදල ශ්‍රී ලංකා මුදල් අමාත්‍යාංශයේ සෘජු අධීක්ෂණය යටතේ ක්‍රියාත්මක වේ.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
