import { useState } from "react";
import { Sprout, Leaf, Shell, ArrowRight, Bot } from "lucide-react";
import CinnamonBot from "./CinnamonBot";
import TeaBot from "./TeaBot";
import CoconutBot from "./CoconutBot";

const BOT_DATA = [
  {
    id: "tea",
    name: "Tea Master",
    nameSi: "තේ මාස්ටර්",
    desc: "Expert guidance on Camellia sinensis cultivation, plucking rounds, and tea processing.",
    icon: Leaf,
    color: "#059669",
    avatar: "🍃",
    component: TeaBot,
  },
  {
    id: "cinnamon",
    name: "Cinnamon Pro",
    nameSi: "කුරුඳු විශේෂඥයා",
    desc: "Official guide on Sri Lankan true cinnamon, grading, peeling, and GAP certification.",
    icon: Sprout,
    color: "#B83A08",
    avatar: "🌿",
    component: CinnamonBot,
  },
  {
    id: "coconut",
    name: "Coconut Expert",
    nameSi: "පොල් විශේෂඥයා",
    desc: "Comprehensive advice on coconut plantation management, pest control, and hybrids.",
    icon: Shell,
    color: "#0891B2",
    avatar: "🥥",
    component: CoconutBot,
  }
];

export default function ChatbotHub() {
  const [activeBot, setActiveBot] = useState(null);

  if (activeBot) {
    const bot = BOT_DATA.find(b => b.id === activeBot);
    const BotComponent = bot.component;
    return <BotComponent onBack={() => setActiveBot(null)} />;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      {/* Page Header — system standard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight italic">
            Chatbots
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
            Domain-Specific AI Agronomic Experts
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            3 Experts Online
          </span>
        </div>
      </div>

      {/* Bot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BOT_DATA.map((bot) => (
          <div
            key={bot.id}
            onClick={() => setActiveBot(bot.id)}
            className="premium-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md p-4 flex flex-col gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl transition-all duration-200 group"
          >
            {/* Icon & status */}
            <div className="flex items-start justify-between">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${bot.color}15`, color: bot.color }}
              >
                <bot.icon size={18} strokeWidth={2.5} />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Online</span>
              </div>
            </div>

            {/* Name & description */}
            <div className="flex-1 space-y-1">
              <div>
                <h3 className="text-base font-black font-outfit text-slate-900 dark:text-white tracking-tight leading-tight">
                  {bot.name}
                </h3>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {bot.nameSi}
                </p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-50 dark:border-slate-800">
                {bot.desc}
              </p>
            </div>

            {/* CTA */}
            <button
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 group-hover:brightness-110"
              style={{ background: bot.color }}
            >
              Start Chat <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
