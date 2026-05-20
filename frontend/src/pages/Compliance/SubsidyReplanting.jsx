import { useState } from "react";
import { FileText, Download, ShieldCheck, ExternalLink, Calendar, ChevronRight, Info, Search } from 'lucide-react';

const sections = [
  {
    heading: "Subsidy Scheme Replanting Registration",
    documents: [
      {
        title: "Establishment of Irrigation Systems - 2026",
        url: "https://srilankateaboard.lk/wp-content/uploads/2025/12/Establishment-of-irrigation-systems.pdf",
        year: "2026",
      },
      {
        title: "Financial Assistance for High Density Planting with Mechanization",
        url: "https://srilankateaboard.lk/wp-content/uploads/2026/01/Financial-assistance-for-high-density-planting-with-mechanization-New.pdf",
        year: "2026",
      },
      {
        title: "Direct Planting and Infilling - 2026",
        url: "https://srilankateaboard.lk/wp-content/uploads/2025/12/Direct-planting-and-Infilling-2026.pdf",
        year: "2026",
      },
      {
        title: "Standard Tea Nurseries - 2026",
        url: "https://srilankateaboard.lk/wp-content/uploads/2025/12/Standerd-tea-nurseries-2026.pdf",
        year: "2026",
      },
      {
        title: "Circulars and Application for Smart Tea Pluckers and Machine Renting - 2025",
        url: "https://srilankateaboard.lk/wp-content/uploads/2025/03/Circulars-and-application-for-Smart-tea-pluckers-and-machine-renting-2025.pdf",
        year: "2025",
      },
      {
        title: "Circular 2026 - Smart Tea Plucker",
        url: "https://srilankateaboard.lk/wp-content/uploads/2026/01/Circular-2026-SMART-TEA-PLUCKER.pdf",
        year: "2026",
      },
      {
        title: "Circular 2026 - Solar Project",
        url: "https://srilankateaboard.lk/wp-content/uploads/2026/01/Circular-2026-SOLAR-PROJECT.pdf",
        year: "2026",
      },
      {
        title: "Smart Tea Plucker - Application",
        url: "https://srilankateaboard.lk/wp-content/uploads/2026/01/Smart-Tea-Plucker-application.pdf",
        year: "2026",
      },
      {
        title: "Circular - Standard Tea Nurseries with Sprinkler Irrigation for Tea Manufacturers - 2026",
        url: "https://srilankateaboard.lk/wp-content/uploads/2026/02/Circular-Tea-Nurseries-with-Sprinkler-Irrigation-for-Tea-Manufactures-2026.pdf",
        year: "2026",
      },
      {
        title: "Application - Standard Tea Nurseries with Sprinkler Irrigation for Tea Manufacturers - 2026",
        url: "https://srilankateaboard.lk/wp-content/uploads/2026/02/Application-Tea-Nurseries-with-Sprinkler-Irrigation-for-Tea-Manufactures-2026.pdf",
        year: "2026",
      },
    ],
  },
  {
    heading: "Tea Commissioner's Division — Bio Fertilizer Subsidy Scheme",
    documents: [
      {
        title: "Subsidy Scheme for Bio/Organic Fertilizer",
        url: "https://srilankateaboard.lk/wp-content/uploads/2021/10/tc11.pdf",
        year: "2021",
      },
      {
        title: "Subsidy Scheme for Bio/Organic Fertilizer - Sinhala Advertisement",
        url: "https://srilankateaboard.lk/wp-content/uploads/2021/10/tc21.pdf",
        year: "2021",
      },
      {
        title: "Annexure-1 (Application Form) TC/Bio Fert/2021",
        url: "https://srilankateaboard.lk/wp-content/uploads/2021/10/tc33.pdf",
        year: "2021",
      },
    ],
  },
];

