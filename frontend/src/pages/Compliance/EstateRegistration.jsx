import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Calendar, Layers, 
  User, Phone, Mail, Users, 
  Home, Droplets, Shovel, Info,
  ShieldCheck, ArrowRight, Activity, Sprout, Loader2
} from 'lucide-react';
import { apiClient } from '../../api/client';



const SectionTitle = ({ children }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-1 h-8 bg-gradient-to-b from-tea-500 to-emerald-600 rounded-full" />
    <h2 className="font-outfit text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">
      {children}
    </h2>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3.5 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 sm:min-w-[180px]">
      {label}
    </span>
    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
      {value}
    </span>
  </div>
);

const StatCard = ({ label, value, sub, color="tea" }) => (
  <div className="premium-card bg-white dark:bg-slate-900/50 p-6 flex flex-col items-center text-center group hover:scale-[1.02] transition-all">
    <div className="font-outfit text-2xl font-black text-slate-900 dark:text-white">{value}</div>
    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{label}</div>
    {sub && <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-70">{sub}</div>}
  </div>
);

export default function EstateRegistration() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [d, setEstateData] = useState(null);

  useEffect(() => {
    const fetchEstateDetails = async () => {
      try {
        const res = await apiClient.get('/compliance/estate-details');
        if (res.success) {
          setEstateData(res.data);
        }
      } catch (err) {
        console.error("Failed to sync estate profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEstateDetails();
  }, []);

  const tabs = [
    { id: "overview", label: "Overview", icon: Building2 },
    { id: "owner", label: "Ownership", icon: User },
    { id: "divisions", label: "Field Divisions", icon: Layers },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-tea-600 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Syncing Estate Profile...</p>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldCheck className="w-12 h-12 text-rose-500 opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security Clearance Failed / No Profile Found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      
      {/* ── Hero Branding ── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-tea-900 p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-4xl">
          <h1 className="font-outfit text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 italic uppercase">
            {d.estateName}
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-10">
            {[
              { label: "Reg No", val: d.registrationNo },
              { label: "Elevation", val: d.elevation },
              { label: "Established", val: d.established },
              { label: "Total Extent", val: d.totalExtent },
              { label: "Cultivated", val: d.cultivatedExtent },
              { label: "Climate", val: d.climate },
            ].map((item, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col gap-1 hover:bg-white/10 transition-colors">
                <span className="text-[8px] font-black uppercase tracking-widest leading-none text-tea-400 mb-1">{item.label}</span>
                <div className="text-xs font-black text-white uppercase tracking-tight">{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-2xl -mx-4 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex overflow-x-auto no-scrollbar gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-tea-600 text-white shadow-xl shadow-tea-600/20' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content View ── */}
      <div className="max-w-7xl mx-auto">
        
        {/* Overview View */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="premium-card p-8 bg-white dark:bg-slate-900/50">
              <SectionTitle>Plantation Identity</SectionTitle>
              <div className="space-y-1">
                <InfoRow label="Estate Name" value={d.estateName} />
                <InfoRow label="Registration No." value={d.registrationNo} />
                <InfoRow label="Estate Address" value={d.estateAddress} />
              </div>
            </div>

            <div className="space-y-8">
              <div className="premium-card p-8 bg-white dark:bg-slate-900/50">
                <SectionTitle>Land Allocation</SectionTitle>
                <div className="space-y-1">
                  <InfoRow label="Total Extent" value={d.totalExtent} />
                  <InfoRow label="Cultivated Area" value={d.cultivatedExtent} />
                  <InfoRow label="Strategic Reserve" value={d.uncultivatedExtent} />
                  <InfoRow label="Administrative Unit" value={`${d.fieldDivisions.length} Active Divisions`} />
                </div>
              </div>


            </div>
          </div>
        )}

        {/* Ownership View */}
        {activeTab === "owner" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
            <div className="premium-card p-10 bg-white dark:bg-slate-900/50 relative overflow-hidden border-none shadow-2xl">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 pointer-events-none">
                <ShieldCheck size={280} />
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-tea-500 to-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-tea-600/30">
                      <User size={48} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-tea-600 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Statutory Owner Registry</span>
                      </div>
                      <h3 className="font-outfit text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic">
                        {d.owner.name}
                      </h3>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-4 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                        Verified Primary Stakeholder
                      </p>
                    </div>
                  </div>
                  
                  <div className="hidden md:block h-20 w-[1px] bg-slate-100 dark:border-slate-800" />
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">REGISTRY STATUS</span>
                    <span className="text-xl font-black text-tea-600 tracking-tighter italic font-outfit">ACTIVE ENROLLMENT</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Synchronized with Tea Board</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4 border-t border-slate-100 dark:border-slate-800 pt-10">
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Legal Headquarters</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{d.owner.address}</p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Primary Business Line</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <Phone size={14} className="text-tea-500" /> {d.owner.tel}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Official Correspondence</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <Mail size={14} className="text-tea-500" /> {d.owner.email}
                      </p>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Strategic Mobile Link</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                        <Activity size={14} className="text-tea-500" /> {d.owner.mobile}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divisions View */}
        {activeTab === "divisions" && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <SectionTitle>Field Division Architecture</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {d.fieldDivisions.map((div, i) => (
                <div key={i} className="premium-card p-0 overflow-hidden bg-white dark:bg-slate-900/50 group border-none shadow-xl">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div>
                      <h3 className="font-outfit text-lg font-black text-slate-900 dark:text-white tracking-tighter italic">{div.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                        <MapPin size={10} className="text-tea-500" /> {div.location}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-tea-500/10 text-tea-600 flex items-center justify-center">
                      <Sprout size={20} />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4 mb-8">
                      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
                        <div className="font-outfit text-xl font-black text-tea-600">{div.extent}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Allocation</div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Field Commander (Kangany)</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black text-[10px]">
                          {div.kangany.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{div.kangany}</p>
                          <p className="text-[10px] font-bold text-tea-600 mt-0.5">{div.tel}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>

    </div>
  );
}
