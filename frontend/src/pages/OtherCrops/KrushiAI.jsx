import { useState, useRef, useEffect } from "react";
import { apiClient } from "../../api/client";
import { 
  Send, 
  Languages as LanguagesIcon, 
  RotateCcw, 
  Bot, 
  User, 
  AlertCircle,
  ChevronRight
} from "lucide-react";

// ── Text Formatter ────────────────────────────────────────────
function FormattedText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const formatted = parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={pi} className="font-bold text-tea-700 dark:text-tea-400">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ");
        
        return (
          <div key={li} className={isBullet ? "flex gap-2 items-start pl-1" : ""}>
            {isBullet && <span className="text-tea-500 mt-1.5 flex-shrink-0">•</span>}
            <span className="flex-1 text-[13px]">
              {isBullet ? formatted.map(f => typeof f === 'string' ? f.replace(/^[\s\-•]+/, '') : f) : formatted}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── i18n strings ──────────────────────────────────────────────
const STRINGS = {
  si: {
    title: "කෘෂි බුද්ධි සහායක",
    subtitle: "Krushi AI Intelligence Engine",
    newChat: "නව සංවාදය",
    welcomeTitle: "ආයුබෝවන්!",
    welcomeSub: "කෘෂිකාර්මික උපදෙස් සහ තොරතුරු සඳහා මම සූදානම්",
    placeholder: "ප්‍රශ්නය මෙහි ඇතුළත් කරන්න...",
    offTopic:
      "සමාවෙන්න, මම කෘෂිකාර්මික විෂයයන් සඳහා පමණක් පිළිතුරු දෙමි.",
    systemPrompt:
      "ඔබ වෘත්තීය කෘෂිකාර්මික AI විශේෂඥයෙකි. " +
      "ඔබ සිංහල භාෂාවෙන් පිළිතුරු දෙයි. " +
      "වැදගත් කරුණු **තද අකුරින්** දක්වන්න. " +
      "පරිශීලකයා අසන ඕනෑම ප්‍රශ්නයකට පිළිතුරු දීමට ඔබට අවසර ඇත.",
    chips: [
      { label: "වී වගාව", q: "වී වගාව සඳහා පොහොර යෙදවුම් මොනවාද?" },
      { label: "කුරුඳු", q: "කුරුඳු තැලීමේදී අවධානය යොමු කළ යුතු කරුණු." },
      { label: "පොල්", q: "පොල් වගාවට වැළඳෙන රෝග පාලනය." },
    ],
  },
  en: {
    title: "Krushi Intel Engine",
    subtitle: "Advanced Agronomic Advisor",
    newChat: "New Session",
    welcomeTitle: "Welcome",
    welcomeSub: "Agricultural intelligence at your service",
    placeholder: "Ask a question...",
    offTopic:
      "I'm sorry, I only answer questions related to agriculture.",
    systemPrompt:
      "You are a Professional Agronomic AI Expert. " +
      "You respond in English. " +
      "Use **bold text** for critical parameters. " +
      "You are allowed to answer ANY question the user asks.",
    chips: [
      { label: "Paddy", q: "Best fertilizer schedule for paddy?" },
      { label: "Cinnamon", q: "How to improve cinnamon quality?" },
      { label: "Coconut", q: "Common coconut pests and control." },
    ],
  },
};

// ── Components ────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isAssistant = msg.role === "assistant";
  
  return (
    <div className={`flex gap-3 mb-4 animate-in fade-in slide-in-from-bottom-1 ${isAssistant ? 'justify-start' : 'justify-end flex-row-reverse'}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
        isAssistant 
          ? 'bg-tea-50 dark:bg-tea-900/20 text-tea-600 border-tea-100 dark:border-tea-800' 
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
      }`}>
        {isAssistant ? <Bot size={14} /> : <User size={14} />}
      </div>
      
      <div className={`max-w-[85%] ${isAssistant ? 'text-left' : 'text-right'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed border ${
          isAssistant 
            ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-100 dark:border-slate-800 rounded-tl-none shadow-sm' 
            : 'bg-tea-600 text-white border-tea-500 rounded-tr-none font-medium'
        }`}>
          <FormattedText text={msg.content} />
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-in fade-in">
      <div className="w-7 h-7 rounded-lg bg-tea-50 dark:bg-tea-900/20 text-tea-600 flex items-center justify-center flex-shrink-0 border border-tea-100 dark:border-tea-800">
        <Bot size={14} />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-2.5 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-tea-400 animate-bounce" />
        <span className="w-1.5 h-1.5 rounded-full bg-tea-400 animate-bounce [animation-delay:0.2s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-tea-400 animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function KrushiAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("si");
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  const s = STRINGS[lang];

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  };

  const handleNewChat = () => {
    setMessages([]);
    setError("");
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async (overrideText) => {
    const userText = (overrideText ?? input).trim();
    if (!userText || thinking) return;

    setError("");
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const userMsg = { role: "user", content: userText };
    setMessages((prev) => [...prev, userMsg]);

    setThinking(true);
    try {
      const history = [...messages, userMsg];
      const apiMessages = history.map((m) => ({ role: m.role, content: m.content }));
      
      const res = await apiClient.post("/ai/chat", {
        messages: apiMessages,
        system: s.systemPrompt,
      });

      if (!res.success) throw new Error(res.error || "AI Service Error");

      const reply = res.data?.content?.find((b) => b.type === "text")?.text || "No response.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to service.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex flex-col w-full space-y-8 pb-32 relative min-h-screen">
      {/* ── Standard Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
            {s.title.split(' ')[0]} <span className="text-tea-600">{s.title.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
            {s.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(l => l === "si" ? "en" : "si")}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <LanguagesIcon size={12} className="text-tea-500" />
            {lang === "si" ? "English" : "සිංහල"}
          </button>
          
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw size={12} className="text-tea-500" />
            {s.newChat}
          </button>
        </div>
      </div>

      {/* ── Chat Flow ── */}
      <div className="w-full">
        {messages.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-outfit uppercase tracking-tight">
                {s.welcomeTitle}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                {s.welcomeSub}
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {s.chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => sendMessage(chip.q)}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-left hover:border-tea-500 transition-all shadow-sm"
                >
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-tea-600 transition-colors">{chip.label}</span>
                  <ChevronRight size={10} className="text-slate-300 group-hover:text-tea-500" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {thinking && <ThinkingIndicator />}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold animate-in fade-in">
                <AlertCircle size={16} />
                <span className="flex-1 uppercase tracking-wider">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Ultra-Minimal Floating Input Bar ── */}
      <div className="fixed bottom-12 left-0 lg:left-64 right-0 z-50 px-4 md:px-10 lg:px-20 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="relative flex items-end gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-2 focus-within:border-tea-500/50 transition-all shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] dark:shadow-black/40">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder={s.placeholder}
              disabled={thinking}
              className="flex-1 bg-transparent border-none outline-none p-3 text-[13px] font-medium text-slate-700 dark:text-slate-200 resize-none max-h-32 placeholder:text-slate-400 font-outfit"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || thinking}
              className="w-10 h-10 rounded-full bg-tea-600 text-white flex items-center justify-center shadow-lg shadow-tea-600/20 hover:bg-tea-700 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex-shrink-0 mb-0.5 mr-0.5"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