function DocumentCard({ doc }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`flex items-center gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all group relative overflow-hidden ${
        hovered ? 'shadow-xl shadow-tea-500/10 -translate-y-1 border-tea-500/30' : 'shadow-sm'
      }`}
    >
      {/* Visual Accent */}
      {hovered && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-tea-500 animate-in slide-in-from-left-full duration-300" />
      )}

      {/* PDF Badge */}
      <div className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
        hovered ? 'bg-tea-500 text-white scale-110 rotate-3' : 'bg-tea-100 dark:bg-tea-900/30 text-tea-600 dark:text-tea-400'
      }`}>
        <FileText size={28} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm font-black tracking-tight leading-tight mb-1 transition-colors ${
          hovered ? 'text-tea-700 dark:text-tea-400' : 'text-slate-800 dark:text-slate-200'
        }`}>
          {doc.title}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Official Document</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[9px] font-black text-tea-600 dark:text-tea-400 uppercase tracking-widest italic">SLTB Approved</span>
        </div>
      </div>

      {/* Metadata & Action */}
      <div className="flex items-center gap-4">
        <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all ${
          hovered ? 'bg-tea-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
        }`}>
          {doc.year}
        </div>
        <div className={`transition-all duration-300 ${hovered ? 'text-tea-500 translate-y-1' : 'text-slate-300'}`}>
          <Download size={20} />
        </div>
      </div>
    </a>
  );
}

export default function SubsidyReplantingPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSections = sections.map(section => ({
    ...section,
    documents: section.documents.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => section.documents.length > 0);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white font-outfit tracking-tighter">
            Subsidy & <span className="text-tea-600 dark:text-tea-400">Replanting</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-2">
            <ShieldCheck size={16} className="text-tea-500" /> Official Registry of Sri Lanka Tea Board Statutory Documents
          </p>
        </div>

        {/* Global Statistics Chip */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col pr-4 border-r border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Docs</span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-1 font-outfit">{sections.reduce((a,c) => a + c.documents.length, 0)}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-tea-500 flex items-center justify-center text-white shadow-lg shadow-tea-500/30">
            <Info size={18} />
          </div>
        </div>
      </div>

      {/* Search & Filter Hub */}
      <div className="premium-card p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-dashed">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-tea-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Filter subsidy documents by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm font-bold placeholder:text-slate-400 outline-none focus:border-tea-500 focus:ring-4 focus:ring-tea-500/5 transition-all"
          />
        </div>
      </div>

      {/* Document Sections */}
      <div className="space-y-12">
        {filteredSections.map((section, si) => (
          <div key={si} className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-4 px-2">
              <div className="w-1.5 h-8 bg-gradient-to-b from-tea-500 to-emerald-600 rounded-full" />
              <div className="flex-1">
                <h2 className="text-xl font-black text-slate-900 dark:text-white font-outfit tracking-tight uppercase italic">
                  {section.heading}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Guidelines</span>
                  <span className="w-1 h-1 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-tea-600 dark:text-tea-400 uppercase tracking-widest">{section.documents.length} Files</span>
                </div>
              </div>
            </div>

            {/* Document Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.documents.map((doc, i) => (
                <DocumentCard key={i} doc={doc} />
              ))}
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="premium-card py-20 flex flex-col items-center justify-center text-center opacity-50">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Search size={40} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-outfit uppercase tracking-tighter">No matching documents</h3>
            <p className="text-sm text-slate-500 mt-2">Try adjusting your search criteria or clear filters.</p>
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-12 p-8 rounded-[2.5rem] bg-slate-900 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h4 className="text-lg font-black font-outfit tracking-tight mb-2 uppercase italic text-tea-400">Compliance & Authenticity</h4>
          <p className="text-sm text-slate-400 leading-relaxed font-medium">
            All documents provided in this registry are sourced directly from the official <strong>Sri Lanka Tea Board</strong> archives. 
            Plantation managers are advised to ensure that they are using the latest circular versions for replanting subsidies 
            and fertilizer applications. 
          </p>
          <div className="flex gap-4 mt-6">
            <a href="https://srilankateaboard.lk" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-tea-400 hover:text-tea-300 transition-colors">
              Visit SLTB Website <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
